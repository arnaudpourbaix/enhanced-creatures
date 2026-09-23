import { SpellbookModName } from "./spells/spellbook-mod-name";

interface SpellbookMod {
  /** Display label used to distinguish this variant's section in the generated documentation. */
  name: string;
  /**
   * Raw WeiDU condition code(s), used as `ACTION_IF <weiduCheck> BEGIN ... END`. A single string is
   * used as-is; an array is OR'd together (some content isn't gated behind one component - e.g.
   * Stratagems' IWD spell import spans two independently installable components, 1500 and 1510, so
   * either one being present means the content is there). Omitted for mods (e.g. Vanilla) that
   * represent unconditional content - always installed, no check needed.
   */
  weiduCheck?: string | string[];
}

/**
 * Resolves a mod's `weiduCheck` to a single WeiDU condition string - an array becomes WeiDU's
 * `OR(n) cond1 cond2 ...` syntax so callers never hand-count the n themselves. Undefined and empty
 * arrays both resolve to undefined (no check needed / nothing to check).
 */
export function resolveWeiduCheck(check: string | string[] | undefined): string | undefined {
  if (check === undefined) return undefined;
  if (typeof check === "string") return check;
  if (check.length === 0) return undefined;
  return check.length === 1 ? check[0] : `OR(${check.length}) ${check.join(" ")}`;
}

const SPELL_REVISIONS_CHECK = "MOD_IS_INSTALLED spell_rev.tp2 0";
const STRATAGEMS_IWD_CHECK = [
  "MOD_IS_INSTALLED STRATAGEMS.TP2 1500",
  "MOD_IS_INSTALLED STRATAGEMS.TP2 1510",
];
const STRATAGEMS_NEW_SPELLS_CHECK = [
  "MOD_IS_INSTALLED STRATAGEMS.TP2 2000",
  "MOD_IS_INSTALLED STRATAGEMS.TP2 2500",
  "MOD_IS_INSTALLED STRATAGEMS.TP2 2510",
];

/** Same as resolveWeiduCheck, but for a known non-empty check - used for the constants above,
 * which are hardcoded non-empty and should fail loudly, not silently produce "undefined", if that
 * ever stops being true. */
function resolveNonEmptyWeiduCheck(check: string | string[]): string {
  const resolved = resolveWeiduCheck(check);
  if (resolved === undefined) throw new Error(`weiduCheck resolved to nothing: ${String(check)}`);
  return resolved;
}

export const SPELLBOOK_MODS: Record<SpellbookModName, SpellbookMod> = {
  // No weiduCheck: base-game spells that don't depend on any mod, always installed.
  Vanilla: { name: "Vanilla" },
  SpellRevisions: { name: "Spell Revisions", weiduCheck: SPELL_REVISIONS_CHECK },
  FaithsAndPowers: {
    name: "Faiths & Powers",
    weiduCheck: "MOD_IS_INSTALLED Faiths_and_Powers.tp2 80",
  },
  StratagemsIWD: { name: "Stratagems (IWD spells)", weiduCheck: STRATAGEMS_IWD_CHECK },
  StratagemsNewSpells: { name: "Stratagems (new spells)", weiduCheck: STRATAGEMS_NEW_SPELLS_CHECK },
  // Mixing partial spell-mod combinations turned out unmanageable (see the spellbook-availability
  // design discussion) - a spell needing any one of Spell Revisions/Stratagems needs all three in
  // practice, so this ANDs their individual checks together rather than exposing partial states.
  AllSpellMods: {
    name: "All spell mods (Spell Revisions + Stratagems)",
    weiduCheck:
      `(${resolveNonEmptyWeiduCheck(SPELL_REVISIONS_CHECK)}) AND ` +
      `(${resolveNonEmptyWeiduCheck(STRATAGEMS_IWD_CHECK)}) AND ` +
      `(${resolveNonEmptyWeiduCheck(STRATAGEMS_NEW_SPELLS_CHECK)})`,
  },
};

/**
 * Deterministic WeiDU variable name for a resource that needs mod-conditional resolution at
 * install time - weidu-creature.service.ts assigns it via OUTER_SPRINT before COMPILE, and
 * ability.service.ts substitutes `%<token>%` for the literal resource in that ability's compiled
 * action/trigger params, so the correct value gets baked into the script when it's actually
 * compiled on the end user's machine rather than at generation time here.
 */
export function resourcePlaceholderToken(baseResource: string): string {
  return `RES_${baseResource.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

/**
 * The two spell-identity states a SpellReference's `requiresMod`/`obsoletedBy` (and a spellbook's
 * SpellBookModVariant.mod) can target - either none of Spell Revisions/Stratagems is installed, or
 * all of them are (see AllSpellMods above; partial combinations aren't supported). FaithsAndPowers
 * is a separate, orthogonal mod outside this chain - using it for `requiresMod`/`obsoletedBy` isn't
 * supported here.
 */
export const MOD_LAYER_ORDER: SpellbookModName[] = ["Vanilla", "AllSpellMods"];

function modLayerIndex(mod: SpellbookModName): number {
  const index = MOD_LAYER_ORDER.indexOf(mod);
  if (index === -1) {
    throw new Error(
      `"${mod}" isn't part of MOD_LAYER_ORDER's fixed chain - requiresMod/obsoletedBy ` +
        "availability ranges aren't defined for it.",
    );
  }
  return index;
}

export interface ModAvailability {
  requiresMod?: SpellbookModName;
  obsoletedBy?: SpellbookModName;
}

/**
 * The half-open [start, end) range of MOD_LAYER_ORDER indices a spell is available across -
 * `requiresMod` (default: Vanilla, index 0) is where it starts, `obsoletedBy` (default: past the
 * last known layer) is where it stops.
 */
export function availabilityRange(spell: ModAvailability): { start: number; end: number } {
  const start = spell.requiresMod ? modLayerIndex(spell.requiresMod) : 0;
  const end = spell.obsoletedBy ? modLayerIndex(spell.obsoletedBy) : MOD_LAYER_ORDER.length;
  if (start >= end) {
    throw new Error(
      `requiresMod (${spell.requiresMod ?? "Vanilla"}) must come before obsoletedBy ` +
        `(${spell.obsoletedBy ?? "never"}) in MOD_LAYER_ORDER - this spell would never be available.`,
    );
  }
  return { start, end };
}

/**
 * Whether two spells' availability ranges overlap - if they don't (e.g. one is obsoletedBy the
 * exact mod the other requiresMod), they can safely share a file, since they're never both
 * present in the same install at once.
 */
export function availabilityOverlaps(a: ModAvailability, b: ModAvailability): boolean {
  const rangeA = availabilityRange(a);
  const rangeB = availabilityRange(b);
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

/**
 * Whether a spell is actually available under the given mod - i.e. that mod's layer index falls
 * inside the spell's availabilityRange, and (unlike availabilityRange/availabilityOverlaps, which
 * only care about a file's true identity) it isn't hidden from spell-selection there either. Meant
 * for validating a mod-scoped list (e.g. a SpellBookModVariant) doesn't include a spell that mod
 * has already obsoleted, hasn't introduced yet, or hides from normal selection (see
 * SpellReference.hiddenIn) - a hand-picked creature ability can still reference such a spell
 * directly without going through this check.
 */
export function isAvailableInMod(
  spell: ModAvailability & { hiddenIn?: SpellbookModName },
  mod: SpellbookModName,
): boolean {
  if (spell.hiddenIn === mod) return false;
  const { start, end } = availabilityRange(spell);
  const index = modLayerIndex(mod);
  return index >= start && index < end;
}

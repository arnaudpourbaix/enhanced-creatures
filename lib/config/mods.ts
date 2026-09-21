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

export const SPELLBOOK_MODS: Record<SpellbookModName, SpellbookMod> = {
  // No weiduCheck: base-game spells that don't depend on any mod, always installed.
  Vanilla: { name: "Vanilla" },
  SpellRevisions: {
    name: "Spell Revisions",
    weiduCheck: "MOD_IS_INSTALLED spell_rev.tp2 0",
  },
  FaithsAndPowers: {
    name: "Faiths & Powers",
    weiduCheck: "MOD_IS_INSTALLED Faiths_and_Powers.tp2 80",
  },
  StratagemsIWD: {
    name: "Stratagems (IWD spells)",
    weiduCheck: ["MOD_IS_INSTALLED STRATAGEMS.TP2 1500", "MOD_IS_INSTALLED STRATAGEMS.TP2 1510"],
  },
  StratagemsNewSpells: {
    name: "Stratagems (new spells)",
    weiduCheck: [
      "MOD_IS_INSTALLED STRATAGEMS.TP2 2000",
      "MOD_IS_INSTALLED STRATAGEMS.TP2 2500",
      "MOD_IS_INSTALLED STRATAGEMS.TP2 2510",
    ],
  },
};

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

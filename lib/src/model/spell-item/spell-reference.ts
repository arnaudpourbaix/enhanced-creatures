import { SpellbookModName } from "../../../config/spells/spellbook-mod-name";
import { SpellKeyword } from "../../../config/spells/keyword";
import { isAvailableInMod } from "../../../config/mods";
import { SpellIdentifier } from "../ids/spell";
import { StringReference } from "../final/stringref";

/**
 * A mod-conditional override of `file`/`id` on the SpellReference it belongs to - some mods
 * repurpose an existing file's slot for a different spell (e.g. spell_rev turns SPWI106 from
 * Blindness into Obscuring Mist), or move a spell.ids constant to a different file entirely (e.g.
 * CLERIC_PROTECTION_FROM_LIGHTNING moves from SPPR407 to SPPR521). For a spell that doesn't exist
 * at all without a mod (rather than existing but pointing elsewhere), use `requiresMod` on the
 * SpellReference instead. See scripts/report-spell-collisions.ts, which audits SPELLS against real
 * spell.ids snapshots per mod to find entries that need one of these.
 */
export interface SpellVariant {
  mod: SpellbookModName;
  file: string;
  id?: SpellIdentifier;
}

export interface SpellReference {
  file: string;
  id?: SpellIdentifier;
  /** Translation key for this spell's display name when used as an ability, e.g. "spell.Vocalize.name" */
  name?: StringReference;
  level?: number;
  duration?:
    | "long" // several hours
    | "mid" // several turns
    | "short"; // several rounds to one turn
  keywords?: SpellKeyword[];
  /**
   * Per-mod overrides, checked in order - the first installed mod wins, falling back to `file`/`id`
   * above when none match (or when this is unset, which is the common case). Not yet consumed by
   * every place that reads `file`/`id` directly - memorized spells, SPELL_GROUPS and ability presets
   * (e.g. lib/config/presets/buff-presets.ts) all still read the base fields unconditionally, so a
   * variant here doesn't yet protect those call sites.
   */
  variants?: SpellVariant[];
  /**
   * Set when this spell doesn't exist at all without a mod - `file`/`id` above describe it once
   * that mod is installed; there is no correct fallback to fall back to (unlike `variants`, which
   * is for a spell that exists everywhere but points somewhere different). Checked by
   * main.service.ts's checkSpells() (so a later mod reusing this file doesn't look like a
   * duplicate) - not yet consumed by generation itself (memorized spells, SPELL_GROUPS and ability
   * presets still reference `file` unconditionally).
   */
  requiresMod?: SpellbookModName;
  /**
   * The inverse of `requiresMod` - set when this spell stops existing once a mod (or anything
   * layered after it - see MOD_LAYER_ORDER) is installed, because that mod repurposes `file` for a
   * different spell (e.g. Deafness's SPWI223 becomes Sound Burst under Spell Revisions). Lets
   * checkSpells() recognize two entries sharing a file as correctly disjoint instead of a real
   * duplicate. Not yet consumed by generation itself, same caveat as `requiresMod`.
   */
  obsoletedBy?: SpellbookModName;
  /**
   * Set when a mod hides this spell from normal spell-selection (e.g. HIDESPL.2da) without
   * repurposing `file` into different content - unlike `obsoletedBy`, the spell itself is still
   * real and fully castable, just not something a caster could ever have learned normally. So a
   * monster whose abilities are hand-picked (not built from a SpellBook) can still reference it
   * directly; only spellbook derivation (resolveForMod/checkSpellbooks) treats it as unavailable
   * here, since a true spellbook (e.g. Greater Mummy's) should only ever contain spells actually
   * obtainable in that install.
   */
  hiddenIn?: SpellbookModName;
  /**
   * The vanilla-safe spell to use instead when this one isn't available (its `requiresMod` isn't
   * satisfied) - e.g. Wizard.SoundBurst's fallback is Wizard.Deafness, the vanilla spell it
   * replaces at the same file. Lets a spellbook/ability be authored once (for AllSpellMods) and the
   * Vanilla variant derived automatically via resolveForMod, instead of hand-authoring both. Set
   * after a spell registry is assembled, since a fallback is itself another SpellReference (e.g.
   * lib/config/spells/spell-database.ts assigns these after its SPELLS object literal, since a sibling
   * can't reference another sibling from within the same object literal).
   */
  fallback?: SpellReference;
}

/**
 * Assigns a spell's `fallback` after the fact (see SpellReference.fallback) - needed because a
 * fallback is itself another SpellReference and can't reference a sibling from within the same
 * object literal it's declared in, so registries (e.g. lib/config/spells/spell-database.ts) assign
 * these once their spell objects already exist.
 *
 * This goes through a `spell: SpellReference` parameter rather than letting a caller assign
 * `someRegistry.Foo.fallback = ...` directly: a registry typed via `satisfies Record<string,
 * SpellReference>` (rather than a `: Record<...>` annotation) keeps each entry's own narrower
 * literal type - one that was never written with a `fallback` key - so TS rejects setting it
 * directly on the entry. Routing the assignment through this SpellReference-typed parameter widens
 * it back to the full interface for the duration of the call, without widening the entries
 * themselves (which would lose their literal `file`/`id` types for every other reader).
 */
export function setFallback(spell: SpellReference, fallback: SpellReference): void {
  spell.fallback = fallback;
}

/**
 * Resolves a spell for a specific mod state: itself (or its matching `variants` entry) if
 * available there, otherwise walks `fallback` until it finds one that is. Throws if the chain runs
 * out (no fallback) or loops (a fallback cycle) before finding an available spell.
 */
export function resolveForMod(spell: SpellReference, mod: SpellbookModName): SpellReference {
  let current = spell;
  const seen = new Set<SpellReference>();
  while (!isAvailableInMod(current, mod)) {
    if (seen.has(current)) {
      throw new Error(`Fallback cycle detected while resolving a spell for ${mod}.`);
    }
    seen.add(current);
    if (!current.fallback) {
      throw new Error(`No spell available for ${mod}, and no fallback is defined for it.`);
    }
    current = current.fallback;
  }
  const variant = current.variants?.find((v) => v.mod === mod);
  return variant ? { ...current, file: variant.file, id: variant.id } : current;
}

/**
 * Every file a spell could resolve to across mods - its base `file` plus each `variants` entry's
 * file. For a static resource list (SPELL_GROUPS, SPELL_PRIORITY_ORDER) this is all that's needed:
 * unlike a compiled ability, listing a file that doesn't exist under some install is harmless there
 * (see spell-group.ts), so there's no need to pick the "right" one at generation time.
 */
export function spellFiles(spell: SpellReference): string[] {
  return [spell.file, ...(spell.variants?.map((v) => v.file) ?? [])];
}

/**
 * Flattens every category of a spell registry (e.g. SPELLS' Wizard/Priest/Class/Innate, or
 * FNP_SPELLS' Priest) into one list, each entry tagged with its original object key. Generic over
 * the per-spell shape so the same helper backs both SPELLS (SpellReference) and FNP_SPELLS
 * (BaseSpell) - see getAllSpells/getAllFnpSpells.
 */
export function flattenSpellCategories<T>(
  categories: Record<string, Record<string, T>>,
): (T & { key: string })[] {
  return Object.values(categories).flatMap((category) =>
    Object.entries(category).map(([key, spell]) => ({ key, ...spell })),
  );
}

/** Every spell in a SPELLS-shaped registry, flattened across its categories - see getAllSpells. */
export type SpellCollection = Record<string, Record<string, SpellReference>>;

export function getAllSpells(spells: SpellCollection): (SpellReference & { key: string })[] {
  return flattenSpellCategories(spells);
}

/** Files of every spell tagged with the given keyword, across a SPELLS-shaped registry. */
export function spellsByKeyword(spells: SpellCollection, keyword: SpellKeyword): string[] {
  return getAllSpells(spells)
    .filter((spell) => spell.keywords?.includes(keyword))
    .flatMap((spell) => spellFiles(spell));
}

/**
 * The `keywords` of whichever SPELLS-registry entry's `file` - or one of its `variants[].file` -
 * matches `file` (case-insensitive), or undefined when no entry matches. Backs the automatic
 * keyword resolution in PresetFactory.create and AbilityService.applyPreset: a preset built from a
 * real SPELLS entry gets its keywords for free, so an explicit `keywords` field on a preset is
 * only needed for a one-off ability with no SPELLS entry of its own (e.g. a spell declared
 * directly on a monster rather than registered in the shared database).
 */
export function keywordsForFile(spells: SpellCollection, file: string): SpellKeyword[] | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.keywords;
}

/**
 * The `level` of whichever SPELLS-registry entry's `file` - or one of its `variants[].file` -
 * matches `file` (case-insensitive), or undefined when no entry matches or it has no `level`.
 * Backs the automatic level resolution in PresetFactory.create and AbilityService.applyPreset,
 * mirroring keywordsForFile: a preset built from a real SPELLS entry gets its level for free, so
 * an explicit `level` field on a preset is only needed for a one-off ability with no SPELLS entry
 * of its own (e.g. a spell declared directly on a monster, or one only present in FNP_SPELLS).
 */
export function levelForFile(spells: SpellCollection, file: string): number | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.level;
}

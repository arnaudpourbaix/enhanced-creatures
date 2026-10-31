import { SpellbookModName } from "../../../config/spells/spellbook-mod-name";
import { SpellKeyword } from "../../../config/spells/keyword";
import { SpellDurationClass, SpellRole, SpellTier } from "../../../config/spells/spell-role";
import { isAvailableInMod } from "../../../config/mods";
import { SpellIdentifier } from "../ids/spell";
import { StateIdentifier } from "../ids/state";
import { StatsIdentifier } from "../ids/stats";
import { SplStateIdentifier } from "../ids/splstate";
import { StringReference } from "../final/stringref";
import { SpellStateValue } from "../../../config/common";
import type { AlliesCheck } from "../creature/ability";
import { SaveTypeEnum } from "./effect.enums";
import { EffectTypeEnum } from "./effect.type";

/**
 * The saving throw negating one effect of a spell: the save types it allows (the target rolls
 * with its best one), and the bonus added to the target's roll (negative: a penalty).
 */
export interface SpellSave {
  types: SaveTypeEnum[];
  /** Default: 0 */
  bonus?: number;
}

/**
 * The saving throws that negate a spell, one per effect. A target escapes the spell only by
 * saving against every effect, so the AI skips it only once it can't fail any of them (see
 * TriggerFactory.saveChecks). Effects without a save, or whose save only halves damage, aren't
 * listed.
 */
export type SpellSaves = SpellSave[];

/**
 * Adds `saves` up, an entry per distinct set of save types: a target can fail either of two
 * entries with the same types as soon as it can fail the lowest bonus, so that one is kept.
 */
export function mergeSaves(saves: SpellSave[]): SpellSaves {
  const merged = new Map<string, SpellSave>();
  for (const save of saves) {
    const key = save.types.join();
    const bonus = Math.min(save.bonus ?? 0, merged.get(key)?.bonus ?? Infinity);
    merged.set(key, bonus ? { types: save.types, bonus } : { types: save.types });
  }
  return [...merged.values()];
}

/** What negatingSaves needs to know about an effect. */
export interface SaveEffect {
  opcode: EffectTypeEnum;
  saveTypes: SaveTypeEnum[];
  saveBonus?: number;
  /** Its save only halves the damage (save for half / fail for half) */
  halved: boolean;
  /** It only lands on the caster, not on the spell's target */
  self?: boolean;
}

/**
 * The saving throws negating a spell with these effects (see SpellSaves): one entry per distinct
 * set of save types (see mergeSaves). Other effects without a save (visuals, strings, guards...)
 * are left out, but damage a save can't negate (none, or only halved) means the spell can't be
 * escaped at all: no saves then. Effects landing on the caster don't count. Shared by the spells
 * this mod creates and the extraction of the game's own.
 */
export function negatingSaves(effects: SaveEffect[]): SpellSaves {
  const saves: SpellSave[] = [];
  for (const effect of effects.filter((e) => !e.self)) {
    const types = [...new Set(effect.saveTypes)]
      .filter((type) => type <= SaveTypeEnum.PetrifyPolymorph)
      .sort((a, b) => a - b);
    if (effect.opcode === EffectTypeEnum.Damage && (effect.halved || !types.length)) return [];
    if (types.length && !effect.halved) saves.push({ types, bonus: effect.saveBonus });
  }
  return mergeSaves(saves);
}

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
  name: StringReference;
  level?: number;
  /**
   * Drives precasting (see StatementBuilderService.precastSpells), so it is only set on
   * protection, buff and summon spells - also used by the cast order rules.
   */
  duration?: SpellDurationClass;
  /**
   * Never precast, however long it lasts: Invisibility would break too much, creatures starting
   * invisible wear a ring for it instead.
   */
  noPrecast?: boolean;
  /** SPL casting speed: lower is faster, and less likely to be interrupted */
  castingTime?: number;
  /** See SpellRole - auto-classified by scripts/extract-spell-profile.ts, reviewed by hand */
  role?: SpellRole;
  /** What else the spell does, adding to its value (Battering Ram damages and puts to sleep) */
  secondaryRoles?: SpellRole[];
  /**
   * A spell's worth in a fight, as a spell level, when it's worth more than its own level says (Call
   * Woodland Beeings' charm, Dragon's Breath): rated by hand, a spell's data can't tell
   */
  worthLevel?: number;
  /** See SpellTier - decent when unset */
  tier?: SpellTier;
  /** An area spell hitting the caster's allies too (scripts/extract-spell-profile.ts) */
  hitsAllies?: boolean;
  keywords?: SpellKeyword[];
  /** See SpellSaves - feeds BaseCreatureAbility.saves the same way `level` feeds its own. */
  saves?: SpellSaves;
  /**
   * The weapons this spell puts in its caster's hand, at every caster level: it isn't cast while
   * holding one (see memorizedChecks), and shares its roll with the others (see sharedRoll). See
   * scripts/extract-spell-items.ts.
   */
  createsItems?: string[];
  /**
   * Its preset targets enemies, but an ally doesn't resist it: a combo may aim it at either side
   * (e.g. a contingency enclosing its caster in a Resilient Sphere).
   */
  anySide?: boolean;
  /**
   * Only cast when the target is within this script Range() distance, not the SPL's own range: a
   * touch or short range spell on enemies declares 10, so its caster doesn't cross the battlefield
   * to deliver it. A longer range spell declares nothing, nor does a spell on allies: nothing else
   * would bring its caster closer to them. On a castOnSelf spell, it's the distance to the enemy the
   * spell is meant for: its target, else the nearest one. Must stay above `alliesCheck.range`, which sets a minimum range. See
   * scripts/extract-spell-ranges.ts.
   */
  range?: number;
  /**
   * The spell also hits the caster's allies around its target - see
   * BaseCreatureAbility.alliesCheck, which this feeds the same way `range`/`keywords` feed theirs.
   */
  alliesCheck?: AlliesCheck;
  /**
   * State(s) that must already be active on the target for this spell to be worth casting (e.g. a
   * dispel that only makes sense against a specific ongoing effect) - see
   * CreatureAbilitySpell.includeStateChecks, which this feeds the same way `range`/`keywords`
   * feed BaseCreatureAbility's fields.
   */
  includeStateChecks?: StateIdentifier[];
  /**
   * State(s) that make re-casting this spell pointless (e.g. Invisibility excluding
   * STATE_INVISIBLE) - see CreatureAbilitySpell.excludeStateChecks.
   */
  excludeStateChecks?: StateIdentifier[];
  /**
   * Spell-state(s) that make re-casting this spell pointless, tracked via CheckSpellState rather
   * than a STATE_ opcode (e.g. a buff with no state icon of its own) - see
   * CreatureAbilitySpell.excludeSpellStates.
   */
  excludeSpellStates?: (SplStateIdentifier | SpellStateValue)[];
  /**
   * Stat(s) that make re-casting this spell pointless when above 0 on the target (e.g. a hold
   * excluding HELD) - see CreatureAbilitySpell.excludeStatsChecks.
   */
  excludeStatsChecks?: StatsIdentifier[];
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

/** A spell's `file` (plus `id` when set), for identifying it in an error message. */
function spellLabel(spell: SpellReference): string {
  return spell.id ? `${spell.file} (${spell.id})` : spell.file;
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
      throw new Error(
        `Fallback cycle detected while resolving ${spellLabel(spell)} for ${mod} ` +
          `(loops back to ${spellLabel(current)}).`,
      );
    }
    seen.add(current);
    if (!current.fallback) {
      const chain =
        current === spell
          ? ""
          : ` (its fallback chain from ${spellLabel(spell)} reached this point)`;
      throw new Error(
        `No spell available for ${mod}: ${spellLabel(current)} requires ${current.requiresMod ?? "a mod"}, ` +
          `and no fallback is defined for it${chain}.`,
      );
    }
    current = current.fallback;
  }
  const variant = current.variants?.find((v) => v.mod === mod);
  return variant ? { ...current, file: variant.file, id: variant.id } : current;
}

/**
 * Every file a spell could resolve to across mods - its base `file` plus each `variants` entry's
 * file. For a static resource list (SPELL_GROUPS) this is all that's needed:
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

/**
 * The `range` of whichever SPELLS-registry entry's `file` - or one of its `variants[].file` -
 * matches `file` (case-insensitive), or undefined when no entry matches or it has no `range`.
 * Mirrors levelForFile, backing the automatic range resolution in AbilityService.applyPreset: a
 * hand-written preset (e.g. BUFF_PRESETS) that doesn't set its own `range` gets the matching
 * SPELLS entry's range for free, so BaseCreatureAbility.range's Range() trigger doesn't need to be
 * hand-authored again for a spell whose SPELLS entry already declares one.
 */
export function rangeForFile(spells: SpellCollection, file: string): number | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.range;
}

/**
 * The `saves` of whichever SPELLS-registry entry's `file` - or one of its `variants[].file` -
 * matches `file` (case-insensitive), or undefined when no entry matches or it has none. Mirrors
 * levelForFile, backing the automatic resolution in AbilityService.applyPreset.
 */
export function savesForFile(spells: SpellCollection, file: string): SpellSaves | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.saves;
}

/**
 * The `alliesCheck` of whichever SPELLS-registry entry's `file` - or one of its `variants[].file` -
 * matches `file` (case-insensitive), or undefined when no entry matches or it has none. Mirrors
 * rangeForFile, backing the automatic resolution in AbilityService.applyPreset: an ability cast
 * through a standard spell's preset (e.g. a monster's stronger Fireball) inherits its allies check.
 */
export function alliesCheckForFile(spells: SpellCollection, file: string): AlliesCheck | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.alliesCheck;
}

/**
 * The `includeStateChecks` of whichever SPELLS-registry entry's `file` - or one of its
 * `variants[].file` - matches `file` (case-insensitive), or undefined when no entry matches or it
 * has none. Mirrors levelForFile/rangeForFile, backing the automatic resolution in
 * AbilityService.applyPreset: a hand-written preset that doesn't set its own
 * CreatureAbilitySpell.includeStateChecks gets the matching SPELLS entry's for free.
 */
export function includeStateChecksForFile(
  spells: SpellCollection,
  file: string,
): StateIdentifier[] | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.includeStateChecks;
}

/** Same as includeStateChecksForFile, for CreatureAbilitySpell.excludeStateChecks. */
export function excludeStateChecksForFile(
  spells: SpellCollection,
  file: string,
): StateIdentifier[] | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.excludeStateChecks;
}

/** Same as includeStateChecksForFile, for CreatureAbilitySpell.excludeSpellStates. */
export function excludeSpellStatesForFile(
  spells: SpellCollection,
  file: string,
): (SplStateIdentifier | SpellStateValue)[] | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.excludeSpellStates;
}

/** Same as includeStateChecksForFile, for CreatureAbilitySpell.excludeStatsChecks. */
export function excludeStatsChecksForFile(
  spells: SpellCollection,
  file: string,
): StatsIdentifier[] | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.excludeStatsChecks;
}

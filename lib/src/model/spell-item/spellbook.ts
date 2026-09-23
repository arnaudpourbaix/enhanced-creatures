import { MOD_LAYER_ORDER } from "../../../config/mods";
import { SpellBookName } from "../../../config/spellbooks/spellbook-name";
import { SpellbookModName } from "../../../config/spells/spellbook-mod-name";
import { resolveForMod, SpellReference } from "./spell-reference";

export interface SpellBookSpells {
  level: number;
  base: SpellReference[];
  additionnals: SpellReference[];
  repeat: SpellReference[];
}

/**
 * Derives one mod's SpellBookSpells levels from another's by resolving every listed spell for
 * `mod` (see resolveForMod) - lets a spellbook be authored once (typically for AllSpellMods, the
 * "ideal" version) and its other variant(s) derived automatically, instead of hand-authoring a full
 * parallel list per mod. Throws if any listed spell has no fallback chain reaching `mod`.
 */
export function resolveSpellBookSpellsForMod(
  values: SpellBookSpells[],
  mod: SpellbookModName,
): SpellBookSpells[] {
  return values.map((level) => ({
    level: level.level,
    base: level.base.map((spell) => resolveForMod(spell, mod)),
    additionnals: level.additionnals.map((spell) => resolveForMod(spell, mod)),
    repeat: level.repeat.map((spell) => resolveForMod(spell, mod)),
  }));
}

/**
 * One mod's spell set for a SpellBook - lets the same named spellbook (e.g. "EvilUndeadCleric")
 * define a different set of spells for a mod whose content genuinely can't be derived from
 * `SpellBook.values` via fallback (e.g. Faiths & Powers swaps in unrelated new spells, rather than
 * substituting for ones that are simply unavailable).
 */
export interface SpellBookModVariant {
  mod: SpellbookModName;
  values: SpellBookSpells[];
}

// Richest-first, so createSpellbook's "pick one variant" default picks the fullest spell list
// (used by tests / anything that doesn't care about mod-specific variants) rather than the
// fallback-only Vanilla one. This is display/selection order, unrelated to MOD_LAYER_ORDER's own
// meaning (availability progression) - it's just that order reversed, since there are only 2 mods.
const DEFAULT_VARIANT_ORDER = [...MOD_LAYER_ORDER].reverse();

export interface SpellBook {
  name: SpellBookName;
  /**
   * Canonical spell list, authored once (typically for AllSpellMods, the "ideal" version) - every
   * mod in MOD_LAYER_ORDER (currently Vanilla and AllSpellMods) is derived from this automatically
   * via each spell's `fallback` (see resolveSpellBookSpellsForMod). Use `variants` instead for a
   * mod whose content can't be derived this way.
   */
  values: SpellBookSpells[];
  variants?: SpellBookModVariant[];
}

/** Every mod's spell set for `book`: one derived per MOD_LAYER_ORDER entry (richest-first, see
 * DEFAULT_VARIANT_ORDER) plus any genuinely distinct `book.variants`. */
export function spellBookVariants(book: SpellBook): SpellBookModVariant[] {
  return [
    ...DEFAULT_VARIANT_ORDER.map((mod) => ({
      mod,
      values: resolveSpellBookSpellsForMod(book.values, mod),
    })),
    ...(book.variants ?? []),
  ];
}

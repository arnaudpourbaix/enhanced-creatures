import { SpellbookModName } from "./spells/spellbook-mod-name";

interface SpellbookMod {
  /** Display label used to distinguish this variant's section in the generated documentation. */
  name: string;
  /**
   * Raw WeiDU condition code, used as `ACTION_IF <weiduCheck> BEGIN ... END`. Omitted for mods
   * (e.g. Vanilla) that represent unconditional content - always installed, no check needed.
   */
  weiduCheck?: string;
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
};

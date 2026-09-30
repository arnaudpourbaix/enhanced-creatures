export type SpellbookModName =
  | "Vanilla"
  | "SpellRevisions"
  | "FaithsAndPowers"
  | "StratagemsIWD"
  | "StratagemsNewSpells"
  /**
   * Spell Revisions + Stratagems IWD spells + Stratagems new spells, required together - a spell
   * that needs any one of them needs all three in practice (mixing partial combinations turned out
   * unmanageable for both players and spellbook authoring), so `requiresMod`/`obsoletedBy` on a
   * SpellReference (and a spellbook's non-vanilla SpellBookModVariant) should target this, not the
   * individual mods above.
   */
  | "AllSpellMods";

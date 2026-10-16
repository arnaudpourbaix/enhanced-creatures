import { TranslationKey } from "../translations/i18n";

/**
 * Monster entries: one monster in several versions (rank, age or size), as in a monster book.
 * Only multi-member entries are listed; a creature without entry is its own single-member entry.
 * Ids are stable: they will name entry-owned resources (see the monster entries roadmap).
 */
export enum EntryEnum {
  Basilisk = 1,
  ClayGolem = 2,
  Ghoul = 3,
  Mummy = 4,
  Shadow = 5,
  StoneGolem = 6,
  Vampire = 7,
  Wyvern = 8,
  Zombie = 9,
}

export const ENTRY_NAMES: Record<EntryEnum, TranslationKey> = {
  [EntryEnum.Basilisk]: "doc.entry.basilisk",
  [EntryEnum.ClayGolem]: "doc.entry.clayGolem",
  [EntryEnum.Ghoul]: "doc.entry.ghoul",
  [EntryEnum.Mummy]: "doc.entry.mummy",
  [EntryEnum.Shadow]: "doc.entry.shadow",
  [EntryEnum.StoneGolem]: "doc.entry.stoneGolem",
  [EntryEnum.Vampire]: "doc.entry.vampire",
  [EntryEnum.Wyvern]: "doc.entry.wyvern",
  [EntryEnum.Zombie]: "doc.entry.zombie",
};

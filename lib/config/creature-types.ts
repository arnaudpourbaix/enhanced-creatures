import { ImmunityName } from "../src/model/final/immunity";

/**
 * D&D 3e creature types, declared on creatures as traits (data.immunities or their trait item).
 * Order is the display order of type tags. Subtypes/features (extraplanar, skeletal, incorporeal,
 * cat, spider...) are not types. A trait nested in another (spider -> vermin) means "is a".
 */
export const TYPE_TRAITS: readonly ImmunityName[] = [
  "aberration",
  "animal",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "giant",
  "magicalBeast",
  "monstrousHumanoid",
  "ooze",
  "outsider",
  "plant",
  "undead",
  "vermin",
];

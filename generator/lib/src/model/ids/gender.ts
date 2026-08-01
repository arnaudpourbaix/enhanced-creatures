export const GENDER_IDENTIFIER = [
  "MALE",
  "FEMALE",
  "OTHER",
  "NIETHER",
  "BOTH",
  "SUMMONED",
  "ILLUSIONARY",
  "EXTRA",
  "SUMMONED_DEMON",
] as const;

export type GenderIdentifier = (typeof GENDER_IDENTIFIER)[number];

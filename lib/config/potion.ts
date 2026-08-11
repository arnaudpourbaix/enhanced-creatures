import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { PotionConfig } from "../src/model/spell-item/potion";

export const POTIONS: PotionConfig[] = [
  {
    name: "Potion of extra healing (40hp)",
    files: ["POTN55"],
    triggers: [
      {
        name: "General",
        params: [ScriptTarget.myself, "UNDEAD"],
        negation: true,
      },
      { name: "HPPercentLT", params: [ScriptTarget.myself, 30] },
    ],
  },
  {
    name: "Potion of extra healing (30hp)",
    files: ["POTN52"],
    triggers: [
      {
        name: "General",
        params: [ScriptTarget.myself, "UNDEAD"],
        negation: true,
      },
      { name: "HPPercentLT", params: [ScriptTarget.myself, 40] },
    ],
  },
  {
    name: "Exilir of health (10hp)",
    files: ["POTN17"],
    triggers: [
      {
        name: "General",
        params: [ScriptTarget.myself, "UNDEAD"],
        negation: true,
      },
      triggerFactory.or([
        { name: "HPPercentLT", params: [ScriptTarget.myself, 75] },
        { name: "StateCheck", params: [ScriptTarget.myself, "STATE_POISONED"] },
      ]),
    ],
  },
  {
    name: "Potion of healing (10hp)",
    files: ["POTN08"],
    triggers: [
      {
        name: "General",
        params: [ScriptTarget.myself, "UNDEAD"],
        negation: true,
      },
      { name: "HPPercentLT", params: [ScriptTarget.myself, 75] },
    ],
  },
  {
    name: "Potion of speed",
    files: ["POTN14"],
    triggers: [{ name: "RandomNumLT", params: [888, 100] }],
  },
  {
    name: "Potion of fire resistance",
    files: ["POTN02"],
    triggers: [{ name: "RandomNumLT", params: [888, 100] }],
  },
];

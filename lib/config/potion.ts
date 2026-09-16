import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { PotionConfig } from "../src/model/spell-item/potion";

export const POTIONS: PotionConfig[] = [
  {
    name: "Potion of superior healing (40hp)",
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
    name: "Potion of regeneration",
    files: ["POTN42"],
    triggers: [{ name: "HPPercentLT", params: [ScriptTarget.myself, 90] }],
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
    name: "Antidote",
    files: ["POTN20"],
    triggers: [{ name: "StateCheck", params: [ScriptTarget.myself, "STATE_POISONED"] }],
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
    triggers: [
      { name: "StateCheck", params: [ScriptTarget.myself, "STATE_HASTED"], negation: true },
    ],
    probability: 80,
  },
  {
    name: "Potion of invisibility",
    files: ["POTN10"],
    triggers: [
      // TODO: check if enemies have true sight ?
      { name: "StateCheck", params: [ScriptTarget.myself, "STATE_INVISIBLE"], negation: true },
    ],
    probability: 80,
  },
  {
    name: "Potion of invulnerability",
    files: ["POTN11"],
    probability: 80,
  },
  {
    name: "Potion of defense",
    files: ["POTN24"],
    probability: 80,
  },
  {
    name: "Potion of fire resistance",
    files: ["POTN02"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 100, "RESISTFIRE"] }],
    probability: 80,
  },
  {
    name: "Potion of magic resistance",
    files: ["POTN34"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 20, "RESISTMAGIC"] }],
    probability: 80,
  },
  {
    name: "Potion of magic shielding",
    files: ["POTN35"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 50, "MAGICDAMAGERESISTANCE"] }],
    probability: 80,
  },
  {
    name: "Potion of freedom",
    files: ["POTN45"],
    triggers: [
      { name: "CheckStatGT", params: ["Myself", 0, "CLERIC_FREE_ACTION"], negation: true },
    ],
    probability: 80,
  },
  {
    name: "Potion of storm giant strength",
    files: ["POTN07"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 24, "STR"] }],
    probability: 80,
  },
  {
    name: "Potion of cloud giant strength",
    files: ["POTN06"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 23, "STR"] }],
    probability: 80,
  },
  {
    name: "Potion of fire giant strength",
    files: ["POTN05"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 22, "STR"] }],
    probability: 80,
  },
  {
    name: "Potion of frost giant strength",
    files: ["POTN04"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 21, "STR"] }],
    probability: 80,
  },
  {
    name: "Potion of hill giant strength",
    files: ["POTN03"],
    triggers: [{ name: "CheckStatLT", params: ["Myself", 19, "STR"] }],
    probability: 80,
  },
];

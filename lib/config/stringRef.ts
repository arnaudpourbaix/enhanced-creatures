export enum BafExistingStringReference {
  LeaveMyWood = 5184,
}

/**
 * Existing dialog.tlk strings, by game: `bg1` on BGEE, `bg2` on BG2EE and EET (EET maps BG1's
 * strings onto BG2EE's identical ones, at no fixed offset, so BGEE's strrefs mean nothing there).
 * Only vanilla strrefs (BGEE with SoD below 71404, BG2EE below 103584): mods append theirs at
 * install-dependent numbers. Vanilla strrefs are the same in every language.
 *
 * Each list holds every vanilla string with that exact text, so an immunity's opcode 267 hides all
 * of them; the first one is the string displayed (StringRefUtils.getString). The game's ids are
 * picked at install time by the generated lib/common/string-refs.tpa.
 */
export const EXISTING_STRING_REFERENCES = [
  { str: "Hasted", group: "haste", bg1: [14023, 14667, 26019], bg2: [14023, 14667] },
  {
    str: "Cone of Cold",
    group: "coneOfCold",
    bg1: [26492, 12066, 13009, 13079],
    bg2: [12066, 13009, 13079],
  },
  { str: "Poison", group: "poison", bg1: [14017, 24454, 26215], bg2: [14017, 5805, 32304] },
  { str: "Poisoned", group: "poison", bg1: [14662, 17397, 25425], bg2: [14662, 17397, 30988] },
  { str: "Diseased", group: "disease", bg1: [31238], bg2: [54337] },
  { str: "Bleeding", group: "bleed", bg1: [25137], bg2: [54335] },
  { str: "Paralyzed", group: "held", bg1: [14650], bg2: [14650] },
  {
    str: "Held",
    group: "held",
    bg1: [14102, 17404, 25866, 31730, 31738, 31769, 31785, 31799],
    bg2: [14102, 340, 384, 915, 1473, 8823, 17404],
  },
  { str: "Stun", group: "stun", bg1: [14043, 25862], bg2: [14043] },
  { str: "Stunned", group: "stun", bg1: [26050], bg2: [1280, 74272] },
  { str: "One Level Drained", group: "levelDrain", bg1: [25802], bg2: [41495] },
  { str: "Two Levels Drained", group: "levelDrain", bg1: [25803], bg2: [40968] },
  { str: "Three Levels Drained", group: "levelDrain", bg1: [25804], bg2: [40969] },
  { str: "Four Levels Drained", group: "levelDrain", bg1: [25805], bg2: [40979] },
  { str: "Five Levels Drained", group: "levelDrain", bg1: [25806], bg2: [41616] },
  {
    str: "Sleep",
    group: "sleep",
    bg1: [12047, 12958, 13027, 14001, 17405, 26040, 26371],
    bg2: [12047, 12958, 13027, 14001, 17405],
  },
  { str: "Unconscious", group: "sleep", bg1: [20438, 25130], bg2: [20438] },
  {
    str: "Dire Charm",
    group: "charm",
    bg1: [26328, 12050, 12996, 13066, 17392],
    bg2: [12050, 12996, 13066, 17392],
  },
  { str: "Dominated", group: "charm", bg1: [26206], bg2: [8364] },
  { str: "Charmed", group: "charm", bg1: [14672, 31787], bg2: [14672, 1476] },
  { str: "Controlled", group: "control", bg1: [31245], bg2: [61418] },
  { str: "Dire charmed", group: "charm", bg1: [14780], bg2: [14780] },
  { str: "Panic", group: "panic", bg1: [14007, 17427, 25817, 25818], bg2: [14007, 17427] },
  { str: "Morale Failure: Panic", group: "panic", bg1: [20568], bg2: [20568] },
  {
    str: "Rigid Thinking",
    group: "rigidThinking",
    bg1: [14791, 12101, 12931, 17393, 26182, 26184],
    bg2: [14791, 12101, 12931, 17393],
  },
  { str: "Feebleminded", group: "rigidThinking", bg1: [23744], bg2: [23744] },
  { str: "Confused", group: "confusion", bg1: [14782, 17394, 25807], bg2: [14782, 17394] },
  { str: "Petrified", group: "petrified", bg1: [14665, 24179, 25863], bg2: [14665, 38043] },
  { str: "Polymorph", group: "polymorph", bg1: [14128], bg2: [14128] },
  {
    str: "Polymorphed",
    group: "polymorph",
    bg1: [25124, 31729, 31732, 31757],
    bg2: [339, 351, 809, 1482, 54332],
  },
  { str: "Death", group: "death", bg1: [14026, 15473, 25282], bg2: [14026] },
  { str: "Blinded", group: "blind", bg1: [14674, 26295, 31786], bg2: [14674, 1474] },
] as const;
export type ExistingStringReference = (typeof EXISTING_STRING_REFERENCES)[number]["str"];
export type StringReferenceGroup = (typeof EXISTING_STRING_REFERENCES)[number]["group"];

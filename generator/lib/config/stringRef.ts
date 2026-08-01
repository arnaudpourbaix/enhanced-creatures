export enum BafExistingStringReference {
  LeaveMyWood = 5184,
}

export const EXISTING_STRING_REFERENCES = [
  { id: [14023], str: "Hasted", group: "haste" },
  { id: [26492], str: "Cone of Cold", group: "coneOfCold" },
  { id: [14017, 26215], str: "Poison", group: "poison" },
  { id: [14662, 25425], str: "Poisoned", group: "poison" },
  { id: [31238], str: "Diseased", group: "disease" },
  { id: [25137], str: "Bleeding", group: "bleed" },
  { id: [14650], str: "Paralyzed", group: "held" },
  { id: [14102, 25866, 25866, 31799], str: "Held", group: "held" },
  { id: [14043, 25862], str: "Stun", group: "stun" },
  { id: [26050], str: "Stunned", group: "stun" },
  { id: [25802], str: "One Level Drained", group: "levelDrain" },
  { id: [25803], str: "Two Levels Drained", group: "levelDrain" },
  { id: [25804], str: "Three Levels Drained", group: "levelDrain" },
  { id: [25805], str: "Four Levels Drained", group: "levelDrain" },
  { id: [25806], str: "Five Levels Drained", group: "levelDrain" },
  {
    id: [12047, 12958, 13027, 14001, 17405, 26040, 26371],
    str: "Sleep",
    group: "sleep",
  },
  { id: [20438, 25130], str: "Unconscious", group: "sleep" },
  { id: [26328], str: "Dire Charm", group: "charm" },
  { id: [26206], str: "Dominated", group: "charm" },
  { id: [14672, 31787], str: "Charmed", group: "charm" },
  { id: [14780, 158915], str: "Dire charmed", group: "charm" },
  { id: [14007, 17427, 25818], str: "Panic", group: "panic" },
  { id: [20568], str: "Morale Failure: Panic", group: "panic" },
  { id: [14791, 26184], str: "Rigid Thinking", group: "rigidThinking" },
  { id: [23744], str: "Feebleminded", group: "rigidThinking" },
  { id: [14782, 25807], str: "Confused", group: "confusion" },
  { id: [14665, 25863], str: "Petrified", group: "petrified" },
  { id: [14128], str: "Polymorph", group: "polymorph" },
  { id: [25124, 31729, 31732, 31757], str: "Polymorphed", group: "polymorph" },
  { id: [14026], str: "Death", group: "death" },
  { id: [14674], str: "Blinded", group: "blind" },
] as const;
export type ExistingStringReference =
  (typeof EXISTING_STRING_REFERENCES)[number]["str"];
export type StringReferenceGroup =
  (typeof EXISTING_STRING_REFERENCES)[number]["group"];

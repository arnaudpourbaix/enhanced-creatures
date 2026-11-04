import { ScriptTarget } from "../src/model/constants";
import { GeneralIdentifier } from "../src/model/ids/general";
import { RaceIdentifier } from "../src/model/ids/race";
import { StatsIdentifier } from "../src/model/ids/stats";
import { Triggers } from "../src/model/script/triggers";

/**
 * A cloud spell a creature should get out of. With Stratagems installed, its clouds shout their
 * code every 3 seconds while they last (stratagems/initial/detectcloud.tpa): these are SCS's codes
 * and checks (stratagems/genai/ssl/fleecloud.ssl). Without SCS nothing shouts, and they never fire.
 */
export interface Cloud {
  name: string;
  /** Shouts heard from this cloud */
  shouts: number[];
  /** How far from the cloud to worry about it */
  range: number;
  /** Creature types it doesn't affect: no block for them, checked in the script for the others */
  immune?: { general?: GeneralIdentifier[]; race?: RaceIdentifier[] };
  /** Otherwise, the creature can be affected (on itself, ScriptTarget.myself) */
  affected?: Triggers.Trigger[];
  /** Magic resistance above which a creature seeing an enemy ignores it (default: 80) */
  magicResistance?: number;
}

const myself = ScriptTarget.myself;
const NEAREST_ENEMY = `NearestEnemyOf(${myself})`;

/** Not fully resisting `stat`, and only flee a partial resistance when no enemy is in sight */
function vulnerable(stat: StatsIdentifier): Triggers.Trigger[] {
  return [
    { name: "CheckStatGT", params: [myself, 99, stat], negation: true },
    {
      name: "Or",
      triggers: [
        { name: "CheckStatGT", params: [myself, 59, stat], negation: true },
        { name: "See", params: [NEAREST_ENEMY], negation: true },
      ],
    },
  ];
}

const NO_MINOR_GLOBE: Triggers.Trigger = {
  name: "CheckStatGT",
  params: [myself, 0, "MINORGLOBE"],
  negation: true,
};

export const CLOUDS: Cloud[] = [
  {
    name: "Storm of Vengeance",
    shouts: [407],
    range: 20,
    affected: [
      {
        name: "Or",
        triggers: (["RESISTACID", "RESISTFIRE", "RESISTELECTRICITY"] as const).map((stat) => ({
          name: "CheckStatGT",
          params: [myself, 99, stat],
          negation: true,
        })),
      },
    ],
  },
  {
    name: "Incendiary Cloud, Meteor Swarm, Fire Storm",
    shouts: [405, 409],
    range: 20,
    affected: vulnerable("RESISTFIRE"),
    magicResistance: 79,
  },
  { name: "Death Fog", shouts: [408], range: 20, affected: vulnerable("RESISTACID") },
  {
    name: "Cloudkill",
    shouts: [404],
    range: 20,
    immune: { general: ["UNDEAD"], race: ["DEMONIC"] },
  },
  {
    name: "Stinking Cloud",
    shouts: [411],
    range: 15,
    immune: { general: ["UNDEAD"], race: ["DEMONIC"] },
    affected: [NO_MINOR_GLOBE],
  },
  {
    name: "Web",
    shouts: [410],
    range: 15,
    affected: [
      NO_MINOR_GLOBE,
      { name: "CheckStatGT", params: [myself, 0, "CLERIC_FREE_ACTION"], negation: true },
      { name: "CheckSpellState", params: [myself, "HOLD_IMMUNITY"], negation: true },
    ],
  },
  { name: "Ice Storm, Writhing Fog", shouts: [412], range: 20, affected: vulnerable("RESISTCOLD") },
  {
    name: "Suffocate, Cloud of Pestilence",
    shouts: [413],
    range: 10,
    immune: { general: ["UNDEAD"], race: ["ELEMENTAL", "GOLEM", "MYCONID"] },
  },
];

/** Shouts after which a creature seeing no enemy stays put rather than walk into the cloud */
export const CLOUD_STOP_SHOUTS = [404, 405, 406, 407, 408, 409, 410, 411];

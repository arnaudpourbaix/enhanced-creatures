import responseFactory from "../../src/factories/response.factory";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureScriptEdit } from "../../src/model/creature/data";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin, kinOf } from "../../src/model/creature/kin";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import type { ConditionalStatement } from "../../src/model/script/script";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { createRevenantGrip, RevenantKin, revenantNature } from "./kin";

/**
 * Svlast's Torment (Firewine ruins): UBSVLREV is Svlast's brother in the faith, who he murdered.
 * Its override script runs the quest and goes after Svlast, its killer, first; once hostile, its
 * other fights are left to the revenant's script (a lower slot):
 * - its blocks attacking the last attacker or the nearest enemy are removed;
 * - its catch-all walk to Svlast only runs while it isn't hostile;
 * - it gazes at Svlast once they have spoken: in PnP the gaze is for its killer, and Svlast is
 *   never one of its enemies, so its own script wouldn't.
 */
function svlastQuest(gaze: string): CreatureScriptEdit {
  return {
    files: ["UBSVLREV"],
    replaces: [["True()", "!Allegiance(Myself,ENEMY)"]],
    removeBlocks: ["AttackedBy([ANYONE],DEFAULT)", "NearestEnemyOf(Myself)"],
    prepend: `
IF
  GlobalGT("UBSVLAST_ENC","GLOBAL",3)
  HaveSpellRES("${gaze}")
  !GlobalTimerNotExpired("JA_ROUND","LOCALS")
  See("ubsvlast")
  !StateCheck("ubsvlast",STATE_BLIND)
  !CheckStatGT("ubsvlast",0,HELD)
  !CheckStatGT("ubsvlast",0,CLERIC_FREE_ACTION)
  !CheckSpellState("ubsvlast",HOLD_IMMUNITY)
THEN
  RESPONSE #100
    SetGlobalTimer("JA_ROUND","LOCALS",6)
    ForceSpellRES("${gaze}","ubsvlast")
END
`,
  };
}

/**
 * BPREVE01, an unused Black Pits revenant (nothing spawns it, Llyrk only summons BPSKEL
 * skeletons), had their script BPSKEL: kept by precaution (user), it dies when Llyrk is dead or
 * gone, as they do.
 */
function diesWithLlyrk(): ConditionalStatement {
  return {
    comment: "BPREVE01 dies with Llyrk, its summoner",
    triggers: [
      { name: "Name", params: ["BPREVE01", "Myself"] },
      {
        name: "Or",
        triggers: [
          { name: "Dead", params: ["BPLLYRK"] },
          { name: "HPLT", params: ["BPLLYRK", 1] },
          { name: "InMyArea", params: ["BPLLYRK"], negation: true },
        ],
      },
    ],
    responses: responseFactory.response([
      { name: "Kill", params: ["Myself"] },
      { name: "ApplyDamage", params: ["Myself", 999, "CRUSHING"] },
    ]),
  };
}

export function revenant(entry: CreatureEntry<Creature>, kin: RevenantKin): Creature {
  const nature = revenantNature(kin);
  const revenant = entry.create({
    monster: MonsterEnum.Revenant,
    name: "monster.revenant.name",
    files: [],
    data: {
      level1: 8,
      strength: 18,
      // its grip is its whole attack: 2d8, no strength bonus
      strength2e: { source: "MM revenant: damage 2-16, no strength" },
      dexterity: 14,
      constitution: 18,
      intelligence: 17,
      wisdom: 16,
      charisma: 18,
      ac: 10,
      apr: 1,
      xpv2e: 3000,
      alignment: "NEUTRAL",
      morale: 20,
      general: "UNDEAD",
      race: "GHOUL",
      class: "GHOUL_REVEANT",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 9,
      ...nature,
      script: { remove: ["BPSKEL"] },
      items: {
        ...nature.items,
        remove: ["REVENT1", "REVENT2", "IMMUNE1", "RING95", "UBSVLHLM"],
      },
    },
  });
  createRevenantGrip(revenant, { slot: "WEAPON1" });
  revenant.setBehavior({
    abilities: { entries: [{ power: kin.gaze }] },
    customCodes: [{ location: "init", type: "insertBefore", statements: [diesWithLlyrk()] }],
  });
  revenant.data.script.edits = [svlastQuest(kin.gaze.file)];
  revenant.setAdjustments([
    { files: ["FIRMON04", "REVENT", "UBSVLREV", "FEARM"], data: { level1: 15 } },
  ]);
  return revenant;
}

export const createRevenantEntry = (kins: Map<KinEnum, CreatureKin>) => {
  const kin = kinOf(kins, KinEnum.Revenant, RevenantKin);
  return new SimpleEntry(EntryEnum.Revenant, [(entry) => revenant(entry, kin)], kin);
};

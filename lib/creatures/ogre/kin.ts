/**
 * Shared weapon/spell primitives for every ogre creature. Creature-specific
 * data lives as plain functions in the per-monster files (ogre.ts,
 * ogrillon.ts, half-ogre.ts, ogre-mage.ts, berserker.ts, shaman.ts).
 */
import { createConeOfCold } from "../../spells/cone_of_cold";
import { Creature } from "../../src/model/creature/creature";
import { CreatureKin } from "../../src/model/creature/kin";
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import { Item } from "../../src/model/spell-item/spell-item";
import { Strength2e } from "../../src/model/creature/data";
import { KinEnum } from "../kin";

/**
 * Shared ability/item ids for the ogre kin. They live in one enum because
 * `entry.item(id)` / `entry.spell(id)` search across every creature in the
 * entry, so ids must stay unique kin-wide.
 */
export enum Ids {
  ConeOfCold,
  Fly,
  GaseousForm,
  Naginata,
  HalfOgre,
  Ogre,
  OgreLeader,
}

/**
 * 2e Monstrous Manual ogre strengths (see docs/research/strength-damage-survey.md): "1-10 (or by
 * weapon +6)" is 18/00; "Ogres wielding weapons get a Strength bonus of +2 to hit; leaders have
 * +3, chieftains have +4", 18/00 giving +3.
 */
const OGRE_MM = "MM ogre: 1-10 (or by weapon +6), Strength bonus of +2 to hit";
export const OGRE_STRENGTH_2E: Strength2e = {
  strength: 18,
  exceptionalStrength: 100,
  hit: -1,
  source: OGRE_MM,
};
export const OGRE_LEADER_STRENGTH_2E: Strength2e = {
  strength: 18,
  exceptionalStrength: 100,
  source: "MM ogre leader: +6 with weapon, +3 to hit",
};
export const OGRE_CHIEFTAIN_STRENGTH_2E: Strength2e = {
  strength: 18,
  exceptionalStrength: 100,
  hit: 1,
  source: "MM ogre chieftain: +6 with weapon, +4 to hit",
};

export class Ogre extends Creature {
  /**
   * Ogre Fists
   */
  createFists(p: { diceThrown: number; diceSize: number; id?: number; equipped?: boolean }) {
    return this.addNaturalWeapon("fists", {
      id: p.id,
      slot: (p.equipped ?? true) ? "WEAPON1" : null,
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      speed: 3,
    });
  }

  /**
   * Cone of cold
   */
  createConeOfCold() {
    return this.addSpell(
      createConeOfCold({
        id: Ids.ConeOfCold,
        description: "monster.ogre.ability.coneOfCold",
        memorizedCount: 1,
        headers: [
          {
            minLevel: 1,
            damage: {
              diceThrown: 8,
              diceSize: 8,
              amount: 0,
            },
          },
        ],
        projectile: {
          copyFromFile: "CONECOLD",
          name: "Ogre-Mage Cone of Cold",
          areaEffectInfo: {
            areaProjectileFlags: [
              AreaProjectileEnum.Coneshaped,
              // we don't want ogres to kill each other, it can be seen as a cheat but humans have no problem to properly cast it
              AreaProjectileEnum.AffectOnlyEnemies,
            ],
            areaOfEffect: 620, // 60 feet long with a terminal diameter of 20 feet
            triggerRadius: 620,
            coneWidth: 60,
          },
        },
      }),
    );
  }
}

export class OgreKin extends CreatureKin {
  /**
   * The Ogre's fists, set when the Ogre entry builds; the Ogre Shaman equips them too.
   */
  ogreFists?: Item;

  constructor() {
    super(KinEnum.Ogre);
  }
}

export const createOgreKin = () => new OgreKin();

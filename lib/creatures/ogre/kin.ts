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

import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { Creature } from "../../src/model/creature/creature";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectDamageModeEnum,
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  EffectTimingEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";

export enum BearIds {
  ImprovedStreamOfFrost,
}

export class Bear extends Creature {
  createPaws(
    diceThrown: number,
    diceSize: number,
    hug: {
      diceSize: number;
      diceThrown: number;
    },
  ) {
    return this.addNaturalWeapon("claws", {
      diceThrown,
      diceSize,
      stringRef: "monster.bear.weapon.claws",
      speed: 5,
      castSpells: [
        {
          probability1: 10,
          spell: {
            name: "monster.bear.hug.name",
            secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
            headers: [
              {
                type: ItemAbilityTypeEnum.Melee,
                range: 5,
                effects: [
                  {
                    opcode: EffectTypeEnum.Damage,
                    type: EffectDamageTypeEnum.Crushing,
                    diceThrown: hug.diceThrown,
                    diceSize: hug.diceSize,
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  }

  createJaws(diceThrown: number, diceSize: number) {
    return this.addNaturalWeapon("jaws", {
      diceThrown,
      diceSize,
      stringRef: "monster.bear.weapon.jaws",
      speed: 3,
      slot: "SHIELD",
    });
  }
}

export class BearKin extends CreatureKin {
  constructor() {
    super(KinEnum.Bear);
    this.createImprovedStreamOfFrost();
  }

  /**
   * Improved Stream Of Frost
   */
  private createImprovedStreamOfFrost() {
    return this.addSpell({
      name: "monster.bear.improvedStreamOfFrost.name",
      description: "monster.bear.improvedStreamOfFrost.description",
      id: BearIds.ImprovedStreamOfFrost,
      options: { renew: 3 },
      icon: SPELLS.Wizard.Fireburst.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      keywords: ["cold", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          projectile: {
            copyFromFile: "CONECOLD",
            name: "Improved stream of frost",
            areaEffectInfo: {
              areaProjectileFlags: [
                AreaProjectileEnum.AffectOnlyEnemies,
                AreaProjectileEnum.UseSecondaryProjectile,
              ],
              triggerRadius: 180,
              areaOfEffect: 180, // within 10 feet
              coneWidth: 0,
            },
          },
          range: 10,
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              amount: 0,
              damageMode: EffectDamageModeEnum.Normal,
              type: EffectDamageTypeEnum.Cold,
              diceThrown: 6,
              diceSize: 4,
              saveTypes: [SaveTypeEnum.Breath],
              flags: [EffectFlagsEnum.SaveForHalf],
            },
            ...effectFactory.paralyze({
              duration: 1 * Durations.turn,
              saveType: SaveTypeEnum.ParalyzePoisonDeath,
              saveBonus: -2,
              startSound: "MISC_04A",
              endSound: "EFF_E03",
              pulse: { blue: 255, green: 213, red: 123, speed: 20 },
              lightingEffect: LightingEffectEnum.AlterationWater,
            }),
          ],
        },
      ],
      ability: {
        targets: [
          {
            name: "NearestEnemies",
            limit: 3,
          },
        ],
        spell: {
          type: "force",
          castOnSelf: true,
        },
        range: 10,
        probability: 20,
      },
    });
  }
}

export const createBearKin = () => new BearKin();

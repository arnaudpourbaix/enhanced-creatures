import { Creature } from "../../src/model/creature/creature";
import { CreatureKin } from "../../src/model/creature/kin";
import {
  EffectDamageTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
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
      stringRef: "common.naturalWeapon.paws",
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
      speed: 3,
      slot: "SHIELD",
    });
  }
}

export class BearKin extends CreatureKin {
  constructor() {
    super(KinEnum.Bear);
  }
}

export const createBearKin = () => new BearKin();

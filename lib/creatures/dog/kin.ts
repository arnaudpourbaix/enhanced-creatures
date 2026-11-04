import { Creature } from "../../src/model/creature/creature";
import { CreatureGrabConfig } from "../../src/model/creature/grab";
import { CreatureKin } from "../../src/model/creature/kin";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import { KinEnum } from "../kin";

export enum DogIds {
  Blink,
  BreathFire,
}

export class Dog extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    castSpell?: WeaponCastSpell;
    grab?: CreatureGrabConfig;
  }) {
    return this.addNaturalWeapon("jaws", {
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      speed: 3,
      castSpells: p.castSpell ? [p.castSpell] : undefined,
      grab: p.grab,
    });
  }
}

export class DogKin extends CreatureKin {
  constructor() {
    super(KinEnum.Dog);
  }
}

export const createDogKin = () => new DogKin();

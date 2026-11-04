import { Creature } from "../../src/model/creature/creature";
import { ItemSlot } from "../../src/model/creature/item";
import { CreatureKin } from "../../src/model/creature/kin";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import { KinEnum } from "../kin";

export enum WolfIds {
  DreadWolfDisease,
  DreadWolfDownState,
  StreamOfFrost,
}

export class Wolf extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    castSpells?: WeaponCastSpell[];
    slot?: ItemSlot;
  }) {
    return this.addNaturalWeapon("jaws", {
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      speed: 3,
      slot: p.slot ?? "WEAPON1",
      castSpells: p.castSpells,
    });
  }
}

export class WolfKin extends CreatureKin {
  constructor() {
    super(KinEnum.Wolf);
  }
}

export const createWolfKin = () => new WolfKin();

import { Creature } from "../../src/model/creature/creature";
import { CreatureKin } from "../../src/model/creature/kin";
import { Effect } from "../../src/model/spell-item/effect";
import { EffectDamageTypeEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import creatureService from "../../src/services/creature.service";
import { KinEnum } from "../kin";
import { addLeap, leapAttackEffects } from "../leap";

export enum CatIds {
  CheetahLeap,
  LeopardLeap,
  JaguarLeap,
  LionLeap,
  MountainLionLeap,
  SpottedLionLeap,
  TigerLeap,
  LynxLeap,
  BurstOfSpeed,
}

export class Cat extends Creature {
  /**
   * The paws: one forepaw a hit, its claw/claw attacks being two hits a round. With `rear` (the
   * leap's weapon), all four claws on one hit: both forepaws and both rear claws. Each dice and
   * bonus is one claw's, as PnP prints it (a wild tiger's 1d4+1), Strength apart.
   */
  createPaws(p: {
    id?: number;
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    rear?: {
      diceThrown: number;
      diceSize: number;
      damageBonus?: number;
    };
  }) {
    const amount = creatureService.naturalStrengthDamage(this.data);
    const forepaws = p.rear ? 2 : 1;
    const effects: Effect[] = [];
    if (p.rear) {
      effects.push({
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Slashing,
        diceThrown: p.rear.diceThrown * 2,
        diceSize: p.rear.diceSize,
        amount: (amount + (p.rear.damageBonus ?? 0)) * 2,
      });
    }
    return this.addNaturalWeapon("claws", {
      effects,
      stringRef: "common.naturalWeapon.paws",
      id: p.id,
      slot: p.id === undefined ? "WEAPON1" : null,
      diceThrown: p.diceThrown * forepaws,
      diceSize: p.diceSize,
      ...(p.damageBonus ? { damageBonus: p.damageBonus * forepaws } : {}),
      speed: 5,
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

  /**
   * Leap
   */
  createLeap(p: { id: number; range: number; effects: Effect[] }) {
    return addLeap(this, {
      ...p,
      name: "monster.cat.ability.leap.name",
      description: "monster.cat.ability.leap.description",
    });
  }

  /**
   * Leap attack
   */
  createLeapAttack(p: {
    id: number;
    range: number;
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    rear: {
      diceThrown: number;
      diceSize: number;
      damageBonus?: number;
    };
  }) {
    this.createPaws(p);
    return this.createLeap({
      ...p,
      effects: leapAttackEffects(this.item(p.id), "monster.cat.ability.leap.attack"),
    });
  }
}

export class CatKin extends CreatureKin {
  constructor() {
    super(KinEnum.Cat);
  }
}

export const createCatKin = () => new CatKin();

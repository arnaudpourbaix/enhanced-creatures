import { SPELLS } from "../../config/spells/spell-database";
import { ScriptTarget } from "../../src/model/constants";
import { Creature } from "../../src/model/creature/creature";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  AttackModifierTypeEnum,
  EffectDamageTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityTypeEnum,
  WingBuffetDirectionEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import creatureService from "../../src/services/creature.service";
import { KinEnum } from "../kin";

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
  createPaws(p: {
    id?: number;
    diceThrown: number;
    diceSize: number;
    rear?: {
      diceThrown: number;
      diceSize: number;
    };
  }) {
    const amount = creatureService.getStrengthBonus(this.data).damage;
    const effects: Effect[] = [];
    if (p.rear) {
      effects.push({
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Slashing,
        diceThrown: p.rear.diceThrown * 2,
        diceSize: p.rear.diceSize,
        amount: amount * 2,
      });
    }
    return this.addNaturalWeapon("claws", {
      effects,
      stringRef: "common.naturalWeapon.paws",
      id: p.id,
      slot: p.id === undefined ? "WEAPON1" : null,
      diceThrown: p.diceThrown * 2,
      diceSize: p.diceSize,
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
  createLeap(p: {
    id: number;
    range: number;
    diceThrown: number;
    diceSize: number;
    rear: {
      diceThrown: number;
      diceSize: number;
    };
    effects: Effect[];
  }) {
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.WingBuffet,
        target: EffectTargetEnum.Self,
        speed: 150,
        direction: WingBuffetDirectionEnum.TowardsTargetPoint,
        duration: 2,
      },
      ...p.effects,
    ];
    return this.addSpell({
      id: p.id,
      name: "monster.cat.ability.leap.name",
      description: "monster.cat.ability.leap.description",
      icon: SPELLS.Wizard.DimensionDoor.file,
      memorizedCount: 1,
      options: { renew: 2 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: p.range,
          effects,
        },
      ],
      ability: {
        targets: [{ name: "FarthestEnemies", randomOrder: true }],
        minRange: 5,
        range: p.range,
        spell: {
          type: "force",
          isAttack: true,
        },
        disableInterrupt: true,
        actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
      },
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
    rear: {
      diceThrown: number;
      diceSize: number;
    };
  }) {
    this.createPaws(p);
    return this.createLeap({
      ...p,
      effects: [
        {
          opcode: EffectTypeEnum.ModifyAttacksPerRound,
          type: AttackModifierTypeEnum.Set,
          value: 1,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: Durations.round,
        },
        {
          opcode: EffectTypeEnum.CreateWeapon,
          amount: 1,
          resource: this.item(p.id).file,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: Durations.round,
        },
        {
          opcode: EffectTypeEnum.DisplayString,
          stringRef: "monster.cat.ability.leap.attack",
        },
      ],
    });
  }
}

export class CatKin extends CreatureKin {
  constructor() {
    super(KinEnum.Cat);
  }
}

export const createCatKin = () => new CatKin();

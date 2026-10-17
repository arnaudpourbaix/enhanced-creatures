import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { customCodes } from "../common";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Cat, CatIds } from "./kin";

class Cheetah extends Cat {
  /**
   * Burst Of Speed
   */
  createBurstOfSpeed() {
    const duration = 3 * Durations.round;
    return this.addSpell({
      name: "monster.cat.ability.burstOfSpeed.name",
      description: "monster.cat.ability.burstOfSpeed.description",
      id: CatIds.BurstOfSpeed,
      memorizedCount: 1,
      options: {
        renew: 30,
      },
      castingSound: "CAS_P04",
      icon: SPELLS.Wizard.Haste.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(45),
              timing: EffectTimingEnum.InstantLimited,
              duration,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Haste,
              timing: EffectTimingEnum.InstantLimited,
              duration,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.cat.ability.burstOfSpeed.name",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource: "EFF_M28",
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.DelayPermanent,
              resource: "EFF_M29",
              duration,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "reallyForce",
          castOnSelf: true,
          remove: true,
        },
      },
    });
  }
}

class CheetahEntry extends CreatureEntry<Cheetah> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Cheetah, kin);
    this.addCreature(() => this.cheetah());
  }

  createCreature(id: MonsterEnum): Cheetah {
    return new Cheetah(id);
  }

  /**
   * Cheetah
   */
  private cheetah() {
    const cheetah = this.create({
      monster: MonsterEnum.Cheetah,
      name: "monster.cat.name.cheetah",
      files: [],
      data: {
        level1: 3,
        strength: 14,
        dexterity: 16,
        constitution: 13,
        intelligence: 1,
        wisdom: 12,
        charisma: 6,
        ac: 5,
        apr: 3,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 15, // sprint 45
        items: {
          remove: ["P1-8"],
        },
        immunities: ["cat", "animal"],
      },
    });
    cheetah.createBurstOfSpeed();
    const dices = {
      diceThrown: 1,
      diceSize: 2,
    };
    cheetah.createPaws(dices);
    cheetah.createJaws(1, 8);
    cheetah.createLeapAttack({
      id: CatIds.CheetahLeap,
      ...dices,
      range: 20,
      rear: {
        diceThrown: 1,
        diceSize: 2,
      },
    });
    cheetah.setBehavior({
      abilities: [this.ability(CatIds.CheetahLeap), this.ability(CatIds.BurstOfSpeed)],
      customCodes: [customCodes.hunterCustomCode],
    });
    return cheetah;
  }
}

export const createCheetahEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new CheetahEntry(kins.get(KinEnum.Cat));

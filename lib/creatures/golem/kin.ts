import { SPELLS } from "../../config/spells/spell-database";
import { createConeOfCold } from "../../spells/cone_of_cold";
import effectFactory from "../../src/factories/effect.factory";
import { Creature } from "../../src/model/creature/creature";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectCastSpellTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import { KinEnum } from "../kin";

export enum GolemIds {
  Charge,
  CloudOfPoisonousGas,
  ConeOfCold,
  Haste,
  HideousLaugh,
  WildMagicFlare,
}

export const BAF_CONTINUE = "Continue()";

export class Golem extends Creature {
  createFists({
    diceThrown,
    diceSize,
    damageType,
    castSpell,
    effects,
  }: {
    diceThrown: number;
    diceSize: number;
    damageType?: AbilityDamageTypeEnum;
    castSpell?: WeaponCastSpell;
    effects?: Effect[];
  }) {
    return this.addNaturalWeapon("fists", {
      diceThrown,
      diceSize,
      damageType,
      effects,
      speed: 4,
      castSpells: castSpell ? [castSpell] : undefined,
    });
  }

  /**
   * Charge
   */
  createCharge() {
    //TODO: this is a poor implementation of a charge
    // Anyone caught in the path of a juggernaut charge is run over by the thundering behemoth,
    // though the juggernaut must make a normal attack roll if the victim can avoid the charge.
    // A hit indicates that the victim is crushed, suffering 10d10 points of damage
    const attack = this.createFists({
      diceSize: 10,
      diceThrown: 10,
      damageType: AbilityDamageTypeEnum.Crushing,
    });
    const duration = 3 * Durations.round;
    const peakCharge = this.addSpell({
      name: "monster.golem.ability.charge.peakSpeed",
      icon: SPELLS.Wizard.Haste.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(12),
              duration,
            },
            {
              opcode: EffectTypeEnum.CreateWeapon,
              amount: 1,
              resource: attack.file,
              target: EffectTargetEnum.Self,
              duration,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.golem.ability.charge.end",
              timing: EffectTimingEnum.DelayPermanent,
              duration,
            },
          ],
        },
      ],
    });
    return this.addSpell({
      name: "monster.golem.ability.charge.name",
      description: "monster.golem.ability.charge.description",
      id: GolemIds.Charge,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Haste.file,
      options: { renew: 6 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(6),
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.round,
            },
            {
              ...effectFactory.naturalMovementSpeed(9),
              timing: EffectTimingEnum.DelayLimited,
              duration: Durations.round,
            },
            {
              opcode: EffectTypeEnum.CastSpell,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              timing: EffectTimingEnum.DelayPermanent,
              duration: 2 * Durations.round,
              resource: peakCharge.file,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "force",
          castOnSelf: true,
          remove: true,
        },
        triggers: [{ name: "Range", params: ["NearestEnemyOf", 5], negation: true }],
      },
    });
  }

  /**
   * Cone of cold
   */
  createConeOfCold() {
    // Snow golems are able to breathe a cone of cold once every five rounds.
    // This functions as if the spell of that name were being cast by a 10th level wizard.
    return this.addSpell(
      createConeOfCold({
        id: GolemIds.ConeOfCold,
        description: "monster.golem.ability.coneOfCold",
        memorizedCount: 1,
        options: { renew: 5 },
        headers: [
          {
            minLevel: 1,
            damage: {
              diceThrown: 10,
              diceSize: 4,
              amount: 10,
            },
          },
          {
            minLevel: 18,
            damage: {
              diceThrown: 15,
              diceSize: 4,
              amount: 15,
            },
          },
        ],
      }),
    );
  }
}

export class GolemKin extends CreatureKin {
  constructor() {
    super(KinEnum.Golem);
  }
}

export const createGolemKin = () => new GolemKin();

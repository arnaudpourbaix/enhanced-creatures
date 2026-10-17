import { SPELLS } from "../../config/spells/spell-database";
import { ScriptTarget } from "../../src/model/constants";
import { Creature } from "../../src/model/creature/creature";
import { CreatureGrabConfig } from "../../src/model/creature/grab";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTeleportTypeEnum,
  EffectTimingEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
  SpellFlagEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { PartialSpellHeader, WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import { CreatureKin } from "../../src/model/creature/kin";
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
      stringRef: "monster.dog.weapon.jaws",
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      speed: 3,
      castSpells: p.castSpell ? [p.castSpell] : undefined,
      grab: p.grab,
    });
  }

  /**
   * Blink
   */
  createBlink() {
    return this.addSpell({
      icon: SPELLS.Wizard.DimensionDoor.file,
      options: {
        renew: 1,
      },
      name: "monster.dog.ability.blink",
      id: DogIds.Blink,
      memorizedCount: 1,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.Teleport,
              type: EffectTeleportTypeEnum.Default,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.Thac0Bonus,
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.round,
              type: EffectStatisticModifierEnum.Increment,
              probability1: 75,
              value: 2,
              target: EffectTargetEnum.Self,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "FarthestEnemies", randomOrder: true }],
        spell: {
          type: "force",
        },
        actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
      },
    });
  }

  /**
   * Hell Hound Breath Fire
   */
  createBreathFire() {
    const headers: PartialSpellHeader[] = [4, 5, 6, 7].map((level) => ({
      type: ItemAbilityTypeEnum.Melee,
      minLevel: level,
      range: 10,
      // projectile: "dvburnhd",
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Fire,
          amount: level,
          saveTypes: [SaveTypeEnum.Breath, SaveTypeEnum.BypassMirrorImage],
          flags: [EffectFlagsEnum.SaveForHalf],
        },
      ],
    }));
    return this.addSpell({
      name: "monster.dog.ability.breathFire.name",
      description: "monster.dog.ability.breathFire.description",
      id: DogIds.BreathFire,
      memorizedCount: 1,
      icon: SPELLS.Wizard.BurningHands.file,
      options: {
        renew: 1,
      },
      castingSound: "CAS_M08",
      flags: [SpellFlagEnum.BreakSanctuary],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        spell: {
          type: "force",
          remove: true,
        },
        range: 10,
      },
      keywords: ["fire", "area"],
      headers,
    });
  }
}

export class DogKin extends CreatureKin {
  constructor() {
    super(KinEnum.Dog);
  }
}

export const createDogKin = () => new DogKin();

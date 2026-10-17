import { SPELLS } from "../../config/spells/spell-database";
import { ScriptTarget } from "../../src/model/constants";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTeleportTypeEnum,
  EffectTimingEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Dog, DogIds } from "./kin";

class BlinkDog extends Dog {
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
}

class BlinkDogEntry extends CreatureEntry<BlinkDog> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.BlinkDog, kin);
    this.addCreature(() => this.blinkDog());
  }

  createCreature(id: MonsterEnum): BlinkDog {
    return new BlinkDog(id);
  }

  /**
   * Blink Dog
   */
  private blinkDog() {
    const blinkDog = this.create({
      monster: MonsterEnum.BlinkDog,
      name: "monster.dog.name.blink",
      files: [],
      data: {
        level1: 4,
        strength: 12,
        dexterity: 17,
        constitution: 15,
        intelligence: 9,
        wisdom: 13,
        charisma: 11,
        ac: 5,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 12,
        general: "ANIMAL",
        race: "DOG",
        class: "DOG_WILD",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        immunities: ["magicalBeast"],
        items: { remove: ["P1-6"] },
        script: { remove: ["PSPIDER"] },
      },
    });
    blinkDog.createBlink();
    blinkDog.createJaws({ diceThrown: 1, diceSize: 6 });
    blinkDog.setBehavior({ abilities: [this.ability(DogIds.Blink)] });
    return blinkDog;
  }
}

export const createBlinkDogEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new BlinkDogEntry(kins.get(KinEnum.Dog));

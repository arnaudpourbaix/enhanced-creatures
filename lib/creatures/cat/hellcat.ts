import {
  EffectStatisticModifierEnum,
  InvisibilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat } from "./kin";

class HellcatEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Hellcat, kin, MonsterFamilyEnum.Cat);
    this.addCreature(() => this.hellcat());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Hellcat
   */
  private hellcat() {
    const hellcat = this.create({
      monster: MonsterEnum.Hellcat,
      name: "monster.cat.name.hellcat",
      files: [],
      data: {
        immunities: ["outsider"],
        level1: 7,
        bonusHp: 2,
        strength: 21,
        dexterity: 21,
        constitution: 19,
        intelligence: 10,
        wisdom: 14,
        charisma: 10,
        ac: 5,
        apr: 3,
        xpv: 5000,
        alignment: "LAWFUL_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "DEMONIC",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        hideShadow: 100,
        moveSilent: 100,
        movement: 15,
        items: {
          remove: ["BDHELCAT", "RINGDEMN", "IPSION"],
        },
        script: {
          remove: ["BDHELCAT"],
        },
        effects: {
          remove: [EffectTypeEnum.Blur, EffectTypeEnum.ProtectionFromBackstab],
        },
      },
    });
    hellcat.addTrait({
      immunities: ["mindSpells", "nonMagicalWeapons", "extraplanar"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 20,
          type: EffectStatisticModifierEnum.Set,
        },
        {
          opcode: EffectTypeEnum.Invisibility,
          type: InvisibilityTypeEnum.Improved,
        },
      ],
    });
    hellcat.createPaws({ diceThrown: 1, diceSize: 4 });
    hellcat.createJaws(2, 6);
    return hellcat;
  }
}

export const createHellcatEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HellcatEntry(kins.get(KinEnum.Cat));

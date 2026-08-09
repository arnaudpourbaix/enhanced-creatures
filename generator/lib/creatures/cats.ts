import { MonsterItemIconEnum } from "../config/item";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import {
  AbilityDamageTypeEnum,
  CastSpellOnConditionTargetEnum,
  EffectBonusToEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  InvisibilityTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import creatureService from "../src/services/creature.service";
import { hunterCustomCode } from "./common";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

class Cat extends Creature {
  createPaws(
    diceThrown: number,
    diceSize: number,
    rear: {
      diceThrown: number;
      diceSize: number;
    },
  ) {
    const amount = creatureService.getStrengthBonus(this.data).damage;
    return this.addWeapon({
      weapon: {
        stringRef: "monster.cat.weapon.claws",
        icon: MonsterItemIconEnum.Wolf,
        equippedSlot: ["WEAPON1"],
        header: {
          diceThrown,
          diceSize,
          type: ItemAbilityTypeEnum.Melee,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: [
        {
          probability1: 20,
          spell: {
            name: "monster.cat.rearClawsAttack.name",
            secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
            headers: [
              {
                type: ItemAbilityTypeEnum.Melee,
                range: 5,
                effects: [
                  {
                    opcode: EffectTypeEnum.Damage,
                    type: EffectDamageTypeEnum.Slashing,
                    diceThrown: rear.diceThrown * 2,
                    diceSize: rear.diceSize,
                    amount: amount * 2,
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
    return this.addWeapon({
      weapon: {
        stringRef: "monster.cat.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: ["SHIELD"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: diceThrown,
          diceSize: diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }
}

class CatFamily extends CreatureFamily<Cat> {
  constructor() {
    super(MonsterFamilyEnum.Cat);
    this.addCreature(() => this.jaguar());
    this.addCreature(() => this.leopard());
    this.addCreature(() => this.lion());
    this.addCreature(() => this.mountainLion());
    this.addCreature(() => this.hellcat());
    this.addCreature(() => this.displacerBeast());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Jaguar
   */
  private jaguar() {
    const jaguar = this.create({
      monster: MonsterEnum.Jaguar,
      name: "monster.cat.name.jaguar",
      files: [
        // "BDSHA06B", //TODO: Panther Spirit
      ],
      data: {
        level1: 4,
        bonusHp: 1,
        strength: 14,
        dexterity: 15,
        constitution: 10,
        intelligence: 4,
        wisdom: 14,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 420,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Large",
        movement: 15,
        items: {
          remove: ["CATJAG"],
        },
        immunities: ["infravision"],
      },
    });
    jaguar.createPaws(1, 3, { diceThrown: 1, diceSize: 4 });
    jaguar.createJaws(1, 8);
    jaguar.setBehavior({ customCodes: [hunterCustomCode] });
    jaguar.setAdjustments([{ files: ["BDHELP04"], summon: true }]);
    return jaguar;
  }

  /**
   * Leopard
   */
  private leopard() {
    const leopard = this.create({
      monster: MonsterEnum.Leopard,
      name: "monster.cat.name.leopard",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 16,
        dexterity: 19,
        constitution: 15,
        intelligence: 4,
        wisdom: 12,
        charisma: 6,
        ac: 6,
        apr: 3,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Medium",
        movement: 15,
        items: {
          remove: ["CATJAGSU"],
        },
        immunities: ["infravision"],
      },
    });
    leopard.createPaws(1, 3, { diceThrown: 1, diceSize: 4 });
    leopard.createJaws(1, 6);
    leopard.setAdjustments([{ files: ["CATJAGSU"], summon: true }]);
    return leopard;
  }

  /**
   * Lion
   */
  private lion() {
    const lion = this.create({
      monster: MonsterEnum.Lion,
      name: "monster.cat.name.lion",
      files: [
        // "SPIRLION", //TODO: Spirit Lion
        // "SPLION1", //TODO: Spirit Lion
        // "SPLION2", //TODO: Spirit Lion
        // "SPLION3", //TODO: Spirit Lion
        // "SPLION4", //TODO: Spirit Lion
        // "SPLION5", //TODO: Spirit Lion
      ],
      data: {
        level1: 5,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 13,
        intelligence: 4,
        wisdom: 12,
        charisma: 8,
        ac: 5,
        apr: 3,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        items: {
          remove: ["CATLIO"],
        },
        immunities: ["infravision"],
      },
    });
    lion.createPaws(1, 4, { diceThrown: 1, diceSize: 6 });
    lion.createJaws(1, 10);
    lion.setAdjustments([{ files: ["CATLIOSU"], summon: true }]);
    return lion;
  }

  /**
   * Mountain Lion
   */
  private mountainLion() {
    const mountainLion = this.create({
      monster: MonsterEnum.MountainLion,
      name: "monster.cat.name.mountainLion",
      files: [],
      data: {
        level1: 3,
        bonusHp: 1,
        strength: 17,
        dexterity: 15,
        constitution: 13,
        intelligence: 4,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 3,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        items: {
          remove: ["P1-6"],
        },
        immunities: ["infravision"],
      },
    });
    mountainLion.createPaws(1, 3, { diceThrown: 1, diceSize: 4 });
    mountainLion.createJaws(1, 6);
    mountainLion.setBehavior({ customCodes: [hunterCustomCode] });
    return mountainLion;
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
        size: "Large",
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
        immunities: ["infravision"],
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
    hellcat.createPaws(1, 4, { diceThrown: 2, diceSize: 4 });
    hellcat.createJaws(2, 6);
    return hellcat;
  }

  /**
   * Displacer Beast
   */
  private displacerBeast() {
    const displacerBeast = this.create({
      monster: MonsterEnum.DisplacerBeast,
      name: "monster.cat.name.displacerBeast",
      files: [],
      data: {
        level1: 6,
        strength: 18,
        dexterity: 15,
        constitution: 16,
        intelligence: 4,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 2,
        xpv: 975,
        alignment: "LAWFUL_EVIL",
        morale: 14,
        general: "MONSTER",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Large",
        movement: 15,
        items: {
          remove: ["BDDISPBE"],
        },
        immunities: ["infravision"],
      },
      autoGenerate: {
        savingThrows: {
          level: 12,
          classe: "FIGHTER",
          bonus: {
            saveDeath: 2,
            saveBreath: 2,
            savePolymorph: 2,
            saveSpell: 2,
            saveWand: 2,
          },
        },
      },
    });
    displacerBeast.addTrait({
      immunities: ["magic", "fire", "cold"],
      effects: [
        {
          opcode: EffectTypeEnum.ArmorClassBonus,
          bonusTo: EffectBonusToEnum.AllWeapons,
          value: 2,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
        {
          opcode: EffectTypeEnum.Blur,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
        {
          opcode: EffectTypeEnum.MirrorImageEffect,
          amount: 1,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
        {
          opcode: EffectTypeEnum.CastSpellOnCondition,
          condition: "AttackedBy([ANYONE])",
          conditionTarget: CastSpellOnConditionTargetEnum.Myself,
          resource: "BDDISPLC",
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
      ],
    });
    displacerBeast.addWeapon({
      weapon: {
        stringRef: "monster.cat.weapon.tentacles",
        icon: MonsterItemIconEnum.Jelly,
        equippedSlot: ["WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          diceThrown: 2,
          diceSize: 4,
          damageType: AbilityDamageTypeEnum.PiercingOrCrushing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
    displacerBeast.setAdjustments([
      {
        files: ["BDDISPBP"],
        data: {
          level1: 9,
          xpv: 1200,
          strength: 19,
          constitution: 19,
          ac: 2,
          saveDeath: 7,
          saveWand: 9,
          savePolymorph: 8,
          saveBreath: 8,
          saveSpell: 10,
        },
      },
    ]);
    return displacerBeast;
  }
}

export const createCats = () => new CatFamily();

import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import {
  AbilityDamageTypeEnum,
  CastSpellOnConditionTargetEnum,
  EffectBonusToEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  InvisibilityTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import creatureService from "../src/services/creature.service";
import { hunterCustomCode } from "./common";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  BurstOfSpeed,
}

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

  /**
   * Burst Of Speed
   */
  createBurstOfSpeed() {
    const duration = 3 * Durations.round;
    return this.addSpell({
      name: "monster.cat.ability.burstOfSpeed.name",
      description: "monster.cat.ability.burstOfSpeed.description",
      id: Ids.BurstOfSpeed,
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
              duration,
              resource: "EFF_M29",
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "reallyForce",
          selfTarget: true,
          remove: true,
        },
      },
    });
  }
}

class CatFamily extends CreatureFamily<Cat> {
  constructor() {
    super(MonsterFamilyEnum.Cat);
    this.addCreature(() => this.wildCat());
    this.addCreature(() => this.cheetah());
    this.addCreature(() => this.giantLynx());
    this.addCreature(() => this.jaguar());
    this.addCreature(() => this.leopard());
    this.addCreature(() => this.lion());
    this.addCreature(() => this.mountainLion());
    this.addCreature(() => this.spottedLion());
    this.addCreature(() => this.wildTiger());
    this.addCreature(() => this.hellcat());
    this.addCreature(() => this.displacerBeast());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Wild Cat
   */
  private wildCat() {
    const cat = this.create({
      monster: MonsterEnum.WildCat,
      name: "monster.cat.name.wildCat",
      files: [],
      data: {
        level1: 1,
        strength: 3,
        dexterity: 15,
        constitution: 10,
        intelligence: 1,
        wisdom: 12,
        charisma: 7,
        ac: 5,
        apr: 3,
        xpv: 35,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Tiny",
        movement: 18,
        items: {
          remove: ["P1-2", "B1-2"],
        },
        immunities: ["cat"],
      },
    });
    cat.createPaws(1, 2, { diceThrown: 1, diceSize: 2 });
    cat.createJaws(1, 2);
    cat.setAttack({ melee: false });
    cat.setBehavior({
      customCodes: [hunterCustomCode],
    });
    return cat;
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
        size: "Medium",
        movement: 15, // sprint 45
        items: {
          remove: ["P1-8"],
        },
        immunities: ["cat"],
      },
    });
    cheetah.createBurstOfSpeed();
    cheetah.createPaws(1, 2, { diceThrown: 1, diceSize: 2 });
    cheetah.createJaws(1, 8);
    cheetah.setBehavior({
      abilities: [this.ability(Ids.BurstOfSpeed)],
      customCodes: [hunterCustomCode],
    });
    return cheetah;
  }

  /**
   * Jaguar
   */
  private jaguar() {
    const jaguar = this.create({
      monster: MonsterEnum.Jaguar,
      name: "monster.cat.name.jaguar",
      files: [],
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
          remove: ["CATJAG", "S1-6"],
        },
        immunities: ["cat"],
      },
    });
    jaguar.createPaws(1, 3, { diceThrown: 1, diceSize: 4 });
    jaguar.createJaws(1, 8);
    jaguar.setBehavior({ customCodes: [hunterCustomCode] });
    jaguar.setAdjustments([
      { files: ["JAGUARSU"], data: { level1: 5 } },
      { files: ["C6GUEN", "C6GUEN2"], data: { level1: 6 } },
    ]);
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
        immunities: ["cat"],
      },
    });
    leopard.createPaws(1, 3, { diceThrown: 1, diceSize: 4 });
    leopard.createJaws(1, 6);
    return leopard;
  }

  /**
   * Lion
   */
  private lion() {
    const lion = this.create({
      monster: MonsterEnum.Lion,
      name: "monster.cat.name.lion",
      files: [],
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
        immunities: ["cat"],
      },
    });
    lion.createPaws(1, 4, { diceThrown: 1, diceSize: 6 });
    lion.createJaws(1, 10);
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
        immunities: ["cat"],
      },
    });
    mountainLion.createPaws(1, 3, { diceThrown: 1, diceSize: 4 });
    mountainLion.createJaws(1, 6);
    mountainLion.setBehavior({ customCodes: [hunterCustomCode] });
    mountainLion.setAdjustments([{ files: ["ANLION1"], data: { level1: 12 } }]);
    return mountainLion;
  }

  /**
   * Spotted Lion
   */
  private spottedLion() {
    const spottedLion = this.create({
      monster: MonsterEnum.SpottedLion,
      name: "monster.cat.name.spottedLion",
      files: [],
      data: {
        level1: 6,
        bonusHp: 2,
        strength: 18,
        dexterity: 14,
        constitution: 17,
        intelligence: 3,
        wisdom: 13,
        charisma: 10,
        ac: 5,
        apr: 3,
        xpv: 975,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Large",
        movement: 12,
        items: {
          remove: ["CATLIS"],
        },
        immunities: ["cat"],
      },
    });
    spottedLion.createPaws(1, 4, { diceThrown: 2, diceSize: 4 });
    spottedLion.createJaws(1, 12);
    spottedLion.setBehavior({ customCodes: [hunterCustomCode] });
    return spottedLion;
  }

  /**
   * Wild Tiger
   */
  private wildTiger() {
    const wildTiger = this.create({
      monster: MonsterEnum.WildTiger,
      name: "monster.cat.name.wildTiger",
      files: [],
      data: {
        level1: 5,
        bonusHp: 5,
        strength: 17,
        dexterity: 15,
        constitution: 14,
        intelligence: 3,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 3,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Large",
        movement: 12,
        items: {
          remove: ["P1-10"],
        },
        immunities: ["cat"],
      },
    });
    wildTiger.createPaws(1, 4, { diceThrown: 2, diceSize: 4 });
    wildTiger.createJaws(1, 10);
    wildTiger.setBehavior({ customCodes: [hunterCustomCode] });
    //TODO: can leap 10 feet upward, and spring forward 30 feet to 50 feet to attack.
    return wildTiger;
  }

  /**
   * Giant Lynx
   */
  private giantLynx() {
    const giantLynx = this.create({
      monster: MonsterEnum.GiantLynx,
      name: "monster.cat.name.giantLynx",
      files: [],
      data: {
        level1: 2,
        bonusHp: 2,
        strength: 14,
        dexterity: 18,
        constitution: 13,
        intelligence: 12,
        wisdom: 14,
        charisma: 10,
        ac: 6,
        apr: 3,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        hideShadow: 90,
        items: {
          remove: ["P1-6"],
        },
        immunities: ["cat"],
      },
    });
    giantLynx.createPaws(1, 2, { diceThrown: 1, diceSize: 3 });
    giantLynx.createJaws(1, 2);
    giantLynx.setBehavior({ customCodes: [hunterCustomCode] });
    giantLynx.setAdjustments([{ files: ["CATLYN01", "CB585AN1"], data: { level1: 4 } }]);
    //TODO: can leap up to 15 feet and imposes a -6 on the surprise rolls of its prey
    return giantLynx;
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
          remove: ["BDDISPBE", "JY_01DB", "JY_02DB", "JY_03DB", "BOOT01", "MOBHA39A"],
        },
        immunities: ["cat"],
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
          xpv: 1100,
          strength: 19,
          constitution: 19,
          ac: 2,
        },
      },
      {
        files: ["JY_00DB1"],
        data: {
          level1: 12,
          xpv: 1200,
        },
      },
      {
        files: ["MOBHA39"],
        data: {
          level1: 12,
          apr: 4,
          xpv: 1500,
          script: { location: "None" },
        },
      },
      {
        files: ["JY_00DB"],
        data: {
          level1: 14,
          xpv: 3000,
          apr: 4,
          resistMagic: 50,
        },
      },
    ]);
    return displacerBeast;
  }
}

export const createCats = () => new CatFamily();

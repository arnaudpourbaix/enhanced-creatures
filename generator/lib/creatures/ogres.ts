import { SPELL_STATES } from "../config/common";
import { ITEMS, MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import { createConeOfCold } from "../spells/cone_of_cold";
import effectFactory from "../src/factories/effect.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { QUICK_SLOTS } from "../src/model/creature/item";
import {
  AbilityDamageTypeEnum,
  AnimationChangeTypeEnum,
  AttackModifierTypeEnum,
  DisableButtonEnum,
  DisableSpellcastingTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ItemAnimationEnum,
  ItemCategoryEnum,
  ItemFlagEnum,
  PortraitIconEnum,
  ProficiencyTypeEnum,
  RegenerationTypeEnum,
  SpellTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../src/model/spell-item/projectile";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  ConeOfCold,
  Fly,
  GaseousForm,
  Naginata,
  Ogre,
  OgreLeader,
}

class Ogre extends Creature {
  /**
   * Ogre Fists
   */
  createFists(diceThrown: number, diceSize: number, id?: number) {
    return this.addWeapon({
      weapon: {
        id,
        stringRef: "monster.ogre.weapon.fists",
        icon: MonsterItemIconEnum.Fist,
        equippedSlot: ["WEAPON1"],
        header: {
          diceThrown,
          diceSize,
          type: ItemAbilityTypeEnum.Melee,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }

  /**
   * Naginata
   */
  createNaginata() {
    return this.addWeapon({
      weapon: {
        id: Ids.Naginata,
        stringRef: "monster.ogre.weapon.naginata.name",
        description: "monster.ogre.weapon.naginata.description",
        equippedSlot: ["WEAPON1"],
        flags: [ItemFlagEnum.Displayable, ItemFlagEnum.TwoHanded],
        animation: ItemAnimationEnum.LongSword,
        category: ItemCategoryEnum.Halberds,
        icon: "ISW1H44",
        proficiency: ProficiencyTypeEnum.PROFICIENCYHALBERD,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          animationSwing: { backhand: 50, overhand: 50, thrust: 0 },
          range: 2,
          diceThrown: 1,
          diceSize: 12,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 8,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }

  /**
   * Giant Flail
   */
  createGiantFlail() {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.ogre.weapon.giantFlail",
        equippedSlot: ["WEAPON1"],
        flags: [ItemFlagEnum.Displayable],
        animation: ItemAnimationEnum.Flail,
        category: ItemCategoryEnum.Flails,
        icon: "IBLUN13",
        proficiency: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          animationSwing: { backhand: 50, overhand: 50, thrust: 0 },
          diceThrown: 2,
          diceSize: 8,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 8,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }

  /**
   * Cone of cold
   */
  createConeOfCold() {
    return this.addSpell(
      createConeOfCold({
        id: Ids.ConeOfCold,
        description: "monster.ogre.ability.coneOfCold",
        memorizedCount: 1,
        damage: {
          diceThrown: 8,
          diceSize: 8,
          amount: 0,
        },
        projectile: {
          copyFromFile: "CONECOLD",
          name: "Ogre-Mage Cone of Cold",
          areaEffectInfo: {
            areaProjectileFlags: [
              AreaProjectileEnum.Coneshaped,
              // we don't want ogres to kill each other, it can be seen as a cheat but humans have no problem to properly cast it
              AreaProjectileEnum.AffectOnlyEnemies,
            ],
            areaOfEffect: 620, // 60 feet long with a terminal diameter of 20 feet
            triggerRadius: 620,
            coneWidth: 60,
          },
        },
      }),
    );
  }

  /**
   * Fly
   */
  createFly() {
    const flyDuration = 72;
    return this.addSpell({
      id: Ids.Fly,
      name: "monster.ogre.ability.fly.name",
      description: "monster.ogre.ability.fly.description",
      memorizedCount: 1,
      icon: SPELLS.Wizard.Haste.file,
      castingSound: "CAS_M08",
      type: SpellTypeEnum.Wizard,
      castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
      primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
      secondaryType: ItemAbilitySecondaryTypeEnum.NonCombat,
      level: 3,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Spell,
          target: ItemAbilityTargetEnum.Caster,
          speed: 3,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(18),
              timing: EffectTimingEnum.InstantLimited,
              duration: flyDuration,
            },
            {
              opcode: EffectTypeEnum.CreateItemInSlot,
              slot: "SLOT_BOOTS",
              resource: ITEMS.Hover,
              timing: EffectTimingEnum.InstantLimited,
              duration: flyDuration,
            },
            {
              opcode: EffectTypeEnum.SetExtendedSpellState,
              state: SPELL_STATES.flying,
              timing: EffectTimingEnum.InstantLimited,
              duration: flyDuration,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Haste,
              timing: EffectTimingEnum.InstantLimited,
              duration: flyDuration,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "EFF_M28",
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "EFF_M29",
              timing: EffectTimingEnum.DelayPermanent,
              duration: flyDuration,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "noDec",
          excludeSpellStates: [SPELL_STATES.flying],
          selfTarget: true,
        },
        triggers: [
          { name: "Detect", params: ["NearestEnemyOf"] },
          {
            name: "StateCheck",
            params: [ScriptTarget.myself, "STATE_INVISIBLE"],
          },
        ],
        probability: 90,
      },
    });
  }

  /**
   * Gaseous Form
   */
  createGaseousForm() {
    const gaseousFormDuration = 12;
    this.createItemGaseousForm();
    return this.addSpell({
      name: "monster.ogre.ability.gaseousForm.name",
      description: "monster.ogre.ability.gaseousForm.description",
      memorizedCount: 1,
      id: Ids.GaseousForm,
      icon: SPELLS.Wizard.PolymorphSelf.file,
      castingSound: "CAS_M08",
      type: SpellTypeEnum.Wizard,
      castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
      primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
      secondaryType: ItemAbilitySecondaryTypeEnum.NonCombat,
      level: 4,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Spell,
          target: ItemAbilityTargetEnum.Caster,
          speed: 4,
          effects: [
            {
              opcode: EffectTypeEnum.CreateWeapon,
              amount: 1,
              resource: this.item(Ids.GaseousForm).file,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantLimited,
              duration: gaseousFormDuration,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              target: EffectTargetEnum.Self,
              playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
              resource: "SPDISPM3",
              timing: EffectTimingEnum.InstantLimited,
              duration: 3,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              target: EffectTargetEnum.Self,
              playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
              resource: "SPDISPM3",
              timing: EffectTimingEnum.DelayPermanent,
              duration: gaseousFormDuration,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "MSTCHNG",
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "MSTCHNG",
              timing: EffectTimingEnum.DelayPermanent,
              duration: gaseousFormDuration,
            },
          ],
        },
      ],
      ability: {
        spell: {},
        triggers: [
          { name: "Detect", params: ["NearestEnemyOf"] },
          {
            name: "HaveSpellRES",
            params: [this.spell(Ids.ConeOfCold).file],
            negation: true,
          },
          {
            name: "HaveSpellRES",
            params: [SPELLS.Wizard.Sleep.file],
            negation: true,
          },
          {
            name: "HaveSpellRES",
            params: [SPELLS.Wizard.CharmPerson.file],
            negation: true,
          },
          { name: "HPPercentLT", params: [ScriptTarget.myself, 25] },
        ],
        probability: 80,
      },
    });
  }
  createItemGaseousForm() {
    this.addItem({
      id: Ids.GaseousForm,
      stringRef: "monster.ogre.ability.gaseousForm.name",
      description: "monster.ogre.ability.gaseousForm.description",
      immunities: ["poison", "cold", "magicDamage", "physicalDamage"],
      flags: [ItemFlagEnum.Displayable],
      header: {
        type: ItemAbilityTypeEnum.Melee,
      },
      effects: [
        {
          opcode: EffectTypeEnum.DisplayPortraitIcon,
          icon: PortraitIconEnum.Invulnerable,
        },
        {
          opcode: EffectTypeEnum.FireResistanceModifier,
          value: 100,
          type: EffectStatisticModifierEnum.Set,
        },
        { opcode: EffectTypeEnum.NoCollisionDetection, passWalls: true },
        { opcode: EffectTypeEnum.ModifyCollisionBehavior },
        {
          ...effectFactory.naturalMovementSpeed(3),
        },
        {
          opcode: EffectTypeEnum.ModifyAttacksPerRound,
          type: AttackModifierTypeEnum.Final,
          value: 0,
        },
        {
          opcode: EffectTypeEnum.DisableSpellcasting,
          type: DisableSpellcastingTypeEnum.Wizard,
        },
        {
          opcode: EffectTypeEnum.DisableButton,
          button: DisableButtonEnum.SpellSelect,
        },
        {
          opcode: EffectTypeEnum.AnimationChange,
          animationId: "BLOB_MIST_CREATURE",
          animationType: AnimationChangeTypeEnum.TemporaryChange,
        },
        {
          opcode: EffectTypeEnum.SetExtendedSpellState,
          state: SPELL_STATES.gaseousForm,
        },
      ],
    });
  }
}

class OgreFamily extends CreatureFamily<Ogre> {
  constructor() {
    super(MonsterFamilyEnum.Ogre);
    this.addCreature(() => this.ogre());
    this.addCreature(() => this.ogrillon());
    this.addCreature(() => this.halfOgre());
    this.addCreature(() => this.ogreMage());
    this.addCreature(() => this.berserker());
    this.addCreature(() => this.shaman());
  }

  createCreature(id: MonsterEnum): Ogre {
    return new Ogre(id);
  }

  /**
   * Ogre
   */
  private ogre() {
    const ogre = this.create({
      monster: MonsterEnum.Ogre,
      name: "monster.ogre.name.ogre",
      files: [
        //"BDCCOGR1", // Ogre Crusader (doesn't seem to be used because no script)
      ],
      data: {
        level1: 4,
        bonusHp: 1,
        strength: 18,
        dexterity: 8,
        constitution: 16,
        intelligence: 8,
        wisdom: 7,
        charisma: 7,
        ac: 5,
        apr: 1,
        xpv: 270,
        alignment: "CHAOTIC_EVIL",
        morale: 12,
        general: "GIANTHUMANOID",
        race: "OGRE",
        class: "OGRE",
        size: "Large",
        movement: 9,
        immunities: ["giant"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 }],
        items: {
          remove: ["OGRE1", "B1-2", "B3-12", "B2-16", "BLUN07", "SHLD03"],
        },
        script: {
          remove: ["OGRE"],
        },
      },
    });
    ogre.createFists(1, 10, Ids.Ogre);
    ogre.createFists(2, 6, Ids.OgreLeader);
    ogre.setBehavior({
      restHeal: true,
      usePotions: true,
    });
    ogre.setAttack({
      targetPriorities: [
        {
          // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
          targets: ["PCSpellcasters", "PCsPreferringStrong"],
        },
      ],
    });
    ogre.setAdjustments([
      {
        files: ["X3HOGRE", "X3HOGRE2", "X3HOGRED"],
        data: { script: { location: "None" } },
      },
      { files: ["OOPAH", "WELT"], data: { class: "INNOCENT" } },
      { files: ["OOPAH", "OOPAH2"], data: { level1: 5 } },
      {
        // leader is a 7 Hit Dice monster with Armor Class 3, Strenth 18/50, XP 650
        // He inflicts 2d6+3 points of damage per attack.
        files: ["SEWERF4", "BDOGREM", "NTOGREDA"],
        data: {
          level1: 7,
          ac: 3,
          exceptionalStrength: 50,
          xpv: 650,
          items: {
            equipped: [{ file: this.item(Ids.OgreLeader).file, slot: "WEAPON1" }],
          },
        },
      },
      {
        // chieftain is a 7+4 Hit Dice monster with Armor Class 2, Strenth 18/100, XP 975
        // He inflicts 2d6+6 points of damage per attack.
        files: ["AC#WRIM1", "AC#FP2O2", "BDSOGR1", "BDSOGR2", "ACQ13002", "GORF", "HACK", "LARZE"],
        data: {
          level1: 7,
          bonusHp: 4,
          ac: 2,
          exceptionalStrength: 100,
          xpv: 975,
          items: {
            equipped: [{ file: this.item(Ids.OgreLeader).file, slot: "WEAPON1" }],
          },
        },
      },
      {
        files: ["NTOGREDA"],
        data: {
          class: "FIGHTER",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 4 }],
        },
      },
      {
        // will have morning star +1
        files: ["AC#FP2OT", "BDSOGR1", "BDSOGR2"],
        noWeapon: true,
        data: {
          items: { equipped: [{ file: "BLUN07", slot: "WEAPON1" }] },
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 2 }],
        },
      },
      {
        files: ["BDSOGR1", "BDSOGR2"],
        data: {
          class: "FIGHTER",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 4 }],
        },
      },
      {
        files: ["GORF", "AC#WRIM1", "HACK", "LARZE"],
        data: {
          level1: 9,
          strength: 19,
          exceptionalStrength: 0,
          morale: 18,
          class: "FIGHTER",
          xpv: 2000,
          proficiencies: [
            { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5 },
            { type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 },
          ],
        },
      },
      {
        files: ["AC#WRIM1"],
        data: { level1: 10 },
      },
      {
        files: ["HACK"],
        data: { level1: 11 },
      },
      {
        files: ["LARZE"],
        data: { level1: 13 },
      },
    ]);
    return ogre;
  }

  /**
   * Ogrillon
   */
  private ogrillon() {
    const ogrillon = this.create({
      monster: MonsterEnum.Ogrillon,
      name: "monster.ogre.name.ogrillon",
      files: [],
      data: {
        level1: 2,
        bonusHp: 4,
        strength: 17,
        dexterity: 9,
        constitution: 14,
        intelligence: 6,
        wisdom: 7,
        charisma: 7,
        ac: 6,
        apr: 2,
        xpv: 175,
        alignment: "CHAOTIC_EVIL",
        morale: 10,
        general: "GIANTHUMANOID",
        race: "OGRE",
        class: "OGRE_OGRILLON",
        size: "Medium",
        movement: 12,
        immunities: ["giant"],
        items: {
          remove: ["B1-8", "SW1H01"],
        },
        script: {
          remove: ["OGRILLON"],
        },
      },
    });
    ogrillon.createFists(1, 6);
    ogrillon.setBehavior({
      restHeal: true,
      usePotions: true,
    });
    ogrillon.setAttack({
      targetPriorities: [
        {
          targets: ["PCsFighters", "PCsPreferringStrong"],
        },
      ],
    });
    ogrillon.setAdjustments([
      { files: ["OGRELESU"], summon: true, data: { level1: 3 } },
      {
        // veteran with 5+3 Hit Dice
        files: ["GNARL", "HAIRTO"],
        data: {
          level1: 5,
          bonusHp: 3,
          strength: 18,
          exceptionalStrength: 95,
          constitution: 15,
          xpv: 420,
        },
      },
    ]);
    return ogrillon;
  }

  /**
   * Half-Ogre
   */
  private halfOgre() {
    const halfOgre = this.create({
      monster: MonsterEnum.HalfOgre,
      name: "monster.ogre.name.half",
      files: [],
      data: {
        level1: 2,
        bonusHp: 6,
        strength: 17,
        dexterity: 10,
        constitution: 14,
        intelligence: 9,
        wisdom: 9,
        charisma: 10,
        ac: 5,
        apr: 1,
        xpv: 175,
        alignment: "CHAOTIC_EVIL",
        morale: 12,
        general: "GIANTHUMANOID",
        race: "OGRE",
        class: "OGRE_HALFOGRE",
        kit: "TRUECLASS",
        size: "Large",
        movement: 12,
        immunities: ["giant"],
        proficiencies: [
          { type: ProficiencyTypeEnum.PROFICIENCYBASTARDSWORD, value: 2 },
          { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 },
        ],
        script: {
          remove: ["HALFOGRE"],
        },
      },
    });
    halfOgre.setBehavior({
      restHeal: true,
      usePotions: true,
    });
    halfOgre.setAttack({
      targetPriorities: [
        {
          // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
          targets: ["PCSpellcasters", "PCsPreferringStrong"],
        },
      ],
    });
    halfOgre.setAdjustments([
      {
        // Veteran with 5+3 Hit Dice.
        files: ["BDOGRE04", "ARGHAI", "X#CHOP", "X#CRU11"],
        data: {
          level1: 5,
          bonusHp: 3,
          strength: 18,
          ac: 3,
          xpv: 520,
        },
      },
      {
        files: ["ARGHAI"],
        data: {
          exceptionalStrength: 100,
        },
      },
      {
        files: ["BDOGRE04"],
        data: {
          exceptionalStrength: 83,
        },
      },
      {
        files: ["X#CHOP", "X#CRU11"],
        data: {
          strength: 19,
        },
      },
      {
        // Level 9 fighter
        files: ["TAZOK", "TAZOK2", "L#CHIEN"],
        data: {
          level1: 9,
          strength: 18,
          ac: 10,
          class: "FIGHTER",
          morale: 20,
          xpv: 4000,
        },
      },
      {
        // Tazok, level 9
        files: ["TAZOK", "TAZOK2"],
        // data: {
        //   kit: "BERSERKER",
        // },
        data: {
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5 }],
          // memorizedSpells: [{ file: SPELLS.Class.BerserkerRage, memorizedCount: 1 }],
        },
      },
      {
        // Tazok, level 11
        files: ["TAZOK2"],
        data: {
          level1: 11,
          items: {
            equipped: [{ file: "POTN02", quantity: 1, slot: QUICK_SLOTS }],
          },
        },
      },
      {
        // Eglarh, level 9 fighter
        files: ["L#CHIEN"],
        data: {
          immunities: ["fireResistance", "coldResistance", "missileDamage"],
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
        },
      },
    ]);
    return halfOgre;
  }

  /**
   * Ogre-Mage
   */
  private ogreMage() {
    const ogreMage = this.create({
      monster: MonsterEnum.OgreMage,
      name: "monster.ogre.name.mage",
      files: [],
      data: {
        level1: 5,
        level2: 5,
        bonusHp: 2,
        strength: 18,
        exceptionalStrength: 100,
        dexterity: 10,
        constitution: 17,
        intelligence: 16,
        wisdom: 14,
        charisma: 17,
        ac: 4,
        apr: 1,
        xpv: 650,
        alignment: "LAWFUL_EVIL",
        morale: 14,
        general: "GIANTHUMANOID",
        race: "OGRE",
        class: "OGRE_MAGE",
        kit: "TRUECLASS",
        gender: "MALE",
        size: "Large",
        movement: 9,
        immunities: ["giant"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 2 }],
        items: {
          remove: [
            "REGHP1",
            "BDOGRE03",
            "HELMNOAN",
            "SW1H43",
            "SW1H01",
            "SW1H20",
            "COMPS01",
            "COMPS02",
            "OGREMASU",
            "BLUN15",
          ],
        },
        script: {
          remove: ["BDOGRE03", "OGREMASU"],
        },
        spells: {
          memorized: [
            { file: SPELLS.Wizard.Invisibility.file, memorizedCount: 1 },
            { file: SPELLS.Wizard.Darkness15Radius.file, memorizedCount: 1 },
            { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 1 },
            { file: SPELLS.Wizard.Sleep.file, memorizedCount: 1 },
          ],
        },
      },
    });
    ogreMage.createNaginata();
    ogreMage.data.movement.bindItem(this.item(Ids.Naginata).file);
    ogreMage.createConeOfCold();
    ogreMage.createFly();
    ogreMage.createGaseousForm();
    ogreMage.addTrait({
      effects: [
        {
          opcode: EffectTypeEnum.Regeneration,
          type: RegenerationTypeEnum.OneHPperAmountSeconds,
          amount: 6,
        },
      ],
    });
    ogreMage.setBehavior({
      restHeal: true,
      usePotions: true,
      abilities: [
        {
          preset: SPELLS.Wizard.Invisibility.file,
          spell: {
            type: "noDec",
          },
          timer: {
            name: "invisible",
            value: 12,
          },
        },
        this.ability(Ids.Fly),
        this.preset(SPELLS.Wizard.Domination.file),
        this.ability(Ids.ConeOfCold),
        this.preset(SPELLS.Wizard.DireCharm.file),
        {
          preset: SPELLS.Wizard.Darkness15Radius.file,
          spell: {
            type: "noDec",
          },
          timer: { name: "darkness", value: 60 },
        },
        this.preset(SPELLS.Wizard.PowerWordSleep.file),
        this.preset(SPELLS.Wizard.Sleep.file),
        this.preset(SPELLS.Wizard.CharmPerson.file),
        this.ability(Ids.GaseousForm),
      ],
    });
    ogreMage.setAttack({
      targetPriorities: [
        {
          // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
          targets: ["PCSpellcasters", "PCsPreferringStrong"],
        },
      ],
    });
    ogreMage.setAdjustments([
      {
        files: ["BDWAVE16", "WIOGMA01", "WIGENTLE", "DROTH"],
        data: {
          level1: 7,
          level2: 7,
          xpv: 1400,
          class: "FIGHTER_MAGE",
          script: { location: "General" },
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 4 }],
          spells: {
            memorized: [
              { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 1 },
              { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 1 },
              { file: SPELLS.Wizard.Sleep.file, memorizedCount: 1 },
            ],
          },
        },
      },
      {
        files: ["BDMURS", "BDMURS2"],
        data: {
          level1: 9,
          level2: 9,
          xpv: 2000,
          class: "FIGHTER_MAGE",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
          spells: {
            memorized: [
              { file: this.spell(Ids.ConeOfCold).file, memorizedCount: 1 },
              { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.Sleep.file, memorizedCount: 2 },
            ],
          },
        },
      },
      {
        files: ["KROTAN", "NTKROTAN", "KAHRK"],
        data: {
          level1: 12,
          level2: 12,
          strength: 19,
          class: "FIGHTER_MAGE",
          xpv: 3500,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
          spells: {
            memorized: [
              { file: SPELLS.Wizard.Domination.file, memorizedCount: 1 },
              { file: this.spell(Ids.ConeOfCold).file, memorizedCount: 2 },
              { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 4 },
              { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 4 },
              { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 3 },
              { file: SPELLS.Wizard.Sleep.file, memorizedCount: 3 },
            ],
          },
        },
      },
      {
        files: ["KAHRK"],
        noWeapon: true,
        data: {
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYKATANA, value: 5 }],
        },
      },
      {
        files: ["KROTAN", "NTKROTAN"],
        data: { level1: 15, level2: 15, class: "FIGHTER_MAGE", xpv: 4000 },
      },
    ]);
    return ogreMage;
  }

  /**
   * Ogre Berserker
   */
  private berserker() {
    const berserker = this.create({
      monster: MonsterEnum.OgreBerserker,
      name: "monster.ogre.name.berserker",
      files: [],
      data: {
        level1: 4,
        bonusHp: 1,
        strength: 18,
        exceptionalStrength: 100,
        dexterity: 8,
        constitution: 17,
        intelligence: 8,
        wisdom: 7,
        charisma: 7,
        ac: 3,
        apr: 1,
        xpv: 650,
        alignment: "CHAOTIC_EVIL",
        morale: 12,
        general: "GIANTHUMANOID",
        race: "OGRE",
        class: "FIGHTER",
        kit: "BERSERKER",
        size: "Large",
        movement: 9,
        immunities: ["giant"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 3 }],
        items: {
          remove: ["BDOGRE02", "BDOGRE06", "BLUN06", "SW2H01", "OGREGRSU", "OGRE1", "BDSLUG"],
        },
        script: {
          remove: ["DVBRSKER"],
        },
      },
    });
    berserker.createGiantFlail();
    berserker.setBehavior({
      restHeal: true,
      usePotions: true,
      useKitAbilities: true,
    });
    berserker.setAttack({
      targetPriorities: [
        {
          // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
          targets: ["PCSpellcasters", "PCsPreferringStrong"],
        },
      ],
    });
    berserker.setAdjustments([
      {
        // chieftain
        files: [
          "BDOGREDS",
          "X3HOGREC",
          "X3HOGREL",
          "BDOGRE06",
          "BDARBING",
          "BDCHESKI",
          "BDSLUG",
          "BDSLUG2",
          "BDBERTOR",
          "BDEINER",
          "BDWAVE13",
          "BDYAROK",
        ],
        data: {
          level1: 7,
          xpv: 1400,
          strength: 19,
          exceptionalStrength: 0,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 4 }],
        },
      },
      {
        files: ["BDSLUG", "BDSLUG2"],
        data: {
          level1: 9,
          xpv: 2000,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 5 }],
        },
      },
      {
        files: ["BDBERTOR", "BDEINER", "BDYAROK"],
        data: {
          level1: 11,
          xpv: 2000,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 5 }],
        },
      },
      {
        files: ["BDYAROK"],
        data: {
          ac: 10,
        },
      },
      {
        // barbarian chieftain
        files: ["BDOGRE06"],
      },
      {
        files: ["X3HOGREL"],
        data: {
          level1: 8,
          script: {
            location: "Race",
          },
        },
      },
    ]);
    return berserker;
  }

  /**
   * Ogre Shaman
   */
  private shaman() {
    const shaman = this.create({
      monster: MonsterEnum.OgreShaman,
      name: "monster.ogre.name.shaman",
      files: [],
      data: {
        level1: 5,
        level2: 5,
        bonusHp: 3,
        strength: 18,
        dexterity: 8,
        constitution: 16,
        intelligence: 12,
        wisdom: 13,
        charisma: 7,
        ac: 5,
        apr: 1,
        xpv: 420,
        alignment: "CHAOTIC_EVIL",
        morale: 12,
        general: "GIANTHUMANOID",
        race: "OGRE",
        class: "FIGHTER_CLERIC",
        size: "Large",
        movement: 9,
        immunities: ["giant"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 }],
        items: {
          remove: ["BLUN01"],
        },
        spells: {
          memorized: [
            { file: SPELLS.Priest.Bless.file, memorizedCount: 1 },
            { file: SPELLS.Priest.Command.file, memorizedCount: 2 },
            { file: SPELLS.Priest.Chant.file, memorizedCount: 1 },
            { file: SPELLS.Priest.HoldPerson.file, memorizedCount: 1 },
          ],
        },
      },
    });
    shaman.equipItem(this.item(Ids.Ogre));
    shaman.setBehavior({
      restHeal: true,
      usePotions: true,
      abilities: { entries: [] },
    });
    shaman.setAttack({
      targetPriorities: [
        {
          // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
          targets: ["PCSpellcasters", "PCsPreferringStrong"],
        },
      ],
    });
    return shaman;
  }
}

export const createOgres = () => new OgreFamily();

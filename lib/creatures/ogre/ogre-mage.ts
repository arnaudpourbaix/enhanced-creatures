import { SPELL_STATES } from "../../config/common";
import { ITEMS } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { InputCreatureData } from "../../src/model/creature/data-input";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Variant } from "../../src/model/creature/variant";
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
  SpellTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Ids, Ogre, OgreKin } from "./kin";

class OgreMage extends Ogre {
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
          castOnSelf: true,
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

function ogreMage(entry: CreatureEntry<OgreMage>): OgreMage {
  const ogreMage = entry.create({
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
      animation: "OGRE_MAGE",
      gender: "MALE",
      size: { value: "Large", tall: true, long: false },
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
          "SW2H01",
          "SW1H20",
          "COMPS01",
          "COMPS02",
          "OGREMASU",
          "BLUN06",
          "BLUN15",
          "PLAT01",
          "SHLD03",
          "HELM01",
          "PALRING",
        ],
      },
      script: {
        remove: ["BDOGRE03", "OGREMASU", "BDFMAG01", "BDFMAG23", "MAGE3", "YSOGMAGE"],
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
  ogreMage.data.movement.bindItem(entry.item(Ids.Naginata).file);
  ogreMage.createConeOfCold();
  ogreMage.createFly();
  ogreMage.createGaseousForm();
  ogreMage.addTrait({
    effects: [effectFactory.regeneration(1)],
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
      entry.ability(Ids.Fly),
      entry.preset(SPELLS.Wizard.Domination.file),
      entry.ability(Ids.ConeOfCold),
      entry.preset(SPELLS.Wizard.DireCharm.file),
      {
        preset: SPELLS.Wizard.Darkness15Radius.file,
        spell: {
          type: "noDec",
        },
        timer: { name: "darkness", value: 60 },
      },
      entry.preset(SPELLS.Wizard.PowerWordSleep.file),
      entry.preset(SPELLS.Wizard.Sleep.file),
      entry.preset(SPELLS.Wizard.CharmPerson.file),
      entry.ability(Ids.GaseousForm),
    ],
  });
  ogreMage.setAttack({
    targetPriorities: [
      {
        // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
        targets: ["Spellcasters", "PreferringStrong"],
      },
    ],
  });
  chieftainVariant(entry, ogreMage);
  return ogreMage;
}

function chieftainVariant(entry: CreatureEntry<OgreMage>, base: Ogre): Variant {
  // Shared profile for Krotan/Ntkrotan/Kahrk before their own level/proficiency bump.
  const krotanChief: InputCreatureData = {
    level1: 12,
    level2: 12,
    strength: 19,
    class: "FIGHTER_MAGE",
    xpv: 3500,
    proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
    spells: {
      memorized: [
        { file: SPELLS.Wizard.Domination.file, memorizedCount: 1 },
        { file: entry.spell(Ids.ConeOfCold).file, memorizedCount: 2 },
        { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 4 },
        { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 4 },
        { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 3 },
        { file: SPELLS.Wizard.Sleep.file, memorizedCount: 3 },
      ],
    },
  };
  // ogre magi will be led by a chief of great strength (+2 on each Hit Die, attacking and saving as a 9 Hit Dice monster)
  return base.variant("Chieftain", {
    files: [
      "BDWAVE16",
      "WIOGMA01",
      "WIGENTLE",
      "DROTH",
      "BDMURS",
      "BDMURS2",
      "UHOGRE01",
      "KROTAN",
      "NTKROTAN",
      "KAHRK",
      "PLSHOM01",
      "PALKNI01",
    ],
    data: {
      bonusHpPerHitDie: 2,
      xpv: 975,
    },
    autoGenerate: {
      thac0: { level: 9 },
      savingThrows: { level: 9 },
    },
    adjust: [
      {
        files: ["BDWAVE16", "WIOGMA01", "WIGENTLE", "DROTH"],
        data: {
          level1: 7,
          level2: 7,
          xpv: 1400,
          class: "FIGHTER_MAGE",
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
        files: ["BDMURS", "BDMURS2", "UHOGRE01"],
        data: {
          level1: 9,
          level2: 9,
          xpv: 2000,
          class: "FIGHTER_MAGE",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
          spells: {
            memorized: [
              { file: entry.spell(Ids.ConeOfCold).file, memorizedCount: 1 },
              { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.Sleep.file, memorizedCount: 2 },
            ],
          },
        },
      },
      {
        files: ["PALKNI01"],
        data: { level1: 10, level2: 10 },
      },
      {
        files: ["KAHRK"],
        noWeapon: true,
        data: {
          ...krotanChief,
          proficiencies: [
            ...(krotanChief.proficiencies ?? []),
            { type: ProficiencyTypeEnum.PROFICIENCYKATANA, value: 5 },
          ],
        },
      },
      {
        files: ["KROTAN", "NTKROTAN"],
        data: { ...krotanChief, level1: 15, level2: 15, xpv: 4000 },
      },
    ],
  });
}

class OgreMageEntry extends CreatureEntry<OgreMage> {
  constructor(kin?: OgreKin) {
    super(EntryEnum.OgreMage, kin);
    this.addCreature(() => ogreMage(this));
  }

  createCreature(id: MonsterEnum): OgreMage {
    return new OgreMage(id);
  }
}

export const createOgreMageEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new OgreMageEntry(kins.get(KinEnum.Ogre));

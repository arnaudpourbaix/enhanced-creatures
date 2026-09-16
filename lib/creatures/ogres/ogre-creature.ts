/**
 * Shared weapon/spell primitives for every ogre creature. Creature-specific
 * data lives as plain functions in the per-monster files (ogre.ts,
 * ogrillon.ts, half-ogre.ts, ogre-mage.ts, berserker.ts, shaman.ts).
 */
import { SPELL_STATES } from "../../config/common";
import { ITEMS, MonsterItemIconEnum } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-names";
import { createConeOfCold } from "../../spells/cone_of_cold";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Creature } from "../../src/model/creature/creature";
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
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import { Ids } from "./ids";

export class Ogre extends Creature {
  /**
   * Ogre Fists
   */
  createFists(p: { diceThrown: number; diceSize: number; id?: number; equipped?: boolean }) {
    p.equipped ??= true;
    return this.addItem({
      id: p.id,
      stringRef: "monster.ogre.weapon.fists",
      icon: MonsterItemIconEnum.Fist,
      equippedSlot: p.equipped ? ["WEAPON1"] : undefined,
      header: {
        diceThrown: p.diceThrown,
        diceSize: p.diceSize,
        type: ItemAbilityTypeEnum.Melee,
        damageType: AbilityDamageTypeEnum.Crushing,
        speed: 3,
        abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
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
        headers: [
          {
            minLevel: 1,
            damage: {
              diceThrown: 8,
              diceSize: 8,
              amount: 0,
            },
          },
        ],
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

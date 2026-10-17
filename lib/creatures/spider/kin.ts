import { MonsterItemIconEnum } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Creature } from "../../src/model/creature/creature";
import { ItemSlot } from "../../src/model/creature/item";
import { ImmunityName } from "../../src/model/final/immunity";
import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect, DamageEffect, Effect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  AttackModifierTypeEnum,
  EffectDamageTypeEnum,
  EffectIDSFileEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  InvisibilityTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PnPPoisonType,
  PortraitIconEnum,
  SaveTypeEnum,
  WingBuffetDirectionEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import {
  SpellProtection,
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../src/model/spell-item/spell-protection";
import { TranslationKey } from "../../translations/i18n";
import { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";

export enum SpiderIds {
  InvisibleWebTangle,
  Leg,
  LeapAttack,
  LeapImpalingAttack,
  LightningLeg,
  LightningLeapImpalingAttack,
  PhaseOut,
  WebTangle,
}

export class Spider extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    effects?: Effect[];
    immunities?: ImmunityName[];
    poisonType?: PnPPoisonType;
    saveBonus?: number;
    slot?: ItemSlot;
    doc?: boolean;
    castSpells?: WeaponCastSpell[];
  }) {
    return this.addNaturalWeapon("jaws", {
      stringRef: "monster.spider.weapon.jaws",
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      speed: 2,
      slot: p.slot ?? "WEAPON1",
      doc: p.doc ?? true,
      immunities: p.immunities,
      effects: p.effects,
      poison: p.poisonType ? { poisonType: p.poisonType, saveBonus: p.saveBonus } : undefined,
      castSpells: p.castSpells,
    });
  }

  createLegWeapon(p: { id: number; impale?: boolean; lightning?: boolean; equipped?: boolean }) {
    const effects: Effect[] = [];
    if (p.impale) {
      effects.push({
        opcode: EffectTypeEnum.Thac0Bonus,
        type: EffectStatisticModifierEnum.Increment,
        value: -4,
        timing: EffectTimingEnum.InstantLimited,
        duration: 2 * Durations.round,
      });
    }
    if (p.lightning) {
      effects.push({
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Electricity,
        amount: p.impale ? 8 : 2,
      });
    }
    return this.addItem({
      id: p.id,
      stringRef: p.impale ? "monster.spider.ability.impale.name" : "monster.spider.weapon.leg",
      icon: MonsterItemIconEnum.Wolf,
      equippedSlot: p.equipped ? ["WEAPON1"] : undefined,
      header: {
        type: ItemAbilityTypeEnum.Melee,
        diceThrown: p.impale ? 8 : 2,
        diceSize: 6,
        damageType: AbilityDamageTypeEnum.Piercing,
        speed: 1,
        abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        effects,
      },
    });
  }

  /**
   * Single Target Web
   */
  createWeb({
    id,
    name,
    description,
    duration,
    saveBonus,
    damageEffect,
    invisible,
  }: {
    id: number;
    name?: TranslationKey;
    description: TranslationKey;
    duration: number;
    saveBonus?: number;
    damageEffect?: DamageEffect;
    invisible?: boolean;
  }) {
    const saves: BaseEffect = {
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
      saveBonus: saveBonus ?? 0,
    };
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.Web,
        timing: EffectTimingEnum.InstantLimited,
        duration,
        ...saves,
      },
      {
        opcode: EffectTypeEnum.Paralyze,
        timing: EffectTimingEnum.InstantLimited,
        idsFile: EffectIDSFileEnum.EA,
        idsEntry: "ANYONE",
        duration,
        ...saves,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.Webbed,
        timing: EffectTimingEnum.InstantLimited,
        duration,
        ...saves,
      },
      {
        opcode: EffectTypeEnum.PlaySound,
        resource: "EFF_P27",
        ...saves,
      },
    ];
    const protections: {
      type: SpellProtection;
      values: (string | number)[];
    }[] = [
      {
        type: {
          stat: SpellProtectionStat.CircleSize,
          relation: SpellProtectionRelation.Greater,
          value: 3,
        },
        values: [0],
      },
      {
        type: {
          stat: SpellProtectionStat.Splstate,
          relation: SpellProtectionRelation.Equal,
        },
        values: ["BLUE_FIRESHIELD", "RED_FIRESHIELD", "FREE_ACTION"],
      },
      {
        type: {
          stat: SpellProtectionStat.Race,
          relation: SpellProtectionRelation.Equal,
        },
        values: ["WRAITH", "MIST", "SHADOW", "ELEMENTAL", "SLIME"],
      },
    ];
    for (const protection of protections) {
      for (const value of protection.values) {
        effects.unshift({
          value,
          opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
          type: protection.type,
          timing: EffectTimingEnum.InstantLimited,
          duration: 1,
        });
      }
    }
    if (damageEffect) {
      const rounds = Math.floor(duration / Durations.round);
      effects.push(...effectFactory.repeatEffect(rounds, [{ ...damageEffect, ...saves }]));
    }
    if (invisible) {
      effects.push({
        opcode: EffectTypeEnum.Invisibility,
        type: InvisibilityTypeEnum.Normal,
        duration,
        ...saves,
      });
    }
    return this.addSpell({
      id,
      description,
      name: name ?? "monster.spider.ability.webTangle.name",
      memorizedCount: 1,
      icon: SPELLS.Wizard.Web.file,
      options: { renew: 2 },
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          range: 5,
          projectile: "WEB1P",
          effects,
        },
      ],
      ability: {
        preset: SPELLS.Wizard.Web.file,
        spell: {
          // It can shoot web strands up to 2 feet to bind a foe.
          // Either attack treats the spider's opponent as AC 10 and prevents the spider from making a melee attack that round.
          type: "force",
          isAttack: true,
        },
        range: 6, // to fix issue with very close range since melee attack is 3 feet
        requireVocal: false,
        probability: 70,
      },
    });
  }

  /**
   * Leap attack
   */
  createLeapSpell(p: { id: number; memorizedCount?: number; effects?: Effect[] }) {
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.WingBuffet,
        target: EffectTargetEnum.Self,
        speed: 150,
        direction: WingBuffetDirectionEnum.TowardsTargetPoint,
        duration: 2,
      },
      ...(p.effects ?? []),
    ];
    return this.addSpell({
      id: p.id,
      name: p.effects?.length
        ? "monster.spider.ability.leapAttack.name"
        : "monster.spider.ability.leap.name",
      description: p.effects?.length
        ? "monster.spider.ability.leapAttack.description"
        : "monster.spider.ability.leap.description",
      memorizedCount: p.memorizedCount,
      icon: SPELLS.Wizard.DimensionDoor.file,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 30,
          effects,
        },
      ],
      ability: {
        targets: [{ name: "FarthestEnemies", randomOrder: true }],
        minRange: 5,
        range: 30,
        spell: {
          type: "force",
          isAttack: true,
        },
        disableInterrupt: true,
        actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
      },
    });
  }

  /**
   * Leap attack
   */
  createLeapImpalingSpell(p: { id: number; lightning?: boolean; memorizedCount?: number }) {
    this.createLegWeapon({
      id: p.id,
      impale: true,
      lightning: p.lightning,
    });
    return this.createLeapSpell({
      id: p.id,
      memorizedCount: p.memorizedCount,
      effects: [
        {
          opcode: EffectTypeEnum.ModifyAttacksPerRound,
          type: AttackModifierTypeEnum.Set,
          value: 1,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: Durations.round,
        },
        {
          opcode: EffectTypeEnum.CreateWeapon,
          amount: 1,
          resource: this.item(p.id).file,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: Durations.round,
        },
        {
          opcode: EffectTypeEnum.DisplayString,
          stringRef: "monster.spider.ability.impale.name",
        },
      ],
    });
  }

  /**
   * Phase out
   */
  createPhaseOut() {
    const base: BaseEffect = {
      target: EffectTargetEnum.Self,
      timing: EffectTimingEnum.InstantPermanent,
    };
    return this.addSpell({
      id: SpiderIds.PhaseOut,
      name: "monster.spider.ability.phase.name",
      description: "monster.spider.ability.phase.description",
      memorizedCount: 1,
      icon: SPELLS.Wizard.Invisibility.file,
      options: { renew: 1 },
      headers: [
        {
          target: ItemAbilityTargetEnum.Caster,
          type: ItemAbilityTypeEnum.Melee,
          effects: [
            {
              opcode: EffectTypeEnum.Invisibility,
              type: InvisibilityTypeEnum.Normal,
              ...base,
            },
          ],
        },
      ],
      ability: {
        preset: SPELLS.Wizard.Invisibility.file,
        spell: {
          type: "force",
        },
        requireVocal: false,
      },
    });
  }
}

export class SpiderKin extends CreatureKin {
  constructor() {
    super(KinEnum.Spider);
  }
}

export const createSpiderKin = () => new SpiderKin();

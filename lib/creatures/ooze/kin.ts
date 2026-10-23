import { VAPOR_IMMUNE_CREATURES } from "../../config/creatures";
import { SPELLS } from "../../config/spells/spell-database";
import { RawCreatureAbility } from "../../src/model/creature/ability";
import { Creature } from "../../src/model/creature/creature";
import { StringReference } from "../../src/model/final/stringref";
import { Durations } from "../../src/model/game-data/durations";
import { Triggers } from "../../src/model/script/triggers";
import { BaseEffect, Effect, IdsEffect } from "../../src/model/spell-item/effect";
import {
  AttackModifierTypeEnum,
  CastingFailureTypeEnum,
  ColorEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectModifierTypeEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  ReplaceCreatureTypeEnum,
  SaveTypeEnum,
  SummonCreatureModeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum, ParticleColorEnum } from "../../src/model/spell-item/projectile";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import { TranslationKey } from "../../translations/i18n";
import { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";

export enum SlimeIds {
  BlackPuddingSplit,
  WhitePuddingSplit,
  MustardJellySplit,
  ToxicVapors,
  AttachToLivingFleshGreenSlime,
  AttachToLivingFleshOliveSlime,
  GargantuanOliveSlimeCreature,
  HugeOliveSlimeCreature,
}

export class Slime extends Creature {
  createPseudopod(p: {
    diceThrown: number;
    diceSize: number;
    effects?: Effect[];
    castSpell?: WeaponCastSpell;
    id?: number;
  }) {
    return this.addNaturalWeapon("pseudopod", {
      id: p.id,
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      speed: 4,
      range: 5,
      animationSwing: { backhand: 100, overhand: 0, thrust: 0 },
      projectile: "ACIDBLMU",
      effects: p.effects,
      castSpells: p.castSpell ? [p.castSpell] : undefined,
    });
  }

  createAttachToLivingFlesh(p: {
    id: number;
    delay: number;
    description: StringReference;
    resource: string;
  }) {
    return this.addSpell({
      id: p.id,
      name: "monster.ooze.ability.attachToLivingFlesh.name",
      description: p.description,
      secondaryType: "Disease",
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          effects: [
            {
              opcode: EffectTypeEnum.SetColor,
              color: ColorEnum.DarkMoldyGreen,
              location: EffectColorLocationEnum.CharacterColor,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Diseased,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.ReplaceCreature,
              type: ReplaceCreatureTypeEnum.NormalDeath,
              timing: EffectTimingEnum.DelayPermanent,
              duration: p.delay,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              resource: p.resource,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              duration: p.delay,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
    });
  }

  /**
   * Split
   */
  createSplit({
    id,
    description,
    resource,
    visualEffect,
    withTriggers,
  }: {
    id: number;
    description: TranslationKey;
    resource: string;
    visualEffect: string;
    withTriggers: boolean;
  }) {
    return this.addSpell({
      id,
      description,
      name: "monster.ooze.ability.split.name",
      icon: SPELLS.Wizard.MirrorImages.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Magical,
          target: ItemAbilityTargetEnum.Caster,
          effects: [
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: visualEffect,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.SummonCreature,
              mode: SummonCreatureModeEnum.PositionTargetAllegianceMatchTarget,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource,
            },
            {
              opcode: EffectTypeEnum.SummonCreature,
              mode: SummonCreatureModeEnum.PositionTargetAllegianceMatchTarget,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource,
            },
            {
              opcode: EffectTypeEnum.RemoveCreature,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
          ],
        },
      ],
      ability: this.getSplitAbility(withTriggers),
    });
  }
  private getSplitAbility(withTriggers: boolean): RawCreatureAbility {
    const triggers: Triggers.Trigger[] = [
      {
        name: "Or",
        triggers: [
          { name: "HitBy", params: ["ANYONE", "ELECTRICITY"] },
          { name: "HitBy", params: ["ANYONE", "SLASHING"] },
          { name: "HitBy", params: ["ANYONE", "PIERCING"] },
          { name: "HitBy", params: ["ANYONE", "CRUSHING"] },
          { name: "HitBy", params: ["ANYONE", "MISSILE"] },
        ],
      },
    ];
    return {
      spell: {
        type: "force",
        castOnSelf: true,
        remove: true,
      },
      triggers: withTriggers ? triggers : [],
      probability: 100,
    };
  }
}

export class OozeKin extends CreatureKin {
  constructor() {
    super(KinEnum.Ooze);
    this.createToxicVapors();
  }

  /**
   * Toxic vapors
   */
  private createToxicVapors() {
    // 5e: Poison Aura. At the start of each of the jelly’s turns, each creature within 10 feet of it takes 3d6 poison damage.
    // A creature that touches the jelly or hits it with a melee attack while within 5 feet of it takes 3d6 poison damage.
    const vaporBaseEffect: BaseEffect = {
      timing: EffectTimingEnum.InstantLimited,
      dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
      duration: 2 * Durations.round,
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    };
    return this.addSpell({
      id: SlimeIds.ToxicVapors,
      name: "monster.ooze.ability.toxicVapors.name",
      keywords: ["area"],
      description: "monster.ooze.ability.toxicVapors.description",
      icon: SPELLS.Wizard.StinkingCloud.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          range: 10,
          projectile: {
            copyFromFile: "dvstink",
            name: "Mustard jelly Toxic Vapors",
            particleColor: ParticleColorEnum.Green,
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
              explosionDelay: 12,
              triggerCount: 6,
              triggerRadius: 180,
              areaOfEffect: 180, // 10-foot radius
            },
          },
          effects: [
            ...[...VAPOR_IMMUNE_CREATURES].map(
              (c) =>
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                ({
                  opcode: EffectTypeEnum.UseEFFFile,
                  idsFile: c[0],
                  idsEntry: c[1],
                  timing: EffectTimingEnum.InstantPermanentUntilDeath,
                }) as IdsEffect,
            ),
            {
              opcode: EffectTypeEnum.ModifyAttacksPerRound,
              type: AttackModifierTypeEnum.Set,
              value: 0,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.CastingFailure,
              type: CastingFailureTypeEnum.Wizard,
              amount: 100,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.CastingFailure,
              type: CastingFailureTypeEnum.Priest,
              amount: 100,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.MovementRateBonus,
              type: EffectModifierTypeEnum.SetPercentOf,
              value: 50,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Nauseated,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.round,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
      ability: {
        targets: [
          {
            name: "NearestEnemies",
            limit: 3,
          },
        ],
        spell: {
          type: "force",
          castOnSelf: true,
        },
        range: 10,
        probability: 100,
      },
    });
  }
}

export const createOozeKin = () => new OozeKin();

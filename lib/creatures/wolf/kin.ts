import { MonsterItemIconEnum } from "../../config/item";
import effectFactory from "../../src/factories/effect.factory";
import { Creature } from "../../src/model/creature/creature";
import { CreatureGrabConfig } from "../../src/model/creature/grab";
import { ItemSlot } from "../../src/model/creature/item";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  DiseaseTypeEnum,
  EffectColorLocationEnum,
  EffectDamageModeEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectFlagsEnum,
  EffectModifierTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ItemCategoryEnum,
  PortraitIconEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import creatureService from "../../src/services/creature.service";
import { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";

export enum WolfIds {
  DreadWolfDisease,
  DreadWolfDownState,
  StreamOfFrost,
}

export class Wolf extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    castSpells?: WeaponCastSpell[];
    slot?: ItemSlot;
  }) {
    return this.addNaturalWeapon("jaws", {
      stringRef: "monster.wolf.weapon.jaws",
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      speed: 3,
      slot: p.slot ?? "WEAPON1",
      castSpells: p.castSpells,
    });
  }

  createVampiricJaws(p: {
    effects?: Effect[];
    slot: ItemSlot;
    grab?: CreatureGrabConfig;
    bonusToHit?: number;
    doc?: boolean;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.wolf.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: [p.slot],
        doc: p.doc,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          damageType: AbilityDamageTypeEnum.Piercing,
          damageBonus: 8,
          bonusToHit: p.bonusToHit,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: [
            ...(p.effects ?? []),
            {
              opcode: EffectTypeEnum.CurrentHPbonus,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              value: 8 + creatureService.getStrengthBonus(this.data).damage,
              type: EffectModifierTypeEnum.Increment,
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantLimited,
              color: { blue: 191, green: 125, red: 53 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 20,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.Sleep,
              wakeOnDamage: true,
              timing: EffectTimingEnum.InstantLimited,
              duration: 2 * Durations.round,
              saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
            },
          ],
        },
      },
      grab: p.grab,
    });
  }

  /**
   * Dread Wolf down state
   */
  createDreadWolfDownState() {
    this.addItem({
      stringRef: "monster.wolf.ability.dreadWolfDownState.name",
      id: WolfIds.DreadWolfDownState,
      description: "monster.wolf.ability.dreadWolfDownState.description",
      immunities: ["poison", "disease", "cold", "lightning", "magicDamage", "physicalDamage"],
      category: ItemCategoryEnum.Rings,
      icon: "IRING01",
    });
    this.addSpell({
      id: WolfIds.DreadWolfDownState,
      name: "monster.wolf.ability.dreadWolfDownState.name",
      headers: [
        {
          target: ItemAbilityTargetEnum.Caster,
          type: ItemAbilityTypeEnum.Melee,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveItem,
              resource: this.traitItem().file,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              target: EffectTargetEnum.Self,
            },
            ...effectFactory.cureAll(),
            {
              opcode: EffectTypeEnum.CreateItemInSlot,
              resource: this.item(WolfIds.DreadWolfDownState).file,
              slot: "SLOT_RING_LEFT",
              duration: 2 * Durations.round,
              timing: EffectTimingEnum.InstantLimited,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.Sleep,
              wakeOnDamage: false,
              timing: EffectTimingEnum.InstantLimited,
              duration: 2 * Durations.round,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.CurrentHPbonus,
              value: 1,
              type: EffectModifierTypeEnum.Set,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.CreateItemInSlot,
              resource: this.traitItem().file,
              slot: "SLOT_RING_LEFT",
              duration: 2 * Durations.round,
              timing: EffectTimingEnum.DelayPermanent,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.CurrentHPbonus,
              value: 6,
              type: EffectModifierTypeEnum.Set,
              duration: 2 * Durations.round,
              timing: EffectTimingEnum.DelayPermanent,
              target: EffectTargetEnum.Self,
            },
          ],
        },
      ],
    });
  }

  /**
   * Stream of Frost
   */
  createStreamOfFrost() {
    this.addSpell({
      name: "monster.wolf.ability.streamOfFrost.name",
      description: "monster.wolf.ability.streamOfFrost.description",
      id: WolfIds.StreamOfFrost,
      memorizedCount: 1,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      options: { renew: 10 },
      keywords: ["cold", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          projectile: {
            copyFromFile: "CONECOLD",
            name: "Stream of frost",
            areaEffectInfo: {
              areaProjectileFlags: [
                AreaProjectileEnum.AffectOnlyEnemies,
                AreaProjectileEnum.UseSecondaryProjectile,
              ],
              triggerRadius: 180,
              areaOfEffect: 180, // within 10 feet
              coneWidth: 0,
            },
          },
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              amount: 0,
              damageMode: EffectDamageModeEnum.Normal,
              type: EffectDamageTypeEnum.Cold,
              diceThrown: 6,
              diceSize: 4,
              saveTypes: [SaveTypeEnum.Breath],
              flags: [EffectFlagsEnum.SaveForHalf],
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              timing: EffectTimingEnum.InstantLimited,
              color: { blue: 255, green: 213, red: 123 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 20,
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
        probability: 20,
      },
    });
  }

  /**
   * Dread Wolf Disease
   */
  createDreadWolfDisease() {
    return this.addSpell({
      name: "monster.wolf.ability.rottingDisease.name",
      description: "monster.wolf.ability.rottingDisease.description",
      id: WolfIds.DreadWolfDisease,
      secondaryType: "Disease",
      doc: false,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveEffectsByResource,
              type: RemoveEffectsByResourceTypeEnum.Default,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.Disease,
              amount: 300,
              type: DiseaseTypeEnum.OneDamagePerAmountSeconds,
              duration: Durations.day * 30,
              icon: PortraitIconEnum.Diseased,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
    });
  }
}

export class WolfKin extends CreatureKin {
  constructor() {
    super(KinEnum.Wolf);
  }
}

export const createWolfKin = () => new WolfKin();

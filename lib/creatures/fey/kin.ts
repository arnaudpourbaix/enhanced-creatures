import { DEFAULT_SPELL_PROBABILITY, PRESET_NAMES } from "../../config/common";
import { GARGANTUAN_CREATURES, INCORPOREAL_CREATURES } from "../../config/creatures";
import { ITEMS } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import { createDimensionDoor } from "../../spells/dimension_door";
import { CommonProjectileFiles } from "../../spells/projectiles";
import actionFactory from "../../src/factories/action.factory";
import effectFactory from "../../src/factories/effect.factory";
import responseFactory from "../../src/factories/response.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Creature } from "../../src/model/creature/creature";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  AdditionalCode,
  ConditionalStatement,
  PartialCustomCode,
} from "../../src/model/script/script";
import { BaseEffect, IdsEffect } from "../../src/model/spell-item/effect";
import {
  CharmTypeEnum,
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
  SaveTypeEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../src/model/spell-item/spell-protection";
import { StringRefUtils } from "../../src/services/utils/string-ref.utils";
import { KinEnum } from "../kin";

export enum FeyIds {
  InnateDimensionDoor,
  PriestDimensionDoor,
  DryadCharm,
  SpeakWithPlants,
  Entangle,
  AnimalFriendship,
  DetectTraps,
  BlindingBeauty,
  CharmSong,
  FogCloud,
  TouchOfTranquility,
  BeguilingAura,
  AttackEvasion,
  DrowningKiss,
  VenomSpit,
  SummonGiantPoisonousSnake,
  WateryFist,
}

export class Fey extends Creature {}

export class FeyKin extends CreatureKin {
  constructor() {
    super(KinEnum.Fey);
    this.createInnateDimensionDoor();
    this.createPriestDimensionDoor();
    this.createCharm();
    this.createSpeakWithPlants();
    this.createEntangle();
    this.createAnimalFriendship();
    this.createDetectTraps();
    this.createBlindingBeauty();
    this.createCharmSong();
    this.createFogCloud();
    this.createTouchOfTranquility();
  }

  /**
   * Dimension Door
   */
  private createInnateDimensionDoor() {
    return this.addSpell({
      ...createDimensionDoor({
        spellLevel: 1,
        spellType: SpellTypeEnum.Innate,
        renew: 1,
      }),
      id: FeyIds.InnateDimensionDoor,
      ability: {
        preset: PRESET_NAMES.DimensionDoorOffscreen,
        spell: {
          type: "force",
          remove: true,
        },
        disableInterrupt: true,
      },
    });
  }

  private createPriestDimensionDoor() {
    return this.addSpell({
      ...createDimensionDoor({
        spellLevel: 1,
        spellType: SpellTypeEnum.Priest,
      }),
      id: FeyIds.PriestDimensionDoor,
      ability: {
        preset: PRESET_NAMES.DimensionDoorOffscreen,
        spell: {
          type: "force",
          remove: true,
        },
        disableInterrupt: true,
      },
    });
  }

  /**
   * Charm
   */
  private createCharm() {
    return this.addSpell({
      name: "monster.fey.ability.dryadDireCharm",
      id: FeyIds.DryadCharm,
      icon: SPELLS.Wizard.DireCharm.file,
      castingSound: "CAS_M05",
      flags: [SpellFlagEnum.BreakSanctuary],
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Enchantment,
      primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      level: 1,
      keywords: ["charm"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          projectile: "SPARKLGO",
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 30,
          speed: 1,
          effects: effectFactory.charm({
            charmType: CharmTypeEnum.NeutralDireCharm,
            duration: 3 * Durations.turn,
            dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
            saveType: SaveTypeEnum.Spell,
            saveBonus: -3,
          }),
        },
      ],
      ability: {
        preset: SPELLS.Wizard.DireCharm.file,
        spell: {
          type: "force",
          remove: true,
        },
        disableInterrupt: true,
      },
    });
  }

  /**
   * Speak with Plants
   */
  private createSpeakWithPlants() {
    return this.addSpell({
      name: "monster.fey.ability.speakWithPlants.name",
      id: FeyIds.SpeakWithPlants,
      description: "monster.fey.ability.speakWithPlants.description",
      icon: "jaak0501",
      castingSound: "CAS_P02",
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
      primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
      secondaryType: ItemAbilitySecondaryTypeEnum.NonCombat,
      level: 1,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          icon: "jaak0501",
          range: 30,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.CreateItemInSlot,
              slot: "SLOT_AMULET",
              resource: ITEMS.EntangleImmunity,
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.turn,
              dispelResistance: EffectDispelResistanceEnum.DispelBypassResistance,
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              color: { red: 72, green: 243, blue: 102 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 30,
              timing: EffectTimingEnum.InstantLimited,
              duration: 1,
              dispelResistance: EffectDispelResistanceEnum.DispelBypassResistance,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: "SPRMCURS",
              timing: EffectTimingEnum.InstantLimited,
              duration: 2,
              dispelResistance: EffectDispelResistanceEnum.DispelBypassResistance,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "force",
        },
        disableInterrupt: true,
        triggers: [{ name: "CheckStatGT", params: [ScriptTarget.myself, 0, "ENTANGLE"] }],
        timer: { name: "speakWithPlants", value: 60 },
      },
    });
  }

  /**
   * Entangle
   */
  private createEntangle() {
    const entangleCommonEffect = {
      timing: EffectTimingEnum.InstantLimited,
      duration: 6,
      dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
      saveTypes: [SaveTypeEnum.Spell],
    } satisfies BaseEffect;
    return this.addSpell({
      name: "monster.fey.ability.entangle.name",
      id: FeyIds.Entangle,
      description: "monster.fey.ability.entangle.description",
      icon: SPELLS.Priest.Entangle.file,
      castingSound: "CAS_P08",
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
      primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      level: 1,
      options: {
        renew: 3,
      },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          projectile: {
            copyFromFile: "ENTANG2",
            name: "Hamadryad Entangle",
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
            },
          },
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          range: 30,
          speed: 1,
          effects: [
            ...[...GARGANTUAN_CREATURES, ...INCORPOREAL_CREATURES].map(
              (c) =>
                // no-unnecessary-type-assertion is wrong here (verified against tsc directly):
                // without this cast, opcode/idsFile widen instead of narrowing to IdsEffect's
                // literal types, which then breaks inference for the array literal's other
                // (sibling) elements below too.
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                ({
                  opcode: EffectTypeEnum.UseEFFFile,
                  idsFile: c[0],
                  idsEntry: c[1],
                  timing: EffectTimingEnum.InstantLimited,
                  duration: 6,
                }) as IdsEffect,
            ),
            {
              opcode: EffectTypeEnum.MovementRateBonus,
              type: EffectModifierTypeEnum.SetPercentOf,
              value: 50,
              ...entangleCommonEffect,
              saveTypes: undefined,
            },
            {
              opcode: EffectTypeEnum.MovementRateBonus,
              type: EffectModifierTypeEnum.Set,
              value: 0,
              ...entangleCommonEffect,
            },
            {
              opcode: EffectTypeEnum.Thac0Bonus,
              type: EffectStatisticModifierEnum.Increment,
              value: -2,
              ...entangleCommonEffect,
            },
            {
              opcode: EffectTypeEnum.ArmorClassBonus,
              bonusTo: EffectBonusToEnum.AllWeapons,
              value: -2,
              ...entangleCommonEffect,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "CRE_P01",
              ...entangleCommonEffect,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "EFF_M22A",
              ...entangleCommonEffect,
              timing: EffectTimingEnum.DelayPermanent,
            },
            {
              opcode: EffectTypeEnum.EntangleOverlay,
              ...entangleCommonEffect,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Entangled,
              ...entangleCommonEffect,
            },
          ],
        },
      ],
      ability: {
        preset: SPELLS.Priest.Entangle.file,
        spell: {
          type: "force",
          remove: true,
        },
        disableInterrupt: true,
      },
    });
  }

  /**
   * Animal Friendship
   */
  private createAnimalFriendship() {
    const animalFriendshipCommonEffect = {
      timing: EffectTimingEnum.InstantLimited,
      duration: 2 * Durations.turn,
      dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
      saveTypes: [SaveTypeEnum.Spell],
    } satisfies BaseEffect;
    return this.addSpell({
      name: "monster.fey.ability.animalFriendship.name",
      id: FeyIds.AnimalFriendship,
      description: "monster.fey.ability.animalFriendship.description",
      icon: SPELLS.Priest.CharmPersonOrAnimal.file,
      flags: [SpellFlagEnum.CastableWhenSilenced],
      castingSound: "CORAN03",
      type: SpellTypeEnum.Innate,
      primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      level: 1,
      options: {
        renew: 1,
      },
      keywords: ["charm"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 30,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.General,
                relation: SpellProtectionRelation.NotEqual,
              },
              value: "ANIMAL",
              ...animalFriendshipCommonEffect,
            },
            {
              opcode: EffectTypeEnum.CharmCreature,
              charmType: CharmTypeEnum.NeutralCharm,
              generalType: "ANIMAL",
              ...animalFriendshipCommonEffect,
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              color: { red: 120, green: 90, blue: 30 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 25,
              ...animalFriendshipCommonEffect,
              timing: EffectTimingEnum.InstantLimited,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: "SPNWCHRM",
              ...animalFriendshipCommonEffect,
              duration: 3,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "force",
        },
        targets: [
          {
            name: "Animals",
          },
        ],
        probability: DEFAULT_SPELL_PROBABILITY,
        disableInterrupt: true,
      },
    });
  }

  /**
   * Detect Traps
   */
  private createDetectTraps() {
    return this.addSpell({
      name: "monster.fey.ability.detectTraps.name",
      id: FeyIds.DetectTraps,
      description: "monster.fey.ability.detectTraps.description",
      castingSound: "CAS_P04",
      flags: [SpellFlagEnum.OutdoorsOnly],
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Divination,
      primaryType: ItemAbilityPrimaryTypeEnum.Diviner,
      secondaryType: ItemAbilitySecondaryTypeEnum.NonCombat,
      icon: SPELLS.Priest.FindTraps.file,
      options: {
        renew: 16,
      },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          projectile: "INAREANS",
          effects: [
            {
              opcode: EffectTypeEnum.FindTraps,
              duration: 2 * Durations.turn,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.DetectingTrapsIllusions,
              duration: 2 * Durations.turn,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.DivinationWater,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              color: { red: 70, green: 32, blue: 73 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 20,
              duration: 2,
            },
          ],
        },
      ],
      ability: {
        preset: SPELLS.Priest.FindTraps.file,
        spell: {
          id: undefined,
          type: "force",
        },
      },
    });
  }

  // TODO: Quench Fire
  // You extinguish all fires in a 30-foot cube centered on a point you choose within range. Any nonmagical fire is put out automatically, as are magical flames created by a spell of 3rd level or lower.
  // For each spell of 4th level or higher which is creating flame within this area,  make an ability check using your spellcasting ability.
  // On a successful check, the spell that created the fire ends. Fire created by a magical item is also doused, and the item becomes unable to produce fire for 1d4 hours.

  /**
   * Blinding Beauty
   */
  private createBlindingBeauty() {
    const blindingBeautyEffect = {
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.day,
      dispelResistance: EffectDispelResistanceEnum.DispelBypassResistance,
      saveTypes: [SaveTypeEnum.Spell],
    } satisfies BaseEffect;
    const technical = this.addSpell({
      name: "monster.fey.ability.blindingBeauty.name",
      keywords: ["area"],
      doc: false,
      type: SpellTypeEnum.Innate,
      icon: SPELLS.Priest.BlindingBeauty.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          effects: [
            ...effectFactory.blindness({
              duration: blindingBeautyEffect.duration,
              dispelResistance: blindingBeautyEffect.dispelResistance,
              saveType: blindingBeautyEffect.saveTypes[0],
            }),
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "EFF_P71B",
              ...blindingBeautyEffect,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: "SPH1HI01",
              ...blindingBeautyEffect,
              duration: 3,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              ...blindingBeautyEffect,
            },
          ],
        },
      ],
    });
    return this.addSpell({
      name: "monster.fey.ability.blindingBeauty.name",
      id: FeyIds.BlindingBeauty,
      description: "monster.fey.ability.blindingBeauty.description",
      type: SpellTypeEnum.Innate,
      icon: SPELLS.Priest.BlindingBeauty.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: {
        renew: 1,
      },
      keywords: ["blind", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          effects: [
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              target: EffectTargetEnum.Self,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              timing: EffectTimingEnum.InstantLimited,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration: 2,
              resource: "ICCLKFR2",
            },
            {
              opcode: EffectTypeEnum.UseEFFFile,
              idsFile: EffectIDSFileEnum.GENERAL,
              idsEntry: "HUMANOID",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
      effectFiles: [
        {
          opcode: EffectTypeEnum.CastSpell,
          type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
          resource: technical.file,
          timing: EffectTimingEnum.InstantPermanentUntilDeath,
        },
      ],
      ability: {
        spell: {
          type: "reallyForce",
          castOnSelf: true,
          excludeStateChecks: ["STATE_BLIND"],
        },
        targets: [
          {
            name: "NearestEnemies",
            triggers: [
              {
                name: "General",
                params: [ScriptTarget.lastSeen, "HUMANOID"],
              },
            ],
          },
        ],
        noRoundTimer: true,
        timer: {
          name: "blindingBeauty",
          value: 6,
        },
      },
    });
  }

  /**
   * Charm Song
   */
  private createCharmSong() {
    const technical = this.addSpell({
      name: "monster.fey.ability.charmSong.name",
      keywords: ["area"],
      doc: false,
      icon: SPELLS.Wizard.DireCharm.file,
      castingSound: "SIRIN05",
      flags: [SpellFlagEnum.BreakSanctuary],
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Enchantment,
      primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      level: 1,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 30,
          speed: 1,
          effects: effectFactory.charm({
            charmType: CharmTypeEnum.NeutralDireCharm,
            duration: 3 * Durations.turn,
            dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
            saveType: SaveTypeEnum.Spell,
          }),
        },
      ],
    });
    return this.addSpell({
      name: "monster.fey.ability.charmSong.name",
      id: FeyIds.CharmSong,
      description: "monster.fey.ability.charmSong.description",
      icon: SPELLS.Wizard.DireCharm.file,
      castingSound: "SIRIN05",
      flags: [SpellFlagEnum.BreakSanctuary, SpellFlagEnum.IgnoreDead],
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Enchantment,
      primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: {
        removeInvisbilityOnCast: true,
      },
      keywords: ["charm", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 30,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.UseEFFFile,
              idsFile: EffectIDSFileEnum.GENERAL,
              idsEntry: "HUMANOID",
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
      effectFiles: [
        {
          opcode: EffectTypeEnum.CastSpell,
          type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
          resource: technical.file,
          timing: EffectTimingEnum.InstantPermanentUntilDeath,
        },
      ],
      ability: {
        preset: SPELLS.Wizard.DireCharm.file,
        spell: {
          type: "force",
          remove: true,
        },
        disableInterrupt: true,
      },
    });
  }

  /**
   * Fog Cloud
   */
  private createFogCloud() {
    return this.addSpell({
      name: "monster.fey.ability.fogCloud.name",
      id: FeyIds.FogCloud,
      description: "monster.fey.ability.fogCloud.description",
      icon: "SPWI204",
      castingSound: "CAS_M08",
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
      primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Battleground,
      level: 1,
      options: {
        removeInvisbilityOnCast: true,
      },
      keywords: ["cloud", "blind", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          projectile: "CLOUD",
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          range: 30,
          speed: 1,
          effects: effectFactory.blindness({
            duration: 7,
            dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
          }),
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies" }],
        spell: {
          excludeStateChecks: ["STATE_BLIND"],
          type: "force",
          remove: true,
        },
        requireVocal: true,
        disableInterrupt: true,
      },
    });
  }

  /**
   * Touch of Tranquility
   */
  private createTouchOfTranquility() {
    const tranquilityBaseEffect = {
      timing: EffectTimingEnum.InstantLimited,
      duration: 5 * Durations.turn,
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    } satisfies BaseEffect;
    return this.addSpell({
      name: "monster.fey.ability.touchOfTranquility.name",
      id: FeyIds.TouchOfTranquility,
      // Only ever reached via the weapon's on-hit CastSpell effect (below) - it isn't a
      // memorized/learnable ability, so it never gets its own Abilities entry (see
      // documentation.service.ts's getCreatureSpell, which requires a `memorized` match). Without
      // `doc: false` it falls into documentation.service.ts's "documented elsewhere" branch and
      // the attack description drops the spell's description entirely, same mechanism ankheg's
      // digestiveEnzyme relies on via addWeapon's castSpells (see attachSpellToWeapon).
      doc: false,
      description: "monster.fey.ability.touchOfTranquility.description",
      // options: { renew: 1 },
      castingSound: "EFF_P11",
      flags: [SpellFlagEnum.Hostile, SpellFlagEnum.IgnoreDead],
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
      primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Battleground,
      icon: SPELLS.Wizard.Feeblemind.file,
      keywords: ["confusion"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.Splstate,
                relation: SpellProtectionRelation.Equal,
              },
              value: "CHAOTIC_COMMANDS",
              timing: EffectTimingEnum.InstantLimited,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.Feeblemindedness,
              ...tranquilityBaseEffect,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Feebleminded,
              ...tranquilityBaseEffect,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              ...tranquilityBaseEffect,
              duration: 2,
              resource: "SPMINDAT",
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              color: { red: 109, green: 73, blue: 0 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 20,
              ...tranquilityBaseEffect,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: StringRefUtils.getStringId("Feebleminded"),
              ...tranquilityBaseEffect,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              ...tranquilityBaseEffect,
            },
          ],
        },
      ],
      ability: {
        // touch is automatic for charmed individuals
        spell: {
          type: "force",
          memorizedSpellCheck: false,
        },
        targets: [
          {
            name: "NearestAllies",
            includeStatus: ["Able"],
            triggers: [
              {
                name: "StateCheck",
                params: [ScriptTarget.lastSeen, "STATE_CHARMED"],
              },
              {
                name: "See",
                params: ["NearestEnemyOf"],
                negation: true,
              },
            ],
          },
        ],
        noRoundTimer: true,
        actionsBefore: [
          { name: "EquipMostDamagingMelee" },
          {
            name: "MoveToObjectNoInterrupt",
            params: [ScriptTarget.lastSeen],
          },
        ],
        disableInterrupt: true,
      },
    });
  }

  dryadTrackTarget(): AdditionalCode {
    const file = this.spell(FeyIds.DryadCharm).file;
    return {
      location: "trackTargets",
      triggers: [{ name: "HaveSpellRES", params: [file] }],
      actions: [],
    };
  }

  dryadWildernessAbilities(): ConditionalStatement[] {
    const globals = {
      Wilderness: "ja_wilderness",
    };
    return [
      {
        comment: "Can use dimension door and detect traps",
        triggers: [
          triggerFactory.global(globals.Wilderness, 0),
          { name: "AreaType", params: ["OUTDOOR"] },
          { name: "AreaType", params: ["CITY"], negation: true },
          { name: "AreaType", params: ["DUNGEON"], negation: true },
        ],
        responses: responseFactory.response([actionFactory.setGlobal(globals.Wilderness, 1)]),
      },
      {
        triggers: [
          triggerFactory.global(globals.Wilderness, 0),
          {
            name: "Or",
            triggers: [
              {
                name: "HaveSpellRES",
                params: [this.spell(FeyIds.InnateDimensionDoor).file],
              },
              {
                name: "HaveSpellRES",
                params: [this.spell(FeyIds.DetectTraps).file],
              },
            ],
          },
        ],
        responses: responseFactory.response([
          {
            name: "RemoveSpellRES",
            params: [this.spell(FeyIds.InnateDimensionDoor).file],
          },
          {
            name: "RemoveSpellRES",
            params: [this.spell(FeyIds.DetectTraps).file],
          },
          actionFactory.setGlobal(globals.Wilderness, 2),
        ]),
      },
    ];
  }

  dryadMeleeCondition(): AdditionalCode {
    return {
      location: "attack",
      triggers: triggerFactory.haveSpellRES([this.spell(FeyIds.DryadCharm).file], true),
      actions: [],
    };
  }

  noMeleeUntilForced(): PartialCustomCode {
    return {
      location: "trackTargets",
      type: "insertAfter",
      statements: [
        {
          comment: "Flee from melee unless you have no spells",
          triggers: [
            { name: "ActionListEmpty" },
            ...triggerFactory.haveSpellRES([this.spell(FeyIds.DryadCharm).file]),
          ],
          responses: responseFactory.response([
            { name: "RunAwayFromNoLeaveArea", params: ["NearestEnemyOf", 45] },
          ]),
        },
      ],
    };
  }
}

export const createFeyKin = () => new FeyKin();

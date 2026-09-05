import { DEFAULT_SPELL_PROBABILITY, PRESET_NAMES } from "../config/common";
import { GARGANTUAN_CREATURES, INCORPOREAL_CREATURES, NEW_CREATURES } from "../config/creatures";
import { ITEMS, MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import { BafExistingStringReference } from "../config/stringRef";
import { createDimensionDoor } from "../spells/dimension_door";
import { CommonProjectileFiles } from "../spells/projectiles";
import abilityFactory from "../src/factories/ability.factory";
import actionFactory from "../src/factories/action.factory";
import effectFactory from "../src/factories/effect.factory";
import responseFactory from "../src/factories/response.factory";
import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import {
  AdditionalCode,
  ConditionalStatement,
  PartialCustomCode,
} from "../src/model/script/script";
import { BaseEffect, IdsEffect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  CastSpellOnConditionTargetEnum,
  CharmTypeEnum,
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
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
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
  ProficiencyTypeEnum,
  SaveTypeEnum,
  SpellFlagEnum,
  SpellTypeEnum,
  SummonCreatureModeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../src/model/spell-item/projectile";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../src/model/spell-item/spell-protection";
import { StringRefUtils } from "../src/services/utils/string-ref.utils";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
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

class Fey extends Creature {
  /**
   * Attack Evasion
   */
  createAttackEvasion() {
    // The nereid also gets a saving throw vs. poison to avoid damage from a weapon.
    const duration = Durations.round;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.attackEvasion.name",
      description: "monster.fey.ability.attackEvasion.description",
      id: Ids.AttackEvasion,
      castingSound: "NERED06",
      icon: SPELLS.Wizard.ReflectedImage.file,
      flags: [SpellFlagEnum.IgnoreDead, SpellFlagEnum.CastableWhenSilenced],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          effects: [
            {
              opcode: EffectTypeEnum.ArmorClassBonus,
              bonusTo: EffectBonusToEnum.AllWeapons,
              value: 4,
              duration,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              duration,
              dispelResistance,
            },
          ],
        },
      ],
    });
  }

  /**
   * Venom Spit
   */
  createVenomSpit() {
    const duration = 7 * Durations.round;
    const saveType = SaveTypeEnum.ParalyzePoisonDeath;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.venomSpit.name",
      description: "monster.fey.ability.venomSpit.description",
      id: Ids.VenomSpit,
      memorizedCount: 1,
      castingSound: "NERED05",
      icon: SPELLS.Priest.Poison.file,
      options: {
        renew: 1,
      },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 20,
          projectile: "ACIDBLMU",
          speed: 1,
          effects: [
            ...effectFactory.blindness({
              duration,
              saveType,
              dispelResistance,
            }),
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies" }],
        range: 20,
        spell: {
          type: "force",
          remove: true,
          excludeStateChecks: ["STATE_BLIND"],
        },
        probability: 50,
      },
    });
  }

  /**
   * Watery Fist
   */
  createWateryFist() {
    // They can also form the water into the shape of a serpent or fist, and cause it to strike as a 4-Hit Die monster and inflict 1d4 points of damage.
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.wateryFist.name",
      description: "monster.fey.ability.wateryFist.description",
      id: Ids.WateryFist,
      memorizedCount: 1,
      castingSound: "CAS_M06",
      icon: SPELLS.Wizard.BigbyIcyGrasp.file,
      options: {
        renew: 1,
      },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 20,
          projectile: "ACIDBLMU", // TODO: need a better animation
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: "SPBGBFST", // TODO: need a better effect
              duration: 2,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Cold,
              diceThrown: 1,
              diceSize: 4,
              dispelResistance,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies" }],
        range: 30,
        spell: {
          type: "force",
          remove: true,
        },
        probability: 50,
      },
    });
  }

  /**
   * Drowning Kiss
   */
  createDrowningKiss() {
    const saveTypes = [SaveTypeEnum.Breath];
    const saveBonus = -2;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.drowningKiss.name",
      description: "monster.fey.ability.drowningKiss.description",
      id: Ids.DrowningKiss,
      memorizedCount: 1,
      castingSound: "NERED07",
      icon: "jaenkis",
      options: {
        renew: 1,
      },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 2,
          projectile: "ACIDBLMU",
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResource,
              type: "NOT_MALE_HUMANOID",
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              color: { red: 103, green: 32, blue: 0 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 25,
              duration: 1,
              saveTypes,
              saveBonus,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
              resource: "JASKISS",
              duration: 1,
              saveTypes,
              saveBonus,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.GENDER,
              idsEntry: "MALE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              saveTypes,
              saveBonus,
              dispelResistance,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "EvilcutoffMaleHumanoids" }],
        spell: {
          type: "force",
          remove: true,
          includeStateChecks: ["STATE_CHARMED"],
          excludeStateChecks: ["STATE_HELPLESS"],
        },
        actionsBefore: [
          { name: "MoveToObjectNoInterrupt", params: [ScriptTarget.lastSeen] },
          { name: "FaceObject", params: [ScriptTarget.lastSeen] },
          {
            name: "ActionOverride",
            params: [
              ScriptTarget.lastSeen,
              "FaceObject([EVILCUTOFF.0.FAIRY.FAIRY_NEREID.0.FEMALE.CHAOTIC_NEUTRAL])",
            ],
          },
        ],
        probability: 75,
      },
    });
  }

  /**
   * Beguiling Aura
   */
  createBeguilingAura() {
    const duration = 1 * Durations.turn;
    const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
    return this.addSpell({
      name: "monster.fey.ability.beguilingAura.name",
      description: "monster.fey.ability.beguilingAura.description",
      id: Ids.BeguilingAura,
      memorizedCount: 1,
      castingSound: "NERED07",
      primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      icon: SPELLS.Wizard.CharmPerson.file,
      options: {
        renew: 1,
      },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 20,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              target: EffectTargetEnum.Self,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: "ICCLKFR2",
              duration: 2,
              dispelResistance,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromResource,
              type: "NOT_MALE_HUMANOID",
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration: 1,
            },
            ...effectFactory.charm({
              charmType: CharmTypeEnum.NeutralCharm,
              duration,
              dispelResistance,
            }),
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        spell: {
          type: "reallyForce",
          excludeStateChecks: ["STATE_INVISIBLE"],
          selfTarget: true,
        },
        noRoundTimer: true,
        timer: { name: "BeguilingAura", value: 6 },
      },
    });
  }

  /**
   * Summon Giant Poisonous Snake
   */
  createSummonGiantPoisonousSnake() {
    const duration = Durations.eightHours;
    return this.addSpell({
      name: "monster.fey.ability.summonGiantPoisonousSnake.name",
      description: "monster.fey.ability.summonGiantPoisonousSnake.description",
      id: Ids.SummonGiantPoisonousSnake,
      memorizedCount: 1,
      castingSound: "CAS_P03",
      icon: SPELLS.Class.SummonSpiritAnimal.file,
      flags: [SpellFlagEnum.CastableWhenSilenced],
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          range: 30,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.UseEFFFile,
              target: EffectTargetEnum.Self,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantLimited,
              duration,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
      effectFiles: [
        {
          opcode: EffectTypeEnum.SummonCreature,
          mode: SummonCreatureModeEnum.MatchTarget0,
          resource: NEW_CREATURES.GiantPoisonousSnake,
          duration,
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 1 }],
        spell: {
          type: "force",
          remove: true,
          selfTarget: true,
        },
        noRoundTimer: true,
      },
    });
  }
}

class FeyFamily extends CreatureFamily<Fey> {
  constructor() {
    super(MonsterFamilyEnum.Fey);
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
    this.addCreature(() => this.dryad());
    this.addCreature(() => this.hamadryad());
    this.addCreature(() => this.nymph());
    this.addCreature(() => this.sirine());
    this.addCreature(() => this.nereid());
  }

  createCreature(id: MonsterEnum): Fey {
    return new Fey(id);
  }

  /**
   * Dryad
   */
  private dryad() {
    const dryad = this.create({
      monster: MonsterEnum.Dryad,
      name: "monster.fey.name.dryad",
      files: [NEW_CREATURES.DryadSummon],
      newFiles: [
        {
          files: [NEW_CREATURES.DryadSummon],
          copyFrom: NEW_CREATURES.DryadSummon,
          stringRef: "monster.fey.name.dryad",
        },
      ],
      data: {
        level1: 2,
        strength: 10,
        dexterity: 12,
        constitution: 11,
        intelligence: 14,
        wisdom: 15,
        charisma: 18,
        ac: 9,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL",
        morale: 12,
        general: "HUMANOID",
        race: "FAIRY",
        class: "FAIRY_DRYAD",
        gender: "FEMALE",
        size: "Medium",
        movement: 12,
        immunities: ["fey"],
        items: {
          remove: ["ANTIWEB", "DAGG01", "DAGG02", "DAGG03"],
        },
        script: {
          remove: ["DRYAD", "nymph"],
        },
        spells: {
          memorized: [
            {
              file: this.spell(Ids.InnateDimensionDoor).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(Ids.SpeakWithPlants).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(Ids.DryadCharm).file,
              memorizedCount: 3,
            },
          ],
        },
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYDAGGER, value: 2 }],
      },
    });
    dryad.addTrait({ immunities: ["magicResistance"] });
    dryad.setBehavior({
      restHeal: true,
      dialog: ["CDryad", "Ulene", "L#APEST"],
      abilities: [
        this.ability(Ids.InnateDimensionDoor),
        this.ability(Ids.SpeakWithPlants),
        this.ability(Ids.DryadCharm),
      ],
      additionalCodes: [this.dryadTrackTarget(), this.dryadMeleeCondition()],
      customCodes: [
        {
          location: "init",
          type: "insertBefore",
          statements: [...this.dryadWildernessAbilities(), ...this.irenicusCode()],
        },
        this.noMeleeUntilForced(),
      ],
    });
    dryad.setAdjustments([
      {
        files: [NEW_CREATURES.DryadSummon],
        summon: true,
      },
      {
        files: ["DRYAD", "L#APEST"],
        data: { class: "INNOCENT" },
      },
      {
        files: ["SUDRYAD", "OHDYARR"],
        data: {
          level1: 5,
        },
      },
      {
        files: ["OHDWNTRB", "OHDYARR"],
        data: {
          level1: 8,
        },
      },
      {
        files: ["VA#PANDA"],
        data: {
          level1: 10,
        },
      },
    ]);
    return dryad;
  }

  /**
   * Hamadryad
   */
  private hamadryad() {
    const hamadryad = this.create({
      monster: MonsterEnum.Hamadryad,
      name: "monster.fey.name.hamadryad",
      files: [NEW_CREATURES.HamadryadSummon],
      newFiles: [
        {
          files: [NEW_CREATURES.HamadryadSummon],
          copyFrom: NEW_CREATURES.HamadryadSummon,
          stringRef: "monster.fey.name.hamadryad",
        },
      ],
      data: {
        level1: 4,
        strength: 10,
        dexterity: 18,
        constitution: 12,
        intelligence: 14,
        wisdom: 14,
        charisma: 18,
        ac: 6,
        apr: 1,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 12,
        general: "HUMANOID",
        race: "FAIRY",
        class: "FAIRY_DRYAD",
        gender: "FEMALE",
        size: "Medium",
        movement: 15,
        immunities: ["fey"],
        items: { remove: ["ANTIWEB", "HAMASU", "AROW02"] },
        script: { remove: ["HAMA", "HAMASU", "BDHAMADC", "wqxhama"] },
        spells: {
          memorized: [
            {
              file: this.spell(Ids.InnateDimensionDoor).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(Ids.SpeakWithPlants).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(Ids.DryadCharm).file,
              memorizedCount: 3,
            },
            {
              file: this.spell(Ids.Entangle).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(Ids.AnimalFriendship).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(Ids.DetectTraps).file,
              memorizedCount: 1,
            },
          ],
        },
        effects: {
          remove: [EffectTypeEnum.CastingTimeModifier, EffectTypeEnum.ProtectionFromSpell],
        },
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYDAGGER, value: 2 }],
      },
    });
    hamadryad.addTrait({
      immunities: ["entangle"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 75,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    hamadryad.setBehavior({
      restHeal: true,
      dialog: ["VAELASA"],
      abilities: [
        this.ability(Ids.InnateDimensionDoor),
        this.ability(Ids.SpeakWithPlants),
        this.ability(Ids.Entangle),
        this.ability(Ids.DryadCharm),
        this.ability(Ids.AnimalFriendship),
        this.ability(Ids.DetectTraps),
      ],
      additionalCodes: [this.dryadTrackTarget(), this.dryadMeleeCondition()],
      customCodes: [
        {
          location: "init",
          type: "insertBefore",
          statements: [
            ...this.dryadWildernessAbilities(),
            ...this.vaelasaFairyQueenCode(),
            ...this.cloakwoodCode(),
          ],
        },
        this.noMeleeUntilForced(),
      ],
    });
    hamadryad.setAdjustments([
      {
        files: [NEW_CREATURES.HamadryadSummon],
        summon: true,
      },
      {
        files: ["WIDRYAD1", "WIDRYAD2"],
        data: { level1: 8 },
      },
      {
        files: ["WQXHAMA"],
        data: { level1: 12, ac: -2, xpv: 3650 },
      },
      {
        files: ["VAELASA"],
        data: { level1: 10 },
      },
      {
        files: ["BDHAMADC"],
        data: { alignment: "NEUTRAL_EVIL" },
      },
    ]);
    return hamadryad;
  }

  /**
   * Nymph
   */
  private nymph() {
    const nymph = this.create({
      monster: MonsterEnum.Nymph,
      name: "monster.fey.name.nymph",
      files: [],
      data: {
        level1: { pnpValue: 3, value: 7, type: "caster" }, // can employ druidical priest spells at 7th ability level
        strength: 10,
        dexterity: 17,
        constitution: 12,
        intelligence: 16,
        wisdom: 12,
        charisma: 19,
        ac: 7,
        apr: 0,
        xpv: 1400,
        alignment: "NEUTRAL_GOOD",
        morale: 7,
        general: "HUMANOID",
        race: "FAIRY",
        class: "DRUID", // FAIRY_NYMPH
        gender: "FEMALE",
        size: "Medium",
        movement: 12,
        immunities: ["fey"],
        items: { remove: ["DAGG01", "B1-6", "DVNYMPH", "ANTIWEB", "DAGG02", "HGNYMPH"] },
        script: { remove: ["BDNYMP01", "NYMPH", "DVNYMPH", "HGNYMPH"] },
        spells: {
          memorized: [
            {
              file: this.spell(Ids.PriestDimensionDoor).file,
              memorizedCount: 1,
            },
            { file: this.spell(Ids.AnimalFriendship).file, memorizedCount: 1 },
            { file: this.spell(Ids.BlindingBeauty).file, memorizedCount: 1 },
            { file: SPELLS.Priest.CureLightWounds.file, memorizedCount: 1 },
            { file: SPELLS.Priest.Bless.file, memorizedCount: 1 },
            { file: SPELLS.Priest.Entangle.file, memorizedCount: 1 },
            { file: SPELLS.Priest.Barkskin.file, memorizedCount: 1 },
            { file: SPELLS.Priest.CharmPersonOrAnimal.file, memorizedCount: 1 },
            { file: SPELLS.Priest.CallLightning.file, memorizedCount: 1 },
            { file: SPELLS.Priest.SummonInsects.file, memorizedCount: 1 },
            { file: SPELLS.Priest.CallWoodlandBeeings.file, memorizedCount: 1 },
          ],
        },
        effects: {
          remove: [EffectTypeEnum.ProtectionFromSpell],
        },
      },
    });
    nymph.addTrait({ immunities: ["magicResistance"] });
    nymph.setAttack({ melee: false });
    nymph.setBehavior({
      abilities: [
        this.ability(Ids.BlindingBeauty),
        this.ability(Ids.PriestDimensionDoor),
        {
          preset: SPELLS.Priest.CallWoodlandBeeings.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.Bless.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.Barkskin.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.CallLightning.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.SummonInsects.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.Entangle.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.CharmPersonOrAnimal.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        this.ability(Ids.AnimalFriendship),
        {
          preset: SPELLS.Priest.CureLightWounds.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
      ],
      additionalCodes: [this.nymphTrackTarget()],
    });
    nymph.setAdjustments([
      {
        files: ["BDNYMP02"],
        data: { alignment: "NEUTRAL_EVIL" },
      },
      {
        files: ["ABELA"],
        data: { spells: { removeMemorized: true } },
      },
      {
        files: ["OHDNYMPH"],
        data: { level1: { pnpValue: 4, value: 7, type: "caster" } },
      },
    ]);
    return nymph;
  }

  /**
   * Sirine
   */
  private sirine() {
    const sirine = this.create({
      monster: MonsterEnum.Sirine,
      name: "monster.fey.name.sirine",
      files: [],
      data: {
        level1: { pnpValue: 5, value: 11, type: "caster" }, // level 11 caster
        strength: 10,
        dexterity: 18,
        constitution: 11,
        intelligence: 13,
        wisdom: 16,
        charisma: 17,
        ac: 3,
        apr: 1,
        xpv: 3000,
        alignment: "NEUTRAL",
        morale: 12,
        general: "HUMANOID",
        race: "FAIRY",
        class: "FAIRY_SIRINE",
        gender: "FEMALE",
        size: "Medium",
        movement: 12,
        immunities: ["fey"],
        items: {
          remove: ["COMPB05", "BOW01", "BOW05", "SIRINE1", "AROW01", "AROW05"],
          equipped: [
            { file: "BOW05", slot: "WEAPON2", undroppable: false },
            {
              file: "AROW10",
              quantity: 10,
              slot: "QUIVER1",
              undroppable: false,
              unstealable: true,
            },
            {
              file: "AROW01",
              quantity: 40,
              slot: "QUIVER2",
              undroppable: false,
              unstealable: true,
            },
            {
              file: "AROW01",
              quantity: 40,
              slot: "QUIVER3",
              undroppable: false,
              unstealable: true,
            },
          ],
        },
        script: {
          remove: ["SIRSPELL", "SIL", "AC#DT30S"],
          edits: [
            {
              files: ["AC#DTSIR"],
              replaces: [['ReallyForceSpellRES("AC#DTSS",NearestEnemyOf(Myself))', "Continue()"]],
            },
          ],
        },
        spells: {
          memorized: [
            { file: this.spell(Ids.CharmSong).file, memorizedCount: 1 },
            { file: this.spell(Ids.FogCloud).file, memorizedCount: 1 },
            { file: SPELLS.Wizard.PolymorphSelf.file, memorizedCount: 1 },
            {
              file: SPELLS.Wizard.ImprovedInvisibility.file,
              memorizedCount: 1,
            },
          ],
        },
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYDAGGER, value: 2 }],
      },
      autoGenerate: {
        savingThrows: {
          level: 11,
          classe: "MAGE",
          bonus: { saveDeath: 2 },
        },
      },
    });
    sirine.addTrait({
      immunities: ["cloudSpells"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 20,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    sirine.addWeapon({
      weapon: {
        stringRef: "monster.fey.weapon.sirineTouch",
        equippedSlot: ["WEAPON1"],
        icon: MonsterItemIconEnum.Fist,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 1,
          diceSize: 3,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 2,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: [
            {
              opcode: EffectTypeEnum.CastSpell,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              castingLevel: 1,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              resource: this.spell(Ids.TouchOfTranquility).file,
            },
          ],
        },
      },
    });
    sirine.setAttack({ ranged: true });
    sirine.setBehavior({
      restHeal: true,
      canPolymorph: true,
      dialog: ["MEIALA", "NTSILUA", "SIL", "LARRIA"],
      abilities: [
        {
          preset: SPELLS.Wizard.ImprovedInvisibility.file,
          spell: {
            type: "force",
            remove: true,
          },
          disableInterrupt: true,
        },
        this.ability(Ids.CharmSong),
        this.ability(Ids.TouchOfTranquility),
        this.ability(Ids.FogCloud),
        ...abilityFactory.polymorphSelf({
          triggers: [
            {
              name: "HaveSpellRES",
              params: [this.spell(Ids.CharmSong).file],
              negation: true,
            },
            {
              name: "HaveSpellRES",
              params: [this.spell(Ids.FogCloud).file],
              negation: true,
            },
            {
              name: "HaveSpellRES",
              params: [SPELLS.Wizard.ImprovedInvisibility.file],
              negation: true,
            },
          ],
        }),
      ],
      customCodes: [
        {
          location: "attack",
          type: "insertBefore",
          statements: [
            {
              comment: "Don't break invisibility when charm is available",
              triggers: [
                {
                  name: "StateCheck",
                  params: [ScriptTarget.myself, "STATE_INVISIBLE"],
                },
                {
                  name: "HaveSpellRES",
                  params: [this.spell(Ids.CharmSong).file],
                },
              ],
              responses: [
                {
                  weight: 100,
                  actions: [{ name: "NoAction" }],
                },
              ],
            },
          ],
        },
      ],
    });
    sirine.setAdjustments([
      { files: ["SIL"], data: { level1: 7 } },
      {
        files: ["AC#DT20S"],
        data: {
          level1: 11,
          xpv: 5000,
          spells: {
            memorized: [{ file: this.spell(Ids.CharmSong).file, memorizedCount: 2 }],
          },
        },
      },
      {
        files: ["ISLSIR", "MEIALA", "CBLNIGHT"],
        data: {
          level1: 11,
          ac: -4,
          apr: 3,
          xpv: 6000,
          spells: {
            memorized: [{ file: this.spell(Ids.CharmSong).file, memorizedCount: 2 }],
          },
        },
      },
      {
        files: ["AC#DT30S"],
        data: {
          items: {
            remove: ["COMPB05", "BOW01", "BOW05", "SIRINE1", "AROW01", "AROW05"],
            equipped: [
              {
                file: "AC#DTAR2",
                quantity: 10,
                slot: "QUIVER1",
                undroppable: false,
                unstealable: true,
              },
              {
                file: "AC#DTAR1",
                quantity: 10,
                slot: "QUIVER2",
                undroppable: false,
                unstealable: true,
              },
            ],
          },
          spells: {
            memorized: [
              { file: SPELLS.Wizard.MirrorImages.file, memorizedCount: 1 },
              { file: SPELLS.Wizard.GreaterMalison.file, memorizedCount: 1 },
            ],
          },
        },
      },
    ]);
    return sirine;
  }

  /**
   * Nereid
   */
  private nereid() {
    const nereid = this.create({
      monster: MonsterEnum.Nereid,
      name: "monster.fey.name.nereid",
      data: {
        level1: 4,
        strength: 9,
        dexterity: 17,
        constitution: 12,
        intelligence: 12,
        wisdom: 12,
        charisma: 18,
        ac: 10,
        apr: 0,
        xpv: 975,
        alignment: "CHAOTIC_NEUTRAL",
        morale: 11,
        general: "HUMANOID",
        race: "FAIRY",
        class: "FAIRY_NEREID",
        gender: "FEMALE",
        size: "Medium",
        movement: 12,
        immunities: ["fey"],
        items: {
          remove: ["WALLPASS", "DAGG01"],
        },
        script: {
          remove: ["BDNEREID", "ULENE"],
        },
      },
    });
    nereid.createAttackEvasion();
    nereid.addTrait({
      description: "monster.fey.trait.nereid",
      immunities: ["magicResistance"],
      effects: [
        {
          opcode: EffectTypeEnum.CastSpellOnCondition,
          condition: "AttackedBy([ANYONE])",
          conditionTarget: CastSpellOnConditionTargetEnum.Myself,
          resource: this.spell(Ids.AttackEvasion).file,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
      ],
    });
    nereid.createBeguilingAura();
    nereid.createDrowningKiss();
    nereid.createVenomSpit();
    nereid.createSummonGiantPoisonousSnake();
    nereid.createWateryFist();
    nereid.setAttack({ melee: false });
    nereid.setBehavior({
      restHeal: true,
      dialog: [],
      abilities: [
        this.ability(Ids.BeguilingAura),
        this.ability(Ids.SummonGiantPoisonousSnake),
        this.ability(Ids.VenomSpit),
        this.ability(Ids.DrowningKiss),
        this.ability(Ids.WateryFist),
      ],
    });
    nereid.setAdjustments([
      { files: ["BDPWATER"], data: { level1: 9, xpv: 3000 } },
      { files: ["RE_MEKRN"], data: { level1: 5 }, stringRef: "monster.fey.name.nereid" },
    ]);
    return nereid;
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
      id: Ids.InnateDimensionDoor,
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
      id: Ids.PriestDimensionDoor,
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
      id: Ids.DryadCharm,
      icon: SPELLS.Wizard.DireCharm.file,
      castingSound: "CAS_M05",
      flags: [SpellFlagEnum.BreakSanctuary],
      type: SpellTypeEnum.Innate,
      castingAnimation: ItemAbilityCastingAnimationEnum.Enchantment,
      primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      level: 1,
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
      id: Ids.SpeakWithPlants,
      description: "monster.fey.ability.speakWithPlants.description",
      icon: "JAFSPKP",
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
          icon: "JAFSPKP",
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
      id: Ids.Entangle,
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
              type: EffectModifierTypeEnum.Increment,
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
      id: Ids.AnimalFriendship,
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
      id: Ids.DetectTraps,
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
      id: Ids.BlindingBeauty,
      description: "monster.fey.ability.blindingBeauty.description",
      type: SpellTypeEnum.Innate,
      icon: SPELLS.Priest.BlindingBeauty.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: {
        renew: 1,
      },
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
          selfTarget: true,
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
      id: Ids.CharmSong,
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
      id: Ids.FogCloud,
      description: "monster.fey.ability.fogCloud.description",
      groups: ["cloud", "blindness"],
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
      id: Ids.TouchOfTranquility,
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

  private dryadTrackTarget(): AdditionalCode {
    const file = this.spell(Ids.DryadCharm).file;
    return {
      location: "trackTargets",
      triggers: [{ name: "HaveSpellRES", params: [file] }],
      actions: [],
    };
  }

  private nymphTrackTarget(): AdditionalCode {
    return {
      location: "trackTargets",
      triggers: [
        {
          name: "Or",
          triggers: [
            {
              name: "HaveSpellRES",
              params: [SPELLS.Priest.CallLightning.file],
            },
            {
              name: "HaveSpellRES",
              params: [SPELLS.Priest.CharmPersonOrAnimal.file],
            },
            {
              name: "HaveSpellRES",
              params: [SPELLS.Priest.SummonInsects.file],
            },
          ],
        },
      ],
      actions: [],
    };
  }

  private dryadWildernessAbilities(): ConditionalStatement[] {
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
                params: [this.spell(Ids.InnateDimensionDoor).file],
              },
              {
                name: "HaveSpellRES",
                params: [this.spell(Ids.DetectTraps).file],
              },
            ],
          },
        ],
        responses: responseFactory.response([
          {
            name: "RemoveSpellRES",
            params: [this.spell(Ids.InnateDimensionDoor).file],
          },
          {
            name: "RemoveSpellRES",
            params: [this.spell(Ids.DetectTraps).file],
          },
          actionFactory.setGlobal(globals.Wilderness, 2),
        ]),
      },
    ];
  }

  private irenicusCode(): ConditionalStatement[] {
    const globals = {
      MinscCharmed: "MinscCharmed",
      HelpDryads: "HelpDryads",
    };
    return [
      {
        comment: "Irenicus' Dungeon specific code",
        triggers: [
          {
            name: "Name",
            params: ["Ulene", ScriptTarget.myself],
          },
          {
            name: "AreaCheck",
            params: ["AR0602"], // Irenicus' Dungeon, first level
          },
          triggerFactory.global(globals.MinscCharmed, 1, "AR0602"),
          triggerFactory.global(globals.HelpDryads, 0, "GLOBAL"),
          { name: "See", params: ["Minsc"], negation: true },
          { name: "Range", params: ["Minsc", 4], negation: true },
        ],
        responses: responseFactory.response([
          {
            name: "ActionOverride",
            params: ["Minsc", "JumpToPoint([4069.1222])"],
          },
        ]),
      },
      {
        triggers: [
          {
            name: "Name",
            params: ["Ulene", ScriptTarget.myself],
          },
          {
            name: "AreaCheck",
            params: ["AR0602"], // Irenicus' Dungeon, first level
          },
          triggerFactory.global(globals.MinscCharmed, 1, "AR0602"),
          triggerFactory.global(globals.HelpDryads, 0, "GLOBAL"),
          { name: "See", params: ["Minsc"] },
          { name: "Range", params: ["Minsc", 4], negation: true },
        ],
        responses: responseFactory.response([
          {
            name: "ActionOverride",
            params: ["Minsc", `MoveToObject("Ulene")`],
          },
        ]),
      },
    ];
  }

  private vaelasaFairyQueenCode(): ConditionalStatement[] {
    const globals = {
      SummonDryads: "SummonDryads",
      VaelasaHostile: "VaelasaHostile",
    };
    return [
      {
        comment: "Vaelasa, the Fairy Queen",
        triggers: [
          {
            name: "Name",
            params: ["VAELASA", ScriptTarget.myself],
          },
          {
            name: "AreaCheck",
            params: ["AR1200"], // Windsper Hills
          },
          triggerFactory.global(globals.SummonDryads, 1, "AR1200"),
        ],
        responses: responseFactory.response([
          actionFactory.setGlobal(globals.SummonDryads, 2, "AR1200"),
          {
            name: "StartCutSceneMode",
          },
          {
            name: "StartCutScene",
            params: ["Cut23a"],
          },
        ]),
      },
      {
        triggers: [
          {
            name: "Name",
            params: ["VAELASA", ScriptTarget.myself],
          },
          {
            name: "AreaCheck",
            params: ["AR0602"], // Irenicus' Dungeon, first level
          },
          { name: "AttackedBy", params: ["GOODCUTOFF", "DEFAULT"] },
          triggerFactory.global(globals.VaelasaHostile, 0, "GLOBAL"),
        ],
        responses: responseFactory.response([
          actionFactory.setGlobal(globals.VaelasaHostile, 1, "GLOBAL"),
          { name: "Enemy" },
        ]),
      },
    ];
  }

  private cloakwoodCode(): ConditionalStatement[] {
    const globals = {
      CloakwoodHamadryad: "rr#hamat",
    };
    return [
      {
        comment: "Cloakwood Hamadryad",
        triggers: [
          triggerFactory.global("rr#chama", 1, "MYAREA"),
          triggerFactory.global(globals.CloakwoodHamadryad, 0),
          { name: "See", params: ["PC"] },
        ],
        responses: responseFactory.response([
          actionFactory.setGlobal(globals.CloakwoodHamadryad, 1),
          { name: "FaceObject", params: ["PC"] },
          {
            name: "DisplayStringHead",
            params: [ScriptTarget.myself, BafExistingStringReference.LeaveMyWood],
          },
        ]),
      },
    ];
  }

  private dryadMeleeCondition(): AdditionalCode {
    return {
      location: "attack",
      triggers: triggerFactory.haveSpellRES([this.spell(Ids.DryadCharm).file], true),
      actions: [],
    };
  }

  private noMeleeUntilForced(): PartialCustomCode {
    return {
      location: "trackTargets",
      type: "insertAfter",
      statements: [
        {
          comment: "Flee from melee unless you have no spells",
          triggers: [
            { name: "ActionListEmpty" },
            ...triggerFactory.haveSpellRES([this.spell(Ids.DryadCharm).file]),
          ],
          responses: responseFactory.response([
            { name: "RunAwayFromNoLeaveArea", params: ["NearestEnemyOf", 45] },
          ]),
        },
      ],
    };
  }

  private whiteQueenHamadryad(): ConditionalStatement[] {
    // IF
    //     Global("HamaBehavior","GLOBAL",0)
    //     See(NearestEnemyOf(Myself))
    // THEN
    //     RESPONSE #100
    //         ApplySpell(Myself,WIZARD_IMPROVED_ALUCRITY)  // SPWI921.SPL (Improved Alacrity)
    //         ApplySpell(Myself,WIZARD_MIRROR_IMAGE)  // SPWI212.SPL (Mirror Image)
    //         ApplySpell(Myself,WIZARD_TRUE_SIGHT)  // SPWI609.SPL (True Seeing)
    //         Spell(NearestEnemyOf(Myself),WIZARD_DIRE_CHARM)  // SPWI316.SPL (Dire Charm)
    //         ForceSpellPoint([1840.1625],WIZARD_DIMENSION_DOOR_DEPRECATED)  // SPWI402.SPL (Dimension Jump)
    //         SetGlobal("HamaBehavior","GLOBAL",1)
    // END
    // IF
    //     Global("HamaBehavior","GLOBAL",1)
    //     See(NearestEnemyOf(Myself))
    // THEN
    //     RESPONSE #100
    //         Spell(NearestEnemyOf(Myself),WIZARD_DIRE_CHARM)  // SPWI316.SPL (Dire Charm)
    //         ForceSpellPoint([1700.1800],WIZARD_DIMENSION_DOOR_DEPRECATED)  // SPWI402.SPL (Dimension Jump)
    //         SetGlobal("HamaBehavior","GLOBAL",2)
    // END
    // IF
    //     Global("HamaBehavior","GLOBAL",2)
    //     See(NearestEnemyOf(Myself))
    // THEN
    //     RESPONSE #100
    //         Spell(NearestEnemyOf(Myself),CLERIC_HOLD_PERSON)  // SPPR208.SPL (Hold Person)
    //         ForceSpellPoint([2000.1500],WIZARD_DIMENSION_DOOR_DEPRECATED)  // SPWI402.SPL (Dimension Jump)
    //         SetGlobal("HamaBehavior","GLOBAL",3)
    // END
    // IF
    //     Global("HamaBehavior","GLOBAL",3)
    //     See(NearestEnemyOf(Myself))
    // THEN
    //     RESPONSE #100
    //         Spell(NearestEnemyOf(Myself),CLERIC_ENTANGLE)  // SPPR105.SPL (Entangle)
    //         ForceSpellPoint([1950.1750],WIZARD_DIMENSION_DOOR_DEPRECATED)  // SPWI402.SPL (Dimension Jump)
    //         SetGlobal("HamaBehavior","GLOBAL",4)
    // END
    // IF
    //     Global("HamaBehavior","GLOBAL",4)
    //     See(NearestEnemyOf(Myself))
    // THEN
    //     RESPONSE #100
    //         Spell(NearestEnemyOf(Myself),CLERIC_ENTANGLE)  // SPPR105.SPL (Entangle)
    //         ForceSpellPoint([2000.1935],WIZARD_DIMENSION_DOOR_DEPRECATED)  // SPWI402.SPL (Dimension Jump)
    //         SetGlobal("HamaBehavior","GLOBAL",5)
    // END
    // IF
    //     Global("HamaBehavior","GLOBAL",5)
    //     See(NearestEnemyOf(Myself))
    // THEN
    //     RESPONSE #100
    //         Spell(NearestEnemyOf(Myself),CLERIC_HOLD_PERSON)  // SPPR208.SPL (Hold Person)
    //         ApplySpell(Myself,WIZARD_MIRROR_IMAGE)  // SPWI212.SPL (Mirror Image)
    //         ForceSpellPoint([2140.1665],WIZARD_DIMENSION_DOOR_DEPRECATED)  // SPWI402.SPL (Dimension Jump)
    //         SetGlobal("HamaBehavior","GLOBAL",6)
    // END
    return [];
  }
}

export const createFeys = () => new FeyFamily();

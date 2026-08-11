import { DEFAULT_SPELL_PROBABILITY, PRESET_NAMES } from "../config/common";
import {
  ATWEAKS_CREATURES,
  GARGANTUAN_CREATURES,
  INCORPOREAL_CREATURES,
} from "../config/creatures";
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
import { AdditionalCode, ConditionalStatement } from "../src/model/script/script";
import { BaseEffect, IdsEffect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
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
}

class Fey extends Creature {}

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
      files: [ATWEAKS_CREATURES.DryadSummon],
      newFiles: [
        {
          files: [ATWEAKS_CREATURES.DryadSummon],
          copyFrom: ATWEAKS_CREATURES.DryadSummon,
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
        items: {},
        script: {
          remove: ["DRYAD"],
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
    dryad.setAttack({ melee: false });
    dryad.setBehavior({
      restHeal: true,
      dialog: ["CDryad", "Ulene", "L#APEST"],
      abilities: [
        this.ability(Ids.InnateDimensionDoor),
        this.ability(Ids.SpeakWithPlants),
        this.ability(Ids.DryadCharm),
      ],
      additionalCodes: [this.dryadTrackTarget()],
      customCodes: [
        {
          location: "init",
          type: "insertBefore",
          statements: [...this.dryadWildernessAbilities(), ...this.irenicusCode()],
        },
      ],
    });
    dryad.setAdjustments([
      {
        files: [ATWEAKS_CREATURES.DryadSummon],
        summon: true,
      },
      {
        files: ["DRYAD", "L#APEST"],
        data: { class: "INNOCENT" },
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
      files: [ATWEAKS_CREATURES.HamadryadSummon],
      newFiles: [
        {
          files: [ATWEAKS_CREATURES.HamadryadSummon],
          copyFrom: ATWEAKS_CREATURES.HamadryadSummon,
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
        items: { remove: ["ANTIWEB"] },
        script: { remove: ["HAMA", "BDHAMADC"] },
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
    hamadryad.setAttack({ melee: false });
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
      additionalCodes: [this.dryadTrackTarget()],
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
      ],
    });
    hamadryad.setAdjustments([
      {
        files: [ATWEAKS_CREATURES.HamadryadSummon],
        summon: true,
      },
      {
        files: ["WIDRYAD1", "WIDRYAD2"],
        data: { level1: 8 },
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
        items: { remove: ["DAGG01", "B1-6"] },
        script: { remove: ["BDNYMP01", "NYMPH"] },
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
        script: { remove: ["SIRSPELL", "SIL"], location: "Race" },
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
      { files: ["ISLSIR"], data: { level1: 11 } },
      { files: ["MEIALA"], data: { level1: 11 } },
    ]);
    return sirine;
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
      icon: "RR#FSPKP",
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
          icon: "RR#FSPKP",
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
      Wilderness: "ja#wilderness",
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
}

export const createFeys = () => new FeyFamily();

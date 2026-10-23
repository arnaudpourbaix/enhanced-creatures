import { MonsterItemIconEnum } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import { CommonProjectileFiles } from "../../spells/projectiles";
import abilityFactory from "../../src/factories/ability.factory";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  CharmTypeEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  ProficiencyTypeEnum,
  SaveTypeEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../src/model/spell-item/spell-protection";
import { StringRefUtils } from "../../src/services/utils/string-ref.utils";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Fey, FeyIds } from "./kin";

class SirineEntry extends CreatureEntry<Fey> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Sirine, kin);
    this.createCharmSong();
    this.createFogCloud();
    this.createTouchOfTranquility();
    this.addCreature(() => this.sirine());
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
              stringRef: StringRefUtils.getString("Feebleminded"),
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

  createCreature(id: MonsterEnum): Fey {
    return new Fey(id);
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
        size: { value: "Medium", tall: true, long: false },
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
            { file: this.spell(FeyIds.CharmSong).file, memorizedCount: 1 },
            { file: this.spell(FeyIds.FogCloud).file, memorizedCount: 1 },
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
              resource: this.spell(FeyIds.TouchOfTranquility).file,
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
        this.ability(FeyIds.CharmSong),
        this.ability(FeyIds.TouchOfTranquility),
        this.ability(FeyIds.FogCloud),
        ...abilityFactory.polymorphSelf({
          triggers: [
            {
              name: "HaveSpellRES",
              params: [this.spell(FeyIds.CharmSong).file],
              negation: true,
            },
            {
              name: "HaveSpellRES",
              params: [this.spell(FeyIds.FogCloud).file],
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
                  params: [this.spell(FeyIds.CharmSong).file],
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
            memorized: [{ file: this.spell(FeyIds.CharmSong).file, memorizedCount: 2 }],
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
            memorized: [{ file: this.spell(FeyIds.CharmSong).file, memorizedCount: 2 }],
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
}

export const createSirineEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SirineEntry(kins.get(KinEnum.Fey));

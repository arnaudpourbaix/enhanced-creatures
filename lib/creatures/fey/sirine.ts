import { MonsterItemIconEnum } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import abilityFactory from "../../src/factories/ability.factory";
import { ScriptTarget } from "../../src/model/constants";
import {
  AbilityDamageTypeEnum,
  EffectCastSpellTypeEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ProficiencyTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Fey, FeyIds } from "./kin";

class SirineEntry extends CreatureEntry<Fey> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Sirine, kin, MonsterFamilyEnum.Fey);
    this.addCreature(() => this.sirine());
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

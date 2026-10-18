import { GARGANTUAN_CREATURES, INCORPOREAL_CREATURES, NEW_CREATURES } from "../../config/creatures";
import { SPELLS } from "../../config/spells/spell-database";
import { BafExistingStringReference } from "../../config/stringRef";
import actionFactory from "../../src/factories/action.factory";
import responseFactory from "../../src/factories/response.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin, kinOf } from "../../src/model/creature/kin";
import { ConditionalStatement } from "../../src/model/script/script";
import { BaseEffect, IdsEffect } from "../../src/model/spell-item/effect";
import {
  EffectBonusToEnum,
  EffectDispelResistanceEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  ProficiencyTypeEnum,
  SaveTypeEnum,
  SpellTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Fey, FeyIds, FeyKin } from "./kin";

class HamadryadEntry extends CreatureEntry<Fey> {
  constructor(private readonly feyKin: FeyKin) {
    super(EntryEnum.Hamadryad, feyKin);
    this.createEntangle();
    this.addCreature(() => this.hamadryad());
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

  createCreature(id: MonsterEnum): Fey {
    return new Fey(id);
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
        size: { value: "Medium", tall: true, long: false },
        movement: 15,
        immunities: ["fey"],
        items: { remove: ["ANTIWEB", "HAMASU", "AROW02"] },
        script: { remove: ["HAMA", "HAMASU", "BDHAMADC", "wqxhama"] },
        spells: {
          memorized: [
            {
              file: this.spell(FeyIds.InnateDimensionDoor).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(FeyIds.SpeakWithPlants).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(FeyIds.DryadCharm).file,
              memorizedCount: 3,
            },
            {
              file: this.spell(FeyIds.Entangle).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(FeyIds.AnimalFriendship).file,
              memorizedCount: 1,
            },
            {
              file: this.spell(FeyIds.DetectTraps).file,
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
        this.ability(FeyIds.InnateDimensionDoor),
        this.ability(FeyIds.SpeakWithPlants),
        this.ability(FeyIds.Entangle),
        this.ability(FeyIds.DryadCharm),
        this.ability(FeyIds.AnimalFriendship),
        this.ability(FeyIds.DetectTraps),
      ],
      additionalCodes: [this.feyKin.dryadTrackTarget(), this.feyKin.dryadMeleeCondition()],
      customCodes: [
        {
          location: "init",
          type: "insertBefore",
          statements: [...this.feyKin.dryadWildernessAbilities(), ...this.cloakwoodCode()],
        },
        this.feyKin.noMeleeUntilForced(),
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

export const createHamadryadEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HamadryadEntry(kinOf(kins, KinEnum.Fey, FeyKin));

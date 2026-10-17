import { NEW_CREATURES } from "../../config/creatures";
import { BafExistingStringReference } from "../../config/stringRef";
import actionFactory from "../../src/factories/action.factory";
import responseFactory from "../../src/factories/response.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { ConditionalStatement } from "../../src/model/script/script";
import {
  EffectStatisticModifierEnum,
  ProficiencyTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Fey, FeyIds, FeyKin } from "./kin";

class HamadryadEntry extends CreatureEntry<Fey> {
  constructor(private readonly feyKin: FeyKin) {
    super(EntryEnum.Hamadryad, feyKin);
    this.addCreature(() => this.hamadryad());
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
  new HamadryadEntry(kins.get(KinEnum.Fey) as FeyKin);

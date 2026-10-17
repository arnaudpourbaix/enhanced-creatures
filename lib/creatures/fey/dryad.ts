import { NEW_CREATURES } from "../../config/creatures";
import { ProficiencyTypeEnum } from "../../src/model/spell-item/effect.enums";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Fey, FeyIds, FeyKin } from "./kin";

class DryadEntry extends CreatureEntry<Fey> {
  constructor(private readonly feyKin: FeyKin) {
    super(EntryEnum.Dryad, feyKin);
    this.addCreature(() => this.dryad());
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
        size: { value: "Medium", tall: true, long: false },
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
        this.ability(FeyIds.InnateDimensionDoor),
        this.ability(FeyIds.SpeakWithPlants),
        this.ability(FeyIds.DryadCharm),
      ],
      additionalCodes: [this.feyKin.dryadTrackTarget(), this.feyKin.dryadMeleeCondition()],
      customCodes: [
        {
          location: "init",
          type: "insertBefore",
          statements: [...this.feyKin.dryadWildernessAbilities()],
        },
        this.feyKin.noMeleeUntilForced(),
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
}

export const createDryadEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new DryadEntry(kins.get(KinEnum.Fey) as FeyKin);

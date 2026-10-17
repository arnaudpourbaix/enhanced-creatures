import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { EffectStatisticModifierEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Dog } from "./kin";

class MoonDogEntry extends CreatureEntry<Dog> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.MoonDog, kin);
    this.addCreature(() => this.moonDog());
  }

  createCreature(id: MonsterEnum): Dog {
    return new Dog(id);
  }

  /**
   * Moon Dog
   */
  private moonDog() {
    const moon = this.create({
      monster: MonsterEnum.MoonDog,
      name: "monster.dog.name.moon",
      files: [],
      data: {
        level1: { pnpValue: 9, type: "caster", value: 12 },
        bonusHp: 3,
        strength: 16,
        dexterity: 15,
        constitution: 16,
        intelligence: 15,
        wisdom: 15,
        charisma: 15,
        ac: 0,
        apr: 1,
        xpv: 9000,
        alignment: "NEUTRAL_GOOD",
        morale: 18,
        general: "ANIMAL",
        race: "DOG",
        class: "DOG_WAR",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 30,
        items: { remove: ["MDOG1", "IMMUNE2", "P3-12M4"] },
        script: { remove: ["moondog", "teldog"] },
        immunities: ["outsider", "extraplanar"],
        spells: {
          memorized: [
            { file: SPELLS.Innate.MoonDogHowl.file, memorizedCount: 1 },
            { file: SPELLS.Innate.MoonDogSight.file, memorizedCount: 1 },
            { file: SPELLS.Innate.HealingLick.file, memorizedCount: 6 },
            { file: SPELLS.Wizard.MirrorImages.file, memorizedCount: 3 },
            { file: SPELLS.Wizard.Darkness15Radius.file, memorizedCount: 10 },
            { file: SPELLS.Wizard.DetectInvisibility.file, memorizedCount: 10 },
            { file: SPELLS.Wizard.ImprovedInvisibility.file, memorizedCount: 10 },
            { file: SPELLS.Wizard.NonDetection.file, memorizedCount: 1 },
            { file: SPELLS.Wizard.Shades.file, memorizedCount: 10 },
            { file: SPELLS.Wizard.DancingLights.file, memorizedCount: 10 },
            { file: SPELLS.Priest.DetectEvil.file, memorizedCount: 10 },
            // TODO: Wall of Fog
          ],
        },
      },
      autoGenerate: {
        savingThrows: {
          bonus: {
            saveBreath: 2,
            saveDeath: 2,
            savePolymorph: 2,
            saveSpell: 2,
            saveWand: 2,
          },
        },
      },
    });
    moon.createJaws({ diceThrown: 3, diceSize: 4 });
    moon.addTrait({
      immunities: ["backstab", "infravision", "plusOneWeapons", "fear"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          type: EffectStatisticModifierEnum.Increment,
          value: 25,
        },
        ...effectFactory.physicalResistance(38),
      ],
    });
    // Moon dogs prefer to attack with their keening howl.
    // This baying is harmful to evil creatures only.
    // Any evil creature within an 80-foot radius of a baying moon dog is affected as by a fear spell cast at 12th-level of magic use.
    // The howling will also cause 5-8 points of damage per round to evil creatures within 40 feet.
    // Moon dogs can whine to dispel illusions or bark to dispel evil, once per round
    // Moon dogs can become ethereal and have the ability to travel in the ethereal and Astral plane at will.
    return moon;
  }
}

export const createMoonDogEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new MoonDogEntry(kins.get(KinEnum.Dog));

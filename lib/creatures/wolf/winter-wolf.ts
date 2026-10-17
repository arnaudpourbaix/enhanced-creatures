import effectFactory from "../../src/factories/effect.factory";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Wolf, WolfIds } from "./kin";

class WinterWolfEntry extends CreatureEntry<Wolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WinterWolf, kin);
    this.addCreature(() => this.winter());
  }

  createCreature(id: MonsterEnum): Wolf {
    return new Wolf(id);
  }

  /**
   * Winter Wolf
   */
  private winter() {
    const winter = this.create({
      monster: MonsterEnum.WinterWolf,
      name: "monster.wolf.name.winter",
      files: [],
      data: {
        level1: 6,
        strength: 18,
        dexterity: 13,
        constitution: 14,
        intelligence: 9,
        wisdom: 12,
        charisma: 8,
        ac: 5,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL_EVIL",
        morale: 13,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_WINTER",
        gender: "MALE",
        size: { value: "Large", tall: false, long: true },
        movement: 18,
        immunities: ["magicalBeast"],
        items: {
          remove: ["WOLFWI1", "WOLFWI2"],
        },
        script: {
          remove: ["WNTRWOLF"],
        },
      },
    });
    winter.addTrait({
      immunities: ["cold"],
      effects: effectFactory.fireResistance(-10),
    });
    winter.createStreamOfFrost();
    winter.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    winter.setBehavior({ abilities: [this.ability(WolfIds.StreamOfFrost)] });
    return winter;
  }
}

export const createWinterWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WinterWolfEntry(kins.get(KinEnum.Wolf));

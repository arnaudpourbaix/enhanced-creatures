import effectFactory from "../../src/factories/effect.factory";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem, GolemIds } from "./kin";

class IronGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.IronGolem, kin, MonsterFamilyEnum.Golem);
    this.addCreature(() => this.iron());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Iron Golem
   */
  private iron() {
    const iron = this.create({
      monster: MonsterEnum.IronGolem,
      name: "monster.golem.name.iron",
      files: [],
      data: {
        level1: 18,
        strength: 24,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 3,
        apr: 1,
        xpv: 13000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_IRON",
        gender: "NIETHER",
        animation: ["GOLEM_IRON_IWD"],
        size: { value: "Large", tall: true, long: false },
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLIRO", "IRONGOL", "IMMUNE3", "HELMNOAN"],
        },
        script: {
          remove: ["GOLIRO01"],
        },
      },
    });
    iron.addTrait({
      immunities: ["magic", "plusTwoWeapons", "lightning"],
      effects: effectFactory.fireResistance(125),
    });
    iron.createCloudOfPoisonousGas();
    iron.createFists({ diceThrown: 4, diceSize: 10 });
    iron.setBehavior({
      restHeal: true,
      abilities: [this.ability(GolemIds.CloudOfPoisonousGas)],
    });
    iron.setAdjustments([
      {
        files: ["OHBBANNO"],
        data: {
          level1: 30,
          script: { location: "None" },
          //TODO: need to keep effects 293, 101, 267
          // resistances: physical 90%, cold 100%, fire: 127%, acid: 100%
        },
      },
    ]);
    return iron;
  }
}

export const createIronGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new IronGolemEntry(kins.get(KinEnum.Golem));

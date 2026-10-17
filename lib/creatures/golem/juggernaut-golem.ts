import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem, GolemIds } from "./kin";

class JuggernautGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.JuggernautGolem, kin, MonsterFamilyEnum.Golem);
    this.addCreature(() => this.juggernaut());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Juggernaut Golem
   */
  private juggernaut() {
    const juggernaut = this.create({
      monster: MonsterEnum.JuggernautGolem,
      name: "monster.golem.name.juggernaut",
      files: [],
      data: {
        level1: 18,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 2,
        apr: 2,
        xpv: 11000,
        alignment: "NEUTRAL",
        morale: 16,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        animation: ["GOLEM_IRON"],
        gender: "NIETHER",
        size: { value: "Large", tall: true, long: false },
        movement: 3,
        immunities: ["construct"],
        items: {
          remove: ["IRONGOL", "IMMUNE1", "IMMUNE2", "GOLTOME4"],
        },
        script: {
          remove: ["GOLSTO01", "GOLIRO01", "TOMEGOL4"],
        },
      },
    });
    juggernaut.addTrait({ immunities: ["magic", "fire"] });
    juggernaut.createCharge();
    juggernaut.createFists({ diceThrown: 2, diceSize: 6 });
    juggernaut.setBehavior({
      restHeal: true,
      abilities: [this.ability(GolemIds.Charge)],
    });
    return juggernaut;
  }
}

export const createJuggernautGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new JuggernautGolemEntry(kins.get(KinEnum.Golem));

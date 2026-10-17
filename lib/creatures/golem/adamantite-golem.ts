import effectFactory from "../../src/factories/effect.factory";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem } from "./kin";

class AdamantiteGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.AdamantiteGolem, kin, MonsterFamilyEnum.Golem);
    this.addCreature(() => this.adamantite());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Adamantite Golem
   */
  private adamantite() {
    const adamantite = this.create({
      monster: MonsterEnum.AdamantiteGolem,
      name: "monster.golem.name.adamantite",
      files: [],
      data: {
        level1: 18,
        strength: 24,
        dexterity: 10,
        constitution: 25,
        intelligence: 3,
        wisdom: 16,
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
        size: { value: "Large", tall: true, long: false },
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLIRO", "IRONGOL", "IMMUNE3"],
        },
      },
    });

    adamantite.addTrait({
      immunities: ["plusTwoWeapons", "magic", "lightning", "cold", "acid"],
      effects: [...effectFactory.fireResistance(125), ...effectFactory.physicalResistance(90)],
    });
    // TODO: create Trample, 2 uses per day (see golem's mod)
    adamantite.createFists({ diceThrown: 4, diceSize: 10 });
    adamantite.setBehavior({
      restHeal: true,
      // abilities: [this.ability(GolemIds.CloudOfPoisonousGas)],
    });
    return adamantite;
  }
}

export const createAdamantiteGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new AdamantiteGolemEntry(kins.get(KinEnum.Golem));

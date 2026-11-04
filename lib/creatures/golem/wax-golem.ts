import effectFactory from "../../src/factories/effect.factory";
import { SaveTypeEnum } from "../../src/model/spell-item/effect.enums";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem } from "./kin";

class WaxGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WaxGolem, kin);
    this.addCreature(() => this.wax());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Wax Golem
   */
  private wax() {
    const wax = this.create({
      monster: MonsterEnum.WaxGolem,
      name: "monster.golem.name.wax",
      files: [],
      data: {
        level1: 8,
        strength: 18,
        exceptionalStrength: 90,
        dexterity: 9,
        constitution: 18,
        intelligence: 9,
        wisdom: 11,
        charisma: 1,
        ac: 4,
        apr: 1,
        xpv: 5000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_FLESH",
        gender: "NIETHER",
        size: { value: "Medium", tall: true, long: false },
        movement: 12,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "IMMUNE1"],
        },
      },
    });
    wax.addTrait({
      immunities: ["magic", "lightning", "cold"],
      effects: effectFactory.fireResistance(-30),
    });
    wax.createFists({
      diceThrown: 2,
      diceSize: 6,
      effects: effectFactory.levelDrain({ levels: 1, saveType: SaveTypeEnum.ParalyzePoisonDeath }),
    });
    wax.setBehavior({
      restHeal: true,
    });
    return wax;
  }
}

export const createWaxGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WaxGolemEntry(kins.get(KinEnum.Golem));

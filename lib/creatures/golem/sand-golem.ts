import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem } from "./kin";

class SandGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.SandGolem, kin);
    this.addCreature(() => this.sand());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Sand Golem
   */
  private sand() {
    const sand = this.create({
      monster: MonsterEnum.SandGolem,
      name: "monster.golem.name.sand",
      files: [],
      data: {
        level1: 8,
        strength: 16,
        dexterity: 12,
        constitution: 16,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 3,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_FLESH",
        gender: "NIETHER",
        size: { value: "Large", tall: true, long: false },
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "GOLCLA"],
        },
      },
    });
    sand.addTrait({
      // immune to all transmutation spells
      // immune to any spells cast by creatures of less than 3rd level
      immunities: [],
      effects: [],
    });
    // Suffocate a victim within themselves.
    // On any attack roll that hits a foe, a save versus paralysis must be made.
    // Failure indicates that the target has been drawn into the body of the golem.
    // If this happens, the target takes 2d10 points of damage
    // and then an additional 1d10 points each subsequent round until it dies.
    // Breaking free of a sand golem's suffocation requires a Strength check at a -5 penalty.
    sand.createFists({ diceThrown: 2, diceSize: 6 });
    sand.setBehavior({
      restHeal: true,
    });
    sand.setAdjustments([]);
    return sand;
  }
}

export const createSandGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SandGolemEntry(kins.get(KinEnum.Golem));

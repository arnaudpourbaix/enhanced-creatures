import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem } from "./kin";

class MagicGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.MagicGolem, kin, MonsterFamilyEnum.Golem);
    this.addCreature(() => this.magic());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Magic Golem
   */
  private magic() {
    const magic = this.create({
      monster: MonsterEnum.MagicGolem,
      name: "monster.golem.name.magic",
      files: [],
      data: {
        level1: 8,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: -2,
        apr: 1,
        xpv: 8000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_CLAY",
        gender: "NIETHER",
        size: { value: "Large", tall: true, long: false },
        movement: 18,
        immunities: ["construct"],
        items: {
          remove: ["GOLMAG01"],
        },
        script: {
          remove: ["GOLMAG01", "O#LLENEM"],
        },
      },
    });
    magic.addTrait({
      immunities: ["magic", "fire", "cold", "lightning", "acid", "magicalWeapons"],
    });
    // TODO:
    // Magic golems absorb all magical energy within a 20-foot radius.
    // Spells are instantly absorbed as they are cast.
    // Running spells are terminated and absorbed at the end of one round,
    // with the two exceptions noted below.
    // Charged magical items lose 1d6 charges per round.
    // magic.createWildMagicFlare();
    magic.createMagicalBlast();
    magic.setBehavior({
      restHeal: true,
      //abilities: [this.ability(GolemIds.WildMagicFlare)],
    });
    magic.setAdjustments([]);
    return magic;
  }
}

export const createMagicGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new MagicGolemEntry(kins.get(KinEnum.Golem));

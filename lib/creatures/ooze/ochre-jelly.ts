import { EffectDamageTypeEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime } from "./kin";

class OchreJellyEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.OchreJelly, kin, MonsterFamilyEnum.Ooze);
    this.addCreature(() => this.ochreJelly());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Ochre Jelly
   */
  private ochreJelly() {
    const ochre = this.create({
      monster: MonsterEnum.OchreJelly,
      name: "monster.slime.name.ochre",
      files: [],
      data: {
        level1: 6,
        thac0: 15,
        strength: 15,
        dexterity: 6,
        constitution: 14,
        intelligence: 1,
        wisdom: 6,
        charisma: 1,
        ac: 8,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "SLIME",
        class: "OCRE_JELLY",
        animation: "SLIME_OCHRE",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 3,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "JELLOC1", "DW#JELOC"],
        },
      },
    });
    ochre.addTrait({
      immunities: ["lightning"],
      // 5e: Damage Resistances: Acid. Damage Immunities: Slashing
    });
    ochre.createPseudopod({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 1,
          diceSize: 10,
          amount: 2,
        },
      ],
    });
    ochre.setBehavior({
      restHeal: true,
    });
    return ochre;
  }
}

export const createOchreJellyEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new OchreJellyEntry(kins.get(KinEnum.Ooze));

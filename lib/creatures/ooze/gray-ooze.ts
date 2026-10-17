import { EffectDamageTypeEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime } from "./kin";

class GrayOozeEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.GrayOoze, kin);
    this.addCreature(() => this.grayOoze());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Gray Ooze
   */
  private grayOoze() {
    const gray = this.create({
      monster: MonsterEnum.GrayOoze,
      name: "monster.slime.name.gray",
      files: [],
      data: {
        level1: 3,
        bonusHp: 3,
        thac0: 17,
        strength: 12,
        dexterity: 6,
        constitution: 16,
        intelligence: 1,
        wisdom: 6,
        charisma: 2,
        ac: 8,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 1,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "OOZEGR1", "DW#OOZEG", "DW#JELGR"],
        },
      },
    });
    // 5e:
    // Acid (Ex): A gray ooze secretes a digestive acid that quickly dissolves organic material and metal, but not stone. Any melee hit or constrict attack deals acid damage. Armor or clothing dissolves and becomes useless immediately unless it succeeds on a DC 16 Reflex save. A metal or wooden weapon that strikes a gray ooze also dissolves immediately unless it succeeds on a DC 16 Reflex save. The save DCs are Constitution-based.
    // The ooze’s acidic touch deals 16 points of damage per round to wooden or metal objects, but the ooze must remain in contact with the object for 1 full round to deal this damage.
    // Constrict (Ex): A gray ooze deals automatic slam and acid damage with a successful grapple check. The opponent’s clothing and armor take a –4 penalty on Reflex saves against the acid.
    // Improved Grab (Ex): To use this ability, a gray ooze must hit with its slam attack. It can then attempt to start a grapple as a free action without provoking an attack of opportunity. If it wins the grapple check, it establishes a hold and can constrict.
    gray.addTrait({
      // Spells have no effect on this monster, nor do fire- or cold-based attacks. Lightning and blows from weapons cause full damage.
      // Note that weapons striking a gray ooze may corrode and break.
      immunities: ["magic", "fire", "cold"],
    });
    gray.createPseudopod({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 2,
          diceSize: 8,
        },
      ],
    });
    gray.setBehavior({
      restHeal: true,
    });
    return gray;
  }
}

export const createGrayOozeEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new GrayOozeEntry(kins.get(KinEnum.Ooze));

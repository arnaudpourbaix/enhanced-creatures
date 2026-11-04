import { EffectStatisticModifierEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Golem } from "./kin";

class FleshGolemEntry extends CreatureEntry<Golem> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.FleshGolem, kin);
    this.addCreature(() => this.flesh());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Flesh Golem
   */
  private flesh() {
    const flesh = this.create({
      monster: MonsterEnum.FleshGolem,
      name: "monster.golem.name.flesh",
      files: [],
      data: {
        level1: 9,
        strength: 19,
        dexterity: 9,
        constitution: 18,
        intelligence: 3,
        wisdom: 10,
        charisma: 5,
        ac: 9,
        apr: 2,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_FLESH",
        gender: "NIETHER",
        size: { value: "Large", tall: true, long: false },
        animation: ["A7!GOLEM_FLESH_PST", "OGRILLON"],
        movement: 8,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "GOLCLA", "IMMUNE1", "B2-16"],
        },
      },
    });
    flesh.addTrait({
      immunities: ["magic", "fire", "cold", "nonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    flesh.createFists({ diceThrown: 2, diceSize: 8 });
    flesh.setBehavior({
      restHeal: true,
    });
    flesh.setAdjustments([
      {
        files: ["ARNGOL01", "IGOLFLE1", "IGOLFLE2", "IGOLFLE3", "IGOLFLE4", "BDGOLEMF"],
        stringRef: "monster.golem.name.flesh",
      },
    ]);
    return flesh;
  }
}

export const createFleshGolemEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new FleshGolemEntry(kins.get(KinEnum.Golem));

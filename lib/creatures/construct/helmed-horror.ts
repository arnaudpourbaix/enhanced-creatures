import { ProficiencyTypeEnum } from "../../src/model/spell-item/effect.enums";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin, kinOf } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Construct, ConstructIds, ConstructKin } from "./kin";

class HelmedHorrorEntry extends CreatureEntry<Construct> {
  constructor(private readonly constructKin?: ConstructKin) {
    super(EntryEnum.HelmedHorror, constructKin);
    this.addCreature(() => {
      const creature = this.helmedHorror();
      if (this.constructKin) this.constructKin.helmedHorror = creature;
      return creature;
    });
  }

  createCreature(id: MonsterEnum): Construct {
    return new Construct(id);
  }

  /**
   * Helmed Horror
   */
  private helmedHorror() {
    const helmedHorror = this.create({
      monster: MonsterEnum.HelmedHorror,
      name: "monster.construct.name.helmedHorror",
      files: [],
      data: {
        level1: 4,
        bonusHp: 10,
        strength: 18,
        dexterity: 13,
        constitution: 9,
        intelligence: 14,
        wisdom: 10,
        charisma: 10,
        ac: 2,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "MONSTER",
        race: "GOLEM",
        class: "FIGHTER",
        gender: "NIETHER",
        size: { value: "Medium", tall: true, long: false },
        animation: "DOOM_GUARD",
        hairColor: 63,
        armorColor: 63,
        skinColor: 63,
        majorColor: 63,
        metalColor: 63,
        minorColor: 63,
        leatherColor: 63,
        movement: 12,
        items: {
          remove: [
            "HELM08",
            "HELM01",
            "SHLD18",
            "RING95",
            "RING98",
            "BLUN08",
            "FBLADE",
            "PLAT07",
            "HELM13",
          ],
        },
        immunities: ["construct"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 }],
      },
    });
    helmedHorror.addTrait({
      immunities: [
        "seeInvisible",
        "fireballSpell",
        "lightningBoltSpell",
        "flameArrowSpell",
        "magicMissile",
        "hover",
      ],
    });
    helmedHorror.equipItem(this.item(ConstructIds.FlamingSword));
    helmedHorror.equipItem(this.item(ConstructIds.Armor));
    helmedHorror.equipItem(this.item(ConstructIds.Helmet));
    helmedHorror.setBehavior({
      restHeal: true,
    });
    return helmedHorror;
  }
}

export const createHelmedHorrorEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HelmedHorrorEntry(kinOf(kins, KinEnum.Construct, ConstructKin));

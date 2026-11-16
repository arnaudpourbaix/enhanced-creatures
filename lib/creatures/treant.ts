import { NEW_CREATURES } from "../config/creatures";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { InputCreatureData } from "../src/model/creature/data-input";
import { CreatureEntry } from "../src/model/creature/entry";
import { VariantInput } from "../src/model/creature/variant";
import { TranslationKey } from "../translations/i18n";
import { EntryEnum } from "./entry";
import { MonsterEnum } from "./monster";

class Plant extends Creature {
  createBranch(diceThrown: number, diceSize: number, equip = false) {
    return this.addNaturalWeapon("branch", {
      diceThrown,
      diceSize,
      speed: 8,
      range: 5,
      slot: equip ? "WEAPON1" : null,
    });
  }

  /** A smaller treant's branch, as variant data */
  branch(diceThrown: number, diceSize: number): InputCreatureData {
    const file = this.createBranch(diceThrown, diceSize).file;
    return { items: { equipped: [{ file, slot: "WEAPON1" }] } };
  }
}

/** Template CRE shipped in the treant assets, copied to every treant the mod creates */
const TEMPLATE_CRE = "jacm1904";

/** A summonable treant the mod creates (Call Woodland Beings), as variant input */
function summoned(file: string, stringRef: TranslationKey): VariantInput {
  return {
    newFiles: [{ files: [file], copyFrom: TEMPLATE_CRE, stringRef }],
    adjust: [{ files: [file], summon: true }],
  };
}

class TreantEntry extends CreatureEntry<Plant> {
  constructor() {
    super(EntryEnum.Treant);
    this.addCreature(() => this.treant());
  }

  createCreature(id: MonsterEnum): Plant {
    return new Plant(id);
  }

  /**
   * Treant
   */
  private treant() {
    const treant = this.create({
      monster: MonsterEnum.Treant,
      name: "monster.treant.name.treant",
      files: [NEW_CREATURES.Treant11hd],
      newFiles: [
        {
          files: [NEW_CREATURES.Treant11hd],
          copyFrom: TEMPLATE_CRE,
          stringRef: "monster.treant.name.hd11",
        },
      ],
      data: {
        level1: 11,
        strength: 23,
        dexterity: 8,
        constitution: 21,
        intelligence: 12,
        wisdom: 16,
        charisma: 12,
        ac: 0,
        apr: 2,
        xpv2e: 6000,
        alignment: "CHAOTIC_GOOD",
        morale: 16,
        general: "PLANT",
        race: "TREANT",
        class: "NO_CLASS",
        gender: "NIETHER",
        size: { value: "Huge", tall: true, long: false },
        movement: 12,
        immunities: ["plant"],
        items: {
          remove: ["BDTREANT", "BDPLANT", "IPSION", "cbtreant", "golsto", "immune1", "ring95"],
        },
      },
    });
    // Elder treant (11-12 HD, 4d6) is the base; younger ones are variants.
    treant.createBranch(4, 6, true);
    treant.setAdjustments([
      { files: [NEW_CREATURES.Treant11hd], summon: true },
      { files: ["L0TREE"], data: { level1: 12, alignment: "CHAOTIC_EVIL" } },
    ]);
    treant.variant("middle-aged treant", {
      files: ["BDTREANT", "WITREANT"],
      ...summoned(NEW_CREATURES.Treant9hd, "monster.treant.name.hd9"),
      data: { level1: 9, strength: 21, constitution: 20, ...treant.branch(3, 6) },
      adjust: [{ files: ["BDTREANT"], data: { alignment: "CHAOTIC_EVIL" } }],
    });
    treant.variant("young treant", {
      ...summoned(NEW_CREATURES.Treant7hd, "monster.treant.name.hd7"),
      data: { level1: 7, strength: 20, constitution: 20, ...treant.branch(2, 8) },
    });
    // Below the PnP range (young treants start at 7 HD): Call Woodland Beings' weakest summon
    treant.variant("sapling treant", {
      ...summoned(NEW_CREATURES.Treant5hd, "monster.treant.name.hd5"),
      data: { level1: 5, strength: 19, constitution: 19, ...treant.branch(2, 6) },
    });
    treant.addTrait({
      effects: effectFactory.fireResistance(-25),
    });
    return treant;
  }
}

export const createTreantEntry = () => new TreantEntry();

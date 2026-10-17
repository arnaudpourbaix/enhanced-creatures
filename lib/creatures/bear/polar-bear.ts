import { ScriptTarget } from "../../src/model/constants";
import { CustomCode } from "../../src/model/script/script";
import { customCodes } from "../common";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Bear, BearIds } from "./kin";

class PolarBearEntry extends CreatureEntry<Bear> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.PolarBear, kin, MonsterFamilyEnum.Bear);
    this.addCreature(() => this.polar());
  }

  createCreature(id: MonsterEnum): Bear {
    return new Bear(id);
  }

  /**
   * Polar Bear
   */
  private polar() {
    const polar = this.create({
      monster: MonsterEnum.PolarBear,
      name: "monster.bear.name.polar",
      files: [],
      data: {
        level1: 8,
        bonusHp: 8,
        specialBonusHp: 12,
        strength: 20,
        dexterity: 10,
        constitution: 16,
        intelligence: 4,
        wisdom: 13,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_POLAR",
        gender: "NIETHER",
        size: { value: "Huge", tall: false, long: true },
        movement: 12,
        items: {
          remove: [
            "B1-12",
            "B1-12M3",
            "BEARPO",
            "BEARPOSU",
            "KALDW1",
            "IMMUNE1",
            "RING95",
            "BEARSPIR",
          ],
        },
        script: {
          remove: ["CBEAR", "BEAR", "kaldran", "gnsummm"],
        },
        immunities: ["coldResistance", "animal"],
      },
    });
    polar.createPaws(1, 10, { diceThrown: 3, diceSize: 6 });
    polar.createJaws(2, 6);
    polar.setBehavior({
      walk: true,
      abilities: [this.ability(BearIds.ImprovedStreamOfFrost)],
      customCodes: [customCodes.wildAnimalsTurningHostile, this.kaldran],
    });
    polar.setAdjustments([
      { files: ["BDGHBRSU"], data: { level1: 9 } },
      {
        files: ["KALDRAN"],
        data: {
          level1: 12,
          intelligence: 10,
          morale: 15,
          immunities: ["cold", "coldSpells"],
          spells: {
            memorized: [
              {
                file: this.spell(BearIds.ImprovedStreamOfFrost).file,
                memorizedCount: 1,
              },
            ],
          },
        },
      },
      {
        files: ["BEARPO01", "D9ARPO01", "NTBEARPO", "OBSICE04"],
        stringRef: "monster.bear.name.polar",
      },
      // {
      //   files: ["SPIRBEAR"],
      //   data: {
      //     level1: 10,
      //     immunities: ["incorporeal"],
      //     //TODO: ghost fear aura
      //   },
      // },
    ]);
    return polar;
  }

  kaldran: CustomCode = {
    location: "init",
    type: "insertAfter",
    statements: [
      {
        triggers: [
          { name: "Name", params: ["kaldran", ScriptTarget.myself] },
          { name: "Global", params: ["Kaldran", "GLOBAL", 0] },
          { name: "See", params: ["NearestEnemyOf"] },
          { name: "See", params: ["PC"] },
        ],
        responses: [
          {
            weight: 100,
            actions: [{ name: "SetGlobal", params: ["Kaldran", "GLOBAL", 1] }],
          },
        ],
      },
    ],
    abilities: [],
  };
}

export const createPolarBearEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new PolarBearEntry(kins.get(KinEnum.Bear));

import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Wolf } from "./kin";

class VampiricWolfEntry extends CreatureEntry<Wolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.VampiricWolf, kin, MonsterFamilyEnum.Wolf);
    this.addCreature(() => this.vampiric());
  }

  createCreature(id: MonsterEnum): Wolf {
    return new Wolf(id);
  }

  /**
   * Vampiric Wolf
   */
  private vampiric() {
    const vampiric = this.create({
      monster: MonsterEnum.VampiricWolf,
      name: "monster.wolf.name.vampiric",
      files: [],
      notEnforceFiles: ["DW#ULCWO"],
      data: {
        level1: 6,
        bonusHp: 4,
        strength: 18,
        dexterity: 13,
        constitution: 9,
        intelligence: 6,
        wisdom: 12,
        charisma: 7,
        ac: 2,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL_EVIL",
        morale: 14,
        general: "UNDEAD",
        race: "WOLF",
        class: "WOLF_VAMPIRIC",
        gender: "MALE",
        size: { value: "Small", tall: false, long: true },
        movement: 24,
        items: {
          remove: ["WOLFVA1", "BDWOLFVA", "IMMUNE1", "RING95"],
        },
        script: {
          remove: ["VAMPWOLF"],
        },
      },
    });
    vampiric.createVampiricJaws({ slot: "WEAPON1" });
    vampiric.createVampiricJaws({
      slot: "WEAPON2",
      grab: {
        onlyGrabProneTarget: true,
        rounds: 5,
      },
      doc: false,
    });
    vampiric.createVampiricJaws({
      slot: "WEAPON3",
      bonusToHit: 30,
      doc: false,
    });
    vampiric.addTrait({
      immunities: ["undead", "nonSilverNonMagicalWeapons"],
    });
    vampiric.setAttack({
      // A bite attack will cause a running or standing victim to fall if the victim fails a saving throw vs. paralysis.
      // Once the prey falls, the wolves continue to attack, shifting to the victim's arms so that he can no longer use a weapon.
      // This involves a called-shot attack in which a vampiric wolf has a -4 penalty to hit;
      // success means the wolf has grasped an arm in its mouth, and the victim cannot get free unless he makes a successful Strength check (one attempt per round).
      // Once a grasping bite is made, damage is continually inflicted each round as the wolf gnaws on the limb.
      targetPriorities: [{ status: ["Grabbed", "Sleep"] }],
      defaultWeaponSlot: "WEAPON1",
      targetStatusWeaponSlot: [
        { status: ["Sleep"], slot: "WEAPON2" },
        { status: ["Grabbed"], slot: "WEAPON3" },
      ],
    });
    vampiric.setAdjustments([{ files: ["DW#ULCWO"], data: { level1: 15 } }]);
    return vampiric;
  }
}

export const createVampiricWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new VampiricWolfEntry(kins.get(KinEnum.Wolf));

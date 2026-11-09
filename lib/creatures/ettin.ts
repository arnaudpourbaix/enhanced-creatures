import { Creature } from "../src/model/creature/creature";
import { CreatureEntry } from "../src/model/creature/entry";
import { ItemSlot } from "../src/model/creature/item";
import { CreatureKin, kinOf } from "../src/model/creature/kin";
import {
  AbilityDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ItemAnimationEnum,
  ItemCategoryEnum,
  ItemFlagEnum,
  ProficiencyTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EntryEnum } from "./entry";
import { KinEnum } from "./kin";
import { MonsterEnum } from "./monster";
import { createRevenantGrip, RevenantKin, revenantNature } from "./revenant/kin";

enum Ids {
  RevenantGrip = 1,
}

class Ettin extends Creature {
  /**
   * Large Spiked Club
   */
  createLargeSpikedClub(p: { diceThrown: number; diceSize: number; slot: ItemSlot }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.ettin.weapon.largeSpikedClub",
        equippedSlot: [p.slot],
        flags: [ItemFlagEnum.Displayable],
        animation: ItemAnimationEnum.Club,
        category: ItemCategoryEnum.Clubs,
        icon: "IBLUN13",
        proficiency: ProficiencyTypeEnum.PROFICIENCYCLUB,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          animationSwing: { backhand: 50, overhand: 50, thrust: 0 },
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 8,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }
}

class EttinEntry extends CreatureEntry<Ettin> {
  constructor(private readonly revenantKin: RevenantKin) {
    super(EntryEnum.Ettin, revenantKin);
    this.addCreature(() => this.ettin());
  }
  createCreature(id: MonsterEnum): Ettin {
    return new Ettin(id);
  }
  /**
   * Ettin
   */
  private ettin() {
    const ettin = this.create({
      monster: MonsterEnum.Ettin,
      name: "monster.ettin.name",
      files: [],
      data: {
        level1: 10,
        strength: 21,
        dexterity: 8,
        constitution: 17,
        intelligence: 7,
        wisdom: 10,
        charisma: 8,
        ac: 3,
        apr: 2,
        xpv2e: 3000,
        alignment: "CHAOTIC_EVIL",
        morale: 14,
        general: "GIANTHUMANOID",
        race: "ETTIN",
        class: "GIANT",
        gender: "NIETHER",
        size: { value: "Huge", tall: true, long: false },
        movement: 12,
        items: {
          remove: ["BDRINGGE", "B2-16", "ETTIN", "B1-12M3", "B3-12", "BDBLUNGH"],
        },
      },
    });
    ettin.createLargeSpikedClub({
      diceThrown: 3,
      diceSize: 6,
      slot: "WEAPON1",
    });
    ettin.createLargeSpikedClub({ diceThrown: 2, diceSize: 8, slot: "SHIELD" });
    ettin.addTrait({
      immunities: ["backstab", "giant"],
    });
    ettin.setBehavior({
      restHeal: true,
      abilities: [],
    });
    ettin.setAdjustments([
      { files: ["PLSHFG01", "PLSHFG02", "SAHOTY01", "D0QPSY10"], data: { level1: 12 } },
      {
        files: ["BDETTIN"],
        data: { immunities: ["undead", "incorporeal"], script: { location: "None" } },
      },
    ]);
    this.revenant(ettin);
    return ettin;
  }

  /**
   * Ettin revenant (SotSC, the cave under the Ormyr graveyard): an ettin's body risen as a
   * revenant. Its body stays an ettin's (Hit Dice, size, strength, the club in its main hand); the
   * revenant brings its undead nature (d12 Hit Dice), regeneration, immunities and paralyzing
   * gaze. Being huge, it grips with its off hand and keeps striking with the club (user).
   */
  private revenant(ettin: Ettin) {
    const nature = revenantNature(this.revenantKin);
    const grip = createRevenantGrip(ettin, { id: Ids.RevenantGrip, slot: null, freeHand: true });
    ettin.variant("ettin revenant", {
      files: ["L#ORMETT"],
      data: {
        ...nature,
        items: {
          equipped: [...(nature.items?.equipped ?? []), { file: grip.file, slot: "SHIELD" }],
        },
      },
      behavior: { abilities: { entries: [{ power: this.revenantKin.gaze }] } },
    });
  }
}

export const createEttinEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new EttinEntry(kinOf(kins, KinEnum.Revenant, RevenantKin));

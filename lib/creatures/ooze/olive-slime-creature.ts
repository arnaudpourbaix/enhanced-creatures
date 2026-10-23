import { NEW_CREATURES } from "../../config/creatures";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime, SlimeIds } from "./kin";

class OliveSlimeCreatureEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.OliveSlimeCreature, kin);
    this.addCreature(() => this.oliveSlimeCreature());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Olive Slime Creature
   */
  private oliveSlimeCreature() {
    const olive = this.create({
      monster: MonsterEnum.OliveSlimeCreature,
      name: "monster.ooze.name.oliveCreature",
      files: [NEW_CREATURES.OliveSlimeCreature],
      newFiles: [
        {
          files: [NEW_CREATURES.OliveSlimeCreature],
          copyFrom: NEW_CREATURES.OliveSlimeCreature,
          stringRef: "monster.ooze.name.oliveCreature",
        },
      ],
      data: {
        level1: 8,
        bonusHp: 2,
        strength: 15,
        dexterity: 10,
        constitution: 21,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ac: 9,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL",
        morale: 9,
        general: "MONSTER",
        race: "SLIME",
        class: "OLIVE_SLIME",
        gender: "NIETHER",
        animation: "SLIME_OLIVE",
        // Tiny       HD: 1+2   Attack: 1d3   xpv: 65
        // Small     HD: 3+2   Attack: 1d4   xpv: 420
        // Medium     HD: 5+2   Attack: 2d4   xpv: 650
        // Large     HD: 8+2   Attack: 3d4   xpv: 975
        // Huge       HD: 12+2 Attack: 4d4   xpv: 2000
        // Gargantuan HD: 16   Attack: 4d6   xpv: 2500
        size: { value: "Large", tall: false, long: true },
        movement: 6,
        immunities: ["ooze"],
        items: {
          remove: ["SCHLUM1", "DW#SCHLU", "RING95", "IMMUNE1"],
        },
        script: {
          remove: ["SCHLUM"],
        },
      },
    });
    olive.addTrait({
      // Olive slime zombies are harmed by acid, freezing cold, fire and magic missile spells.
      // Spells that affect plants will also affect them, although the effects of entangle are minimal at best.
      // No other attacks, by weapons, lightning, or spells that affect the mind will kill a slime creature.
      immunities: ["lightning", "entangle"],
    });
    olive.createPseudopod({
      diceThrown: 4,
      diceSize: 4,
      id: SlimeIds.HugeOliveSlimeCreature,
    });
    olive.createPseudopod({
      diceThrown: 4,
      diceSize: 6,
      id: SlimeIds.GargantuanOliveSlimeCreature,
    });
    olive.createPseudopod({
      diceThrown: 3,
      diceSize: 4,
    });
    olive.setBehavior({
      dialog: ["SCHLUMPSA"],
      restHeal: true,
    });
    olive.setAdjustments([
      {
        files: ["SCHLUM"],
        data: {
          size: { value: "Huge", tall: false, long: true },
          level1: 12,
          xpv: 2000,
          items: {
            equipped: [{ file: this.item(SlimeIds.HugeOliveSlimeCreature).file, slot: "WEAPON1" }],
          },
        },
      },
    ]);
    return olive;
  }
}

export const createOliveSlimeCreatureEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new OliveSlimeCreatureEntry(kins.get(KinEnum.Ooze));

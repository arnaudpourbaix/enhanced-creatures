import { NEW_CREATURES } from "../../config/creatures";
import { Durations } from "../../src/model/game-data/durations";
import { EffectDamageTypeEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime, SlimeIds } from "./kin";

class GreenSlimeEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.GreenSlime, kin);
    this.addCreature(() => this.greenSlime());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Green Slime
   */
  private greenSlime() {
    const green = this.create({
      monster: MonsterEnum.GreenSlime,
      name: "monster.slime.name.green",
      files: [NEW_CREATURES.GreenSlime],
      newFiles: [
        {
          files: [NEW_CREATURES.GreenSlime],
          copyFrom: NEW_CREATURES.GreenSlime,
          stringRef: "monster.slime.name.green",
        },
      ],
      data: {
        level1: 2,
        thac0: 19,
        strength: 4,
        dexterity: 12,
        constitution: 8,
        intelligence: 1,
        wisdom: 3,
        charisma: 1,
        ac: 9,
        apr: 1,
        xpv: 65,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "SLIME",
        class: "GREEN_SLIME",
        gender: "NIETHER",
        size: { value: "Small", tall: false, long: true },
        movement: 0,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "JELLGR1", "JELLGRSU", "DW#JELGR", "GORJELGR"],
        },
      },
    });
    green.addTrait({
      // The horrid growth can be scraped off quickly, cut away, frozen, or burned.
      // A cure disease spell kills green slime, but other attacks, including weapons and spells, have no effect.
      immunities: ["magic", "physicalDamage"],
    });
    green.createAttachToLivingFlesh({
      id: SlimeIds.AttachToLivingFleshGreenSlime,
      description: "monster.slime.ability.attachToLivingFlesh.descriptionGreen",
      delay: 4 * Durations.round,
      resource: NEW_CREATURES.GreenSlime,
    });
    // 5e: Pseudopod. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) acid damage.
    green.createPseudopod({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 1,
          diceSize: 4,
        },
      ],
      castSpell: {
        spell: this.spell(SlimeIds.AttachToLivingFleshGreenSlime).file,
        doc: "both",
      },
    });
    green.setBehavior({
      restHeal: true,
    });
    green.setAdjustments([
      {
        files: ["JELLGRSU"],
        data: { script: { location: "None" } },
      },
      {
        files: ["X#JELLY", "X#SLIME"],
        data: { script: { location: "None" } },
      },
    ]);
    return green;
  }
}

export const createGreenSlimeEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new GreenSlimeEntry(kins.get(KinEnum.Ooze));

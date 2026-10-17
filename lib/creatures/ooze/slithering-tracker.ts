import effectFactory from "../../src/factories/effect.factory";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectDamageTypeEnum,
  LightingEffectEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime } from "./kin";

class SlitheringTrackerEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.SlitheringTracker, kin, MonsterFamilyEnum.Ooze);
    this.addCreature(() => this.slitheringTracker());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Slithering Tracker
   */
  private slitheringTracker() {
    const tracker = this.create({
      monster: MonsterEnum.SlitheringTracker,
      name: "monster.slime.name.slitheringTracker",
      files: [],
      data: {
        level1: 5,
        thac0: 15,
        strength: 14,
        dexterity: 8,
        constitution: 18,
        intelligence: 9,
        wisdom: 7,
        charisma: 2,
        ac: 5,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL",
        morale: 15,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        animation: "GRAY_OOZE",
        gender: "NIETHER",
        size: { value: "Small", tall: false, long: true },
        movement: 12,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "AC#FPSL2", "AC#FPSL3", "AC#FPSLT", "JELLOL1"],
        },
      },
    });
    tracker.createPseudopod({
      diceThrown: 1,
      diceSize: 6,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 4,
          diceSize: 6,
        },
        ...effectFactory.paralyze({
          duration: Durations.turn,
          lightingEffect: LightingEffectEnum.MushroomGray,
          saveType: SaveTypeEnum.ParalyzePoisonDeath,
        }),
      ],
    });
    tracker.setBehavior({
      restHeal: true,
    });
    tracker.setAdjustments([
      { files: ["JELOLI01"], stringRef: "monster.slime.name.slitheringTracker" },
    ]);
    return tracker;
  }
}

export const createSlitheringTrackerEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SlitheringTrackerEntry(kins.get(KinEnum.Ooze));

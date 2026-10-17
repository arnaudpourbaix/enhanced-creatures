import { NEW_CREATURES } from "../../config/creatures";
import {
  EffectDamageTypeEnum,
  EffectStatisticModifierEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime, SlimeIds } from "./kin";

class WhitePuddingEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WhitePudding, kin, MonsterFamilyEnum.Ooze);
    this.addCreature(() => this.whitePudding());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * White Pudding
   */
  private whitePudding() {
    const white = this.create({
      monster: MonsterEnum.WhitePudding,
      name: "monster.slime.name.white",
      files: [NEW_CREATURES.SplitWhitePudding],
      newFiles: [
        {
          files: [NEW_CREATURES.SplitWhitePudding],
          copyFrom: NEW_CREATURES.WhitePudding,
        },
      ],
      data: {
        level1: 9,
        thac0: 11,
        strength: 16,
        dexterity: 5,
        constitution: 16,
        intelligence: 1,
        wisdom: 6,
        charisma: 1,
        ac: 8,
        apr: 1,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 12,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        animation: "GRAY_OOZE",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 9,
        immunities: ["ooze"],
        items: {
          remove: ["IMMUNE1", "RING95", "AC#FPWPU"],
        },
        effects: { remove: true },
      },
    });
    white.addTrait({
      // 5e: Damage Immunities: Lightning, Slashing
      description: "monster.slime.trait.split.pudding",
      immunities: ["acid", "cold", "poison"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 90,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    white.createSplit({
      id: SlimeIds.WhitePuddingSplit,
      description: "monster.slime.ability.split.puddingDesc",
      resource: NEW_CREATURES.SplitWhitePudding,
      visualEffect: "BDGOOYAA",
      withTriggers: true,
    });
    white.createPseudopod({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 7,
          diceSize: 4,
        },
      ],
    });
    white.setBehavior({
      restHeal: true,
      abilities: [this.ability(SlimeIds.WhitePuddingSplit)],
    });
    white.setAdjustments([
      {
        files: [NEW_CREATURES.SplitWhitePudding],
        data: {
          hp: 45, // a little less than half hp since it splits after taking some damage
          xpv: 700,
          spells: { removeMemorized: true },
        },
      },
    ]);
    return white;
  }
}

export const createWhitePuddingEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WhitePuddingEntry(kins.get(KinEnum.Ooze));

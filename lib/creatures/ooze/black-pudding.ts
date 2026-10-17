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

class BlackPuddingEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.BlackPudding, kin, MonsterFamilyEnum.Ooze);
    this.addCreature(() => this.blackPudding());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Black Pudding
   */
  private blackPudding() {
    const black = this.create({
      monster: MonsterEnum.BlackPudding,
      name: "monster.slime.name.black",
      files: [NEW_CREATURES.SplitBlackPudding],
      newFiles: [
        {
          files: [NEW_CREATURES.SplitBlackPudding],
          copyFrom: NEW_CREATURES.BlackPudding,
        },
      ],
      data: {
        level1: 10,
        thac0: 11,
        strength: 16,
        dexterity: 5,
        constitution: 16,
        intelligence: 1,
        wisdom: 6,
        charisma: 1,
        ac: 6,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 12,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        animation: "BLACK_PUDDING",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 6,
        immunities: ["ooze"],
        items: {
          remove: ["HELMNOAN", "RING95", "BDPUDDBL"],
        },
        script: {
          remove: ["BDPUDDBL"],
        },
        effects: {
          remove: true,
        },
      },
    });
    black.createSplit({
      id: SlimeIds.BlackPuddingSplit,
      description: "monster.slime.ability.split.puddingDesc",
      resource: NEW_CREATURES.SplitBlackPudding,
      visualEffect: "BDGOOYAA",
      withTriggers: true,
    });
    black.addTrait({
      // 5e: Damage Immunities: Lightning, Slashing
      // description overrides the auto-generated immunity bullets so the split trait (a
      // passive, always-on behavior that the doc generator otherwise has no way to list - see
      // monster.ts's slime.trait.split comment) can be folded into the same trait entry.
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
    // TODO: In addition, nonmagical armor worn by the target is partly dissolved and takes a permanent and cumulative −1 penalty to the AC it offers.
    // The armor is destroyed if the penalty reduces its AC to 10.
    black.createPseudopod({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 3,
          diceSize: 8,
        },
      ],
    });
    black.setBehavior({
      restHeal: true,
      abilities: [this.ability(SlimeIds.BlackPuddingSplit)],
    });
    black.setAdjustments([
      {
        files: [NEW_CREATURES.SplitBlackPudding],
        data: {
          hp: 50, // a little less than half hp since it splits after taking some damage
          xpv: 1000,
          spells: { removeMemorized: true },
        },
      },
    ]);
    return black;
  }
}

export const createBlackPuddingEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new BlackPuddingEntry(kins.get(KinEnum.Ooze));

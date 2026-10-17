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

class MustardJellyEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.MustardJelly, kin, MonsterFamilyEnum.Ooze);
    this.addCreature(() => this.mustardJelly());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Mustard Jelly
   */
  private mustardJelly() {
    const mustard = this.create({
      monster: MonsterEnum.MustardJelly,
      name: "monster.slime.name.mustard",
      files: [NEW_CREATURES.SplitMustardJelly],
      newFiles: [
        {
          files: [NEW_CREATURES.SplitMustardJelly],
          copyFrom: NEW_CREATURES.MustardJelly,
          stringRef: "monster.slime.name.SmallerMustard",
        },
      ],
      data: {
        level1: 7,
        bonusHp: 14,
        strength: 15,
        dexterity: 10,
        constitution: 21,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ac: 4,
        apr: 1,
        xpv: 4000,
        alignment: "NEUTRAL",
        morale: 14,
        general: "MONSTER",
        race: "SLIME",
        class: "MUSTARD_JELLY",
        animation: "SLIME_MUSTARD",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 9,
        immunities: ["ooze"],
        items: {
          remove: ["IMMUNE1", "RING95", "JELLMU1", "DW#JELMU"],
        },
        spells: {
          memorized: [{ file: this.spell(SlimeIds.ToxicVapors).file, memorizedCount: 1 }],
        },
      },
    });
    mustard.addTrait({
      description: "monster.slime.trait.split.mustard",
      immunities: ["lightning", "nonMagicalWeapons", "magicMissile", "coldResistance"],
      // 5e: Immunity to magic damage
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 10,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    mustard.createSplit({
      id: SlimeIds.MustardJellySplit,
      description: "monster.slime.ability.split.mustardDesc",
      resource: NEW_CREATURES.SplitMustardJelly,
      visualEffect: "TRGOOYAA",
      withTriggers: false,
    });
    mustard.createPseudopod({
      diceThrown: 2,
      diceSize: 4,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 3,
          diceSize: 4,
        },
      ],
    });
    mustard.setBehavior({
      restHeal: true,
      abilities: [this.ability(SlimeIds.MustardJellySplit), this.ability(SlimeIds.ToxicVapors)],
    });
    mustard.setAdjustments([
      { files: ["PLYJELL1"], data: { script: { location: "None" } } },
      {
        files: [NEW_CREATURES.SplitMustardJelly],
        data: {
          hp: 56,
          xpv: 2000,
          movement: 18,
          spells: {
            removeMemorized: [this.spell(SlimeIds.MustardJellySplit).file],
          },
          size: { value: "Medium", tall: false, long: true },
        },
      },
    ]);
    return mustard;
  }
}

export const createMustardJellyEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new MustardJellyEntry(kins.get(KinEnum.Ooze));

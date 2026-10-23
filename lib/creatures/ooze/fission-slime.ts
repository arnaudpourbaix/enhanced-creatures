import {
  EffectDamageTypeEnum,
  EffectStatisticModifierEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime, SlimeIds } from "./kin";

class FissionSlimeEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.FissionSlime, kin);
    this.addCreature(() => this.fissionSlime());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Fission Slime
   */
  private fissionSlime() {
    const fission = this.create({
      monster: MonsterEnum.FissionSlime,
      name: "monster.ooze.name.fission",
      files: [],
      data: {
        level1: 12,
        bonusHp: 14,
        strength: 15,
        dexterity: 10,
        constitution: 21,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ac: 4,
        apr: 1,
        xpv: 5000,
        alignment: "NEUTRAL",
        morale: 14,
        general: "MONSTER",
        race: "SLIME",
        class: "MUSTARD_JELLY",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 9,
        immunities: ["ooze"],
        items: {
          remove: ["IMMUNE1", "RING95", "JELLMU2", "DW#JELM2"],
        },
        spells: {
          memorized: [{ file: this.spell(SlimeIds.ToxicVapors).file, memorizedCount: 1 }],
        },
        effects: {
          remove: true,
        },
      },
    });
    fission.addTrait({
      description: "monster.ooze.trait.fission",
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
    fission.createPseudopod({
      diceThrown: 3,
      diceSize: 6,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 3,
          diceSize: 6,
        },
      ],
    });
    fission.setBehavior({
      restHeal: true,
      // no split ability since it is handled by existing scripts
      // fission slime is not an official monster, so no rule to follow
      abilities: [this.ability(SlimeIds.ToxicVapors)],
    });
    return fission;
  }
}

export const createFissionSlimeEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new FissionSlimeEntry(kins.get(KinEnum.Ooze));

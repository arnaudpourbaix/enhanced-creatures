import {
  CastSpellOnConditionTargetEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  PortraitIconEnum,
  RegenerationTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import effectService from "../../src/services/effects/effect.service";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Wolf, WolfIds } from "./kin";

class DreadWolfEntry extends CreatureEntry<Wolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.DreadWolf, kin, MonsterFamilyEnum.Wolf);
    this.addCreature(() => this.dread());
  }

  createCreature(id: MonsterEnum): Wolf {
    return new Wolf(id);
  }

  /**
   * Dread Wolf
   */
  private dread() {
    const dread = this.create({
      monster: MonsterEnum.DreadWolf,
      name: "monster.wolf.name.dread",
      files: [],
      data: {
        level1: 4,
        bonusHp: 4,
        specialBonusHp: 10,
        strength: 18,
        dexterity: 13,
        constitution: 14,
        intelligence: 9,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 1,
        xpv: 650,
        alignment: "NEUTRAL_EVIL",
        morale: 18,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_DREAD",
        animation: "WOLF_DREAD",
        gender: "MALE",
        size: { value: "Small", tall: false, long: true },
        movement: 18,
        items: {
          remove: ["P1-10", "RING95", "TROLLIMM", "BDWOLFD1", "BDWOLFDR"],
        },
      },
    });
    const trait = dread.addTrait({
      description: "monster.wolf.trait.dread",
      equippedSlot: "LRING",
      immunities: ["undead", "coldSpells", "cold", "lightningResistance"],
      effects: [
        {
          opcode: EffectTypeEnum.Regeneration,
          amount: 2,
          type: RegenerationTypeEnum.OneHPperAmountSeconds,
          icon: PortraitIconEnum.Regenerating,
        },
        { opcode: EffectTypeEnum.MinimumHP, value: 1 },
      ],
    });
    dread.createDreadWolfDownState();
    trait.effects.push(
      effectService.getEffect({
        opcode: EffectTypeEnum.CastSpellOnCondition,
        conditionTarget: CastSpellOnConditionTargetEnum.Myself,
        condition: "HPLT(Myself,Extra)",
        special: 6,
        timing: EffectTimingEnum.InstantWhileEquipped,
        target: EffectTargetEnum.Self,
        resource: this.spell(WolfIds.DreadWolfDownState).file,
      }),
    );
    dread.createDreadWolfDisease();
    dread.createJaws({
      diceThrown: 1,
      diceSize: 10,
      castSpells: [
        {
          spell: this.spell(WolfIds.DreadWolfDisease).file,
          saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
        },
      ],
    });
    dread.setAdjustments([
      { files: ["ANWOLF1"], stringRef: "monster.wolf.name.dread" },
      { files: ["L#HALWO"], data: { animation: "L#_DOG_MOSS" } },
    ]);
    return dread;
  }
}

export const createDreadWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new DreadWolfEntry(kins.get(KinEnum.Wolf));

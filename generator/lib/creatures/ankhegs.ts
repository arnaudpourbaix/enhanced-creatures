import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import effectFactory from "../src/factories/effect.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import {
  AbilityDamageTypeEnum,
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Stream,
}

class Ankheg extends Creature {
  /**
   * Stream
   */
  createStream() {
    return this.addSpell({
      name: "monster.ankheg.enzymeStream.name",
      description: "monster.ankheg.enzymeStream.description",
      memorizedCount: 1,
      id: Ids.Stream,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      icon: SPELLS.Wizard.MelfAcidArrow.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          range: 30,
          speed: 3,
          projectile: "acidblob",
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Acid,
              diceThrown: 8,
              diceSize: 4,
              saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
              flags: [EffectFlagsEnum.SaveForHalf],
            },
          ],
        },
      ],
      ability: {
        disableInterrupt: true,
        spell: {
          type: "force",
          remove: true,
        },
        targets: [{ name: "PCsPreferringWeak", randomOrder: true }],
        triggers: [{ name: "HPPercentLT", params: [ScriptTarget.myself, 50] }],
        range: 30,
      },
    });
  }
}

class AnkhegFamily extends CreatureFamily<Ankheg> {
  constructor() {
    super(MonsterFamilyEnum.Ankheg);
    this.addCreature(this.ankheg());
  }

  createCreature(id: MonsterEnum): Ankheg {
    return new Ankheg(id);
  }

  /**
   * Ankheg
   */
  private ankheg() {
    const ankheg = this.create({
      monster: MonsterEnum.Ankheg,
      name: "monster.ankheg.name",
      files: [
        "BDNEO",
        "ANKHEG",
        "ANKHEGF",
        "ANKHEGG",
        "ANKHEGQ",
        "BDANKH01",
        "BDANKHEG",
        "BDANKHSU",
        "BPANKHE1",
        "WIANKHE1",
      ],
      data: {
        level1: 8,
        strength: 17,
        dexterity: 11,
        constitution: 13,
        intelligence: 1,
        wisdom: 13,
        charisma: 6,
        ac: 2,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL",
        morale: 9,
        general: "MONSTER",
        race: "ANKHEG",
        class: "ANKHEG",
        gender: "NIETHER",
        size: "Huge",
        movement: 6,
        immunities: ["magicalBeast"],
        script: {
          remove: ["ANKHEG"],
          location: "Race",
        },
        items: {
          remove: ["ANKHEG1", "ANKHEG2"],
        },
      },
    });
    ankheg.createStream();
    ankheg.addWeapon({
      weapon: {
        stringRef: "monster.ankheg.weapon",
        equippedSlot: ["WEAPON1"],
        icon: MonsterItemIconEnum.Wolf,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 3,
          diceSize: 6,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      grab: { rounds: 3 },
      castSpells: [
        {
          spell: {
            name: "monster.ankheg.digestiveEnzyme.name",
            description: "monster.ankheg.digestiveEnzyme.description",
            secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
            headers: [
              {
                type: ItemAbilityTypeEnum.Melee,
                range: 5,
                effects: [
                  {
                    opcode: EffectTypeEnum.DisplayPortraitIcon,
                    icon: PortraitIconEnum.Acid,
                    duration: 4 * Durations.round,
                  },
                  ...effectFactory.repeatEffect(4, [
                    {
                      opcode: EffectTypeEnum.Damage,
                      type: EffectDamageTypeEnum.Acid,
                      diceThrown: 1,
                      diceSize: 4,
                    },
                  ]),
                  {
                    opcode: EffectTypeEnum.ProtectionFromSpell,
                    duration: 4 * Durations.round,
                    timing: EffectTimingEnum.InstantLimited,
                  },
                ],
              },
            ],
          },
        },
      ],
    });
    ankheg.setBehavior({
      abilities: [this.ability(Ids.Stream)],
    });
    ankheg.setAdjustments([
      { files: ["BDANKH01"], data: { level1: 10, xpv: 1400 } },
      { files: ["OHDRANKH"], data: { level1: 15, xpv: 1500 } },
      { files: ["BDANKHSU"], summon: true },
    ]);
    return ankheg;
  }
}

export const createAnkhegs = () => new AnkhegFamily();

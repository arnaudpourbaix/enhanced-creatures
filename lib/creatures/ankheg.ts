import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-database";
import { CommonTargetLists } from "../config/target/common";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureEntry } from "../src/model/creature/entry";
import {
  AbilityDamageTypeEnum,
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { EntryEnum } from "./entry";
import { MonsterEnum } from "./monster";

enum Ids {
  Stream,
}

const ENZYMES = { type: EffectDamageTypeEnum.Acid, diceThrown: 1, diceSize: 4 };

class Ankheg extends Creature {
  /**
   * Stream
   */
  createStream() {
    return this.addSpell({
      name: "monster.ankheg.enzymeStream.name",
      xpAbility: "specialAttack",
      role: "damage",
      description: "monster.ankheg.enzymeStream.description",
      memorizedCount: 1,
      id: Ids.Stream,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      icon: SPELLS.Wizard.MelfAcidArrow.file,
      keywords: ["acid"],
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
        targets: CommonTargetLists.PreferringWeak,
        triggers: [{ name: "HPPercentLT", params: [ScriptTarget.myself, 50] }],
        range: 30,
      },
    });
  }
}

class AnkhegEntry extends CreatureEntry<Ankheg> {
  constructor() {
    super(EntryEnum.Ankheg);
    this.addCreature(() => this.ankheg());
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
      files: [],
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
        xpv2e: 975,
        alignment: "NEUTRAL",
        morale: 9,
        general: "MONSTER",
        race: "ANKHEG",
        class: "ANKHEG",
        gender: "NIETHER",
        size: { value: "Huge", tall: false, long: true },
        movement: 6,
        immunities: ["magicalBeast"],
        script: {
          remove: ["ANKHEG"],
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
          // acidic digestive enzymes
          effects: [{ opcode: EffectTypeEnum.Damage, ...ENZYMES }],
        },
      },
      // a hit seizes the victim in the mandibles, crushed and dissolved every round it stays held
      grab: {
        trigger: "probability",
        damagePerRound: [
          { type: EffectDamageTypeEnum.Crushing, diceThrown: 3, diceSize: 6 },
          ENZYMES,
        ],
        addStrengthBonus: true,
      },
    });
    ankheg.setBehavior({
      abilities: { entries: [{ power: this.spell(Ids.Stream) }] },
    });
    ankheg.setAdjustments([
      { files: ["BDANKH01"], data: { level1: 10 } },
      { files: ["L#MIMMI"], data: { level1: 12 } },
      { files: ["OHDRANKH"], data: { level1: 15 } },
      { files: ["L#NDC2"], data: { level1: 16 } },
      { files: ["L#XZEANS"], data: { level1: 15, immunities: ["undead"] } },
      { files: ["L#XZEANK"], data: { level1: 15, immunities: ["undead"] } },
    ]);
    return ankheg;
  }
}

export const createAnkhegEntry = () => new AnkhegEntry();

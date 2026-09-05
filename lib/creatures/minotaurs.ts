import { SPELLS } from "../config/spells/spell-names";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import {
  AbilityDamageTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ItemAnimationEnum,
  ItemCategoryEnum,
  ItemFlagEnum,
  ProficiencyTypeEnum,
  WingBuffetDirectionEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Charge,
  Headbutt,
}

class Minotaur extends Creature {
  createHugeAxe() {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.minotaur.weapon.axe.name",
        description: "monster.minotaur.weapon.axe.description",
        equippedSlot: ["WEAPON1"],
        flags: [ItemFlagEnum.Displayable, ItemFlagEnum.TwoHanded],
        animation: ItemAnimationEnum.Axe,
        category: ItemCategoryEnum.Halberds,
        icon: "IAX1H17",
        proficiency: ProficiencyTypeEnum.PROFICIENCYHALBERD,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          animationSwing: { backhand: 50, overhand: 50, thrust: 0 },
          diceThrown: 1,
          diceSize: 10,
          damageBonus: 2,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 8,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }

  /**
   * Charge
   */
  createCharge() {
    this.addItem({
      stringRef: "monster.minotaur.weapon.headbutt.name",
      id: Ids.Headbutt,
      icon: "IHELM14",
      header: {
        type: ItemAbilityTypeEnum.Melee,
        diceThrown: 4,
        diceSize: 4,
        damageType: AbilityDamageTypeEnum.Piercing,
        speed: 1,
        abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        effects: [
          {
            opcode: EffectTypeEnum.DisplayString,
            stringRef: "monster.minotaur.weapon.headbutt.name",
          },
        ],
      },
    });
    return this.addSpell({
      id: Ids.Charge,
      name: "monster.minotaur.ability.charge.name",
      description: "monster.minotaur.ability.charge.description",
      memorizedCount: 1,
      icon: SPELLS.Wizard.Haste.file,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.WingBuffet,
              target: EffectTargetEnum.Self,
              speed: 40,
              direction: WingBuffetDirectionEnum.TowardsTargetPoint,
              duration: 2,
            },
            {
              opcode: EffectTypeEnum.CreateWeapon,
              amount: 1,
              resource: this.item(Ids.Headbutt).file,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "FarthestEnemies", randomOrder: true }],
        minRange: 20,
        range: 50,
        spell: {
          type: "force",
          isAttack: true,
        },
        disableInterrupt: true,
        actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
      },
    });
  }
}

class MinotaurFamily extends CreatureFamily<Minotaur> {
  constructor() {
    super(MonsterFamilyEnum.Minotaur);
    this.addCreature(() => this.minotaur());
  }

  createCreature(id: MonsterEnum): Minotaur {
    return new Minotaur(id);
  }

  /**
   * Minotaur
   */
  private minotaur() {
    const minotaur = this.create({
      monster: MonsterEnum.Minotaur,
      name: "monster.minotaur.name.minotaur",
      files: [],
      data: {
        level1: 6,
        bonusHp: 3,
        strength: 18,
        dexterity: 11,
        constitution: 16,
        intelligence: 6,
        wisdom: 16,
        charisma: 9,
        ac: 6,
        apr: 2,
        xpv: 1400,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "GIANTHUMANOID",
        race: "MINOTAUR",
        class: "OGRE",
        gender: "MALE",
        size: "Large",
        movement: 12,
        items: {
          remove: ["AX1H01", "HELMNOAN", "HALB01", "OHBFIG01", "LEAT10", "OHLEAT50", "HALB02"],
        },
        script: {
          remove: ["OHBFIG01"],
        },
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 2 }],
      },
    });
    minotaur.addTrait({
      immunities: ["infravision", "maze"],
    });
    minotaur.createHugeAxe();
    minotaur.createCharge();
    minotaur.setBehavior({
      usePotions: true,
      abilities: [this.ability(Ids.Charge)],
    });
    minotaur.setAdjustments([
      {
        // elder
        files: ["GAROCK", "HLMAFER", "OHBMIN01", "OHBMINSU", "OHNGHALL"],
        data: {
          level1: 8,
          bonusHp: 4,
          exceptionalStrength: 50,
          xpv: 3000,
        },
      },
      {
        files: ["OHBMIN01", "OHBMINSU", "OHNGHALL", "HLMAFER", "GAROCK", "ROCK"],
        data: {
          class: "FIGHTER",
          kit: "BARBARIAN",
          apr: 1,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
        },
      },
      {
        files: ["OHBMIN01"],
        data: {
          level1: 11,
          xpv: 4000,
        },
      },
      {
        files: ["OHBMINSU"],
        data: {
          level1: 13,
        },
      },
      {
        files: ["OHNGHALL"],
        data: {
          level1: 14,
          xpv: 5000,
        },
      },
      {
        files: ["GROMMIN"],
        data: {
          level1: 16,
          xpv: 10000,
          class: "CLERIC",
          spells: {
            removeMemorized: false,
          },
          script: {
            location: "None",
          },
        },
      },
      {
        files: ["HLMAFER"],
        data: {
          level1: 17,
          xpv: 6000,
        },
      },
      {
        files: ["GAROCK", "ROCK"],
        noWeapon: true,
        data: {
          level1: 20,
          exceptionalStrength: 100,
          xpv: 10000,
          proficiencies: [
            { type: ProficiencyTypeEnum.PROFICIENCYAXE, value: 5 },
            { type: ProficiencyTypeEnum.PROFICIENCY2WEAPON, value: 3 },
          ],
        },
      },
    ]);
    return minotaur;
  }
}

export const createMinotaurs = () => new MinotaurFamily();

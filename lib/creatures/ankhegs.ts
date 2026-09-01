import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import actionFactory from "../src/factories/action.factory";
import effectFactory from "../src/factories/effect.factory";
import responseFactory from "../src/factories/response.factory";
import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import { ConditionalStatement } from "../src/model/script/script";
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
          remove: ["ANKHEG", "ANKHEGB", "L#XZEANK"],
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
      customCodes: [
        {
          location: "init",
          type: "insertBefore",
          statements: [...this.dreadfulZombieAnkheg(), ...this.assassinAnkheg()],
        },
      ],
    });
    ankheg.setAdjustments([
      { files: ["BDANKH01"], data: { level1: 10 } },
      { files: ["L#MIMMI"], data: { level1: 12, xpv: 1200 } },
      { files: ["OHDRANKH"], data: { level1: 15, xpv: 1500 } },
      { files: ["L#NDC2"], data: { level1: 16, xpv: 1500 } },
      { files: ["L#XZEANS"], data: { level1: 15, xpv: 2000, immunities: ["undead"] } },
      { files: ["L#XZEANK"], data: { level1: 15, xpv: 2000, immunities: ["undead"] } },
    ]);
    return ankheg;
  }

  private dreadfulZombieAnkheg(): ConditionalStatement[] {
    const global = "L#XZEAnkheGreater";
    return [
      {
        comment: "Dreadful Zombie Ankheg",
        triggers: [
          triggerFactory.name("L#XZEANK"),
          { name: "See", params: ["PC"] },
          triggerFactory.global(global, 0),
        ],
        responses: responseFactory.response([
          actionFactory.setGlobal(global, 1),
          { name: "ReallyForceSpell", params: [ScriptTarget.myself, "WIZARD_STONE_SKIN"] },
          { name: "Enemy" },
        ]),
      },
    ];
  }

  private assassinAnkheg(): ConditionalStatement[] {
    const global = "BP_HOSTILE";
    return [
      {
        comment: "Assassin Ankheg",
        triggers: [
          triggerFactory.name("WIANKHE1"),
          triggerFactory.globalLT(global, 3, "GLOBAL"),
          triggerFactory.hpgt(0),
        ],
        responses: responseFactory.response([
          actionFactory.incrementGlobal(global, 1, "GLOBAL"),
          { name: "Enemy" },
        ]),
      },
    ];
  }
}

export const createAnkhegs = () => new AnkhegFamily();

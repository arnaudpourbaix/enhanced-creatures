import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import actionFactory from "../src/factories/action.factory";
import effectFactory from "../src/factories/effect.factory";
import responseFactory from "../src/factories/response.factory";
import { ScriptTarget } from "../src/model/constants";
import { RawCreatureAbility } from "../src/model/creature/ability";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import { CustomCode } from "../src/model/script/script";
import {
  AbilityDamageTypeEnum,
  EffectDamageModeEnum,
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../src/model/spell-item/projectile";
import targetService from "../src/services/baf/target.service";
import { hunterCustomCode } from "./common";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  ImprovedStreamOfFrost,
}

class Bear extends Creature {
  createPaws(
    diceThrown: number,
    diceSize: number,
    hug: {
      diceSize: number;
      diceThrown: number;
    },
  ) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.bear.weapon.claws",
        icon: MonsterItemIconEnum.Wolf,
        equippedSlot: ["WEAPON1"],
        header: {
          diceThrown,
          diceSize,
          type: ItemAbilityTypeEnum.Melee,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: [
        {
          probability1: 10,
          spell: {
            name: "monster.bear.hug.name",
            secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
            headers: [
              {
                type: ItemAbilityTypeEnum.Melee,
                range: 5,
                effects: [
                  {
                    opcode: EffectTypeEnum.Damage,
                    type: EffectDamageTypeEnum.Crushing,
                    diceThrown: hug.diceThrown,
                    diceSize: hug.diceSize,
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  }

  createJaws(diceThrown: number, diceSize: number) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.bear.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: ["SHIELD"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: diceThrown,
          diceSize: diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }
}

class BearFamily extends CreatureFamily<Bear> {
  constructor() {
    super(MonsterFamilyEnum.Bear);
    this.createImprovedStreamOfFrost();
    this.addCreature(() => this.black());
    this.addCreature(() => this.brown());
    this.addCreature(() => this.cave());
    this.addCreature(() => this.polar());
  }

  createCreature(id: MonsterEnum): Bear {
    return new Bear(id);
  }

  /**
   * Black Bear
   */
  private black() {
    const black = this.create({
      monster: MonsterEnum.BlackBear,
      name: "monster.bear.name.black",
      files: [],
      data: {
        level1: 3,
        bonusHp: 3,
        strength: 15,
        dexterity: 10,
        constitution: 15,
        intelligence: 4,
        wisdom: 12,
        charisma: 7,
        ac: 7,
        apr: 3,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_BLACK",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        items: {
          remove: ["B1-6"],
        },
        script: {
          remove: ["CBEAR", "BEAR"],
        },
      },
    });
    black.createPaws(1, 3, { diceThrown: 2, diceSize: 4 });
    black.createJaws(1, 6);
    black.setBehavior({
      walk: true,
      customCodes: [this.turningHostile, this.fearFire],
    });
    black.setAdjustments([
      { files: ["BEARBLSU"], summon: true },
      { files: ["PLYBEAR2"], data: { script: { location: "None" } } },
    ]);
    return black;
  }

  /**
   * Brown Bear
   */
  private brown() {
    const brown = this.create({
      monster: MonsterEnum.BrownBear,
      name: "monster.bear.name.brown",
      files: [
        // "BDSHA06A", //TODO: Summon bear spirit
      ],
      data: {
        level1: 5,
        bonusHp: 5,
        specialBonusHp: 8,
        strength: 19,
        dexterity: 10,
        constitution: 16,
        intelligence: 4,
        wisdom: 13,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 420,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_BROWN",
        gender: "NIETHER",
        size: "Large",
        movement: 12,
        items: {
          remove: ["B1-8"],
        },
        script: {
          remove: ["CBEAR", "BEAR"],
        },
      },
    });
    brown.createPaws(1, 6, { diceThrown: 2, diceSize: 6 });
    brown.createJaws(1, 8);
    brown.setBehavior({
      walk: true,
      customCodes: [this.turningHostile, hunterCustomCode],
      abilities: [this.rage],
    });
    brown.setAdjustments([
      { files: ["BEARBRSU"], summon: true },
      { files: ["PLYBEAR1"], data: { script: { location: "None" } } },
      { files: ["BDGRIZHU"], data: { class: "HUNTER_CREATURE" } },
      // { do we want to give them rage? this is not RAW
      //   files: ["BDBEARBN", "BDGRIZHU"],
      //   data: { removeMemorizedSpells: false },
      // },
    ]);
    return brown;
  }

  /**
   * Cave Bear
   */
  private cave() {
    const cave = this.create({
      monster: MonsterEnum.CaveBear,
      name: "monster.bear.name.cave",
      files: [],
      data: {
        level1: 6,
        bonusHp: 6,
        specialBonusHp: 8,
        strength: 20,
        dexterity: 10,
        constitution: 16,
        intelligence: 4,
        wisdom: 13,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_CAVE",
        gender: "NIETHER",
        size: "Huge",
        movement: 12,
        items: {
          remove: ["B1-10", "BEARCASU"],
        },
        script: {
          remove: ["CBEAR", "BEAR"],
        },
      },
    });
    cave.createPaws(1, 8, { diceThrown: 2, diceSize: 6 });
    cave.createJaws(1, 12);
    cave.setBehavior({
      customCodes: [this.turningHostile],
      walk: true,
      abilities: [this.rage],
    });
    cave.setAdjustments([
      { files: ["BEARCASU"], summon: true },
      { files: ["BD328OSO"], data: { level1: 8, xpv: 900 } },
      // { do we want to give them rage? this is not RAW
      //   files: ["BDBEARCA"],
      //   data: { removeMemorizedSpells: false },
      // },
    ]);
    return cave;
  }

  /**
   * Polar Bear
   */
  private polar() {
    const polar = this.create({
      monster: MonsterEnum.PolarBear,
      name: "monster.bear.name.polar",
      files: [
        // "SPBEAR1", //TODO: Spirit Bear
        // "SPBEAR2", //TODO: Spirit Bear
        // "SPBEAR3", //TODO: Spirit Bear
        // "SPBEAR4", //TODO: Spirit Bear
        // "SPBEAR5", //TODO: Spirit Bear
      ],
      data: {
        level1: 8,
        bonusHp: 8,
        specialBonusHp: 12,
        strength: 20,
        dexterity: 10,
        constitution: 16,
        intelligence: 4,
        wisdom: 13,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_POLAR",
        gender: "NIETHER",
        size: "Huge",
        movement: 12,
        items: {
          remove: ["B1-12", "B1-12M3", "BEARPOSU", "KALDW1"],
        },
        script: {
          remove: ["CBEAR", "BEAR", "kaldran"],
        },
        immunities: ["coldResistance"],
      },
    });
    polar.createPaws(1, 10, { diceThrown: 3, diceSize: 6 });
    polar.createJaws(2, 6);
    polar.setBehavior({
      walk: true,
      abilities: [this.ability(Ids.ImprovedStreamOfFrost)],
      customCodes: [this.turningHostile, this.kaldranInit],
    });
    polar.setAdjustments([
      { files: ["BEARPOSU", "BDGHBRSU", "BDGHOSTF"], summon: true },
      { files: ["BDGHOSTF"], data: { immunities: ["undead", "incorporeal"] } },
      { files: ["BDGHBRSU"], data: { level1: 9 } },
      {
        files: ["KALDRAN"],
        data: {
          level1: 12,
          intelligence: 10,
          morale: 15,
          immunities: ["cold", "coldSpells"],
          spells: {
            memorized: [
              {
                file: this.spell(Ids.ImprovedStreamOfFrost).file,
                memorizedCount: 1,
              },
            ],
          },
        },
      },
    ]);
    return polar;
  }

  /**
   * Improved Stream Of Frost
   */
  private createImprovedStreamOfFrost() {
    return this.addSpell({
      name: "monster.bear.improvedStreamOfFrost.name",
      description: "monster.bear.improvedStreamOfFrost.description",
      id: Ids.ImprovedStreamOfFrost,
      options: { renew: 3 },
      icon: SPELLS.Wizard.Fireburst.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          projectile: {
            copyFromFile: "CONECOLD",
            name: "Improved stream of frost",
            areaEffectInfo: {
              areaProjectileFlags: [
                AreaProjectileEnum.AffectOnlyEnemies,
                AreaProjectileEnum.UseSecondaryProjectile,
              ],
              triggerRadius: 180,
              areaOfEffect: 180, // within 10 feet
              coneWidth: 0,
            },
          },
          range: 10,
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              amount: 0,
              damageMode: EffectDamageModeEnum.Normal,
              type: EffectDamageTypeEnum.Cold,
              diceThrown: 6,
              diceSize: 4,
              saveTypes: [SaveTypeEnum.Breath],
              flags: [EffectFlagsEnum.SaveForHalf],
            },
            ...effectFactory.paralyze({
              duration: 1 * Durations.turn,
              saveType: SaveTypeEnum.ParalyzePoisonDeath,
              saveBonus: -2,
              startSound: "MISC_04A",
              endSound: "EFF_E03",
              pulse: { blue: 255, green: 213, red: 123, speed: 20 },
              lightingEffect: LightingEffectEnum.AlterationWater,
            }),
          ],
        },
      ],
      ability: {
        targets: [
          {
            name: "NearestEnemies",
            limit: 3,
          },
        ],
        spell: {
          type: "force",
          selfTarget: true,
        },
        range: 10,
        probability: 20,
      },
    });
  }

  turningHostile: CustomCode = {
    location: "turnHostile",
    type: "insertAfter",
    statements: [
      {
        comment: "Turn hostile if too close and not druid/ranger",
        triggers: [
          { name: "Range", params: ["GOODCUTOFF", 7] },
          {
            name: "See",
            params: [targetService.targetObject({ ea: "PC", clazz: "DRUID" })],
            negation: true,
          },
          {
            name: "See",
            params: [targetService.targetObject({ ea: "PC", clazz: "RANGER" })],
            negation: true,
          },
          {
            name: "See",
            params: [targetService.targetObject({ ea: "PC", clazz: "FIGHTER_DRUID" })],
            negation: true,
          },
          {
            name: "See",
            params: [targetService.targetObject({ ea: "PC", clazz: "CLERIC_RANGER" })],
            negation: true,
          },
          {
            name: "Allegiance",
            params: [ScriptTarget.myself, "NEUTRAL"],
          },
        ],
        responses: responseFactory.response([{ name: "Enemy" }]),
      },
    ],
    abilities: [],
  };

  fearFire: CustomCode = {
    location: "handlePanic",
    type: "insertAfter",
    statements: [
      {
        triggers: [{ name: "HitBy", params: ["ANYONE", "FIRE"] }],
        responses: responseFactory.response(
          actionFactory.disableInterrupt([
            { name: "RunAwayFromNoLeaveArea", params: ["LastAttackerOf", 200] },
          ]),
        ),
      },
    ],
    abilities: [],
  };

  rage: RawCreatureAbility = {
    preset: SPELLS.Class.BerserkerRage.file,
    triggers: [{ name: "HPPercentLT", params: [ScriptTarget.myself, 75] }],
    probability: 50,
  };

  kaldranInit: CustomCode = {
    location: "init",
    type: "insertAfter",
    statements: [
      {
        triggers: [
          { name: "Name", params: ["kaldran", ScriptTarget.myself] },
          { name: "Global", params: ["Kaldran", "GLOBAL", 0] },
          { name: "See", params: ["NearestEnemyOf"] },
          { name: "See", params: ["PC"] },
        ],
        responses: [
          {
            weight: 100,
            actions: [{ name: "SetGlobal", params: ["Kaldran", "GLOBAL", 1] }],
          },
        ],
      },
    ],
    abilities: [],
  };
}

export const createBears = () => new BearFamily();

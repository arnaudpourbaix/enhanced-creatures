import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import { CustomCode } from "../../src/model/script/script";
import {
  EffectDamageModeEnum,
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  EffectTimingEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import { customCodes } from "../common";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Bear, BearIds } from "./kin";

class PolarBearEntry extends CreatureEntry<Bear> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.PolarBear, kin);
    this.createImprovedStreamOfFrost();
    this.addCreature(() => this.polar());
  }

  /**
   * Improved Stream Of Frost
   */
  private createImprovedStreamOfFrost() {
    return this.addSpell({
      name: "monster.bear.improvedStreamOfFrost.name",
      description: "monster.bear.improvedStreamOfFrost.description",
      id: BearIds.ImprovedStreamOfFrost,
      options: { renew: 3 },
      icon: SPELLS.Wizard.Fireburst.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      keywords: ["cold", "area"],
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
          castOnSelf: true,
        },
        range: 10,
        probability: 20,
      },
    });
  }

  createCreature(id: MonsterEnum): Bear {
    return new Bear(id);
  }

  /**
   * Polar Bear
   */
  private polar() {
    const polar = this.create({
      monster: MonsterEnum.PolarBear,
      name: "monster.bear.name.polar",
      files: [],
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
        size: { value: "Huge", tall: false, long: true },
        movement: 12,
        items: {
          remove: [
            "B1-12",
            "B1-12M3",
            "BEARPO",
            "BEARPOSU",
            "KALDW1",
            "IMMUNE1",
            "RING95",
            "BEARSPIR",
          ],
        },
        script: {
          remove: ["CBEAR", "BEAR", "kaldran", "gnsummm"],
        },
        immunities: ["coldResistance", "animal"],
      },
    });
    polar.createPaws(1, 10, { diceThrown: 3, diceSize: 6 });
    polar.createJaws(2, 6);
    polar.setBehavior({
      walk: true,
      abilities: [this.ability(BearIds.ImprovedStreamOfFrost)],
      customCodes: [customCodes.wildAnimalsTurningHostile, this.kaldran],
    });
    polar.setAdjustments([
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
                file: this.spell(BearIds.ImprovedStreamOfFrost).file,
                memorizedCount: 1,
              },
            ],
          },
        },
      },
      {
        files: ["BEARPO01", "D9ARPO01", "NTBEARPO", "OBSICE04"],
        stringRef: "monster.bear.name.polar",
      },
      // {
      //   files: ["SPIRBEAR"],
      //   data: {
      //     level1: 10,
      //     immunities: ["incorporeal"],
      //     //TODO: ghost fear aura
      //   },
      // },
    ]);
    return polar;
  }

  kaldran: CustomCode = {
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

export const createPolarBearEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new PolarBearEntry(kins.get(KinEnum.Bear));

import effectFactory from "../../src/factories/effect.factory";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import {
  EffectColorLocationEnum,
  EffectDamageModeEnum,
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  EffectTimingEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../../src/model/spell-item/projectile";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Wolf, WolfIds } from "./kin";

class WinterWolf extends Wolf {
  /**
   * Stream of Frost
   */
  createStreamOfFrost() {
    this.addSpell({
      name: "monster.wolf.ability.streamOfFrost.name",
      description: "monster.wolf.ability.streamOfFrost.description",
      id: WolfIds.StreamOfFrost,
      memorizedCount: 1,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      options: { renew: 10 },
      keywords: ["cold", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          projectile: {
            copyFromFile: "CONECOLD",
            name: "Stream of frost",
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
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              timing: EffectTimingEnum.InstantLimited,
              color: { blue: 255, green: 213, red: 123 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 20,
            },
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
}

class WinterWolfEntry extends CreatureEntry<WinterWolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WinterWolf, kin);
    this.addCreature(() => this.winter());
  }

  createCreature(id: MonsterEnum): WinterWolf {
    return new WinterWolf(id);
  }

  /**
   * Winter Wolf
   */
  private winter() {
    const winter = this.create({
      monster: MonsterEnum.WinterWolf,
      name: "monster.wolf.name.winter",
      files: [],
      data: {
        level1: 6,
        strength: 18,
        dexterity: 13,
        constitution: 14,
        intelligence: 9,
        wisdom: 12,
        charisma: 8,
        ac: 5,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL_EVIL",
        morale: 13,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_WINTER",
        gender: "MALE",
        size: { value: "Large", tall: false, long: true },
        movement: 18,
        immunities: ["magicalBeast"],
        items: {
          remove: ["WOLFWI1", "WOLFWI2"],
        },
        script: {
          remove: ["WNTRWOLF"],
        },
      },
    });
    winter.addTrait({
      immunities: ["cold"],
      effects: effectFactory.fireResistance(-10),
    });
    winter.createStreamOfFrost();
    winter.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    winter.setBehavior({ abilities: [this.ability(WolfIds.StreamOfFrost)] });
    return winter;
  }
}

export const createWinterWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WinterWolfEntry(kins.get(KinEnum.Wolf));

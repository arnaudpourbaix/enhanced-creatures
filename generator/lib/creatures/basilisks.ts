import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { ItemSlot } from "../src/model/creature/item";
import { Durations } from "../src/model/game-data/durations";
import {
  AbilityDamageTypeEnum,
  EffectCastSpellTypeEnum,
  EffectIDSFileEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import {
  AreaProjectileEnum,
  ParticleColorEnum,
  ProjectileAnimationEnum,
  ProjectileExplosionEffectEnum,
  ProjectileTypeEnum,
} from "../src/model/spell-item/projectile";
import { WeaponCastSpell } from "../src/model/spell-item/spell-item";
import poisonService from "../src/services/effects/poison.service";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Projectile,
  Petrification,
}

// Shared across the multiple rule-edition variants of this ability below - same displayed
// ability name, different mechanics per edition.
const PETRIFYING_GAZE_NAME = "monster.basilisk.ability.petrifyingGaze.name";

class Basilisk extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    slot?: ItemSlot;
    castSpell?: WeaponCastSpell;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.spider.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: [p.slot ?? "WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: p.castSpell ? [p.castSpell] : undefined,
    });
  }
}

class BasiliskFamily extends CreatureFamily<Basilisk> {
  constructor() {
    super(MonsterFamilyEnum.Basilisk);
    this.createPetrificationProjectile();
    this.createPetrification2e();
    this.addCreature(() => this.lesser());
    this.addCreature(() => this.greater());
  }

  createCreature(id: MonsterEnum): Basilisk {
    return new Basilisk(id);
  }

  /**
   * Lesser Basilisk
   */
  private lesser() {
    const lesser = this.create({
      monster: MonsterEnum.LesserBasilisk,
      name: "monster.basilisk.name.lesser",
      files: [],
      data: {
        level1: 6,
        bonusHp: 1,
        strength: 16,
        dexterity: 8,
        constitution: 15,
        intelligence: 2,
        wisdom: 8,
        charisma: 7,
        ac: 4,
        apr: 1,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 12,
        general: "MONSTER",
        race: "BASILISK",
        class: "BASILISK",
        gender: "NIETHER",
        size: "Medium",
        movement: 6,
        immunities: ["magicalBeast"],
        items: {
          remove: ["BASILL1", "BASILL2"],
        },
        script: {
          remove: ["LBASILSK"],
          location: "Race",
        },
      },
    });
    lesser.memorizeSpell(this.spell(Ids.Petrification).file, 1);
    lesser.createJaws({
      diceThrown: 1,
      diceSize: 10,
    });
    lesser.setBehavior({
      abilities: [this.ability(Ids.Petrification)],
    });
    return lesser;
  }

  /**
   * Greater Basilisk
   */
  private greater() {
    const greater = this.create({
      monster: MonsterEnum.GreaterBasilisk,
      name: "monster.basilisk.name.greater",
      files: [],
      data: {
        level1: 10,
        strength: 20,
        dexterity: 8,
        constitution: 19,
        intelligence: 7,
        wisdom: 12,
        charisma: 11,
        ac: 2,
        apr: 3,
        xpv: 7000,
        alignment: "NEUTRAL",
        morale: 16,
        general: "MONSTER",
        race: "BASILISK",
        class: "BASILISK_GREATER",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["magicalBeast"],
        items: {
          remove: ["BASILG1", "BASILG2", "BASILG3"],
        },
        script: {
          remove: ["GBASILSK"],
          location: "Race",
        },
      },
    });
    greater.memorizeSpell(this.spell(Ids.Petrification).file, 1);
    greater.addWeapon({
      weapon: {
        stringRef: "monster.basilisk.weapon.claws",
        equippedSlot: ["WEAPON1"],
        icon: MonsterItemIconEnum.Wolf,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 1,
          diceSize: 6,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: [poisonService.getSpell({ poisonType: "K", saveBonus: 4 })],
    });
    greater.createJaws({
      diceThrown: 2,
      diceSize: 8,
      slot: "SHIELD",
      castSpell: {
        spell: {
          name: "monster.basilisk.ability.foulBreath.name",
          description: "monster.basilisk.ability.foulBreath.description",
          secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
          headers: [
            {
              type: ItemAbilityTypeEnum.Ranged,
              projectile: {
                copyFromFile: "dvstink",
                name: "Basilisk foul breath",
                particleColor: ParticleColorEnum.Green,
                areaEffectInfo: {
                  areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
                  explosionDelay: 12,
                  triggerCount: 6,
                  triggerRadius: 64,
                  areaOfEffect: 64, // 5 feet of its mouth
                },
              },
              range: 5,
              target: ItemAbilityTargetEnum.AnyPointWithinRange,
              effects: [
                {
                  opcode: EffectTypeEnum.Slay,
                  idsFile: EffectIDSFileEnum.EA,
                  idsEntry: "ANYONE",
                  timing: EffectTimingEnum.InstantPermanentUntilDeath,
                  saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
                  saveBonus: 2,
                },
                {
                  opcode: EffectTypeEnum.PlaySound,
                  resource: "EFF_P88",
                  timing: EffectTimingEnum.InstantPermanentUntilDeath,
                  saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
                  saveBonus: 2,
                },
                {
                  opcode: EffectTypeEnum.PlayVisualEffect,
                  playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
                  resource: "SPFINGER",
                  timing: EffectTimingEnum.InstantPermanentUntilDeath,
                  saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
                  saveBonus: 2,
                },
              ],
            },
          ],
        },
      },
    });
    greater.setBehavior({
      abilities: [this.ability(Ids.Petrification)],
    });
    greater.setAdjustments([
      {
        files: ["L#NSSULJ"],
        data: {
          level1: 15,
          xpv: 10000,
        },
      },
    ]);
    return greater;
  }

  private createPetrificationProjectile() {
    return this.addProjectile({
      copyFromFile: "gaze",
      name: "Basilisk petrifying gaze",
      id: Ids.Projectile,
      type: ProjectileTypeEnum.AreaOfEffect,
      areaEffectInfo: {
        areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies, AreaProjectileEnum.Coneshaped],
        triggerRadius: 255,
        areaOfEffect: 255, // cone from basilisk, every creature that can see its eyes
        coneWidth: 60,
        fragmentAnimation: ProjectileAnimationEnum.NULL_ANIMATION,
        explosionEffect: ProjectileExplosionEffectEnum.NONE,
      },
    });
  }

  /**
   * Petrification (2e)
   */
  private createPetrification2e() {
    const petrificationSave: { saveTypes: SaveTypeEnum[]; saveBonus: number } = {
      saveTypes: [SaveTypeEnum.PetrifyPolymorph],
      saveBonus: -4,
    };
    return this.addSpell({
      name: PETRIFYING_GAZE_NAME,
      description: "monster.basilisk.ability.petrifyingGaze.description",
      id: Ids.Petrification,
      groups: ["petrification"],
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: {
        renew: 1,
      },
      icon: SPELLS.Wizard.FleshToStone.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          projectile: this.projectile(Ids.Projectile).file,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.Petrification,
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.basilisk.ability.petrifyingGaze.petrified",
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "MISC_06B",
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
              resource: "SPFLESHS.VVC",
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.CreatureRGBColorFade,
              color: { blue: 120, red: 120, green: 120 },
              fadeSpeed: 25,
              ...petrificationSave,
            },
          ],
        },
      ],
      ability: {
        targets: [
          {
            name: "NearestEnemies",
            randomOrder: true,
          },
        ],
        spell: {
          type: "force",
        },
      },
    });
  }

  /**
   * Petrification (5e)
   */
  private createPetrification5e() {
    const petrificationSave: { saveTypes: SaveTypeEnum[]; saveBonus: number } = {
      saveTypes: [SaveTypeEnum.PetrifyPolymorph],
      saveBonus: -4,
    };
    const technical = this.addSpell({
      name: PETRIFYING_GAZE_NAME,
      description: "monster.basilisk.ability.petrifyingGaze.description5e",
      groups: ["petrification"],
      doc: false,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      icon: SPELLS.Wizard.FleshToStone.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          projectile: this.projectile(Ids.Projectile).file,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.Petrification,
              timing: EffectTimingEnum.InstantPermanent,
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.basilisk.ability.petrifyingGaze.petrified",
              timing: EffectTimingEnum.InstantPermanent,
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "MISC_06B",
              timing: EffectTimingEnum.InstantPermanent,
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
              resource: "SPFLESHS.VVC",
              timing: EffectTimingEnum.InstantPermanent,
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.CreatureRGBColorFade,
              color: { blue: 120, red: 120, green: 120 },
              fadeSpeed: 25,
              timing: EffectTimingEnum.InstantPermanent,
              ...petrificationSave,
            },
          ],
        },
      ],
    });
    return this.addSpell({
      name: PETRIFYING_GAZE_NAME,
      description: "monster.basilisk.ability.petrifyingGaze.description5e",
      id: Ids.Petrification,
      groups: ["petrification"],
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: {
        renew: 1,
      },
      icon: SPELLS.Wizard.FleshToStone.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          projectile: this.projectile(Ids.Projectile).file,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.basilisk.ability.petrifyingGaze.turningToStone",
              ...petrificationSave,
            },
            ...effectFactory.restrained({
              duration: 2 * Durations.round,
              ...petrificationSave,
            }),
            {
              opcode: EffectTypeEnum.CastSpell,
              timing: EffectTimingEnum.DelayLimited,
              duration: 2 * Durations.round,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              resource: technical.file,
              ...petrificationSave,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              timing: EffectTimingEnum.DelayLimited,
              duration: 2 * Durations.round,
              ...petrificationSave,
            },
          ],
        },
      ],
      ability: {
        targets: [
          {
            name: "NearestEnemies",
            randomOrder: true,
          },
        ],
        spell: {
          excludeStateChecks: ["STATE_SLOWED"],
          excludeStatsChecks: ["HELD"],
          type: "force",
        },
      },
    });
  }
}

export const createBasilisks = () => new BasiliskFamily();

import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import { createConeOfCold } from "../spells/cone_of_cold";
import { CommonProjectileFiles } from "../spells/projectiles";
import effectFactory from "../src/factories/effect.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureScriptEdit } from "../src/model/creature/data";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import { Effect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectCastSpellTypeEnum,
  EffectDamageTypeEnum,
  EffectHasteTypeEnum,
  EffectIDSFileEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
  SaveTypeEnum,
  WingBuffetDirectionEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AreaProjectileEnum, ParticleColorEnum } from "../src/model/spell-item/projectile";
import { WeaponCastSpell } from "../src/model/spell-item/spell-item";
import { StringRefUtils } from "../src/services/utils/string-ref.utils";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Charge,
  CloudOfPoisonousGas,
  ConeOfCold,
  Haste,
  HideousLaugh,
  WildMagicFlare,
}

class Golem extends Creature {
  createFists({
    diceThrown,
    diceSize,
    damageType,
    castSpell,
    effects,
  }: {
    diceThrown: number;
    diceSize: number;
    damageType?: AbilityDamageTypeEnum;
    castSpell?: WeaponCastSpell;
    effects?: Effect[];
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.golem.weapon.fists",
        icon: MonsterItemIconEnum.Fist,
        equippedSlot: ["WEAPON1"],
        header: {
          diceThrown,
          diceSize,
          damageType: damageType ?? AbilityDamageTypeEnum.Crushing,
          type: ItemAbilityTypeEnum.Melee,
          speed: 4,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects,
        },
      },
      castSpells: castSpell ? [castSpell] : undefined,
    });
  }

  createMagicalBlast() {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.golem.weapon.magicalBlast",
        icon: MonsterItemIconEnum.FireElemental,
        equippedSlot: ["WEAPON1"],
        header: {
          range: 50,
          diceThrown: 0,
          diceSize: 0,
          damageType: AbilityDamageTypeEnum.Missile,
          type: ItemAbilityTypeEnum.Ranged,
          speed: 4,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          projectile: "SPBEHBLA",
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Magic,
              diceThrown: 3,
              diceSize: 10,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.AlterationAir,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
            },
          ],
        },
      },
    });
  }

  /**
   * Wild Magic Flare
   */
  createWildMagicFlare() {
    // TODO:
    // cast as a 16th level
    // 20%	Magical blast
    // 10%	Chain lightning
    // 10%	Dispel magic
    // 10%	Fire shield
    // 10%	Color spray in a 360' radius
    // 20%	Fireball centered on golem
    // 10%	Time stop
    // 10%	Earthquake
    return this.addSpell({
      name: "monster.golem.ability.wildMagicFlare.name",
      description: "monster.golem.ability.wildMagicFlare.description",
      id: Ids.WildMagicFlare,
      memorizedCount: 1,
      icon: SPELLS.Wizard.NahalRecklessDweomer.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          projectile: {
            copyFromFile: "GOLCLOUD",
            name: "Golem poison cloud",
            particleColor: ParticleColorEnum.Green,
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
              explosionDelay: 12,
              triggerCount: 10, // 6 or 10
              triggerRadius: 128,
              areaOfEffect: 128, //  10-foot cube
            },
          },
          speed: 1,
          effects: [],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        range: 10,
        spell: {
          type: "reallyForce",
          selfTarget: true,
          remove: true,
        },
      },
    });
  }

  /**
   * Haste
   */
  createHaste() {
    return this.addSpell({
      name: "monster.golem.ability.haste",
      id: Ids.Haste,
      memorizedCount: 1,
      castingSound: "CAS_P04",
      icon: SPELLS.Wizard.Haste.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveSpellTypeProtections,
              maximumLevel: 9,
              type: "K1#SLOW",
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.Haste,
              type: EffectHasteTypeEnum.NormalHaste,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Haste,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.AlterationAir,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.CreatureRGBColorFade,
              color: {
                red: 60,
                green: 60,
                blue: 120,
              },
              fadeSpeed: 25,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: StringRefUtils.getStringId("Hasted"),
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource: "EFF_M28",
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.DelayPermanent,
              duration: 3 * Durations.round,
              resource: "EFF_M29",
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "reallyForce",
          excludeStateChecks: ["STATE_HASTED"],
          selfTarget: true,
          remove: true,
        },
        triggers: [{ name: "Delay", params: [6] }],
      },
    });
  }

  /**
   * Hideous Laugh
   */
  createHideousLaugh() {
    return this.addSpell({
      name: "monster.golem.ability.hideousLaugh",
      id: Ids.HideousLaugh,
      memorizedCount: 1,
      icon: SPELLS.Priest.CloakOfFear.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: { renew: 3 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 1,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: effectFactory.fear({
            duration: 7 * Durations.round,
            saveType: SaveTypeEnum.Spell,
          }),
        },
      ],
      ability: {
        preset: SPELLS.Priest.CloakOfFear.file,
        spell: {
          type: "force",
          remove: true,
        },
      },
    });
  }

  /**
   * Charge
   */
  createCharge() {
    //TODO: this is a poor implementation of a charge
    // Anyone caught in the path of a juggernaut charge is run over by the thundering behemoth,
    // though the juggernaut must make a normal attack roll if the victim can avoid the charge.
    // A hit indicates that the victim is crushed, suffering 10d10 points of damage
    const attack = this.createFists({
      diceSize: 10,
      diceThrown: 10,
      damageType: AbilityDamageTypeEnum.Crushing,
    });
    const duration = 3 * Durations.round;
    const peakCharge = this.addSpell({
      name: "monster.golem.ability.charge.peakSpeed",
      icon: SPELLS.Wizard.Haste.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(12),
              duration,
            },
            {
              opcode: EffectTypeEnum.CreateWeapon,
              amount: 1,
              resource: attack.file,
              target: EffectTargetEnum.Self,
              duration,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.golem.ability.charge.end",
              timing: EffectTimingEnum.DelayPermanent,
              duration,
            },
          ],
        },
      ],
    });
    return this.addSpell({
      name: "monster.golem.ability.charge.name",
      description: "monster.golem.ability.charge.description",
      id: Ids.Charge,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Haste.file,
      options: { renew: 6 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(6),
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.round,
            },
            {
              ...effectFactory.naturalMovementSpeed(9),
              timing: EffectTimingEnum.DelayLimited,
              duration: Durations.round,
            },
            {
              opcode: EffectTypeEnum.CastSpell,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              timing: EffectTimingEnum.DelayPermanent,
              duration: 2 * Durations.round,
              resource: peakCharge.file,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "force",
          selfTarget: true,
          remove: true,
        },
        triggers: [{ name: "Range", params: ["NearestEnemyOf", 5], negation: true }],
      },
    });
  }

  /**
   * Cloud of poisonous gas
   */
  createCloudOfPoisonousGas() {
    return this.addSpell({
      name: "monster.golem.ability.cloudOfPoisonousGas.name",
      description: "monster.golem.ability.cloudOfPoisonousGas.description",
      id: Ids.CloudOfPoisonousGas,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Cloudkill.file,
      options: { renew: 7 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          projectile: {
            copyFromFile: "GOLCLOUD",
            name: "Golem poison cloud",
            particleColor: ParticleColorEnum.Green,
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
              explosionDelay: 12,
              triggerCount: 10, // 6 or 10
              triggerRadius: 128,
              areaOfEffect: 128, //  10-foot cube
            },
          },
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.UseEFFFile,
              idsFile: EffectIDSFileEnum.GENERAL,
              idsEntry: "UNDEAD",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: "POISON_IMMUNITY",
              timing: EffectTimingEnum.InstantLimited,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Poison,
              diceThrown: 1,
              diceSize: 10,
              saveTypes: [SaveTypeEnum.BypassMirrorImage],
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              maxLevel: 4,
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              minLevel: 5,
              maxLevel: 6,
              saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
              saveBonus: -4,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        range: 10,
        spell: {
          type: "reallyForce",
          selfTarget: true,
          remove: true,
        },
      },
    });
  }

  /**
   * Cone of cold
   */
  createConeOfCold() {
    // Snow golems are able to breathe a cone of cold once every five rounds.
    // This functions as if the spell of that name were being cast by a 10th level wizard.
    return this.addSpell(
      createConeOfCold({
        id: Ids.ConeOfCold,
        description: "monster.golem.ability.coneOfCold",
        memorizedCount: 1,
        options: { renew: 5 },
        headers: [
          {
            minLevel: 1,
            damage: {
              diceThrown: 10,
              diceSize: 4,
              amount: 10,
            },
          },
          {
            minLevel: 18,
            damage: {
              diceThrown: 15,
              diceSize: 4,
              amount: 15,
            },
          },
        ],
      }),
    );
  }
}

class GolemFamily extends CreatureFamily<Golem> {
  constructor() {
    super(MonsterFamilyEnum.Golem);
    this.addCreature(() => this.flesh());
    this.addCreature(() => this.sand());
    this.addCreature(() => this.clay());
    this.addCreature(() => this.lesserClay());
    this.addCreature(() => this.greaterClay());
    this.addCreature(() => this.stone());
    this.addCreature(() => this.lesserStone());
    this.addCreature(() => this.iron());
    this.addCreature(() => this.bone());
    this.addCreature(() => this.juggernaut());
    this.addCreature(() => this.snow());
    this.addCreature(() => this.magic());
    this.addCreature(() => this.adamantite());
    this.addCreature(() => this.wax());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Flesh Golem
   */
  private flesh() {
    const flesh = this.create({
      monster: MonsterEnum.FleshGolem,
      name: "monster.golem.name.flesh",
      files: [],
      data: {
        level1: 9,
        strength: 19,
        dexterity: 9,
        constitution: 18,
        intelligence: 3,
        wisdom: 10,
        charisma: 5,
        ac: 9,
        apr: 2,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_FLESH",
        gender: "NIETHER",
        size: "Large",
        modAnimation: "A7!GOLEM_FLESH_PST",
        movement: 8,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "GOLCLA", "IMMUNE1", "B2-16"],
        },
      },
    });
    flesh.addTrait({
      immunities: ["magic", "fire", "cold", "nonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    flesh.createFists({ diceThrown: 2, diceSize: 8 });
    flesh.setBehavior({
      restHeal: true,
    });
    flesh.setAdjustments([
      {
        files: ["ARNGOL01", "L#XZEGOL", "IGOLFLE1", "IGOLFLE2", "IGOLFLE3", "IGOLFLE4", "BDGOLEMF"],
        stringRef: "monster.golem.name.flesh",
      },
      // { files: ["BDGOLEMF"], data: {} }, // TODO: need to keep effect #114 (dither)
    ]);
    return flesh;
  }

  /**
   * Wax Golem
   */
  private wax() {
    const wax = this.create({
      monster: MonsterEnum.WaxGolem,
      name: "monster.golem.name.wax",
      files: [],
      data: {
        level1: 8,
        strength: 18,
        exceptionalStrength: 90,
        dexterity: 9,
        constitution: 18,
        intelligence: 9,
        wisdom: 11,
        charisma: 1,
        ac: 4,
        apr: 1,
        xpv: 5000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_FLESH",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "IMMUNE1"],
        },
      },
    });
    wax.addTrait({
      immunities: ["magic", "lightning", "cold"],
      effects: effectFactory.fireResistance(-30),
    });
    wax.createFists({
      diceThrown: 2,
      diceSize: 6,
      effects: effectFactory.levelDrain({ levels: 1, saveType: SaveTypeEnum.ParalyzePoisonDeath }),
    });
    wax.setBehavior({
      restHeal: true,
    });
    return wax;
  }

  /**
   * Sand Golem
   */
  private sand() {
    const sand = this.create({
      monster: MonsterEnum.SandGolem,
      name: "monster.golem.name.sand",
      files: [],
      data: {
        level1: 8,
        strength: 16,
        dexterity: 12,
        constitution: 16,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 3,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_FLESH",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "GOLCLA"],
        },
      },
    });
    sand.addTrait({
      // immune to all transmutation spells
      // immune to any spells cast by creatures of less than 3rd level
      immunities: [],
      effects: [],
    });
    // Suffocate a victim within themselves.
    // On any attack roll that hits a foe, a save versus paralysis must be made.
    // Failure indicates that the target has been drawn into the body of the golem.
    // If this happens, the target takes 2d10 points of damage
    // and then an additional 1d10 points each subsequent round until it dies.
    // Breaking free of a sand golem's suffocation requires a Strength check at a -5 penalty.
    sand.createFists({ diceThrown: 2, diceSize: 6 });
    sand.setBehavior({
      restHeal: true,
    });
    sand.setAdjustments([]);
    return sand;
  }

  /**
   * Clay Golem
   */
  private clay() {
    const clay = this.create({
      monster: MonsterEnum.ClayGolem,
      name: "monster.golem.name.clay",
      files: [],
      data: {
        level1: 11,
        strength: 20,
        dexterity: 9,
        constitution: 18,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 7,
        apr: 1,
        xpv: 5000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_CLAY",
        gender: "NIETHER",
        size: "Large",
        movement: 7,
        immunities: ["construct"],
        items: {
          remove: [
            "GOLCLA",
            "GOLFLE",
            "GOLIRO",
            "OHBGOL01",
            "B3-30",
            "RING95",
            "IMMUNE1",
            "IMMUNE2",
            "IMMUNE3",
            "IRONGOL",
            "D5CLGOL",
            "HELMNOAN",
          ],
        },
        script: {
          remove: ["GOLCLY01", "BPFHT", "OHBNONIN", "O#BrynFi"],
        },
      },
    });
    clay.addTrait({
      immunities: [
        "magic",
        "nonMagicalWeapons",
        "slashingDamage",
        "piercingDamage",
        "missileDamage",
      ],
    });
    clay.createHaste();
    clay.createFists({ diceThrown: 3, diceSize: 10 });
    clay.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.Haste)],
    });
    clay.setAdjustments([
      { files: ["OBSGOL01", "IGOLEM01"], data: { script: { location: "None" } } },
    ]);
    return clay;
  }

  /**
   * Lesser Clay Golem
   */
  private lesserClay() {
    const lesserClay = this.createFrom({
      from: this.creature(MonsterEnum.ClayGolem),
      monster: MonsterEnum.LesserClayGolem,
      name: "monster.golem.name.lesserClay",
    });
    lesserClay.setData({
      level1: 9,
      strength: 19,
      xpv: 3000,
    });
    lesserClay.addTrait({
      immunities: [
        "magic",
        "nonMagicalWeapons",
        "slashingDamageResistance",
        "piercingDamageResistance",
        "missileDamageResistance",
      ],
    });
    return lesserClay;
  }

  /**
   * Greater Clay Golem
   */
  private greaterClay() {
    const greaterClay = this.createFrom({
      from: this.creature(MonsterEnum.ClayGolem),
      monster: MonsterEnum.GreaterClayGolem,
      name: "monster.golem.name.greaterClay",
    });
    greaterClay.setData({
      level1: 14,
      strength: 22,
      xpv: 8000,
      script: {
        edits: [
          {
            files: ["OHB_T302"],
            replaces: [["ReallyForceSpell(Myself,GOLEM_HASTE)", "Continue()"]],
          },
        ],
      },
    });
    greaterClay.addTrait({
      immunities: [
        "magic",
        "nonMagicalWeapons",
        "slashingDamage",
        "piercingDamage",
        "missileDamage",
        "crushingDamageResistance",
      ],
    });
    greaterClay.setAdjustments([
      { files: ["OHBGOL01"], data: { level1: 26, xpv: 0, ac: -1 }, noWeapon: true },
    ]);
    return greaterClay;
  }

  /**
   * Stone Golem
   */
  private stone() {
    const stone = this.create({
      monster: MonsterEnum.StoneGolem,
      name: "monster.golem.name.stone",
      files: [],
      data: {
        level1: 14,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 8000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE", "GOLSTO", "GOLSTONE", "IMMUNE2", "IMMUNE1", "HELMNOAN", "B3-24"],
        },
        script: {
          remove: ["GOLSTO01", "OHBNONIN"],
        },
        spells: {
          memorized: [{ file: SPELLS.Wizard.Slow.file, memorizedCount: 1 }],
        },
      },
    });
    stone.addTrait({
      immunities: ["magic", "plusOneWeapons"],
    });
    stone.createFists({ diceThrown: 3, diceSize: 8 });
    stone.setBehavior({
      restHeal: true,
      abilities: [
        {
          preset: SPELLS.Wizard.Slow.file,
          spell: {
            type: "reallyForce",
            selfTarget: true,
            remove: true,
          },
          requireVocal: false,
          range: 10,
          timer: { name: "Slow", value: 12 },
        },
      ],
    });
    return stone;
  }

  /**
   * Lesser Stone Golem
   */
  private lesserStone() {
    const lesserStone = this.createFrom({
      from: this.creature(MonsterEnum.StoneGolem),
      monster: MonsterEnum.LesserStoneGolem,
      name: "monster.golem.name.lesserStone",
    });
    lesserStone.setData({
      level1: 10,
      strength: 20,
      xpv: 4000,
      script: {
        edits: [
          {
            files: ["bdpetsg", "bdpetsgs"],
            replaces: [["ReallyForceSpell(Myself,GOLEM_SLOW)", "Continue()"]],
          },
        ],
      },
    });
    lesserStone.setAdjustments([
      { files: ["ARGHH", "UGHH"], data: { level1: 14, strength: 22, xpv: 6000 } },
    ]);
    return lesserStone;
  }

  /**
   * Iron Golem
   */
  private iron() {
    const iron = this.create({
      monster: MonsterEnum.IronGolem,
      name: "monster.golem.name.iron",
      files: [],
      data: {
        level1: 18,
        strength: 24,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 3,
        apr: 1,
        xpv: 13000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_IRON",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLIRO", "IRONGOL", "IMMUNE3", "HELMNOAN"],
        },
        script: {
          remove: ["GOLIRO01"],
        },
      },
    });
    iron.addTrait({
      immunities: ["magic", "plusTwoWeapons", "lightning"],
      effects: effectFactory.fireResistance(125),
    });
    iron.createCloudOfPoisonousGas();
    iron.createFists({ diceThrown: 4, diceSize: 10 });
    iron.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.CloudOfPoisonousGas)],
    });
    iron.setAdjustments([
      {
        files: ["OHBBANNO"],
        data: {
          level1: 30,
          script: { location: "None" },
          //TODO: need to keep effects 293, 101, 267
          // resistances: physical 90%, cold 100%, fire: 127%, acid: 100%
        },
      },
    ]);
    return iron;
  }

  /**
   * Adamantite Golem
   */
  private adamantite() {
    const adamantite = this.create({
      monster: MonsterEnum.AdamantiteGolem,
      name: "monster.golem.name.adamantite",
      files: [],
      data: {
        level1: 18,
        strength: 24,
        dexterity: 10,
        constitution: 25,
        intelligence: 3,
        wisdom: 16,
        charisma: 1,
        ac: 3,
        apr: 1,
        xpv: 13000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_IRON",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLIRO", "IRONGOL", "IMMUNE3"],
        },
      },
    });

    adamantite.addTrait({
      immunities: ["plusTwoWeapons", "magic", "lightning", "cold", "acid"],
      effects: [...effectFactory.fireResistance(125), ...effectFactory.physicalResistance(90)],
    });
    // TODO: create Trample, 2 uses per day (see golem's mod)
    adamantite.createFists({ diceThrown: 4, diceSize: 10 });
    adamantite.setBehavior({
      restHeal: true,
      // abilities: [this.ability(Ids.CloudOfPoisonousGas)],
    });
    return adamantite;
  }

  /**
   * Bone Golem
   */
  private bone() {
    const bone = this.create({
      monster: MonsterEnum.BoneGolem,
      name: "monster.golem.name.bone",
      files: [],
      data: {
        level1: 14,
        strength: 17,
        dexterity: 13,
        constitution: 16,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 0,
        apr: 1,
        xpv: 18000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["construct", "skeletal"],
        items: {
          remove: ["S3-8M3", "GOLCLA", "IMMUNE1", "IMMUNE2", "HELMNOAN"],
        },
        script: {
          remove: ["OHBNONIN"],
        },
      },
    });
    bone.addTrait({
      immunities: ["magic", "fire", "cold"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    bone.createHideousLaugh();
    bone.createFists({ diceThrown: 3, diceSize: 8, damageType: AbilityDamageTypeEnum.Slashing });
    bone.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.HideousLaugh)],
    });
    bone.setAdjustments([
      {
        files: ["OHBGOLB1"],
        data: {
          level1: 25,
          xpv: 0,
        },
      },
    ]);
    return bone;
  }

  /**
   * Juggernaut Golem
   */
  private juggernaut() {
    const juggernaut = this.create({
      monster: MonsterEnum.JuggernautGolem,
      name: "monster.golem.name.juggernaut",
      files: [],
      data: {
        level1: 18,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 2,
        apr: 2,
        xpv: 11000,
        alignment: "NEUTRAL",
        morale: 16,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Large",
        animation: "GOLEM_CLAY",
        movement: 3,
        immunities: ["construct"],
        items: {
          remove: ["IRONGOL", "IMMUNE1", "IMMUNE2", "GOLTOME4"],
        },
        script: {
          remove: ["GOLSTO01", "GOLIRO01", "TOMEGOL4"],
        },
      },
    });
    juggernaut.addTrait({ immunities: ["magic", "fire"] });
    juggernaut.createCharge();
    juggernaut.createFists({ diceThrown: 2, diceSize: 6 });
    juggernaut.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.Charge)],
    });
    return juggernaut;
  }

  /**
   * Snow Golem
   */
  private snow() {
    const edits: CreatureScriptEdit[] = [
      {
        files: ["gorgoli"],
        replaces: [["ReallyForceSpell(NearestEnemyOf(Myself),WIZARD_CONE_OF_COLD)", "Continue()"]],
      },
    ];
    const snow = this.create({
      monster: MonsterEnum.SnowGolem,
      name: "monster.golem.name.snow",
      files: [],
      data: {
        level1: 12,
        strength: 19,
        dexterity: 6,
        constitution: 14,
        intelligence: 3,
        wisdom: 6,
        charisma: 1,
        ac: 1,
        apr: 2,
        xpv: 7000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Large",
        movement: 9,
        immunities: ["construct"],
        items: {
          remove: [
            "UBSNORNG",
            "UBSNOFST",
            "B2-24M3",
            "IMMUNE1",
            "IMMUNE3",
            "GOLSTONE",
            "IMMCHS",
            "IRONGOL",
            "GOLIRO",
            "INVULNER",
            "GORMISTI",
          ],
        },
        script: {
          remove: ["GOLICE01"],
          edits,
        },
      },
    });
    snow.addTrait({
      immunities: ["plusOneWeapons", "lightning"],
      effects: [
        {
          opcode: EffectTypeEnum.ColdResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
        {
          opcode: EffectTypeEnum.MagicalColdResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    snow.createConeOfCold();
    edits.push({
      files: ["ubsnogol"],
      replaces: [
        [
          `ForceSpellRES("UBSNOBR",LastSeenBy(Myself))`,
          `ForceSpellRES("${this.spell(Ids.ConeOfCold).file}",LastSeenBy(Myself))`,
        ],
      ],
    });
    snow.createFists({ diceThrown: 2, diceSize: 12 });
    snow.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.ConeOfCold)],
    });
    snow.setAdjustments([
      { files: ["D9LICE01", "GOLICE01", "WQXGOL"], data: { level1: 20, xpv: 12000 } },
      { files: ["GORGOLI"], data: { level1: 18 } },
    ]);
    return snow;
  }

  /**
   * Magic Golem
   */
  private magic() {
    const magic = this.create({
      monster: MonsterEnum.MagicGolem,
      name: "monster.golem.name.magic",
      files: [],
      data: {
        level1: 8,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: -2,
        apr: 1,
        xpv: 8000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_CLAY",
        gender: "NIETHER",
        size: "Large",
        movement: 18,
        immunities: ["construct"],
        items: {
          remove: ["GOLMAG01"],
        },
        script: {
          remove: ["GOLMAG01", "O#LLENEM"],
        },
      },
    });
    magic.addTrait({
      immunities: ["magic", "fire", "cold", "lightning", "acid", "magicalWeapons"],
    });
    // TODO:
    // Magic golems absorb all magical energy within a 20-foot radius.
    // Spells are instantly absorbed as they are cast.
    // Running spells are terminated and absorbed at the end of one round,
    // with the two exceptions noted below.
    // Charged magical items lose 1d6 charges per round.
    // magic.createWildMagicFlare();
    magic.createMagicalBlast();
    magic.setBehavior({
      restHeal: true,
      //abilities: [this.ability(Ids.WildMagicFlare)],
    });
    magic.setAdjustments([]);
    return magic;
  }
}

export const createGolems = () => new GolemFamily();

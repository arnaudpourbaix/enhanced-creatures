import { NEW_CREATURES, VAPOR_IMMUNE_CREATURES } from "../config/creatures";
import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import effectFactory from "../src/factories/effect.factory";
import { RawCreatureAbility } from "../src/model/creature/ability";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import { Triggers } from "../src/model/script/triggers";
import { BaseEffect, Effect, IdsEffect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  AttackModifierTypeEnum,
  CastingFailureTypeEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  PortraitIconEnum,
  SaveTypeEnum,
  SummonCreatureModeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AreaProjectileEnum, ParticleColorEnum } from "../src/model/spell-item/projectile";
import { TranslationKey } from "../translations/i18n";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  BlackPuddingSplit,
  WhitePuddingSplit,
  MustardJellySplit,
  ToxicVapors,
}

class Slime extends Creature {
  createPseudopod(diceThrown: number, diceSize: number, effects?: Effect[]) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.slime.weapon.pseudopod",
        icon: MonsterItemIconEnum.Jelly,
        equippedSlot: ["WEAPON1"],
        header: {
          diceThrown,
          diceSize,
          effects,
          type: ItemAbilityTypeEnum.Melee,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 4,
          range: 5,
          animationSwing: { backhand: 100, overhand: 0, thrust: 0 },
          projectile: "ACIDBLMU",
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }

  /**
   * Split
   */
  createSplit({
    id,
    description,
    resource,
    visualEffect,
    withTriggers,
  }: {
    id: number;
    description: TranslationKey;
    resource: string;
    visualEffect: string;
    withTriggers: boolean;
  }) {
    return this.addSpell({
      id,
      description,
      name: "monster.slime.ability.split.name",
      icon: SPELLS.Wizard.MirrorImages.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Magical,
          target: ItemAbilityTargetEnum.Caster,
          effects: [
            {
              opcode: EffectTypeEnum.PlayVisualEffect,
              playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
              resource: visualEffect,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.SummonCreature,
              mode: SummonCreatureModeEnum.MatchTarget3,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource,
            },
            {
              opcode: EffectTypeEnum.SummonCreature,
              mode: SummonCreatureModeEnum.MatchTarget3,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource,
            },
            {
              opcode: EffectTypeEnum.RemoveCreature,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
          ],
        },
      ],
      ability: this.getSplitAbility(withTriggers),
    });
  }
  private getSplitAbility(withTriggers: boolean): RawCreatureAbility {
    const triggers: Triggers.Trigger[] = [
      {
        name: "Or",
        triggers: [
          { name: "HitBy", params: ["ANYONE", "ELECTRICITY"] },
          { name: "HitBy", params: ["ANYONE", "SLASHING"] },
          { name: "HitBy", params: ["ANYONE", "PIERCING"] },
          { name: "HitBy", params: ["ANYONE", "CRUSHING"] },
          { name: "HitBy", params: ["ANYONE", "MISSILE"] },
        ],
      },
    ];
    return {
      spell: {
        type: "force",
        selfTarget: true,
        remove: true,
      },
      triggers: withTriggers ? triggers : [],
      probability: 100,
    };
  }
}

class SlimeFamily extends CreatureFamily<Slime> {
  constructor() {
    super(MonsterFamilyEnum.Ooze);
    this.createToxicVapors();
    this.addCreature(() => this.blackPudding());
    this.addCreature(() => this.whitePudding());
    this.addCreature(() => this.mustardJelly());
    this.addCreature(() => this.fissionSlime());
    this.addCreature(() => this.grayOoze());
    this.addCreature(() => this.greenSlime());
    this.addCreature(() => this.ochreJelly());
    this.addCreature(() => this.oliveSlimeCreature());
    this.addCreature(() => this.slitheringTracker());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Black Pudding
   */
  private blackPudding() {
    const black = this.create({
      monster: MonsterEnum.BlackPudding,
      name: "monster.slime.name.black",
      files: [NEW_CREATURES.SplitBlackPudding],
      newFiles: [
        {
          files: [NEW_CREATURES.SplitBlackPudding],
          copyFrom: NEW_CREATURES.BlackPudding,
        },
      ],
      data: {
        level1: 10,
        thac0: 11,
        strength: 16,
        dexterity: 5,
        constitution: 16,
        intelligence: 1,
        wisdom: 6,
        charisma: 1,
        ac: 6,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 12,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        animation: "BLACK_PUDDING",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["ooze"],
        items: {
          remove: ["HELMNOAN", "RING95", "BDPUDDBL"],
        },
        script: {
          remove: ["BDPUDDBL"],
        },
        effects: {
          remove: true,
        },
      },
    });
    black.createSplit({
      id: Ids.BlackPuddingSplit,
      description: "monster.slime.ability.split.puddingDesc",
      resource: NEW_CREATURES.SplitBlackPudding,
      visualEffect: "BDGOOYAA",
      withTriggers: true,
    });
    black.addTrait({
      // 5e: Damage Immunities: Lightning, Slashing
      // description overrides the auto-generated immunity bullets so the split trait (a
      // passive, always-on behavior that the doc generator otherwise has no way to list - see
      // monster.ts's slime.trait.split comment) can be folded into the same trait entry.
      description: "monster.slime.trait.split.pudding",
      immunities: ["acid", "cold", "poison"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 90,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    // TODO: In addition, nonmagical armor worn by the target is partly dissolved and takes a permanent and cumulative −1 penalty to the AC it offers.
    // The armor is destroyed if the penalty reduces its AC to 10.
    black.createPseudopod(0, 0, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 3,
        diceSize: 8,
      },
    ]);
    black.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.BlackPuddingSplit)],
    });
    black.setAdjustments([
      {
        files: [NEW_CREATURES.SplitBlackPudding],
        data: {
          hp: 50, // a little less than half hp since it splits after taking some damage
          xpv: 1000,
          spells: { removeMemorized: true },
        },
      },
    ]);
    return black;
  }

  /**
   * White Pudding
   */
  private whitePudding() {
    const white = this.create({
      monster: MonsterEnum.WhitePudding,
      name: "monster.slime.name.white",
      files: [NEW_CREATURES.SplitWhitePudding],
      newFiles: [
        {
          files: [NEW_CREATURES.SplitWhitePudding],
          copyFrom: NEW_CREATURES.WhitePudding,
        },
      ],
      data: {
        level1: 9,
        thac0: 11,
        strength: 16,
        dexterity: 5,
        constitution: 16,
        intelligence: 1,
        wisdom: 6,
        charisma: 1,
        ac: 8,
        apr: 1,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 12,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        animation: "GRAY_OOZE",
        gender: "NIETHER",
        size: "Large",
        movement: 9,
        immunities: ["ooze"],
        items: {
          remove: ["IMMUNE1", "RING95", "AC#FPWPU"],
        },
        effects: { remove: true },
      },
    });
    white.addTrait({
      // 5e: Damage Immunities: Lightning, Slashing
      description: "monster.slime.trait.split.pudding",
      immunities: ["acid", "cold", "poison"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 90,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    white.createSplit({
      id: Ids.WhitePuddingSplit,
      description: "monster.slime.ability.split.puddingDesc",
      resource: NEW_CREATURES.SplitWhitePudding,
      visualEffect: "BDGOOYAA",
      withTriggers: true,
    });
    white.createPseudopod(0, 0, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 7,
        diceSize: 4,
      },
    ]);
    white.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.WhitePuddingSplit)],
    });
    white.setAdjustments([
      {
        files: [NEW_CREATURES.SplitWhitePudding],
        data: {
          hp: 45, // a little less than half hp since it splits after taking some damage
          xpv: 700,
          spells: { removeMemorized: true },
        },
      },
    ]);
    return white;
  }

  /**
   * Mustard Jelly
   */
  private mustardJelly() {
    const mustard = this.create({
      monster: MonsterEnum.MustardJelly,
      name: "monster.slime.name.mustard",
      files: [NEW_CREATURES.SplitMustardJelly],
      newFiles: [
        {
          files: [NEW_CREATURES.SplitMustardJelly],
          copyFrom: NEW_CREATURES.MustardJelly,
          stringRef: "monster.slime.name.SmallerMustard",
        },
      ],
      data: {
        level1: 7,
        bonusHp: 14,
        strength: 15,
        dexterity: 10,
        constitution: 21,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ac: 4,
        apr: 1,
        xpv: 4000,
        alignment: "NEUTRAL",
        morale: 14,
        general: "MONSTER",
        race: "SLIME",
        class: "MUSTARD_JELLY",
        gender: "NIETHER",
        size: "Large",
        movement: 9,
        immunities: ["ooze"],
        items: {
          remove: ["IMMUNE1", "RING95", "JELLMU1", "DW#JELMU"],
        },
        spells: {
          memorized: [{ file: this.spell(Ids.ToxicVapors).file, memorizedCount: 1 }],
        },
      },
    });
    mustard.addTrait({
      description: "monster.slime.trait.split.mustard",
      immunities: ["lightning", "nonMagicalWeapons", "magicMissile", "coldResistance"],
      // 5e: Immunity to magic damage
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 10,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    mustard.createSplit({
      id: Ids.MustardJellySplit,
      description: "monster.slime.ability.split.mustardDesc",
      resource: NEW_CREATURES.SplitMustardJelly,
      visualEffect: "TRGOOYAA",
      withTriggers: false,
    });
    mustard.createPseudopod(2, 4, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 3,
        diceSize: 4,
      },
    ]);
    mustard.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.MustardJellySplit), this.ability(Ids.ToxicVapors)],
    });
    mustard.setAdjustments([
      { files: ["PLYJELL1"], data: { script: { location: "None" } } },
      {
        files: [NEW_CREATURES.SplitMustardJelly],
        data: {
          hp: 56,
          xpv: 2000,
          movement: 18,
          spells: {
            removeMemorized: [this.spell(Ids.MustardJellySplit).file],
          },
          size: "Medium",
        },
      },
    ]);
    return mustard;
  }

  /**
   * Fission Slime
   */
  private fissionSlime() {
    const fission = this.create({
      monster: MonsterEnum.FissionSlime,
      name: "monster.slime.name.fission",
      files: [],
      data: {
        level1: 12,
        bonusHp: 14,
        strength: 15,
        dexterity: 10,
        constitution: 21,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ac: 4,
        apr: 1,
        xpv: 5000,
        alignment: "NEUTRAL",
        morale: 14,
        general: "MONSTER",
        race: "SLIME",
        class: "MUSTARD_JELLY",
        gender: "NIETHER",
        size: "Large",
        movement: 9,
        immunities: ["ooze"],
        items: {
          remove: ["IMMUNE1", "RING95", "JELLMU2", "DW#JELM2"],
        },
        spells: {
          memorized: [{ file: this.spell(Ids.ToxicVapors).file, memorizedCount: 1 }],
        },
        effects: {
          remove: true,
        },
      },
    });
    fission.addTrait({
      description: "monster.slime.trait.fission",
      immunities: ["lightning", "nonMagicalWeapons", "magicMissile", "coldResistance"],
      // 5e: Immunity to magic damage
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 10,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    fission.createPseudopod(3, 6, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 3,
        diceSize: 6,
      },
    ]);
    fission.setBehavior({
      restHeal: true,
      // no split ability since it is handled by existing scripts
      // fission slime is not an official monster, so no rule to follow
      abilities: [this.ability(Ids.ToxicVapors)],
    });
    return fission;
  }

  /**
   * Gray Ooze
   */
  private grayOoze() {
    const gray = this.create({
      monster: MonsterEnum.GrayOoze,
      name: "monster.slime.name.gray",
      files: [],
      data: {
        level1: 3,
        bonusHp: 3,
        thac0: 17,
        strength: 12,
        dexterity: 6,
        constitution: 16,
        intelligence: 1,
        wisdom: 6,
        charisma: 2,
        ac: 8,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        gender: "NIETHER",
        size: "Large",
        movement: 1,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "OOZEGR1", "DW#OOZEG"],
        },
      },
    });
    // 5e:
    // Acid (Ex): A gray ooze secretes a digestive acid that quickly dissolves organic material and metal, but not stone. Any melee hit or constrict attack deals acid damage. Armor or clothing dissolves and becomes useless immediately unless it succeeds on a DC 16 Reflex save. A metal or wooden weapon that strikes a gray ooze also dissolves immediately unless it succeeds on a DC 16 Reflex save. The save DCs are Constitution-based.
    // The ooze’s acidic touch deals 16 points of damage per round to wooden or metal objects, but the ooze must remain in contact with the object for 1 full round to deal this damage.
    // Constrict (Ex): A gray ooze deals automatic slam and acid damage with a successful grapple check. The opponent’s clothing and armor take a –4 penalty on Reflex saves against the acid.
    // Improved Grab (Ex): To use this ability, a gray ooze must hit with its slam attack. It can then attempt to start a grapple as a free action without provoking an attack of opportunity. If it wins the grapple check, it establishes a hold and can constrict.
    gray.addTrait({
      // Spells have no effect on this monster, nor do fire- or cold-based attacks. Lightning and blows from weapons cause full damage.
      // Note that weapons striking a gray ooze may corrode and break.
      immunities: ["magic", "fire", "cold"],
    });
    gray.createPseudopod(0, 0, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 2,
        diceSize: 8,
      },
    ]);
    gray.setBehavior({
      restHeal: true,
    });
    return gray;
  }

  /**
   * Green Slime
   */
  private greenSlime() {
    const green = this.create({
      monster: MonsterEnum.GreenSlime,
      name: "monster.slime.name.green",
      files: [],
      data: {
        level1: 2,
        thac0: 19,
        strength: 4,
        dexterity: 12,
        constitution: 8,
        intelligence: 1,
        wisdom: 3,
        charisma: 1,
        ac: 9,
        apr: 1,
        xpv: 65,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "SLIME",
        class: "GREEN_SLIME",
        gender: "NIETHER",
        size: "Small",
        movement: 0,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "JELLGR1", "JELLGRSU"],
        },
      },
    });
    green.addTrait({
      // The horrid growth can be scraped off quickly, cut away, frozen, or burned.
      // A cure disease spell kills green slime, but other attacks, including weapons and spells, have no effect.
      immunities: ["magic", "physicalDamage"],
    });
    // Green slime attaches itself to living flesh and in 1-4 melee rounds turns the creature into green slime (no resurrection possible).
    // 5e: Pseudopod. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) acid damage.
    green.createPseudopod(0, 0, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 1,
        diceSize: 4,
      },
    ]);
    green.setBehavior({
      restHeal: true,
    });
    green.setAdjustments([
      {
        files: ["JELLGRSU"],
        data: { script: { location: "None" } },
      },
      {
        files: ["X#JELLY", "X#SLIME"],
        data: { script: { location: "None" } },
      },
    ]);
    return green;
  }

  /**
   * Ochre Jelly
   */
  private ochreJelly() {
    const ochre = this.create({
      monster: MonsterEnum.OchreJelly,
      name: "monster.slime.name.ochre",
      files: [],
      data: {
        level1: 6,
        thac0: 15,
        strength: 15,
        dexterity: 6,
        constitution: 14,
        intelligence: 1,
        wisdom: 6,
        charisma: 1,
        ac: 8,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "SLIME",
        class: "OCRE_JELLY",
        gender: "NIETHER",
        size: "Medium",
        movement: 3,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "JELLOC1", "DW#JELOC"],
        },
      },
    });
    ochre.addTrait({
      immunities: ["lightning"],
      // 5e: Damage Resistances: Acid. Damage Immunities: Slashing
    });
    ochre.createPseudopod(0, 0, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 1,
        diceSize: 10,
        amount: 2,
      },
    ]);
    ochre.setBehavior({
      restHeal: true,
    });
    return ochre;
  }

  /**
   * Olive Slime Creature
   */
  private oliveSlimeCreature() {
    const olive = this.create({
      monster: MonsterEnum.OliveSlimeCreature,
      name: "monster.slime.name.olive",
      files: [],
      data: {
        level1: 12,
        bonusHp: 2,
        strength: 15,
        dexterity: 10,
        constitution: 21,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        ac: 9,
        apr: 1,
        xpv: 2500,
        alignment: "NEUTRAL",
        morale: 9,
        general: "MONSTER",
        race: "SLIME",
        class: "OLIVE_SLIME",
        gender: "NIETHER",
        animation: "SLIME_OLIVE",
        size: "Large",
        movement: 6,
        immunities: ["ooze"],
        items: {
          remove: ["SCHLUM1", "DW#SCHLU", "RING95", "IMMUNE1"],
        },
        script: {
          remove: ["SCHLUM"],
        },
      },
    });
    olive.addTrait({
      // Olive slime zombies are harmed by acid, freezing cold, fire and magic missile spells.
      // Spells that affect plants will also affect them, although the effects of entangle are minimal at best.
      // No other attacks, by weapons, lightning, or spells that affect the mind will kill a slime creature.
      immunities: ["lightning", "entangle", "nonMagicalWeapons"],
    });
    olive.createPseudopod(2, 4, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 2,
        diceSize: 4,
      },
    ]);
    olive.setBehavior({
      dialog: ["SCHLUMPSA"],
      restHeal: true,
    });
    return olive;
  }

  /**
   * Slithering Tracker
   */
  private slitheringTracker() {
    const tracker = this.create({
      monster: MonsterEnum.SlitheringTracker,
      name: "monster.slime.name.slitheringTracker",
      files: [],
      data: {
        level1: 5,
        thac0: 15,
        strength: 14,
        dexterity: 8,
        constitution: 18,
        intelligence: 9,
        wisdom: 7,
        charisma: 2,
        ac: 5,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL",
        morale: 15,
        general: "MONSTER",
        race: "SLIME",
        class: "GREY_OOZE",
        gender: "NIETHER",
        size: "Small",
        movement: 12,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "AC#FPSL2", "AC#FPSLT"],
        },
      },
    });
    tracker.createPseudopod(1, 6, [
      {
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Acid,
        diceThrown: 4,
        diceSize: 6,
      },
      ...effectFactory.paralyze({
        duration: Durations.turn,
        lightingEffect: LightingEffectEnum.MushroomGray,
        saveType: SaveTypeEnum.ParalyzePoisonDeath,
      }),
    ]);
    tracker.setBehavior({
      restHeal: true,
    });
    return tracker;
  }

  /**
   * Toxic vapors
   */
  private createToxicVapors() {
    // 5e: Poison Aura. At the start of each of the jelly’s turns, each creature within 10 feet of it takes 3d6 poison damage.
    // A creature that touches the jelly or hits it with a melee attack while within 5 feet of it takes 3d6 poison damage.
    const vaporBaseEffect: BaseEffect = {
      timing: EffectTimingEnum.InstantLimited,
      dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
      duration: 2 * Durations.round,
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    };
    return this.addSpell({
      id: Ids.ToxicVapors,
      name: "monster.slime.ability.toxicVapors.name",
      description: "monster.slime.ability.toxicVapors.description",
      groups: ["poison"],
      icon: SPELLS.Wizard.StinkingCloud.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          range: 10,
          projectile: {
            copyFromFile: "dvstink",
            name: "Mustard jelly Toxic Vapors",
            particleColor: ParticleColorEnum.Green,
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
              explosionDelay: 12,
              triggerCount: 6,
              triggerRadius: 180,
              areaOfEffect: 180, // 10-foot radius
            },
          },
          effects: [
            ...[...VAPOR_IMMUNE_CREATURES].map(
              (c) =>
                // no-unnecessary-type-assertion is wrong here (verified against tsc directly):
                // without this cast, opcode/idsFile widen instead of narrowing to IdsEffect's
                // literal types, which then breaks inference for the array literal's other
                // (sibling) elements below too.
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                ({
                  opcode: EffectTypeEnum.UseEFFFile,
                  idsFile: c[0],
                  idsEntry: c[1],
                  timing: EffectTimingEnum.InstantPermanentUntilDeath,
                }) as IdsEffect,
            ),
            {
              opcode: EffectTypeEnum.ModifyAttacksPerRound,
              type: AttackModifierTypeEnum.Set,
              value: 0,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.CastingFailure,
              type: CastingFailureTypeEnum.Wizard,
              amount: 100,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.CastingFailure,
              type: CastingFailureTypeEnum.Priest,
              amount: 100,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.MovementRateBonus,
              type: EffectModifierTypeEnum.SetPercentOf,
              value: 50,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Nauseated,
              ...vaporBaseEffect,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.round,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
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
          selfTarget: true,
        },
        range: 10,
        probability: 100,
      },
    });
  }
}

export const createSlimes = () => new SlimeFamily();

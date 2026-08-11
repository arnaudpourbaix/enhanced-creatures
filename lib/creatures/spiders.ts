import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import effectFactory from "../src/factories/effect.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { ItemSlot } from "../src/model/creature/item";
import { ImmunityName } from "../src/model/final/immunity";
import { Durations } from "../src/model/game-data/durations";
import { BaseEffect, DamageEffect, Effect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectDamageTypeEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  InvisibilityTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PnPPoisonType,
  PortraitIconEnum,
  SaveTypeEnum,
  WingBuffetDirectionEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { WeaponCastSpell } from "../src/model/spell-item/spell-item";
import {
  SpellProtection,
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../src/model/spell-item/spell-protection";
import creatureService from "../src/services/creature.service";
import poisonService from "../src/services/effects/poison.service";
import { TranslationKey } from "../translations/i18n";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  InvisibleWebTangle,
  Leg,
  LeapAttack,
  LeapImpalingAttack,
  LightningLeg,
  LightningLeapImpalingAttack,
  PhaseOut,
  WebTangle,
}

class Spider extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    effects?: Effect[];
    immunities?: ImmunityName[];
    poisonType?: PnPPoisonType;
    saveBonus?: number;
    slot?: ItemSlot;
    doc?: boolean;
    castSpells?: WeaponCastSpell[];
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.spider.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        doc: p.doc ?? true,
        equippedSlot: [p.slot ?? "WEAPON1"],
        immunities: p.immunities,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 2,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: p.effects,
        },
      },
      castSpells: [
        ...(p.poisonType
          ? [poisonService.getSpell({ poisonType: p.poisonType, saveBonus: p.saveBonus })]
          : []),
        ...(p.castSpells ?? []),
      ],
    });
  }

  createLegWeapon(p: { id: number; impale?: boolean; lightning?: boolean; equipped?: boolean }) {
    const effects: Effect[] = [];
    if (p.impale) {
      effects.push(
        {
          opcode: EffectTypeEnum.DisplayString,
          stringRef: "monster.spider.ability.impale.name",
        },
        {
          opcode: EffectTypeEnum.Thac0Bonus,
          type: EffectModifierTypeEnum.Increment,
          value: -4,
          timing: EffectTimingEnum.InstantLimited,
          duration: 2 * Durations.round,
        },
      );
    }
    if (p.lightning) {
      effects.push({
        opcode: EffectTypeEnum.Damage,
        type: EffectDamageTypeEnum.Electricity,
        amount: p.impale ? 8 : 2,
      });
    }
    return this.addItem({
      id: p.id,
      stringRef: p.impale ? "monster.spider.ability.impale.name" : "monster.spider.weapon.leg",
      icon: MonsterItemIconEnum.Wolf,
      equippedSlot: p.equipped ? ["SHIELD"] : undefined,
      header: {
        type: ItemAbilityTypeEnum.Melee,
        diceThrown: p.impale ? 4 : 1,
        diceSize: 12,
        damageType: AbilityDamageTypeEnum.Piercing,
        speed: 1,
        abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        effects,
      },
    });
  }

  /**
   * Single Target Web
   */
  createWeb({
    id,
    name,
    description,
    duration,
    saveBonus,
    damageEffect,
    invisible,
  }: {
    id: number;
    name?: TranslationKey;
    description: TranslationKey;
    duration: number;
    saveBonus?: number;
    damageEffect?: DamageEffect;
    invisible?: boolean;
  }) {
    const saves: BaseEffect = {
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
      saveBonus: saveBonus ?? 0,
    };
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.Web,
        timing: EffectTimingEnum.InstantLimited,
        duration,
        ...saves,
      },
      {
        opcode: EffectTypeEnum.Paralyze,
        timing: EffectTimingEnum.InstantLimited,
        idsFile: EffectIDSFileEnum.EA,
        idsEntry: "ANYONE",
        duration,
        ...saves,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.Webbed,
        timing: EffectTimingEnum.InstantLimited,
        duration,
        ...saves,
      },
      {
        opcode: EffectTypeEnum.PlaySound,
        resource: "EFF_P27",
        ...saves,
      },
    ];
    const protections: {
      type: SpellProtection;
      values: (string | number)[];
    }[] = [
      {
        type: {
          stat: SpellProtectionStat.CircleSize,
          relation: SpellProtectionRelation.Greater,
          value: 3,
        },
        values: [0],
      },
      {
        type: {
          stat: SpellProtectionStat.Splstate,
          relation: SpellProtectionRelation.Equal,
        },
        values: ["BLUE_FIRESHIELD", "RED_FIRESHIELD", "FREE_ACTION"],
      },
      {
        type: {
          stat: SpellProtectionStat.Race,
          relation: SpellProtectionRelation.Equal,
        },
        values: ["WRAITH", "MIST", "SHADOW", "ELEMENTAL", "SLIME"],
      },
    ];
    for (const protection of protections) {
      for (const value of protection.values) {
        effects.unshift({
          value,
          opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
          type: protection.type,
          timing: EffectTimingEnum.InstantLimited,
          duration: 1,
        });
      }
    }
    if (damageEffect) {
      const rounds = Math.floor(duration / Durations.round);
      effects.push(...effectFactory.repeatEffect(rounds, [{ ...damageEffect, ...saves }]));
    }
    if (invisible) {
      effects.push({
        opcode: EffectTypeEnum.Invisibility,
        type: InvisibilityTypeEnum.Normal,
        duration,
        ...saves,
      });
    }
    return this.addSpell({
      id,
      description,
      name: name ?? "monster.spider.ability.webTangle.name",
      memorizedCount: 1,
      icon: SPELLS.Wizard.Web.file,
      options: { renew: 2 },
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          range: 5,
          projectile: "WEB1P",
          effects,
        },
      ],
      ability: {
        preset: SPELLS.Wizard.Web.file,
        spell: {
          // It can shoot web strands up to 2 feet to bind a foe.
          // Either attack treats the spider's opponent as AC 10 and prevents the spider from making a melee attack that round.
          type: "force",
          isAttack: true,
        },
        range: 6, // to fix issue with very close range since melee attack is 3 feet
        requireVocal: false,
        probability: 70,
      },
    });
  }

  /**
   * Leap attack
   */
  createLeapSpell(p: { id: number; memorizedCount?: number; effects?: Effect[] }) {
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.WingBuffet,
        target: EffectTargetEnum.Self,
        speed: 150,
        direction: WingBuffetDirectionEnum.TowardsTargetPoint,
        duration: 2,
      },
      ...(p.effects ?? []),
    ];
    return this.addSpell({
      id: p.id,
      name: p.effects?.length
        ? "monster.spider.ability.leapAttack.name"
        : "monster.spider.ability.leap.name",
      description: p.effects?.length
        ? "monster.spider.ability.leapAttack.description"
        : "monster.spider.ability.leap.description",
      memorizedCount: p.memorizedCount,
      icon: SPELLS.Wizard.Haste.file,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 30,
          effects,
        },
      ],
      ability: {
        targets: [{ name: "FarthestEnemies", randomOrder: true }],
        minRange: 5,
        range: 30,
        spell: {
          type: "force",
          isAttack: true,
        },
        disableInterrupt: true,
        actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
      },
    });
  }

  /**
   * Leap attack
   */
  createLeapImpalingSpell(p: { id: number; lightning?: boolean; memorizedCount?: number }) {
    this.createLegWeapon({
      id: p.id,
      impale: true,
      lightning: p.lightning,
    });
    return this.createLeapSpell({
      id: p.id,
      memorizedCount: p.memorizedCount,
      effects: [
        {
          opcode: EffectTypeEnum.CreateWeapon,
          amount: 1,
          resource: this.item(p.id).file,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: Durations.round,
        },
      ],
    });
  }

  /**
   * Phase out
   */
  createPhaseOut() {
    const base: BaseEffect = {
      target: EffectTargetEnum.Self,
      timing: EffectTimingEnum.InstantPermanent,
    };
    return this.addSpell({
      id: Ids.PhaseOut,
      name: "monster.spider.ability.phase.name",
      description: "monster.spider.ability.phase.description",
      memorizedCount: 1,
      icon: SPELLS.Wizard.Invisibility.file,
      options: { renew: 1 },
      headers: [
        {
          target: ItemAbilityTargetEnum.Caster,
          type: ItemAbilityTypeEnum.Melee,
          effects: [
            {
              opcode: EffectTypeEnum.Invisibility,
              type: InvisibilityTypeEnum.Normal,
              ...base,
            },
          ],
        },
      ],
      ability: {
        preset: SPELLS.Wizard.Invisibility.file,
        spell: {
          type: "force",
        },
        requireVocal: false,
      },
    });
  }
}

class SpiderFamily extends CreatureFamily<Spider> {
  constructor() {
    super(MonsterFamilyEnum.Spider);
    this.addCreature(() => this.gargantuan());
    this.addCreature(() => this.ghostwalk());
    this.addCreature(() => this.giant());
    this.addCreature(() => this.hairy());
    this.addCreature(() => this.huge());
    this.addCreature(() => this.hunting());
    this.addCreature(() => this.phase());
    this.addCreature(() => this.sword());
    this.addCreature(() => this.vortex());
    this.addCreature(() => this.wraith());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Gargantuan
   */
  private gargantuan() {
    const gargantuan = this.create({
      monster: MonsterEnum.GargantuanSpider,
      name: "monster.spider.name.gargantuan",
      files: [],
      data: {
        level1: 8,
        bonusHp: 8,
        thac0: 11,
        strength: 18,
        dexterity: 15,
        constitution: 17,
        intelligence: 7,
        wisdom: 11,
        charisma: 4,
        ac: 4,
        apr: 1,
        xpv: 3000,
        alignment: "CHAOTIC_EVIL",
        morale: 14,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_GIANT",
        gender: "NIETHER",
        size: "Gargantuan",
        movement: 9, // Web 12
        immunities: ["spider"],
        items: {
          remove: ["BDSPIDGA", "ANTIWEB"],
        },
        script: {
          remove: ["BDSPIDGA"],
        },
      },
    });
    gargantuan.createWeb({
      id: Ids.WebTangle,
      duration: 3 * Durations.round,
      // saveBonus: -2,
      description: "monster.spider.ability.webTangle.standardDesc",
    });
    gargantuan.createJaws({
      diceThrown: 2,
      diceSize: 6,
      poisonType: "Q",
      saveBonus: -2,
    });
    gargantuan.setAttack({
      targetPriorities: [{ status: ["HeldAndNotPoisoned"] }],
    });
    gargantuan.setBehavior({
      abilities: [this.ability(Ids.WebTangle)],
    });
    return gargantuan;
  }

  /**
   * Ghostwalk
   */
  private ghostwalk() {
    const ghostwalk = this.create({
      monster: MonsterEnum.GhostwalkSpider,
      name: "monster.spider.name.ghostwalk",
      files: [],
      data: {
        level1: 14,
        strength: 15,
        dexterity: 20,
        constitution: 17,
        intelligence: 9,
        wisdom: 14,
        charisma: 8,
        ac: 6,
        apr: 2,
        xpv: 5000,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: "Large",
        movement: 15,
        immunities: ["spider"],
        items: {
          remove: ["SPIDPH1", "ANTIWEB", "GHOST2"],
        },
        script: {
          remove: ["C#LCCENS", "PSPIDER", "L#ULCSP"],
        },
      },
    });
    ghostwalk.addTrait({
      description: "monster.spider.trait.ghostwalk",
      immunities: ["seeInvisible"],
    });
    ghostwalk.createWeb({
      id: Ids.InvisibleWebTangle,
      duration: 3 * Durations.round,
      saveBonus: -2,
      description: "monster.spider.ability.webTangle.ghostwalkDesc",
      invisible: true,
    });
    ghostwalk.createJaws({
      diceThrown: 3,
      diceSize: 10,
      slot: "WEAPON1",
      immunities: ["incorporeal", "ghostVisual1"],
      doc: false,
    });
    ghostwalk.createJaws({
      diceThrown: 3,
      diceSize: 10,
      slot: "WEAPON2",
      poisonType: "E",
      saveBonus: -2,
    });
    ghostwalk.setAttack({
      targetPriorities: [{ status: ["HeldAndNotPoisoned"] }],
      selectWeapons: [
        {
          slot: "WEAPON1",
          triggers: [
            {
              name: "Range",
              params: [ScriptTarget.lastSeen, 5],
              negation: true,
            },
          ],
        },
        {
          slot: "WEAPON2",
          triggers: [
            {
              name: "Range",
              params: [ScriptTarget.lastSeen, 5],
            },
          ],
        },
      ],
    });
    ghostwalk.setBehavior({
      dialog: ["C#LCCENS"],
      abilities: [this.ability(Ids.InvisibleWebTangle)],
    });
    return ghostwalk;
  }

  /**
   * Giant
   */
  private giant() {
    const giant = this.create({
      monster: MonsterEnum.GiantSpider,
      name: "monster.spider.name.giant",
      files: [],
      data: {
        level1: 4,
        bonusHp: 4,
        thac0: 15,
        strength: 14,
        dexterity: 16,
        constitution: 12,
        intelligence: 7,
        wisdom: 11,
        charisma: 4,
        ac: 4,
        apr: 1,
        xpv: 650,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_GIANT",
        gender: "NIETHER",
        size: "Large",
        movement: 3, // Web 12
        immunities: ["spider"],
        items: {
          remove: ["BDSPIDGI", "SPIDG1", "ANTIWEB", "PLYSPID"],
        },
        script: {
          remove: ["DW#SPIDG", "SPIDFGSU"],
        },
      },
    });
    giant.createJaws({
      diceThrown: 1,
      diceSize: 8,
      poisonType: "F",
    });
    giant.setAdjustments([{ files: ["PLYSPID2"], data: { script: { location: "None" } } }]);
    return giant;
  }

  /**
   * Hairy
   */
  private hairy() {
    const hairy = this.create({
      monster: MonsterEnum.HairySpider,
      name: "monster.spider.name.hairy",
      files: [],
      data: {
        level1: 1,
        bonusHp: 1,
        strength: 2,
        dexterity: 14,
        constitution: 8,
        intelligence: 1,
        wisdom: 10,
        charisma: 2,
        ac: 8,
        apr: 1,
        thac0: 20,
        xpv: 65,
        alignment: "NEUTRAL_EVIL",
        morale: 10,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_HUGE",
        gender: "NIETHER",
        size: "Tiny",
        movement: 6, // web 15
        immunities: ["spider"],
        items: {
          remove: ["SPIDHU1", "ANTIWEB"],
        },
        script: {
          remove: ["DW#SPIDG"],
        },
        spells: {
          memorized: [{ file: SPELLS.Wizard.DetectInvisibility.file, memorizedCount: 1 }],
        },
      },
    });
    hairy.createJaws({
      diceThrown: 1,
      diceSize: 1,
      poisonType: "R",
      saveBonus: 2,
    });
    hairy.addTrait({ immunities: ["crushingDamageResistance"] });
    hairy.setBehavior({
      abilities: [
        {
          preset: SPELLS.Wizard.DetectInvisibility.file,
          spell: {
            type: "force",
          },
          timer: { name: "detectInvisibility", value: 18 },
          requireVocal: false,
          probability: 30,
        },
      ],
    });
    hairy.setAdjustments([{ files: ["BDSPIDER"], data: { script: { location: "None" } } }]);
    return hairy;
  }

  /**
   * Huge
   */
  private huge() {
    const huge = this.create({
      monster: MonsterEnum.HugeSpider,
      name: "monster.spider.name.huge",
      files: [],
      data: {
        level1: 2,
        bonusHp: 2,
        thac0: 19,
        strength: 14,
        dexterity: 16,
        constitution: 12,
        intelligence: 7,
        wisdom: 11,
        charisma: 4,
        ac: 6,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 8,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_HUGE",
        gender: "NIETHER",
        size: "Medium",
        movement: 18,
        immunities: ["spider"],
        items: {
          remove: ["BDSPIDHU", "SPIDHU1", "ANTIWEB", "D5SMSPID"],
        },
        script: {
          remove: ["DW#SPIDS"],
        },
      },
    });
    huge.createJaws({
      diceThrown: 1,
      diceSize: 6,
      poisonType: "A",
      saveBonus: 1,
    });
    return huge;
  }

  /**
   * Hunting
   */
  private hunting() {
    const hunting = this.create({
      monster: MonsterEnum.HuntingSpider,
      name: "monster.spider.name.hunting",
      files: [],
      data: {
        level1: 3,
        bonusHp: 3,
        thac0: 17,
        strength: 14,
        dexterity: 16,
        constitution: 12,
        intelligence: 10,
        wisdom: 11,
        charisma: 4,
        ac: 4,
        apr: 1,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_GIANT",
        gender: "NIETHER",
        size: "Large",
        movement: 8,
        immunities: [
          "spider",
          "seeInvisible", // their vision gives them the natural ability of true seeing
        ],
        items: {
          remove: ["D5SMSPID", "ANTIWEB"],
        },
      },
    });
    hunting.createLeapSpell({ id: Ids.LeapAttack, memorizedCount: 1 });
    hunting.createJaws({
      diceThrown: 1,
      diceSize: 3,
      poisonType: "A",
      saveBonus: 2,
    });
    hunting.setBehavior({ abilities: [this.ability(Ids.LeapAttack)] });
    return hunting;
  }

  /**
   * Phase
   */
  private phase() {
    const phase = this.create({
      monster: MonsterEnum.PhaseSpider,
      name: "monster.spider.name.phase",
      files: [],
      data: {
        level1: 5,
        bonusHp: 5,
        strength: 15,
        dexterity: 15,
        constitution: 12,
        intelligence: 7,
        wisdom: 10,
        charisma: 6,
        ac: 7,
        apr: 1,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_PHASE",
        gender: "NIETHER",
        size: "Huge",
        movement: 6, // Web 15
        immunities: ["spider", "magicalBeast"],
        items: {
          remove: ["SPIDPH1", "ANTIWEB", "SPIDPHSU"],
        },
        script: {
          remove: ["PSPIDER", "SPIDPHSU"],
        },
      },
    });
    phase.addTrait({
      effects: [
        {
          opcode: EffectTypeEnum.Invisibility,
          type: InvisibilityTypeEnum.Normal,
        },
      ],
    });
    phase.createPhaseOut();
    // They phase in, attack, and phase out, all in a single round.
    // This gives them a -3 modifier on initiative rolls; if a phase spider wins initiative by more than 4, it attacks and phases out before its opponent has a chance to strike back.
    // Then too, a phase spider usually phases into existence behind its chosen victim, so they get a +4 modifier for attacking from behind.
    // Phase spiders flee to the Ethereal plane when outmatched
    phase.createJaws({
      diceThrown: 1,
      diceSize: 6,
      poisonType: "F",
      saveBonus: -2,
      castSpells: [{ spell: this.spell(Ids.PhaseOut).file, delay: 2, doc: "both" }],
    });
    phase.setBehavior({
      abilities: [this.ability(Ids.PhaseOut)],
    });
    phase.setAdjustments([
      {
        files: ["SPIDPHAS"],
        data: {
          level1: 12,
          xpv: 4000,
        },
      },
    ]);
    return phase;
  }

  /**
   * Sword
   */
  private sword() {
    const sword = this.create({
      monster: MonsterEnum.SwordSpider,
      name: "monster.spider.name.sword",
      files: [],
      data: {
        level1: 5,
        bonusHp: 5,
        thac0: 15,
        strength: 16,
        dexterity: 18,
        constitution: 14,
        intelligence: 9,
        wisdom: 14,
        charisma: 4,
        ac: 3,
        apr: 2,
        xpv: 2000,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_SWORD",
        gender: "NIETHER",
        size: "Huge",
        movement: 6, // Web 8
        immunities: ["spider"],
        items: {
          remove: ["SPIDSW1", "ANTIWEB", "SPIDSWSU", "WISPIDSW"],
        },
        script: {
          remove: ["DW#SPIDS"],
        },
      },
    });
    sword.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    sword.createLegWeapon({ id: Ids.Leg, equipped: true });
    sword.createLeapImpalingSpell({
      id: Ids.LeapImpalingAttack,
      memorizedCount: 1,
    });
    sword.createLegWeapon({ id: Ids.LightningLeg, lightning: true });
    sword.createLeapImpalingSpell({
      id: Ids.LightningLeapImpalingAttack,
      lightning: true,
    });
    sword.setBehavior({
      abilities: [
        this.ability(Ids.LeapImpalingAttack),
        this.ability(Ids.LightningLeapImpalingAttack),
      ],
    });
    sword.setAdjustments([
      { files: ["PLYSPID"], data: { script: { location: "None" } } },
      {
        files: ["WISPID03"],
        data: {
          spells: {
            removeMemorized: true,
            memorized: [
              {
                file: this.spell(Ids.LightningLeapImpalingAttack).file,
                memorizedCount: 1,
              },
            ],
          },
          items: {
            equipped: [{ file: this.item(Ids.LightningLeg).file, slot: "SHIELD" }],
          },
        },
      },
    ]);
    return sword;
  }

  /**
   * Vortex
   */
  private vortex() {
    const vortex = this.create({
      monster: MonsterEnum.VortexSpider,
      name: "monster.spider.name.vortex",
      files: [],
      data: {
        level1: 7,
        bonusHp: 4,
        strength: 15,
        dexterity: 15,
        constitution: 12,
        intelligence: 7,
        wisdom: 10,
        charisma: 6,
        ac: 4,
        apr: 1,
        xpv: 2700,
        alignment: "CHAOTIC_EVIL",
        morale: 10,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_PHASE",
        gender: "NIETHER",
        size: "Large",
        movement: 15, // Normal: 9, Web: 15
        immunities: ["spider"],
        items: {
          remove: ["BDSPIDGI", "SPIDG1", "ANTIWEB", "PLYSPID"],
        },
        script: {
          remove: ["DW#SPIDG", "SPIDVO01"],
        },
        spells: {
          memorized: [{ file: SPELLS.Innate.VortexWeb.file, memorizedCount: 1 }],
        },
      },
    });
    vortex.addTrait({
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    vortex.createJaws({
      diceThrown: 2,
      diceSize: 4,
      poisonType: "F",
      saveBonus: -2,
    });
    vortex.setBehavior({
      abilities: [
        {
          preset: SPELLS.Wizard.Slow.file,
          spell: {
            resource: SPELLS.Innate.VortexWeb.file,
            type: "force",
          },
          timer: { name: "VortexWeb", value: 30 },
        },
      ],
    });
    return vortex;
  }

  /**
   * Wraith
   */
  private wraith() {
    const wraith = this.create({
      monster: MonsterEnum.WraithSpider,
      name: "monster.spider.name.wraith",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 9,
        intelligence: 10,
        wisdom: 10,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 1400,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["spider", "undead"],
        items: {
          remove: ["IMMUNE1", "RING95", "ANTIWEB", "SPIDWR1"],
        },
        script: {
          remove: ["DW#SPIDG"],
        },
      },
    });
    wraith.addTrait({
      immunities: ["cold", "nonSilverNonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    wraith.createJaws({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Cold,
          diceThrown: 1,
          diceSize: 4,
          amount: creatureService.getStrengthBonus(wraith.data).damage,
        },
        ...effectFactory.levelDrain({ levels: 1 }),
      ],
      poisonType: "S",
    });
    wraith.setBehavior({
      dialog: ["C#Q04009", "ttspid"],
    });
    return wraith;
  }
}

export const createSpiders = () => new SpiderFamily();

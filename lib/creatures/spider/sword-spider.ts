import { MonsterItemIconEnum } from "../../config/item";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  AttackModifierTypeEnum,
  EffectDamageTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Spider, SpiderIds } from "./kin";

class SwordSpider extends Spider {
  createLegWeapon(p: { id: number; impale?: boolean; lightning?: boolean; equipped?: boolean }) {
    const effects: Effect[] = [];
    if (p.impale) {
      effects.push({
        opcode: EffectTypeEnum.Thac0Bonus,
        type: EffectStatisticModifierEnum.Increment,
        value: -4,
        timing: EffectTimingEnum.InstantLimited,
        duration: 2 * Durations.round,
      });
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
      equippedSlot: p.equipped ? ["WEAPON1"] : undefined,
      header: {
        type: ItemAbilityTypeEnum.Melee,
        diceThrown: p.impale ? 8 : 2,
        diceSize: 6,
        damageType: AbilityDamageTypeEnum.Piercing,
        speed: 1,
        abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        effects,
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
          opcode: EffectTypeEnum.ModifyAttacksPerRound,
          type: AttackModifierTypeEnum.Set,
          value: 1,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: Durations.round,
        },
        {
          opcode: EffectTypeEnum.CreateWeapon,
          amount: 1,
          resource: this.item(p.id).file,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: Durations.round,
        },
        {
          opcode: EffectTypeEnum.DisplayString,
          stringRef: "monster.spider.ability.impale.name",
        },
      ],
    });
  }
}

class SwordSpiderEntry extends CreatureEntry<SwordSpider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.SwordSpider, kin);
    this.addCreature(() => this.sword());
  }

  createCreature(id: MonsterEnum): SwordSpider {
    return new SwordSpider(id);
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
        animation: "SPIDER_SWORD",
        gender: "NIETHER",
        size: { value: "Huge", tall: false, long: true },
        movement: 6, // Web 8
        immunities: ["spider"],
        items: {
          remove: ["SPIDSW1", "ANTIWEB", "SPIDSWSU", "WISPIDSW", "FIGSPID", "VERMTYPE"],
        },
        script: {
          remove: ["DW#SPIDS", "SPIDFGSU"],
        },
        spells: {
          removeMemorized: true,
        },
      },
    });
    sword.createLegWeapon({ id: SpiderIds.Leg, equipped: true });
    sword.createLeapImpalingSpell({
      id: SpiderIds.LeapImpalingAttack,
      memorizedCount: 1,
    });
    sword.createLegWeapon({ id: SpiderIds.LightningLeg, lightning: true });
    sword.createLeapImpalingSpell({
      id: SpiderIds.LightningLeapImpalingAttack,
      lightning: true,
    });
    sword.createJaws({
      diceThrown: 2,
      diceSize: 4,
      slot: "SHIELD",
    });
    sword.setBehavior({
      abilities: [
        this.ability(SpiderIds.LeapImpalingAttack),
        this.ability(SpiderIds.LightningLeapImpalingAttack),
      ],
    });
    sword.setAdjustments([
      { files: ["PLYSPID"], data: { script: { location: "None" } } },
      { files: ["L0SPID"], data: { level1: 16, xpv: 4000 } },
      { files: ["OHHSPI03"], data: { level1: 15, xpv: 4000 } },
      {
        files: ["WISPID03"],
        data: {
          spells: {
            removeMemorized: true,
            memorized: [
              {
                file: this.spell(SpiderIds.LightningLeapImpalingAttack).file,
                memorizedCount: 1,
              },
            ],
          },
          items: {
            equipped: [{ file: this.item(SpiderIds.LightningLeg).file, slot: "SHIELD" }],
          },
        },
      },
    ]);
    return sword;
  }
}

export const createSwordSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SwordSpiderEntry(kins.get(KinEnum.Spider));

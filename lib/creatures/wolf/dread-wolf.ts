import effectFactory from "../../src/factories/effect.factory";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { Durations } from "../../src/model/game-data/durations";
import {
  CastSpellOnConditionTargetEnum,
  DiseaseTypeEnum,
  EffectDispelResistanceEnum,
  EffectModifierTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ItemCategoryEnum,
  PortraitIconEnum,
  RegenerationTypeEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import effectService from "../../src/services/effects/effect.service";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Wolf, WolfIds } from "./kin";

class DreadWolf extends Wolf {
  /**
   * Dread Wolf down state
   */
  createDreadWolfDownState() {
    this.addItem({
      stringRef: "monster.wolf.ability.dreadWolfDownState.name",
      id: WolfIds.DreadWolfDownState,
      description: "monster.wolf.ability.dreadWolfDownState.description",
      immunities: ["poison", "disease", "cold", "lightning", "magicDamage", "physicalDamage"],
      category: ItemCategoryEnum.Rings,
      icon: "IRING01",
    });
    this.addSpell({
      id: WolfIds.DreadWolfDownState,
      name: "monster.wolf.ability.dreadWolfDownState.name",
      headers: [
        {
          target: ItemAbilityTargetEnum.Caster,
          type: ItemAbilityTypeEnum.Melee,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveItem,
              resource: this.traitItem().file,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              target: EffectTargetEnum.Self,
            },
            ...effectFactory.cureAll(),
            {
              opcode: EffectTypeEnum.CreateItemInSlot,
              resource: this.item(WolfIds.DreadWolfDownState).file,
              slot: "SLOT_RING_LEFT",
              duration: 2 * Durations.round,
              timing: EffectTimingEnum.InstantLimited,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.Sleep,
              wakeOnDamage: false,
              timing: EffectTimingEnum.InstantLimited,
              duration: 2 * Durations.round,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.CurrentHPbonus,
              value: 1,
              type: EffectModifierTypeEnum.Set,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.CreateItemInSlot,
              resource: this.traitItem().file,
              slot: "SLOT_RING_LEFT",
              duration: 2 * Durations.round,
              timing: EffectTimingEnum.DelayPermanent,
              target: EffectTargetEnum.Self,
            },
            {
              opcode: EffectTypeEnum.CurrentHPbonus,
              value: 6,
              type: EffectModifierTypeEnum.Set,
              duration: 2 * Durations.round,
              timing: EffectTimingEnum.DelayPermanent,
              target: EffectTargetEnum.Self,
            },
          ],
        },
      ],
    });
  }

  /**
   * Dread Wolf Disease
   */
  createDreadWolfDisease() {
    return this.addSpell({
      name: "monster.wolf.ability.rottingDisease.name",
      description: "monster.wolf.ability.rottingDisease.description",
      id: WolfIds.DreadWolfDisease,
      secondaryType: "Disease",
      doc: false,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveEffectsByResource,
              type: RemoveEffectsByResourceTypeEnum.Default,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.Disease,
              amount: 300,
              type: DiseaseTypeEnum.OneDamagePerAmountSeconds,
              duration: Durations.day * 30,
              icon: PortraitIconEnum.Diseased,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
    });
  }
}

class DreadWolfEntry extends CreatureEntry<DreadWolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.DreadWolf, kin);
    this.addCreature(() => this.dread());
  }

  createCreature(id: MonsterEnum): DreadWolf {
    return new DreadWolf(id);
  }

  /**
   * Dread Wolf
   */
  private dread() {
    const dread = this.create({
      monster: MonsterEnum.DreadWolf,
      name: "monster.wolf.name.dread",
      files: [],
      data: {
        level1: 4,
        bonusHp: 4,
        specialBonusHp: 10,
        strength: 18,
        dexterity: 13,
        constitution: 14,
        intelligence: 9,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 1,
        xpv: 650,
        alignment: "NEUTRAL_EVIL",
        morale: 18,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_DREAD",
        animation: "WOLF_DREAD",
        gender: "MALE",
        size: { value: "Small", tall: false, long: true },
        movement: 18,
        items: {
          remove: ["P1-10", "RING95", "TROLLIMM", "BDWOLFD1", "BDWOLFDR"],
        },
      },
    });
    const trait = dread.addTrait({
      description: "monster.wolf.trait.dread",
      equippedSlot: "LRING",
      immunities: ["undead", "coldSpells", "cold", "lightningResistance"],
      effects: [
        {
          opcode: EffectTypeEnum.Regeneration,
          amount: 2,
          type: RegenerationTypeEnum.OneHPperAmountSeconds,
          icon: PortraitIconEnum.Regenerating,
        },
        { opcode: EffectTypeEnum.MinimumHP, value: 1 },
      ],
    });
    dread.createDreadWolfDownState();
    trait.effects.push(
      effectService.getEffect({
        opcode: EffectTypeEnum.CastSpellOnCondition,
        conditionTarget: CastSpellOnConditionTargetEnum.Myself,
        condition: "HPLT(Myself,Extra)",
        special: 6,
        timing: EffectTimingEnum.InstantWhileEquipped,
        target: EffectTargetEnum.Self,
        resource: this.spell(WolfIds.DreadWolfDownState).file,
      }),
    );
    dread.createDreadWolfDisease();
    dread.createJaws({
      diceThrown: 1,
      diceSize: 10,
      castSpells: [
        {
          spell: this.spell(WolfIds.DreadWolfDisease).file,
          saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
        },
      ],
    });
    dread.setAdjustments([
      { files: ["ANWOLF1"], stringRef: "monster.wolf.name.dread" },
      { files: ["L#HALWO"], data: { animation: "L#_DOG_MOSS" } },
    ]);
    return dread;
  }
}

export const createDreadWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new DreadWolfEntry(kins.get(KinEnum.Wolf));

import { MonsterItemIconEnum } from "../config/item";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { CreatureGrabConfig } from "../src/model/creature/grab";
import { ItemSlot } from "../src/model/creature/item";
import { Durations } from "../src/model/game-data/durations";
import { Effect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  CastSpellOnConditionTargetEnum,
  DiseaseTypeEnum,
  EffectColorLocationEnum,
  EffectDamageModeEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectFlagsEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ItemCategoryEnum,
  PortraitIconEnum,
  RegenerationTypeEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AreaProjectileEnum } from "../src/model/spell-item/projectile";
import { WeaponCastSpell } from "../src/model/spell-item/spell-item";
import creatureService from "../src/services/creature.service";
import effectService from "../src/services/effects/effect.service";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  DreadWolfDisease,
  DreadWolfDownState,
  DreadWolfTrait,
  StreamOfFrost,
}

class Wolf extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    castSpells?: WeaponCastSpell[];
    slot?: ItemSlot;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.wolf.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: [p.slot ?? "WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: p.castSpells,
    });
  }

  createVampiricJaws(p: {
    effects?: Effect[];
    slot: ItemSlot;
    grab?: CreatureGrabConfig;
    bonusToHit?: number;
    doc?: boolean;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.wolf.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: [p.slot],
        doc: p.doc,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          damageType: AbilityDamageTypeEnum.Piercing,
          damageBonus: 8,
          bonusToHit: p.bonusToHit,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: [
            ...(p.effects ?? []),
            {
              opcode: EffectTypeEnum.CurrentHPbonus,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              value: 8 + creatureService.getStrengthBonus(this.data).damage,
              type: EffectModifierTypeEnum.Increment,
            },
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantLimited,
              color: { blue: 191, green: 125, red: 53 },
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              cycleSpeed: 20,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.Sleep,
              wakeOnDamage: true,
              timing: EffectTimingEnum.InstantLimited,
              duration: 2 * Durations.round,
              saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
            },
          ],
        },
      },
      grab: p.grab,
    });
  }

  /**
   * Dread Wolf down state
   */
  createDreadWolfDownState() {
    this.addItem({
      stringRef: "monster.wolf.ability.dreadWolfDownState.name",
      id: Ids.DreadWolfDownState,
      description: "monster.wolf.ability.dreadWolfDownState.description",
      immunities: [
        "poison",
        "disease",
        "cold",
        "lightning",
        "magicDamage",
        "physicalDamage",
      ],
      category: ItemCategoryEnum.Rings,
      icon: "IRING01",
    });
    this.addSpell({
      id: Ids.DreadWolfDownState,
      name: "monster.wolf.ability.dreadWolfDownState.name",
      headers: [
        {
          target: ItemAbilityTargetEnum.Caster,
          type: ItemAbilityTypeEnum.Melee,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveItem,
              resource: this.item(Ids.DreadWolfTrait).file,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              target: EffectTargetEnum.Self,
            },
            ...effectFactory.cureAll(),
            {
              opcode: EffectTypeEnum.CreateItemInSlot,
              resource: this.item(Ids.DreadWolfDownState).file,
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
              resource: this.item(Ids.DreadWolfTrait).file,
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
   * Stream of Frost
   */
  createStreamOfFrost() {
    this.addSpell({
      name: "monster.wolf.ability.streamOfFrost.name",
      description: "monster.wolf.ability.streamOfFrost.description",
      id: Ids.StreamOfFrost,
      memorizedCount: 1,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      options: { renew: 10 },
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
          selfTarget: true,
        },
        range: 10,
        probability: 20,
      },
    });
  }

  /**
   * Dread Wolf Disease
   */
  createDreadWolfDisease() {
    return this.addSpell({
      name: "monster.wolf.ability.rottingDisease.name",
      description: "monster.wolf.ability.rottingDisease.description",
      id: Ids.DreadWolfDisease,
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

class WolfFamily extends CreatureFamily<Wolf> {
  constructor() {
    super(MonsterFamilyEnum.Wolf);
    this.addCreature(this.wolf());
    this.addCreature(this.dire());
    this.addCreature(this.dread());
    this.addCreature(this.vampiric());
    this.addCreature(this.winter());
    this.addCreature(this.worg());
  }

  createCreature(id: MonsterEnum): Wolf {
    return new Wolf(id);
  }

  /**
   * Wolf
   */
  private wolf() {
    const wolf = this.create({
      monster: MonsterEnum.Wolf,
      name: "monster.wolf.name.wolf",
      files: [
        "BDURE6D",
        "BDWOLF",
        "BDWOLF02",
        "DW#RNWLF",
        "RSWOLF",
        "WOLF",
        "WOLFSU",
      ],
      data: {
        level1: 3,
        bonusHp: 0,
        strength: 12,
        dexterity: 15,
        constitution: 12,
        intelligence: 4,
        wisdom: 12,
        charisma: 6,
        ac: 7,
        apr: 1,
        xpv: 65,
        alignment: "NEUTRAL",
        morale: 10,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF",
        gender: "MALE",
        size: "Small",
        movement: 18,
        items: {
          remove: ["P1-6"],
        },
      },
    });
    wolf.createJaws({
      diceThrown: 1,
      diceSize: 4,
    });
    wolf.setAdjustments([{ files: ["WOLFSU"], summon: true }]);
    return wolf;
  }

  /**
   * Dire wolf
   */
  private dire() {
    const dire = this.create({
      monster: MonsterEnum.DireWolf,
      name: "monster.wolf.name.dire",
      files: [
        "BDWOLFDI",
        "P#WOLF02",
        "WOLFDI",
        "WOLFDISU",
        "UBNIMWLF",
        "SHAWOL01", // Shade Wolf
        "RUFIE", // Rufie
        "L#FAIEN3", // Apsu
      ],
      data: {
        level1: 4,
        bonusHp: 4,
        strength: 17,
        dexterity: 15,
        constitution: 15,
        intelligence: 4,
        wisdom: 12,
        charisma: 7,
        ac: 6,
        apr: 1,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 10,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_DIRE",
        gender: "MALE",
        size: "Large",
        movement: 18,
        items: {
          remove: ["P1-8", "P2-8", "IMMUNE1", "RING95"],
        },
        script: {
          remove: ["DIREWOLF"],
        },
      },
    });
    dire.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    dire.setAdjustments([
      { files: ["WOLFDISU"], summon: true },
      {
        files: ["SHAWOL01"],
        data: { strength: 18, xpv: 450, immunities: ["incorporeal"] },
      },
    ]);
    return dire;
  }

  /**
   * Dread Wolf
   */
  private dread() {
    const dread = this.create({
      monster: MonsterEnum.DreadWolf,
      name: "monster.wolf.name.dread",
      files: [
        "BDWOLFDR",
        "D5WOLFD1",
        "DW#REWO",
        "P#WOLF03",
        "P#WOLF05",
        "PLYWOLF",
        "WOLFD1",
        "WOLFDR",
        "L#HALWO", // Cu-sith
      ],
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
        gender: "MALE",
        size: "Small",
        movement: 18,
        items: {
          remove: ["P1-10", "RING95", "TROLLIMM", "BDWOLFD1", "BDWOLFDR"],
        },
      },
    });
    const trait = dread.addTrait({
      id: Ids.DreadWolfTrait,
      description: "monster.wolf.trait.dread",
      equippedSlot: "LRING",
      immunities: [
        "coldSpells",
        "cold",
        "lightningResistance",
        "charm",
        "hold",
      ],
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
        resource: this.spell(Ids.DreadWolfDownState).file,
      }),
    );
    dread.createDreadWolfDisease();
    dread.createJaws({
      diceThrown: 1,
      diceSize: 10,
      castSpells: [
        {
          spell: this.spell(Ids.DreadWolfDisease).file,
          saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
        },
      ],
    });
    return dread;
  }

  /**
   * Vampiric Wolf
   */
  private vampiric() {
    const vampiric = this.create({
      monster: MonsterEnum.VampiricWolf,
      name: "monster.wolf.name.vampiric",
      files: [
        "BDWOLFVA",
        "P#WOLF04",
        "WOLFVA",
        "DW#ULCWO", // Wolf of Ulcaster
      ],
      notEnforceFiles: ["DW#ULCWO"],
      data: {
        level1: 6,
        bonusHp: 4,
        strength: 18,
        dexterity: 13,
        constitution: 9,
        intelligence: 6,
        wisdom: 12,
        charisma: 7,
        ac: 2,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL_EVIL",
        morale: 14,
        general: "UNDEAD",
        race: "WOLF",
        class: "WOLF_VAMPIRIC",
        gender: "MALE",
        size: "Small",
        movement: 24,
        items: {
          remove: ["WOLFVA1", "BDWOLFVA", "IMMUNE1", "RING95"],
        },
        script: {
          remove: ["VAMPWOLF"],
        },
      },
    });
    vampiric.createVampiricJaws({ slot: "WEAPON1" });
    vampiric.createVampiricJaws({
      slot: "WEAPON2",
      grab: {
        onlyGrabProneTarget: true,
        rounds: 5,
      },
      doc: false,
    });
    vampiric.createVampiricJaws({
      slot: "WEAPON3",
      bonusToHit: 30,
      doc: false,
    });
    vampiric.addTrait({
      immunities: ["sleep", "charm", "hold", "nonSilverNonMagicalWeapons"],
    });
    vampiric.setAttack({
      // A bite attack will cause a running or standing victim to fall if the victim fails a saving throw vs. paralysis.
      // Once the prey falls, the wolves continue to attack, shifting to the victim's arms so that he can no longer use a weapon.
      // This involves a called-shot attack in which a vampiric wolf has a -4 penalty to hit;
      // success means the wolf has grasped an arm in its mouth, and the victim cannot get free unless he makes a successful Strength check (one attempt per round).
      // Once a grasping bite is made, damage is continually inflicted each round as the wolf gnaws on the limb.
      targetPriorities: [{ status: ["Grabbed", "Sleep"] }],
      defaultWeaponSlot: "WEAPON1",
      targetStatusWeaponSlot: [
        { status: ["Sleep"], slot: "WEAPON2" },
        { status: ["Grabbed"], slot: "WEAPON3" },
      ],
    });
    return vampiric;
  }

  /**
   * Winter Wolf
   */
  private winter() {
    const winter = this.create({
      monster: MonsterEnum.WinterWolf,
      name: "monster.wolf.name.winter",
      files: [
        "P#WOLF01",
        "WOLFWI",
        "WOLFWISU",
        "WOLFWWSU",
        "L#WOLST", // Pregnant Wolf
        // "SPIRWOLF", //TODO: Spirit Wolf
        // "SPWOLF1", //TODO: Spirit Wolf
        // "SPWOLF2", //TODO: Spirit Wolf
        // "SPWOLF3", //TODO: Spirit Wolf
        // "SPWOLF4", //TODO: Spirit Wolf
        // "SPWOLF5", //TODO: Spirit Wolf
      ],
      data: {
        level1: 6,
        bonusHp: 0,
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
        size: "Large",
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
      effects: [
        {
          opcode: EffectTypeEnum.FireResistanceModifier,
          value: -10,
          type: EffectStatisticModifierEnum.Set,
        },
        {
          opcode: EffectTypeEnum.MagicalFireResistanceModifier,
          value: -10,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    winter.createStreamOfFrost();
    winter.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    winter.setBehavior({ abilities: [this.ability(Ids.StreamOfFrost)] });
    return winter;
  }

  /**
   * Worg
   */
  private worg() {
    const worg = this.create({
      monster: MonsterEnum.Worg,
      name: "monster.wolf.name.worg",
      files: ["WOLFCH", "BDWORG", "WORG", "WORGAR", "WORGSU"],
      data: {
        level1: 3,
        bonusHp: 3,
        strength: 16,
        dexterity: 13,
        constitution: 13,
        intelligence: 7,
        wisdom: 11,
        charisma: 8,
        ac: 6,
        apr: 1,
        xpv: 120,
        alignment: "NEUTRAL_EVIL",
        morale: 11,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_WORG",
        gender: "MALE",
        size: "Medium",
        movement: 18,
        immunities: ["magicalBeast"],
        items: {
          remove: ["P1-6"],
        },
      },
    });
    worg.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    worg.setAdjustments([{ files: ["WORGSU"], summon: true }]);
    return worg;
  }
}

export const createWolves = () => new WolfFamily();

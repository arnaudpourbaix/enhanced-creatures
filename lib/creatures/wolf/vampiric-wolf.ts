import { MonsterItemIconEnum } from "../../config/item";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureGrabConfig } from "../../src/model/creature/grab";
import { CreatureTripConfig } from "../../src/model/creature/trip";
import { ItemSlot } from "../../src/model/creature/item";
import { CreatureKin } from "../../src/model/creature/kin";
import { Effect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectDamageTypeEnum,
  EffectColorLocationEnum,
  EffectModifierTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import creatureService from "../../src/services/creature.service";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Wolf } from "./kin";

class VampiricWolf extends Wolf {
  createVampiricJaws(p: {
    effects?: Effect[];
    slot: ItemSlot;
    grab?: CreatureGrabConfig;
    trip?: CreatureTripConfig;
    bonusToHit?: number;
    doc?: boolean;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "common.naturalWeapon.jaws",
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
          ],
        },
      },
      grab: p.grab,
      trip: p.trip,
    });
  }
}

class VampiricWolfEntry extends CreatureEntry<VampiricWolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.VampiricWolf, kin);
    this.addCreature(() => this.vampiric());
  }

  createCreature(id: MonsterEnum): VampiricWolf {
    return new VampiricWolf(id);
  }

  /**
   * Vampiric Wolf
   */
  private vampiric() {
    const vampiric = this.create({
      monster: MonsterEnum.VampiricWolf,
      name: "monster.wolf.name.vampiric",
      files: [],
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
        xpv2e: 2000,
        alignment: "NEUTRAL_EVIL",
        morale: 14,
        general: "UNDEAD",
        race: "WOLF",
        class: "WOLF_VAMPIRIC",
        gender: "MALE",
        size: { value: "Small", tall: false, long: true },
        movement: 24,
        items: {
          remove: ["WOLFVA1", "BDWOLFVA", "IMMUNE1", "RING95"],
        },
        script: {
          remove: ["VAMPWOLF"],
        },
      },
    });
    // A bite attack will cause a running or standing victim to fall if the victim fails a saving
    // throw vs. paralysis.
    vampiric.createVampiricJaws({ slot: "WEAPON1", trip: {} });
    // Once the prey falls, the wolves shift to the victim's arms so that he can no longer use a
    // weapon: a called shot at -4 to hit, success means the wolf has grasped an arm in its mouth.
    // Once a grasping bite is made, damage is continually inflicted each round as the wolf gnaws
    // on the limb.
    vampiric.createVampiricJaws({
      slot: "WEAPON2",
      bonusToHit: -4,
      grab: {
        trigger: "probability",
        // the victim cannot get free unless he makes a successful Strength check (one attempt per
        // round)
        escape: "strength",
        damagePerRound: { type: EffectDamageTypeEnum.Piercing, amount: 8 },
        addStrengthBonus: true,
        // the gnawing steals life, like its bite
        lifeDrain: true,
        victimNoAttack: true,
        // an arm (or a leg) in its mouth: reaches a victim one size bigger
        limb: true,
      },
    });
    vampiric.addTrait({
      immunities: ["undead", "nonSilverNonMagicalWeapons"],
    });
    vampiric.setAttack({
      // the pack closes in on a helpless victim: held first, then fallen
      targetPriorities: [{ status: ["Grabbed", "Prone"] }],
      defaultWeaponSlot: "WEAPON1",
      targetStatusWeaponSlot: [{ status: ["Prone"], slot: "WEAPON2" }],
    });
    vampiric.setAdjustments([{ files: ["DW#ULCWO"], data: { level1: 15 } }]);
    return vampiric;
  }
}

export const createVampiricWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new VampiricWolfEntry(kins.get(KinEnum.Wolf));

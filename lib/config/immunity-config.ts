import { JEWEL_SLOTS } from "../src/model/creature/item";
import { ImmunityConfig } from "../src/model/final/immunity";
import { MISSILE_WEAPONS } from "../src/model/ids/projectile";
import { Effect } from "../src/model/spell-item/effect";
import {
  CastingTimeModifierTypeEnum,
  EffectBonusToEnum,
  EffectColorLocationEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  PortraitIconEnum,
  ProtectionFromWeaponsTypeEnum,
  TranslucencyTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AtLeast } from "../src/model/utility-types";
import { StringRefUtils } from "../src/services/utils/string-ref.utils";
import { AIR_CREATURES, WATER_CREATURES } from "./creatures";
import { ITEMS } from "./item";

export const IMMUNITIES: (AtLeast<ImmunityConfig, "name" | "type" | "stringRef"> & {
  type: "immunity";
})[] = [
  {
    name: "poison",
    type: "immunity",
    stringRef: "common.immunity.poison",
    preventEffects: [EffectTypeEnum.Poison],
    preventIcons: [PortraitIconEnum.Poisoned],
    displayIcons: [PortraitIconEnum.ProtectionFromPoison],
    strings: StringRefUtils.getStringIds("poison"),
    effects: [
      {
        opcode: EffectTypeEnum.PoisonResistanceModifier,
        value: 100,
      },
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "ITEM_POISON",
      },
    ],
    spellGroups: ["poison"],
    overrides: ["poisonResistance"],
  },
  {
    name: "disease",
    type: "immunity",
    stringRef: "common.immunity.disease",
    preventEffects: [EffectTypeEnum.Disease],
    preventIcons: [PortraitIconEnum.Diseased],
    strings: StringRefUtils.getStringIds("disease"),
    spellGroups: ["disease"],
  },
  {
    name: "bleeding",
    type: "immunity",
    stringRef: "common.immunity.bleeding",
    preventIcons: [PortraitIconEnum.Bleeding],
    strings: StringRefUtils.getStringIds("bleed"),
    spellGroups: ["bleeding"],
  },
  {
    name: "abilityDrain",
    type: "immunity",
    stringRef: "common.immunity.abilityDrain",
    preventEffects: [
      EffectTypeEnum.IntelligenceBonus,
      EffectTypeEnum.DexterityBonus,
      EffectTypeEnum.StrengthBonus,
      EffectTypeEnum.ConstitutionBonus,
    ],
    strings: StringRefUtils.getStringIds("rigidThinking"),
  },
  {
    name: "hold",
    type: "immunity",
    stringRef: "common.immunity.hold",
    preventEffects: [EffectTypeEnum.Paralyze, EffectTypeEnum.Hold],
    preventIcons: [PortraitIconEnum.Held],
    spellGroups: ["hold"],
    strings: StringRefUtils.getStringIds("held"),
    animations: ["SPFLAYER", "SPMINDAT"],
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "HOLD_IMMUNITY",
      },
    ],
  },
  {
    name: "stun",
    type: "immunity",
    stringRef: "common.immunity.stun",
    preventEffects: [EffectTypeEnum.Stun, EffectTypeEnum.Stun90HP],
    preventIcons: [PortraitIconEnum.Stun],
    strings: StringRefUtils.getStringIds("stun"),
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "STUN_IMMUNITY",
      },
    ],
  },
  {
    name: "maze",
    type: "immunity",
    stringRef: "common.immunity.maze",
    preventEffects: [EffectTypeEnum.Maze],
    preventIcons: [PortraitIconEnum.Maze],
    spellGroups: ["maze"],
  },
  {
    name: "energyDrain",
    type: "immunity",
    stringRef: "common.immunity.energyDrain",
    preventEffects: [EffectTypeEnum.LevelDrain],
    strings: StringRefUtils.getStringIds("levelDrain"),
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "ITEM_LEVELDRAIN",
      },
    ],
  },
  {
    name: "sleep",
    type: "immunity",
    stringRef: "common.immunity.sleep",
    preventEffects: [EffectTypeEnum.Sleep, EffectTypeEnum.Sleep20HP],
    preventIcons: [PortraitIconEnum.Sleep, PortraitIconEnum.Unconscious],
    strings: StringRefUtils.getStringIds("sleep"),
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "SLEEP_IMMUNITY",
      },
    ],
  },
  {
    name: "charm",
    type: "immunity",
    stringRef: "common.immunity.charm",
    preventEffects: [EffectTypeEnum.CharmCreature, EffectTypeEnum.CharmControlCreature],
    preventIcons: [PortraitIconEnum.Charm, PortraitIconEnum.DireCharm, PortraitIconEnum.Domination],
    strings: StringRefUtils.getStringIds("charm"),
    animations: ["SPNWCHRM"],
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "CHARM_IMMUNITY",
      },
    ],
  },
  {
    name: "confusion",
    type: "immunity",
    stringRef: "common.immunity.confusion",
    preventEffects: [EffectTypeEnum.Confusion],
    preventIcons: [PortraitIconEnum.Confused],
    strings: StringRefUtils.getStringIds(["rigidThinking", "confusion"]),
    animations: ["SPCONFUS"],
    spellGroups: ["confusion"],
    displaySpellIneffective: true,
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "CONFUSION_IMMUNITY",
      },
    ],
  },
  {
    name: "fear",
    type: "immunity",
    stringRef: "common.immunity.fear",
    preventEffects: [
      EffectTypeEnum.Panic,
      EffectTypeEnum.MoraleModifier,
      EffectTypeEnum.MoraleBreakModifier,
    ],
    preventIcons: [PortraitIconEnum.Panic],
    strings: StringRefUtils.getStringIds("panic"),
    animations: ["CDHORROR"],
    spellGroups: ["fear"],
    displaySpellIneffective: true,
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "RESIST_FEAR",
      },
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "PANIC_IMMUNITY",
      },
    ],
  },
  {
    name: "fatigue",
    type: "immunity",
    stringRef: "common.immunity.fatigue",
    preventEffects: [EffectTypeEnum.FatigueBonus],
    spellGroups: ["fatigue"],
    displaySpellIneffective: true,
  },
  {
    name: "magicMissile",
    type: "immunity",
    stringRef: "common.immunity.magicMissile",
    spellGroups: ["magicMissile"],
    displaySpellIneffective: true,
  },
  {
    name: "blindness",
    type: "immunity",
    stringRef: "common.immunity.blindness",
    preventEffects: [EffectTypeEnum.Blindness],
    preventIcons: [PortraitIconEnum.Blind],
    spellGroups: ["blindness"],
  },
  {
    name: "fireSpells",
    type: "immunity",
    stringRef: "common.immunity.fireSpells",
    spellGroups: ["fire"],
  },
  {
    name: "fire",
    type: "immunity",
    stringRef: "common.immunity.fire",
    effects: [
      {
        opcode: EffectTypeEnum.FireResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
      {
        opcode: EffectTypeEnum.MagicalFireResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["fireResistance"],
  },
  {
    name: "coldSpells",
    type: "immunity",
    stringRef: "common.immunity.coldSpells",
    spellGroups: ["cold"],
  },
  {
    name: "cold",
    type: "immunity",
    stringRef: "common.immunity.cold",
    effects: [
      {
        opcode: EffectTypeEnum.ColdResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
      {
        opcode: EffectTypeEnum.MagicalColdResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["coldResistance"],
  },
  {
    name: "lightningSpells",
    type: "immunity",
    stringRef: "common.immunity.lightningSpells",
    spellGroups: ["electrical"],
  },
  {
    name: "lightning",
    type: "immunity",
    stringRef: "common.immunity.lightning",
    effects: [
      {
        opcode: EffectTypeEnum.ElectricityResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["lightningResistance"],
  },
  {
    name: "magic",
    type: "immunity",
    stringRef: "common.immunity.magic",
    effects: [
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["magicResistance"],
  },
  {
    name: "magicDamage",
    type: "immunity",
    stringRef: "common.immunity.magicDamage",
    effects: [
      {
        opcode: EffectTypeEnum.MagicDamageResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["magicDamageResistance"],
  },
  {
    name: "acid",
    type: "immunity",
    stringRef: "common.immunity.acid",
    effects: [
      {
        opcode: EffectTypeEnum.AcidResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["acidResistance"],
  },
  {
    name: "acidSpells",
    type: "immunity",
    stringRef: "common.immunity.acidSpells",
    spellGroups: ["acidSpells"],
  },
  {
    name: "cureWoundSpells",
    type: "immunity",
    stringRef: "common.immunity.cureWoundSpells",
    spellGroups: ["cureWounds", "curePoison"],
    displaySpellIneffective: true,
  },
  {
    name: "causeWoundSpells",
    type: "immunity",
    stringRef: "common.immunity.causeWoundSpells",
    effects: ["LIGHT", "SERIOUS", "CRITICAL", "HARM"].map((resource) => ({
      opcode: EffectTypeEnum.ProtectionFromResource,
      type: "ANYONE",
      resource,
    })),
    displaySpellIneffective: true,
  },
  {
    name: "cloudSpells",
    type: "immunity",
    itemSlot: { file: ITEMS.CloudSpells, slot: JEWEL_SLOTS },
    stringRef: "common.immunity.cloudSpells",
    spellGroups: ["cloud"],
    displaySpellIneffective: true,
  },
  {
    name: "web",
    type: "immunity",
    stringRef: "common.immunity.web",
    preventEffects: [EffectTypeEnum.Web],
    preventIcons: [PortraitIconEnum.Webbed],
    spellGroups: ["web"],
    effects: [
      {
        opcode: EffectTypeEnum.ProtectionFromProjectile,
        projectile: 319, // webtrav
      },
    ],
    displaySpellIneffective: true,
  },
  {
    name: "entangle",
    type: "immunity",
    stringRef: "common.immunity.entangle",
    preventEffects: [EffectTypeEnum.EntangleOverlay],
    preventIcons: [PortraitIconEnum.Entangled],
    spellGroups: ["entangle"],
    displaySpellIneffective: true,
    itemSlot: { file: ITEMS.EntangleImmunity, slot: JEWEL_SLOTS },
  },
  {
    name: "insectSpells",
    type: "immunity",
    stringRef: "common.immunity.insectSpells",
    spellGroups: ["insect"],
    displaySpellIneffective: true,
  },
  {
    name: "petrification",
    type: "immunity",
    stringRef: "common.immunity.petrification",
    preventEffects: [EffectTypeEnum.Petrification],
    strings: StringRefUtils.getStringIds("petrified"),
    spellGroups: ["petrification"],
    displaySpellIneffective: true,
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "PETRIFY_IMMUNITY",
      },
    ],
  },
  {
    name: "polymorph",
    type: "immunity",
    stringRef: "common.immunity.polymorph",
    //preventEffects: [EffectTypeEnum.PolymorphIntoSpecific], // not used anymore
    preventIcons: [PortraitIconEnum.Polymorphed],
    strings: StringRefUtils.getStringIds("polymorph"),
    spellGroups: ["polymorph"],
    displaySpellIneffective: true,
  },
  {
    name: "vorpal",
    type: "immunity",
    stringRef: "common.immunity.vorpal",
    preventEffects: [EffectTypeEnum.KillTarget, EffectTypeEnum.Slay],
    strings: StringRefUtils.getStringIds("death"),
  },
  {
    name: "earthquake",
    type: "immunity",
    stringRef: "common.immunity.earthquakeSpells",
    spellGroups: ["earthquake"],
    displaySpellIneffective: true,
  },
  {
    name: "physicalDamage",
    type: "immunity",
    stringRef: "common.immunity.physicalDamage",
    immunities: ["slashingDamage", "crushingDamage", "piercingDamage", "missileDamage"],
    overrides: ["physicalDamageResistance"],
  },
  {
    name: "slashingDamage",
    type: "immunity",
    stringRef: "common.immunity.slashingDamage",
    effects: [
      {
        opcode: EffectTypeEnum.SlashingResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["slashingDamageResistance"],
  },
  {
    name: "crushingDamage",
    type: "immunity",
    stringRef: "common.immunity.crushingDamage",
    effects: [
      {
        opcode: EffectTypeEnum.CrushingResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["crushingDamageResistance"],
  },
  {
    name: "piercingDamage",
    type: "immunity",
    stringRef: "common.immunity.piercingDamage",
    effects: [
      {
        opcode: EffectTypeEnum.PiercingResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["piercingDamageResistance"],
  },
  {
    name: "missileDamage",
    type: "immunity",
    stringRef: "common.immunity.missileDamage",
    effects: [
      {
        opcode: EffectTypeEnum.MissilesResistanceModifier,
        value: 100,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
    overrides: ["missileDamageResistance"],
  },
  {
    name: "missileWeapons",
    type: "immunity",
    stringRef: "common.immunity.missileWeapons",
    effects: MISSILE_WEAPONS.map((w) => ({
      opcode: EffectTypeEnum.ProtectionFromProjectile,
      projectile: w,
    })),
  },
  {
    name: "turnUndead",
    type: "immunity",
    stringRef: "common.immunity.turnUndead",
    effects: [{ opcode: EffectTypeEnum.ImmunityToTurnUndead }],
  },
  {
    name: "illusion",
    type: "immunity",
    stringRef: "common.immunity.illusion",
    spellGroups: ["illusion"],
    displaySpellIneffective: true,
  },
  {
    name: "necromancyEffects",
    type: "immunity",
    stringRef: "common.immunity.necromancyEffects",
    immunities: ["cureWoundSpells", "causeWoundSpells"],
    spellGroups: ["necromancyEffects", "curePoison"],
    displaySpellIneffective: true,
  },
  {
    name: "deathEffects",
    type: "immunity",
    stringRef: "common.immunity.deathEffects",
    preventEffects: [EffectTypeEnum.DeathKill60HP, EffectTypeEnum.KillTarget, EffectTypeEnum.Slay],
    effects: [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: "DEATH_IMMUNITY",
      },
    ],
  },
  {
    name: "deathSpell",
    type: "immunity",
    stringRef: "common.immunity.deathSpell",
    spellGroups: ["death"],
    displaySpellIneffective: true,
  },
  {
    name: "mindSpells",
    type: "immunity",
    stringRef: "common.immunity.mindSpells",
    preventEffects: [EffectTypeEnum.Berserk],
    immunities: ["charm", "fear", "confusion", "illusion", "hold", "stun"],
  },
  {
    name: "nonMagicalWeapons",
    type: "immunity",
    stringRef: "common.immunity.nonMagicalWeapons",
    effects: [
      {
        opcode: EffectTypeEnum.ProtectionFromWeapons,
        type: ProtectionFromWeaponsTypeEnum.NonMagical,
        enchantment: 0,
      },
    ],
  },
  {
    name: "nonSilverNonMagicalWeapons",
    type: "immunity",
    stringRef: "common.immunity.nonSilverNonMagicalWeapons",
    effects: [
      {
        opcode: EffectTypeEnum.ProtectionFromWeapons,
        type: ProtectionFromWeaponsTypeEnum.NonSilverNonMagical,
        enchantment: 0,
      },
    ],
  },
  {
    name: "plusOneWeapons",
    type: "immunity",
    stringRef: "common.immunity.plusOneWeapons",
    immunities: ["nonMagicalWeapons"],
    effects: [
      {
        opcode: EffectTypeEnum.ProtectionFromWeapons,
        type: ProtectionFromWeaponsTypeEnum.Enchanted,
        enchantment: 1,
      },
    ],
  },
  {
    name: "plusTwoWeapons",
    type: "immunity",
    stringRef: "common.immunity.plusTwoWeapons",
    immunities: ["plusOneWeapons"],
    effects: [
      {
        opcode: EffectTypeEnum.ProtectionFromWeapons,
        type: ProtectionFromWeaponsTypeEnum.Enchanted,
        enchantment: 2,
      },
    ],
  },
  {
    name: "backstab",
    type: "immunity",
    stringRef: "common.immunity.backstab",
    effects: [{ opcode: EffectTypeEnum.ProtectionFromBackstab }],
  },
  {
    name: "criticalHit",
    type: "immunity",
    itemSlot: { file: ITEMS.CriticalHitImmunity, slot: "HELMET" },
    stringRef: "common.immunity.criticalHit",
  },
  {
    name: "devourBrain",
    type: "immunity",
    stringRef: "common.immunity.devourBrain",
    preventEffects: [EffectTypeEnum.IntelligenceBonus],
  },
  {
    name: "fireballSpell",
    type: "immunity",
    stringRef: "common.immunity.fireballSpell",
    spellGroups: ["fireball"],
    displaySpellIneffective: true,
  },
  {
    name: "lightningBoltSpell",
    type: "immunity",
    stringRef: "common.immunity.lightningBoltSpell",
    spellGroups: ["lightningBolt"],
    displaySpellIneffective: true,
  },
  {
    name: "flameArrowSpell",
    type: "immunity",
    stringRef: "common.immunity.flameArrowSpell",
    spellGroups: ["flameArrow"],
    displaySpellIneffective: true,
  },
  {
    name: "gazeAttacks",
    type: "immunity",
    stringRef: "common.immunity.gazeAttacks",
    immunities: ["petrification"],
  },
];

export const RESISTANCES: (AtLeast<ImmunityConfig, "name" | "type" | "stringRef"> & {
  type: "resistance";
})[] = [
  {
    name: "poisonResistance",
    stringRef: "common.resistance.poison",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.PoisonResistanceModifier,
        value: 50,
      },
    ],
  },
  {
    name: "fireResistance",
    stringRef: "common.resistance.fire",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.FireResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
      {
        opcode: EffectTypeEnum.MagicalFireResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "coldResistance",
    stringRef: "common.resistance.cold",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.ColdResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
      {
        opcode: EffectTypeEnum.MagicalColdResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "lightningResistance",
    stringRef: "common.resistance.lightning",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.ElectricityResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "magicResistance",
    stringRef: "common.resistance.magic",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "magicDamageResistance",
    stringRef: "common.resistance.magicDamage",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.MagicDamageResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "acidResistance",
    stringRef: "common.resistance.acid",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.AcidResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "physicalDamageResistance",
    stringRef: "common.resistance.physicalDamage",
    type: "resistance",
    immunities: [
      "slashingDamageResistance",
      "crushingDamageResistance",
      "piercingDamageResistance",
      "missileDamageResistance",
    ],
  },
  {
    name: "slashingDamageResistance",
    stringRef: "common.resistance.slashingDamage",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.SlashingResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "crushingDamageResistance",
    stringRef: "common.resistance.crushingDamage",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.CrushingResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "piercingDamageResistance",
    stringRef: "common.resistance.piercingDamage",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.PiercingResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
  {
    name: "missileDamageResistance",
    stringRef: "common.resistance.missileDamage",
    type: "resistance",
    effects: [
      {
        opcode: EffectTypeEnum.MissilesResistanceModifier,
        value: 50,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  },
];

type TraitImmunityKeys = "name" | "type" | "stringRef" | "description";

export const TRAITS: (AtLeast<ImmunityConfig, TraitImmunityKeys> & {
  type: "trait";
})[] = [
  {
    name: "hover",
    type: "trait",
    itemSlot: { file: ITEMS.Hover, slot: "BOOTS" },
    stringRef: "common.traits.hover.name",
    description: "common.traits.hover.desc",
    immunities: ["entangle", "web"],
    spellGroups: ["ground"],
    displaySpellIneffective: true,
  },
  {
    name: "construct",
    type: "trait",
    itemSlot: { file: ITEMS.Construct, slot: JEWEL_SLOTS },
    stringRef: "common.traits.construct.name",
    description: "common.traits.construct.desc",
    immunities: [
      "poison",
      "sleep",
      "hold",
      "bleeding",
      "stun",
      "disease",
      "deathEffects",
      "necromancyEffects",
      "mindSpells",
      "backstab",
      "criticalHit",
      "abilityDrain",
      "energyDrain",
      "fatigue",
      "petrification",
      "insectSpells",
      "infravision",
    ],
  },
  {
    name: "undead",
    type: "trait",
    itemSlot: { file: ITEMS.Undead, slot: JEWEL_SLOTS },
    stringRef: "common.traits.undead.name",
    description: "common.traits.undead.desc",
    immunities: [
      "poison",
      "sleep",
      "hold",
      "bleeding",
      "stun",
      "disease",
      "deathEffects",
      "necromancyEffects",
      "mindSpells",
      "backstab",
      "criticalHit",
      "abilityDrain",
      "energyDrain",
      "fatigue",
      "petrification",
      "insectSpells",
      "infravision",
    ],
  },
  {
    name: "fey",
    type: "trait",
    itemSlot: { file: ITEMS.Fey, slot: JEWEL_SLOTS },
    stringRef: "common.traits.fey.name",
    description: "common.traits.fey.desc",
    effects: [
      {
        opcode: EffectTypeEnum.CastingTimeModifier,
        value: 1,
        type: CastingTimeModifierTypeEnum.Set,
      },
    ],
  },
  {
    name: "elemental",
    type: "trait",
    stringRef: "common.traits.elemental.name",
    description: "common.traits.elemental.desc",
    immunities: [
      "poison",
      "sleep",
      "hold",
      "bleeding",
      "stun",
      "criticalHit",
      "backstab",
      "devourBrain",
      "petrification",
      "insectSpells",
      "infravision",
    ],
  },
  {
    name: "airAffinity",
    type: "trait",
    stringRef: "common.traits.airAffinity.name",
    description: "common.traits.airAffinity.desc",
    effects: AIR_CREATURES.map(([f, e]): Effect[] => [
      {
        opcode: EffectTypeEnum.DamageVsCreatureTypeModifier,
        idsFile: f,
        idsEntry: e,
        special: 4,
      },
      {
        opcode: EffectTypeEnum.Thac0VsCreatureTypeModifier,
        idsFile: f,
        idsEntry: e,
        special: 1,
      },
    ]).flat(),
  },
  {
    name: "earthAffinity",
    type: "trait",
    stringRef: "common.traits.earthAffinity.name",
    description: "common.traits.earthAffinity.desc",
    immunities: ["earthquake"],
    effects: [...AIR_CREATURES, ...WATER_CREATURES]
      .map(([f, e]): Effect[] => [
        {
          opcode: EffectTypeEnum.DamageVsCreatureTypeModifier,
          idsFile: f,
          idsEntry: e,
          special: -2,
        },
        {
          opcode: EffectTypeEnum.Thac0VsCreatureTypeModifier,
          idsFile: f,
          idsEntry: e,
          special: -2,
        },
      ])
      .flat(),
  },
  {
    name: "skeletal",
    type: "trait",
    itemSlot: { file: ITEMS.Sketetal, slot: JEWEL_SLOTS },
    stringRef: "common.traits.skeletal.name",
    description: "common.traits.skeletal.desc",
    immunities: [
      "cold",
      "coldSpells",
      "slashingDamageResistance",
      "missileDamageResistance",
      "piercingDamageResistance",
    ],
  },
  {
    name: "extraplanar",
    type: "trait",
    stringRef: "common.traits.extraplanar.name",
    description: "common.traits.extraplanar.desc",
    immunities: ["cureWoundSpells", "causeWoundSpells", "deathSpell"],
  },
  {
    name: "plant",
    type: "trait",
    stringRef: "common.traits.plant.name",
    description: "common.traits.plant.desc",
    itemSlot: { file: ITEMS.Plant, slot: JEWEL_SLOTS },
    immunities: [
      "mindSpells",
      "poison",
      "sleep",
      "hold",
      "polymorph",
      "stun",
      "criticalHit",
      "backstab",
      "disease",
      "bleeding",
      "petrification",
      "insectSpells",
      "entangle",
      "infravision",
    ],
  },
  {
    name: "infravision",
    type: "trait",
    stringRef: "common.traits.infravision",
    effects: [{ opcode: EffectTypeEnum.Infravision }],
  },
  {
    name: "seeInvisible",
    type: "trait",
    stringRef: "common.traits.seeInvisible",
    effects: [{ opcode: EffectTypeEnum.InvisibilityDetection }],
  },
  {
    name: "incorporeal",
    itemSlot: { file: ITEMS.Incorporeal, slot: JEWEL_SLOTS },
    type: "trait",
    stringRef: "common.traits.incorporeal.name",
    description: "common.traits.incorporeal.desc",
    immunities: [
      "backstab",
      "criticalHit",
      "fireResistance",
      "coldResistance",
      "lightningResistance",
      "acidResistance",
      "poisonResistance",
      "magicDamageResistance",
      "physicalDamageResistance",
      "nonMagicalWeapons",
    ],
    effects: [
      {
        opcode: EffectTypeEnum.Translucency,
        amount: 99,
        type: TranslucencyTypeEnum.DrawInstantly,
      },
      {
        opcode: EffectTypeEnum.SetColorGlowPulse,
        color: { red: 125, green: 125, blue: 125 },
        location: EffectColorLocationEnum.CharacterColor,
        cycleSpeed: 30,
      },
      {
        opcode: EffectTypeEnum.CreatureRGBColorFade,
        color: { red: 90, green: 30, blue: 90 },
        fadeSpeed: 25,
      },
      { opcode: EffectTypeEnum.NoCollisionDetection, passWalls: true },
      { opcode: EffectTypeEnum.ModifyCollisionBehavior },
      // { opcode: EffectTypeEnum.OverrideCreatureData, field: "PersonalSpace", value: 0 }, // Create 2 issues: creature can attack from range and can't move at all
      // { opcode: EffectTypeEnum.MakeUnselectable, disableDialog: false },
      // { opcode: EffectTypeEnum.SelectionCircleRemoval },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.Invulnerable,
      },
      {
        opcode: EffectTypeEnum.ArmorClassBonus,
        value: 3,
        bonusTo: EffectBonusToEnum.AllWeapons,
      },
      {
        opcode: EffectTypeEnum.Thac0Bonus,
        value: 4,
        type: EffectModifierTypeEnum.Increment,
      },
    ],
  },
  {
    name: "blindsight",
    type: "trait",
    stringRef: "common.traits.blindsight.name",
    description: "common.traits.blindsight.desc",
    immunities: ["gazeAttacks", "seeInvisible"],
  },
  {
    name: "ooze",
    type: "trait",
    itemSlot: { file: ITEMS.Ooze, slot: JEWEL_SLOTS },
    stringRef: "common.traits.ooze.name",
    description: "common.traits.ooze.desc",
    immunities: [
      "mindSpells",
      "backstab",
      "poison",
      "sleep",
      "hold",
      "stun",
      "bleeding",
      "criticalHit",
      "backstab",
      "infravision",
      "polymorph",
      "blindsight",
      "blindness",
    ],
    effects: [
      {
        opcode: EffectTypeEnum.Translucency,
        amount: 100,
        type: TranslucencyTypeEnum.DrawInstantly,
      },
      { opcode: EffectTypeEnum.NoCollisionDetection, passWalls: true },
      { opcode: EffectTypeEnum.ModifyCollisionBehavior },
    ],
  },
  {
    name: "vermin",
    type: "trait",
    stringRef: "common.traits.vermin.name",
    description: "common.traits.vermin.desc",
    itemSlot: { file: ITEMS.Vermin, slot: JEWEL_SLOTS },
    immunities: ["infravision", "mindSpells"],
  },
  {
    name: "spider",
    type: "trait",
    stringRef: "common.traits.spider",
    itemSlot: { file: ITEMS.Spider, slot: JEWEL_SLOTS },
    immunities: ["web", "poison", "vermin"],
  },
  {
    name: "cat",
    type: "trait",
    stringRef: "common.traits.cat",
    itemSlot: { file: ITEMS.Cat, slot: JEWEL_SLOTS },
    immunities: ["infravision", "backstab"],
  },
  {
    name: "magicalBeast",
    type: "trait",
    stringRef: "common.traits.magicalBeast.name",
    description: "common.traits.magicalBeast.desc",
    itemSlot: { file: ITEMS.MagicalBeast, slot: JEWEL_SLOTS },
    immunities: ["infravision"],
  },
  {
    name: "giant",
    type: "trait",
    stringRef: "common.traits.giant.name",
    description: "common.traits.giant.desc",
    itemSlot: { file: ITEMS.Giant, slot: JEWEL_SLOTS },
    immunities: ["infravision"],
  },
  {
    name: "ghostVisual1",
    type: "trait",
    doc: false,
    stringRef: "common.traits.ghostVisual1",
    itemSlot: { file: ITEMS.Vermin, slot: JEWEL_SLOTS },
    effects: [
      {
        opcode: EffectTypeEnum.SetColorGlowPulse,
        color: { red: 222, green: 201, blue: 255 },
        location: EffectColorLocationEnum.ArmorBlueArmorTrimming,
        cycleSpeed: 43,
      },
      {
        opcode: EffectTypeEnum.SetColorGlowPulse,
        color: { red: 183, green: 222, blue: 255 },
        location: EffectColorLocationEnum.WeaponBlueHeadBladeMinor,
        cycleSpeed: 47,
      },
      {
        opcode: EffectTypeEnum.SetColorGlowPulse,
        color: { red: 174, green: 219, blue: 255 },
        location: EffectColorLocationEnum.HelmetBlueExterior,
        cycleSpeed: 40,
      },
      {
        opcode: EffectTypeEnum.SetColorGlowPulse,
        color: { red: 223, green: 223, blue: 249 },
        location: EffectColorLocationEnum.ShieldBlueBodyTrim,
        cycleSpeed: 42,
      },
      {
        opcode: EffectTypeEnum.Blur,
      },
    ],
  },
];

/**
 * Vampires, by age category (Van Richten's Guide to Vampires, "Powers by Age"):
 * fledgling, mature, old, very old, ancient, eminent, patriarch.
 *
 * Every age is built from the same table row (see VAMPIRE_AGES), so a vampire's powers only
 * differ by what the table says.
 */
import { SPELL_STATES } from "../config/common";
import { SpellKeyword } from "../config/spells/keyword";
import { SPELLS } from "../config/spells/spell-database";
import effectFactory from "../src/factories/effect.factory";
import responseFactory from "../src/factories/response.factory";
import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { RawCreatureAbility } from "../src/model/creature/ability";
import { AbstractCreature } from "../src/model/creature/abstract-creature";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { ImmunityName } from "../src/model/final/immunity";
import { StringReference } from "../src/model/final/stringref";
import { Durations } from "../src/model/game-data/durations";
import { AnimationIdentifiers } from "../src/model/ids/animate";
import { PartialCustomCode } from "../src/model/script/script";
import { Triggers } from "../src/model/script/triggers";
import { Effect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  AnimationChangeTypeEnum,
  AttackModifierTypeEnum,
  CastSpellOnConditionTargetEnum,
  CharmTypeEnum,
  DisableButtonEnum,
  DisableSpellcastingTypeEnum,
  EffectBonusToEnum,
  EffectDispelResistanceEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import {
  AreaExtendedFlagsEnum,
  AreaProjectileEnum,
  BamProjectileFlagsEnum,
  ProjectileExplosionEffectEnum,
  ProjectileExtendedFlagsEnum,
} from "../src/model/spell-item/projectile";
import { PartialSpellHeader, Spell } from "../src/model/spell-item/spell-item";
import targetService from "../src/services/baf/target.service";
import monsterFilesService from "../src/services/monster-files.service";
import { StringRefUtils } from "../src/services/utils/string-ref.utils";
import { TranslationKey } from "../translations/i18n";
import { EntryEnum } from "./entry";
import { MonsterEnum } from "./monster";
import type { TurnUndeadType } from "./types/turn-level";
import { createClaws } from "./types/undead";

enum Ids {
  VampireGazeDomination2,
  VampireGazeDomination3,
  VampireVoiceDomination,
  VampireWillDomination,
  VampireBatSwarm,
  VampireControlUndead,
  VampireWolfForm,
  VampireWolfFormOwnSpeed,
  VampireBatForm,
  VampireBatFormOwnSpeed,
  VampireMistForm,
}

/**
 * How a vampire dominates its victims: younger vampires must meet their eyes, ancient and eminent
 * ones only need to be heard, and a patriarch needs neither.
 */
type DominationMode = "gaze" | "voice" | "will";

interface VampireAge {
  monster: MonsterEnum;
  name: TranslationKey;
  level1: number;
  bonusHp: number;
  /** PHB: vampires are turned as vampires, as ghosts with 10 HD, as liches with 11+ HD. */
  turnAs: TurnUndeadType;
  strength: number;
  exceptionalStrength?: number;
  intelligence: number;
  dexterity: number;
  charisma: number;
  movement: number;
  xpv: number;
  domination: { id: Ids; mode: DominationMode; saveBonus: number };
  /** Weapon needed to hit: immune to every weapon below it */
  weaponImmunity: ImmunityName;
  regeneration: number;
  magicResistance: number;
}

const VAMPIRE_AGES: VampireAge[] = [
  {
    monster: MonsterEnum.VampireFledgling,
    name: "monster.undead.name.fledglingVampire",
    level1: 8,
    bonusHp: 3,
    turnAs: "vampire",
    strength: 18,
    exceptionalStrength: 76,
    intelligence: 16,
    dexterity: 16,
    charisma: 14,
    movement: 12,
    xpv: 8000,
    domination: { id: Ids.VampireGazeDomination2, mode: "gaze", saveBonus: -2 },
    weaponImmunity: "nonMagicalWeapons",
    regeneration: 3,
    magicResistance: 0,
  },
  {
    monster: MonsterEnum.VampireMature,
    name: "monster.undead.name.matureVampire",
    level1: 9,
    bonusHp: 3,
    turnAs: "vampire",
    strength: 18, // the table says 19/91, which can't exist: read as 18/91
    exceptionalStrength: 91,
    intelligence: 16,
    dexterity: 17,
    charisma: 15,
    movement: 15,
    xpv: 9000,
    domination: { id: Ids.VampireGazeDomination2, mode: "gaze", saveBonus: -2 },
    weaponImmunity: "nonMagicalWeapons",
    regeneration: 3,
    magicResistance: 5,
  },
  {
    monster: MonsterEnum.VampireOld,
    name: "monster.undead.name.oldVampire",
    level1: 10,
    bonusHp: 2,
    turnAs: "ghost",
    strength: 18,
    exceptionalStrength: 100,
    intelligence: 17,
    dexterity: 17,
    charisma: 16,
    movement: 15,
    xpv: 11000,
    domination: { id: Ids.VampireGazeDomination3, mode: "gaze", saveBonus: -3 },
    weaponImmunity: "plusOneWeapons",
    regeneration: 3,
    magicResistance: 10,
  },
  {
    monster: MonsterEnum.VampireVeryOld,
    name: "monster.undead.name.veryOldVampire",
    level1: 11,
    bonusHp: 1,
    turnAs: "lich",
    strength: 18,
    exceptionalStrength: 100,
    intelligence: 18,
    dexterity: 18,
    charisma: 17,
    movement: 18,
    xpv: 12000,
    domination: { id: Ids.VampireGazeDomination3, mode: "gaze", saveBonus: -3 },
    weaponImmunity: "plusOneWeapons",
    regeneration: 4,
    magicResistance: 15,
  },
  {
    monster: MonsterEnum.VampireAncient,
    name: "monster.undead.name.ancientVampire",
    level1: 12,
    bonusHp: 0,
    turnAs: "lich",
    strength: 19,
    intelligence: 18,
    dexterity: 18,
    charisma: 18,
    movement: 18,
    xpv: 14000,
    domination: { id: Ids.VampireVoiceDomination, mode: "voice", saveBonus: -4 },
    weaponImmunity: "plusTwoWeapons",
    regeneration: 4,
    magicResistance: 20,
  },
  {
    monster: MonsterEnum.VampireEminent,
    name: "monster.undead.name.eminentVampire",
    level1: 13,
    bonusHp: 0,
    turnAs: "lich",
    strength: 20,
    intelligence: 19,
    dexterity: 19,
    charisma: 18,
    movement: 21,
    xpv: 15000,
    domination: { id: Ids.VampireVoiceDomination, mode: "voice", saveBonus: -4 },
    weaponImmunity: "plusTwoWeapons",
    regeneration: 4,
    magicResistance: 25,
  },
  {
    monster: MonsterEnum.VampirePatriarch,
    name: "monster.undead.name.patriarchVampire",
    level1: 14,
    bonusHp: 0,
    turnAs: "lich",
    strength: 21,
    intelligence: 20,
    dexterity: 20,
    charisma: 19,
    movement: 24,
    xpv: 17000,
    domination: { id: Ids.VampireWillDomination, mode: "will", saveBonus: -5 },
    weaponImmunity: "plusThreeWeapons",
    regeneration: 5,
    magicResistance: 30,
  },
];

const DOMINATION_TEXTS: Record<
  DominationMode,
  { name: StringReference; description: StringReference; keywords: SpellKeyword[] }
> = {
  gaze: {
    name: "monster.undead.ability.vampireDomination.gazeName",
    description: "monster.undead.ability.vampireDomination.gazeDescription",
    keywords: ["charm", "gaze"],
  },
  voice: {
    name: "monster.undead.ability.vampireDomination.voiceName",
    description: "monster.undead.ability.vampireDomination.voiceDescription",
    keywords: ["charm"],
  },
  will: {
    name: "monster.undead.ability.vampireDomination.willName",
    description: "monster.undead.ability.vampireDomination.willDescription",
    keywords: ["charm"],
  },
};

/** A vampire in wolf, bat or gaseous form can't use its other powers. */
const NOT_SHAPECHANGED: Triggers.Trigger[] = [
  SPELL_STATES.animalForm,
  SPELL_STATES.gaseousForm,
].map((state) => ({
  name: "CheckSpellState",
  params: [ScriptTarget.myself, state],
  negation: true,
}));

/** How long a wolf or bat form lasts before the vampire takes back its own form. */
const ANIMAL_FORM_DURATION = 3 * Durations.round;

/**
 * Domination: any person dominated by the vampire is affected as if by a charm person spell, with
 * a saving throw vs. spell penalty that grows with the vampire's age.
 * A gaze needs the victim to meet the vampire's eyes: it is blocked by gaze attack immunity, and
 * the vampire doesn't try it on blinded creatures. Voice and will don't have these limits, but a
 * silenced vampire can't use its voice.
 */
function domination(group: AbstractCreature, domination: VampireAge["domination"]) {
  const texts = DOMINATION_TEXTS[domination.mode];
  return group.addSpell({
    name: texts.name,
    description: texts.description,
    id: domination.id,
    memorizedCount: 1,
    icon: SPELLS.Wizard.Domination.file,
    primaryType: ItemAbilityPrimaryTypeEnum.Enchanter,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: texts.keywords,
    // usable every round, like the original SPIN883 (removes itself, re-added 1 round later)
    options: { renew: 1 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        range: 30,
        speed: 1,
        // like the original SPIN883, so protections from gaze projectiles (e.g. blindness) apply
        projectile: domination.mode === "gaze" ? "GAZE" : undefined,
        effects: effectFactory.charm({
          charmType: CharmTypeEnum.HostileDomination,
          duration: 8 * Durations.round,
          dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
          saveType: SaveTypeEnum.Spell,
          saveBonus: domination.saveBonus,
        }),
      },
    ],
    ability: {
      preset: SPELLS.Wizard.CharmPerson.file,
      requireVocal: domination.mode === "voice",
      spell: {
        type: "force",
        excludeStateChecks: domination.mode === "gaze" ? ["STATE_BLIND"] : undefined,
      },
      triggers: NOT_SHAPECHANGED,
      // not always the first thing a vampire does
      probability: 50,
    },
  });
}

/** Rounds a bat swarm stays, and how often it strikes the creatures caught in it. */
const BAT_SWARM_ROUNDS = 5;

const BAT_SWARM_PULSE = 15; // 1 second, in frames

/**
 * The game's bat flight (BG2's bat creature animation ABATG1, kept to its first 5 cycles: one per
 * direction, south to north), in the vampire's assets.
 */
const BAT_FLIGHT_BAM = "jaae4900";

/**
 * Animal control: the vampire summons a swarm of bats covering a 20-foot radius. Those caught
 * within it are blinded, suffer a -4 penalty to attack rolls and Armor Class, and have their
 * movement rate cut in half. The bats are controlled by the vampire: they only harm its enemies.
 * The swarm strikes every second, and each creature is affected at most once per round: leaving
 * the swarm ends its effects by the next round. They last one pulse longer than that protection,
 * so the strike renewing them lands before they wear off.
 */
function batSwarm(group: AbstractCreature) {
  const base = {
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round + 1,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  return group.addSpell({
    name: "monster.undead.ability.vampireBatSwarm.name",
    description: "monster.undead.ability.vampireBatSwarm.description",
    id: Ids.VampireBatSwarm,
    memorizedCount: 1,
    keywords: ["area"],
    castingSound: "CAS_P03",
    icon: SPELLS.Class.SummonSpiritAnimal.file,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    headers: [
      {
        type: ItemAbilityTypeEnum.Ranged,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        range: 30,
        speed: 1,
        projectile: {
          copyFromFile: "dvstink",
          name: "Vampire bat swarm",
          // Bats instead of the stinking cloud, each one with a random direction (cycle) and wing
          // beat (frame)
          extendedFlags: [
            ProjectileExtendedFlagsEnum.StartRandomFrame,
            ProjectileExtendedFlagsEnum.StartRandomSequence,
          ],
          // a bat flies to the spot (no more colouring it green)
          projectileInfo: {
            bamProjectileFlags: [BamProjectileFlagsEnum.EnableAreaLightingUsage],
            travelingAnimation: BAT_FLIGHT_BAM,
            faceTargetGranularity: 5, // its 5 cycles, from south to north
          },
          areaEffectInfo: {
            areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
            explosionDelay: BAT_SWARM_PULSE,
            triggerCount: (BAT_SWARM_ROUNDS * Durations.round * 15) / BAT_SWARM_PULSE,
            triggerRadius: 360,
            areaOfEffect: 360, // 20-foot radius
            explosionEffect: ProjectileExplosionEffectEnum.CUSTOM,
            // scattered all over the area for as long as it lasts, as the game's own clouds do
            spreadAnimation: BAT_FLIGHT_BAM,
            areaExtendedFlags: [
              AreaExtendedFlagsEnum.StartScattered,
              AreaExtendedFlagsEnum.RepeatScattering,
              AreaExtendedFlagsEnum.Cloud,
            ],
          },
        },
        effects: [
          ...effectFactory.blindness(base),
          {
            opcode: EffectTypeEnum.Thac0Bonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -4,
            ...base,
          },
          {
            opcode: EffectTypeEnum.ArmorClassBonus,
            bonusTo: EffectBonusToEnum.AllWeapons,
            value: -4,
            ...base,
          },
          {
            opcode: EffectTypeEnum.MovementRateBonus,
            type: EffectModifierTypeEnum.SetPercentOf,
            value: 50,
            ...base,
          },
          { opcode: EffectTypeEnum.ProtectionFromSpell, ...base, duration: Durations.round },
        ],
      },
    ],
    ability: {
      targets: [{ name: "NearestEnemies" }],
      triggers: NOT_SHAPECHANGED,
      spell: { type: "force", remove: true },
      probability: 50,
    },
  });
}

/**
 * The charm visual (SPNWCHRM), copied under the vampire's own name: undead are immune to charm,
 * which also blocks SPNWCHRM on them.
 */
const CONTROL_UNDEAD_VISUAL = "jave4900";

/** Highest vampire level, for some bosses: the youngest vampire is the lowest one. */
const VAMPIRE_MAX_LEVEL = 25;

/**
 * Controlling undead: the vampire controls a lesser undead, of up to half its Hit Dice. One header
 * per caster level, so a vampire with more Hit Dice (an older one, or a stronger file) controls
 * stronger undead. Mindless undead get no saving throw, but PnP's intelligent undead save vs.
 * paralysis can't be told apart from them here, so none get one.
 * The book pools the Hit Dice of every controlled creature; each control is checked on its own.
 */
function controlUndead(group: AbstractCreature) {
  // Highest undead level controlled by each header, from the youngest vampire to the strongest
  const minLevel = Math.floor(VAMPIRE_AGES[0].level1 / 2);
  const maxLevel = Math.floor(VAMPIRE_MAX_LEVEL / 2);
  const levels = Array.from({ length: maxLevel - minLevel + 1 }, (_, i) => minLevel + i);
  const headers: PartialSpellHeader[] = levels.map((level) => {
    // feedback of the vanilla Control Undead, only shown when the control takes hold
    const base = {
      dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
      maxLevel: level,
    };
    const feedback = { ...base, timing: EffectTimingEnum.InstantPermanentUntilDeath };
    return {
      minLevel: 2 * level,
      type: ItemAbilityTypeEnum.Melee,
      location: ItemAbilityLocationEnum.Ability,
      target: ItemAbilityTargetEnum.LivingActor,
      range: 30,
      speed: 1,
      effects: [
        {
          opcode: EffectTypeEnum.CharmControlCreature,
          generalType: "UNDEAD",
          charmType: CharmTypeEnum.HostileDomination,
          timing: EffectTimingEnum.InstantPermanent,
          ...base,
        },
        {
          opcode: EffectTypeEnum.PlayVisualEffect,
          playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
          resource: CONTROL_UNDEAD_VISUAL,
          ...feedback,
        },
        {
          opcode: EffectTypeEnum.DisplayString,
          stringRef: StringRefUtils.getStringId("Controlled"),
          ...feedback,
        },
        { opcode: EffectTypeEnum.PlaySound, resource: "EFF_M15", ...feedback },
      ],
    };
  });
  return group.addSpell({
    name: "monster.undead.ability.vampireControlUndead.name",
    description: "monster.undead.ability.vampireControlUndead.description",
    id: Ids.VampireControlUndead,
    memorizedCount: 1,
    icon: SPELLS.Wizard.ControlUndead.file,
    primaryType: ItemAbilityPrimaryTypeEnum.Necromancer,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    options: { renew: 1 },
    ability: {
      // not the common enemy lists, which leave out summons: animated dead are the usual targets
      targets: targetService.combineListWithTriggers(
        [{ name: "NearestEnemies" }],
        [
          { name: "General", params: [ScriptTarget.token, "UNDEAD"] },
          // Target level <= half the caster level, i.e. for each k: target >= k implies caster >=
          // 2k. Matches the header picked from the caster level, which controls up to level / 2.
          // The first header's undead are within reach of every vampire.
          triggerFactory.levelLt(maxLevel + 1),
          ...levels.slice(1).map((k): Triggers.Trigger => ({
            name: "Or",
            triggers: [
              triggerFactory.levelLt(k),
              { name: "LevelGT", params: [ScriptTarget.myself, 2 * k - 1] },
            ],
          })),
        ],
      ),
      triggers: NOT_SHAPECHANGED,
      spell: { type: "force" },
    },
    headers,
  });
}

interface AnimalForm {
  id: Ids;
  name: TranslationKey;
  description: TranslationKey;
  animation: AnimationIdentifiers;
  icon: string | string[];
  damage: { diceThrown: number; diceSize: number; type: AbilityDamageTypeEnum };
  effects: Effect[];
  immunities?: ImmunityName[];
  ability: RawCreatureAbility;
}

/**
 * Shapechanging: wolf and bat forms (AC 2, ML 16, everything else the vampire's own). The form
 * is a weapon in the magical weapon slot, so it replaces the level-draining claws. While
 * changing, the vampire suffers a +4 penalty to its Armor Class and -1 to all saving throws.
 */
function animalForm(group: AbstractCreature, form: AnimalForm) {
  const item = group.addWeapon({
    weapon: {
      id: form.id,
      stringRef: form.name,
      description: form.description,
      immunities: form.immunities,
      equippedSlot: [],
      header: {
        type: ItemAbilityTypeEnum.Melee,
        diceThrown: form.damage.diceThrown,
        diceSize: form.damage.diceSize,
        damageType: form.damage.type,
        speed: 3,
        abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
      },
      effects: [
        {
          opcode: EffectTypeEnum.ArmorClassBonus,
          value: 2,
          bonusTo: EffectBonusToEnum.SetBaseArmorClassToValue,
        },
        {
          opcode: EffectTypeEnum.AnimationChange,
          animationId: form.animation,
          animationType: AnimationChangeTypeEnum.TemporaryChange,
        },
        { opcode: EffectTypeEnum.SetExtendedSpellState, state: SPELL_STATES.animalForm },
        { opcode: EffectTypeEnum.DisableButton, button: DisableButtonEnum.SpellSelect },
        ...form.effects,
      ],
    },
  });
  const changing = {
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    target: EffectTargetEnum.Self,
  };
  return group.addSpell({
    name: form.name,
    description: form.description,
    id: form.id,
    memorizedCount: 1,
    icon: Array.isArray(form.icon) ? form.icon[0] : form.icon,
    primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
    secondaryType: ItemAbilitySecondaryTypeEnum.NonCombat,
    options: { renew: ANIMAL_FORM_DURATION / Durations.round },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.Caster,
        speed: 1,
        icon: Array.isArray(form.icon) ? form.icon[1] : undefined,
        effects: [
          {
            opcode: EffectTypeEnum.CreateWeapon,
            amount: 1,
            resource: item.file,
            target: EffectTargetEnum.Self,
            timing: EffectTimingEnum.InstantLimited,
            duration: ANIMAL_FORM_DURATION,
          },
          {
            opcode: EffectTypeEnum.ArmorClassBonus,
            value: -4,
            bonusTo: EffectBonusToEnum.AllWeapons,
            ...changing,
          },
          {
            opcode: EffectTypeEnum.AllSavingThrowsBonus,
            value: -1,
            type: EffectStatisticModifierEnum.Increment,
            ...changing,
          },
          {
            opcode: EffectTypeEnum.PlayVisualEffect,
            target: EffectTargetEnum.Self,
            playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
            resource: "SPDISPM3",
          },
          { opcode: EffectTypeEnum.PlaySound, resource: "MSTCHNG" },
          {
            opcode: EffectTypeEnum.PlaySound,
            resource: "MSTCHNG",
            timing: EffectTimingEnum.DelayPermanent,
            duration: ANIMAL_FORM_DURATION,
          },
        ],
      },
    ],
    ability: {
      ...form.ability,
      triggers: [...NOT_SHAPECHANGED, ...(form.ability.triggers ?? [])],
      // The cast removes the copy, renew gives it back once the form ends: renew alone can't take
      // it away (opcode 172 keeps memorized copies of an 8-character resource), so a cast that
      // doesn't use it up (noDec) would pile up a new copy each time.
      spell: { type: "force", remove: true, castOnSelf: true },
    },
  });
}

/**
 * A form's movement rate never slows the vampire down: an older vampire, already as fast as the
 * form's own 18 or faster, keeps its speed (the form's "own speed" variant).
 */
const ANIMAL_FORM_MOVEMENT = effectFactory.naturalMovementSpeed(18);

/** Wolf form: Dmg 3d12, MV 18, SZ L. Used on an enemy its level drain can't harm. */
function wolfForm(group: AbstractCreature, ownSpeed: boolean) {
  return animalForm(group, {
    id: ownSpeed ? Ids.VampireWolfFormOwnSpeed : Ids.VampireWolfForm,
    name: "monster.undead.ability.vampireWolfForm.name",
    description: "monster.undead.ability.vampireWolfForm.description",
    animation: "WOLF_VAMPIRIC",
    icon: SPELLS.Innate.ShapeshiftWolf.file,
    damage: { diceThrown: 3, diceSize: 12, type: AbilityDamageTypeEnum.Piercing },
    effects: ownSpeed ? [] : [ANIMAL_FORM_MOVEMENT],
    ability: {
      targets: [
        {
          name: "NearestEnemies",
          limit: 1,
          triggers: [
            triggerFactory.or([
              { name: "CheckStatGT", params: [ScriptTarget.token, 0, "LEVEL_DRAIN_IMMUNITY"] },
              { name: "CheckSpellState", params: [ScriptTarget.token, "ITEM_LEVELDRAIN"] },
            ]),
          ],
        },
      ],
      probability: 50,
    },
  });
}

/**
 * Bat form: Dmg 2d6, MV Fl 18, -3 to opponents' attack rolls, SZ M. Used when badly hurt.
 * Flying, it is unaffected by ground spells (hover) and flies over enemies and allies alike.
 */
function batForm(group: AbstractCreature, ownSpeed: boolean) {
  return animalForm(group, {
    id: ownSpeed ? Ids.VampireBatFormOwnSpeed : Ids.VampireBatForm,
    name: "monster.undead.ability.vampireBatForm.name",
    description: "monster.undead.ability.vampireBatForm.description",
    animation: "BAT_INSIDE",
    icon: ["PLYWYVNC", "PLYWYVNB"],
    damage: { diceThrown: 2, diceSize: 6, type: AbilityDamageTypeEnum.Piercing },
    effects: [
      ...(ownSpeed ? [] : [ANIMAL_FORM_MOVEMENT]),
      { opcode: EffectTypeEnum.ArmorClassBonus, value: 3, bonusTo: EffectBonusToEnum.AllWeapons },
      { opcode: EffectTypeEnum.SetExtendedSpellState, state: SPELL_STATES.flying },
      { opcode: EffectTypeEnum.NoCollisionDetection, passWalls: false },
      { opcode: EffectTypeEnum.ModifyCollisionBehavior },
    ],
    immunities: ["hover"],
    ability: {
      triggers: [
        { name: "Detect", params: ["NearestEnemyOf"] },
        { name: "HPPercentLT", params: [ScriptTarget.myself, 50] },
      ],
      probability: 50,
    },
  });
}

/**
 * How long the gaseous form lasts: just the time to run away or reposition, since its fire
 * vulnerability makes a longer one an easy kill for fire spells.
 */
const MIST_FORM_DURATION = Durations.round;

/**
 * Gaseous form: a vapor that only fire harms (MV 3 less than normal), flowing through creatures.
 * In a fight, the vampire uses it to break off when badly hurt in melee, or when surrounded, and
 * get away. (At 0 hit points, the game's own gaseous form makes it escape.)
 */
function mistForm(cre: Creature, age: VampireAge, forms: Spell[]) {
  const mist = cre.addItem({
    id: Ids.VampireMistForm,
    stringRef: "monster.undead.ability.vampireMistForm.name",
    description: "monster.undead.ability.vampireMistForm.description",
    // only fire harms a vapor: fire spells, and the fire damage of a weapon's hits (the weapon
    // itself does nothing). Gas floats: no ground spells, web or entangle
    immunities: ["poison", "cold", "lightning", "acid", "magicDamage", "physicalDamage", "hover"],
    header: { type: ItemAbilityTypeEnum.Melee },
    effects: [
      {
        opcode: EffectTypeEnum.FireResistanceModifier,
        type: EffectStatisticModifierEnum.Set,
        value: -50,
      },
      {
        opcode: EffectTypeEnum.MagicalFireResistanceModifier,
        type: EffectStatisticModifierEnum.Set,
        value: -50,
      },
      { opcode: EffectTypeEnum.DisplayPortraitIcon, icon: PortraitIconEnum.Invulnerable },
      { opcode: EffectTypeEnum.NoCollisionDetection, passWalls: true },
      { opcode: EffectTypeEnum.ModifyCollisionBehavior },
      effectFactory.naturalMovementSpeed(age.movement - 3),
      {
        opcode: EffectTypeEnum.ModifyAttacksPerRound,
        type: AttackModifierTypeEnum.Final,
        value: 0,
      },
      // hard to land a blow on a mist (positive is a bonus, as bat form's 3)
      {
        opcode: EffectTypeEnum.ArmorClassBonus,
        bonusTo: EffectBonusToEnum.AllWeapons,
        value: 10,
      },
      { opcode: EffectTypeEnum.DisableSpellcasting, type: DisableSpellcastingTypeEnum.Wizard },
      { opcode: EffectTypeEnum.DisableSpellcasting, type: DisableSpellcastingTypeEnum.Innate },
      { opcode: EffectTypeEnum.DisableButton, button: DisableButtonEnum.SpellSelect },
      {
        opcode: EffectTypeEnum.AnimationChange,
        animationId: "BLOB_MIST_CREATURE",
        animationType: AnimationChangeTypeEnum.TemporaryChange,
      },
      { opcode: EffectTypeEnum.SetExtendedSpellState, state: SPELL_STATES.gaseousForm },
    ],
  });
  const spell = cre.addSpell({
    id: Ids.VampireMistForm,
    name: "monster.undead.ability.vampireMistForm.name",
    description: "monster.undead.ability.vampireMistForm.description",
    memorizedCount: 1,
    // it can't keep away for good by chaining forms
    options: { renew: 4 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        target: ItemAbilityTargetEnum.Caster,
        icon: SPELLS.Wizard.ObscuringMist.file,
        effects: [
          // back from a wolf or bat form first
          ...forms.map((form): Effect => ({
            opcode: EffectTypeEnum.RemoveEffectsByResource,
            type: RemoveEffectsByResourceTypeEnum.Default,
            resource: form.file,
            target: EffectTargetEnum.Self,
          })),
          {
            opcode: EffectTypeEnum.CreateWeapon,
            amount: 1,
            resource: mist.file,
            timing: EffectTimingEnum.InstantLimited,
            duration: MIST_FORM_DURATION,
            target: EffectTargetEnum.Self,
          },
          {
            opcode: EffectTypeEnum.PlayVisualEffect,
            playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
            resource: "SPDISPMA",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            target: EffectTargetEnum.Self,
          },
          {
            opcode: EffectTypeEnum.PlaySound,
            resource: "MSTCHNG",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            target: EffectTargetEnum.Self,
          },
        ],
      },
    ],
    // badly hurt in melee
    ability: {
      triggers: [
        ...NOT_SHAPECHANGED,
        { name: "HPPercentLT", params: [ScriptTarget.myself, 35] },
        ...triggerFactory.enemyCanHurtInMelee(`NearestEnemyOf(${ScriptTarget.myself})`),
      ],
      probability: 50,
      // same as the animal forms: renew alone wouldn't take the copy away
      spell: { type: "force", remove: true, castOnSelf: true },
    },
  });
  if (!spell.ability) throw new Error(`No ability for ${spell.file}`);
  // surrounded: BAF can't count the enemies that can hurt it, so its 3 nearest ones must
  const surrounded: RawCreatureAbility = {
    ...spell.ability,
    triggers: [
      ...NOT_SHAPECHANGED,
      ...["NearestEnemyOf", "SecondNearestEnemyOf", "ThirdNearestEnemyOf"].flatMap((enemy) =>
        triggerFactory.enemyCanHurtInMelee(`${enemy}(${ScriptTarget.myself})`),
      ),
    ],
  };
  const flee: PartialCustomCode = {
    location: "init",
    type: "insertBefore",
    statements: [
      {
        comment: "Gaseous form: get away from enemies",
        triggers: [
          { name: "CheckSpellState", params: [ScriptTarget.myself, SPELL_STATES.gaseousForm] },
        ],
        responses: responseFactory.response([
          {
            name: "RunAwayFromNoLeaveArea",
            params: [`NearestEnemyOf(${ScriptTarget.myself})`, 90],
          },
        ]),
      },
    ],
  };
  return { abilities: [spell.ability, surrounded], flee };
}

/**
 * A power every age with the same one shares: created once, on the entry (its files are the
 * entry's), then memorized by each of them.
 */
function sharedPower(
  entry: CreatureEntry<Creature>,
  cre: Creature,
  id: Ids,
  create: () => Spell,
): Spell {
  const spell = entry.spells.find((s) => s.id === id) ?? create();
  cre.memorizeSpell(spell.file, 1);
  return spell;
}

function vampire(entry: CreatureEntry<Creature>, age: VampireAge): Creature {
  const cre = entry.create({
    monster: age.monster,
    name: age.name,
    files: [],
    data: {
      level1: age.level1,
      bonusHp: age.bonusHp,
      strength: age.strength,
      exceptionalStrength: age.exceptionalStrength,
      dexterity: age.dexterity,
      constitution: 18,
      intelligence: age.intelligence,
      wisdom: 15,
      charisma: age.charisma,
      ac: 1,
      apr: 1,
      xpv: age.xpv,
      alignment: "CHAOTIC_EVIL",
      morale: 16,
      general: "UNDEAD",
      race: "VAMPIRE",
      class: "VAMPIRE",
      size: { value: "Medium", tall: true, long: false },
      movement: age.movement,
      immunities: ["undead"],
      moveSilent: 100,
      items: {
        remove: [
          "ring95",
          "immune1",
          "immune2",
          "immune3",
          "vamp",
          "vamp1",
          "vamp2",
          "vamp3",
          "vampreg",
          "vampreg1",
          "vampreg2",
          "dw#bldd",
          "dw#vmwol",
          "dw#vmbat",
        ],
      },
      script: {
        remove: ["vampir01", "ppvampir"],
      },
    },
  });
  createClaws(cre, {
    diceThrown: 1,
    diceSize: 6,
    effects: effectFactory.levelDrain({ levels: 2 }),
  });
  const effects: Effect[] = [
    effectFactory.regeneration(age.regeneration),
    {
      opcode: EffectTypeEnum.CastSpellOnCondition,
      conditionTarget: CastSpellOnConditionTargetEnum.Myself,
      condition: "Die()",
      special: 2,
      timing: EffectTimingEnum.InstantWhileEquipped,
      target: EffectTargetEnum.Self,
      resource: SPELLS.Innate.VampireGasFormChange.file,
    },
  ];
  if (age.magicResistance) {
    effects.push({
      opcode: EffectTypeEnum.MagicResistanceModifier,
      type: EffectStatisticModifierEnum.Set,
      value: age.magicResistance,
    });
  }
  cre.addTrait({
    immunities: [age.weaponImmunity, "coldResistance", "lightningResistance"],
    effects,
  });
  const ownSpeed = age.movement >= 18;
  const dominate = sharedPower(entry, cre, age.domination.id, () =>
    domination(entry, age.domination),
  );
  const swarm = sharedPower(entry, cre, Ids.VampireBatSwarm, () => batSwarm(entry));
  const control = sharedPower(entry, cre, Ids.VampireControlUndead, () => controlUndead(entry));
  const wolf = sharedPower(
    entry,
    cre,
    ownSpeed ? Ids.VampireWolfFormOwnSpeed : Ids.VampireWolfForm,
    () => wolfForm(entry, ownSpeed),
  );
  const bat = sharedPower(
    entry,
    cre,
    ownSpeed ? Ids.VampireBatFormOwnSpeed : Ids.VampireBatForm,
    () => batForm(entry, ownSpeed),
  );
  const mist = mistForm(cre, age, [wolf, bat]);
  cre.setBehavior({
    restHeal: true,
    abilities: [
      ...mist.abilities,
      ...[bat, dominate, swarm, control, wolf].map((spell) => {
        if (!spell.ability) throw new Error(`No ability for ${spell.file}`);
        return spell.ability;
      }),
    ],
    customCodes: [mist.flee],
  });
  // Files called "... Vampire" (or "Vampyre") in game take their age's name; named vampires
  const renamed = cre.files
    .map((f) => f.name)
    .filter((file) => {
      const name = monsterFilesService.getName(file) ?? "";
      return /vamp[iy]re/i.test(name) && !/\b(bat|child|mage)\b/i.test(name);
    });
  if (renamed.length) cre.setAdjustments([{ files: renamed, stringRef: age.name }]);
  cre.turnAs = age.turnAs;
  return cre;
}

export const fledglingVampire = (entry: CreatureEntry<Creature>) => vampire(entry, VAMPIRE_AGES[0]);

export const matureVampire = (entry: CreatureEntry<Creature>) => vampire(entry, VAMPIRE_AGES[1]);

export const oldVampire = (entry: CreatureEntry<Creature>) => vampire(entry, VAMPIRE_AGES[2]);

export const veryOldVampire = (entry: CreatureEntry<Creature>) => vampire(entry, VAMPIRE_AGES[3]);

export const ancientVampire = (entry: CreatureEntry<Creature>) => vampire(entry, VAMPIRE_AGES[4]);

export const eminentVampire = (entry: CreatureEntry<Creature>) => vampire(entry, VAMPIRE_AGES[5]);

export const patriarchVampire = (entry: CreatureEntry<Creature>) => {
  const cre = vampire(entry, VAMPIRE_AGES[6]);
  cre.setAdjustments([
    { files: ["D9TANOV"], stringRef: "monster.undead.name.patriarchVampireMage" },
  ]);
  return cre;
};

export const createVampireEntry = () =>
  new SimpleEntry(EntryEnum.Vampire, [
    fledglingVampire,
    matureVampire,
    oldVampire,
    veryOldVampire,
    ancientVampire,
    eminentVampire,
    patriarchVampire,
  ]);

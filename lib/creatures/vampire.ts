/**
 * Vampires, by age category (Van Richten's Guide to Vampires, "Powers by Age"):
 * fledgling, mature, old, very old, ancient, eminent, patriarch.
 *
 * Every age is built from the same table row (see VAMPIRE_AGES), so a vampire's powers only
 * differ by what the table says.
 */
import { SPELL_STATES } from "../config/common";
import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-database";
import actionFactory from "../src/factories/action.factory";
import effectFactory from "../src/factories/effect.factory";
import responseFactory from "../src/factories/response.factory";
import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { RawCreatureAbility } from "../src/model/creature/ability";
import { AnimationIdentifiers } from "../src/model/ids/animate";
import { PartialCustomCode } from "../src/model/script/script";
import { Triggers } from "../src/model/script/triggers";
import {
  AreaExtendedFlagsEnum,
  AreaProjectileEnum,
  BamProjectileFlagsEnum,
  ProjectileExplosionEffectEnum,
  ProjectileExtendedFlagsEnum,
} from "../src/model/spell-item/projectile";
import { Item, PartialSpellHeader } from "../src/model/spell-item/spell-item";
import targetService from "../src/services/baf/target.service";
import effectService from "../src/services/effects/effect.service";
import { TranslationKey } from "../translations/i18n";
import { ImmunityName } from "../src/model/final/immunity";
import { StringReference } from "../src/model/final/stringref";
import { Durations } from "../src/model/game-data/durations";
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
  KillTargetDeathTypeEnum,
  PortraitIconEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { SpellKeyword } from "../config/spells/keyword";
import { MonsterEnum } from "./monster";
import type { TurnUndeadType } from "./types/turn-level";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { createClaws } from "./types/undead";
import monsterFilesService from "../src/services/monster-files.service";

enum Ids {
  VampireFledglingDomination,
  VampireMatureDomination,
  VampireOldDomination,
  VampireVeryOldDomination,
  VampireAncientDomination,
  VampireEminentDomination,
  VampirePatriarchDomination,
  VampireBatSwarm,
  VampireControlUndead,
  VampireWolfForm,
  VampireBatForm,
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
    domination: { id: Ids.VampireFledglingDomination, mode: "gaze", saveBonus: -2 },
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
    domination: { id: Ids.VampireMatureDomination, mode: "gaze", saveBonus: -2 },
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
    domination: { id: Ids.VampireOldDomination, mode: "gaze", saveBonus: -3 },
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
    domination: { id: Ids.VampireVeryOldDomination, mode: "gaze", saveBonus: -3 },
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
    domination: { id: Ids.VampireAncientDomination, mode: "voice", saveBonus: -4 },
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
    domination: { id: Ids.VampireEminentDomination, mode: "voice", saveBonus: -4 },
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
    domination: { id: Ids.VampirePatriarchDomination, mode: "will", saveBonus: -5 },
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

/** Rounds spent in gaseous form, once reduced to 0 hit points, before it reaches its sanctuary. */
const MIST_DURATION = 2 * Durations.round;

/**
 * Domination: any person dominated by the vampire is affected as if by a charm person spell, with
 * a saving throw vs. spell penalty that grows with the vampire's age.
 * A gaze needs the victim to meet the vampire's eyes: it is blocked by gaze attack immunity, and
 * the vampire doesn't try it on blinded creatures. Voice and will don't have these limits, but a
 * silenced vampire can't use its voice.
 */
function domination(cre: Creature, domination: VampireAge["domination"]) {
  const texts = DOMINATION_TEXTS[domination.mode];
  return cre.addSpell({
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
 * Animal control: the vampire summons a swarm of bats covering a 20-foot radius. Those caught
 * within it are blinded, suffer a -4 penalty to attack rolls and Armor Class, and have their
 * movement rate cut in half. The bats are controlled by the vampire: they only harm its enemies.
 * The swarm strikes every second, and each creature is affected at most once per round: leaving
 * the swarm ends its effects by the next round. They last one pulse longer than that protection,
 * so the strike renewing them lands before they wear off.
 */
function batSwarm(cre: Creature) {
  const base = {
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round + 1,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  return cre.addSpell({
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
          // Bats (jaae4900: the game's bat flight, see scripts/vampire-bat-swarm-assets.ts) instead
          // of the stinking cloud, each one with a random direction (cycle) and wing beat (frame)
          extendedFlags: [
            ProjectileExtendedFlagsEnum.StartRandomFrame,
            ProjectileExtendedFlagsEnum.StartRandomSequence,
          ],
          // a bat flies to the spot (no more colouring it green)
          projectileInfo: {
            bamProjectileFlags: [BamProjectileFlagsEnum.EnableAreaLightingUsage],
            travelingAnimation: "jaae4900",
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
            spreadAnimation: "jaae4900",
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

/** Highest vampire level, for some bosses: the youngest vampire is the lowest one. */
const VAMPIRE_MAX_LEVEL = 25;

/**
 * Controlling undead: the vampire controls a lesser undead, of up to half its Hit Dice. One header
 * per caster level, so a vampire with more Hit Dice (an older one, or a stronger file) controls
 * stronger undead. Mindless undead get no saving throw, but PnP's intelligent undead save vs.
 * paralysis can't be told apart from them here, so none get one.
 * The book pools the Hit Dice of every controlled creature; each control is checked on its own.
 */
function controlUndead(cre: Creature) {
  // Highest undead level controlled by each header, from the youngest vampire to the strongest
  const minLevel = Math.floor(VAMPIRE_AGES[0].level1 / 2);
  const maxLevel = Math.floor(VAMPIRE_MAX_LEVEL / 2);
  const levels = Array.from({ length: maxLevel - minLevel + 1 }, (_, i) => minLevel + i);
  const headers: PartialSpellHeader[] = levels.map((level) => ({
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
        dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
        maxLevel: level,
      },
    ],
  }));
  return cre.addSpell({
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
  icon: MonsterItemIconEnum;
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
function animalForm(cre: Creature, form: AnimalForm) {
  const item = cre.addWeapon({
    weapon: {
      id: form.id,
      stringRef: form.name,
      description: form.description,
      icon: form.icon,
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
  const changing = { timing: EffectTimingEnum.InstantLimited, duration: Durations.round };
  return cre.addSpell({
    name: form.name,
    description: form.description,
    id: form.id,
    memorizedCount: 1,
    icon: SPELLS.Wizard.PolymorphSelf.file,
    primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
    secondaryType: ItemAbilitySecondaryTypeEnum.NonCombat,
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.Caster,
        speed: 1,
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
            target: EffectTargetEnum.Self,
            ...changing,
          },
          {
            opcode: EffectTypeEnum.AllSavingThrowsBonus,
            value: -1,
            type: EffectStatisticModifierEnum.Increment,
            target: EffectTargetEnum.Self,
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
      spell: { type: "noDec", castOnSelf: true },
    },
  });
}

/**
 * A form's movement rate, which never slows the vampire down: older vampires are faster than
 * the form's own 18.
 */
function animalFormMovement(age: VampireAge) {
  return effectFactory.naturalMovementSpeed(Math.max(18, age.movement));
}

/** Wolf form: Dmg 3d12, MV 18, SZ L. Used on an enemy its level drain can't harm. */
function wolfForm(cre: Creature, age: VampireAge) {
  return animalForm(cre, {
    id: Ids.VampireWolfForm,
    name: "monster.undead.ability.vampireWolfForm.name",
    description: "monster.undead.ability.vampireWolfForm.description",
    animation: "WOLF",
    icon: MonsterItemIconEnum.Wolf,
    damage: { diceThrown: 3, diceSize: 12, type: AbilityDamageTypeEnum.Piercing },
    effects: [animalFormMovement(age)],
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
function batForm(cre: Creature, age: VampireAge) {
  return animalForm(cre, {
    id: Ids.VampireBatForm,
    name: "monster.undead.ability.vampireBatForm.name",
    description: "monster.undead.ability.vampireBatForm.description",
    animation: "BAT_INSIDE",
    icon: MonsterItemIconEnum.Jaws,
    damage: { diceThrown: 2, diceSize: 6, type: AbilityDamageTypeEnum.Piercing },
    effects: [
      animalFormMovement(age),
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
 * Gaseous form at 0 hit points: the vampire can't die from damage. At 1 hit point it turns into a
 * vapor that is all but immune to attack (MV 3 less than normal) and flees, and the party is
 * given the experience for defeating it. Once it has reached its sanctuary it really dies (rather
 * than just leaving the area), so quests waiting for its death still go on.
 */
function mistForm(cre: Creature, age: VampireAge, trait: Item): PartialCustomCode {
  const mist = cre.addItem({
    id: Ids.VampireMistForm,
    stringRef: "monster.undead.ability.vampireMistForm.name",
    description: "monster.undead.ability.vampireMistForm.description",
    immunities: ["poison", "cold", "fire", "lightning", "acid", "magicDamage", "physicalDamage"],
    header: { type: ItemAbilityTypeEnum.Melee },
    effects: [
      { opcode: EffectTypeEnum.DisplayPortraitIcon, icon: PortraitIconEnum.Invulnerable },
      { opcode: EffectTypeEnum.NoCollisionDetection, passWalls: true },
      { opcode: EffectTypeEnum.ModifyCollisionBehavior },
      effectFactory.naturalMovementSpeed(age.movement - 3),
      {
        opcode: EffectTypeEnum.ModifyAttacksPerRound,
        type: AttackModifierTypeEnum.Final,
        value: 0,
      },
      { opcode: EffectTypeEnum.DisableSpellcasting, type: DisableSpellcastingTypeEnum.Wizard },
      { opcode: EffectTypeEnum.DisableButton, button: DisableButtonEnum.SpellSelect },
      {
        opcode: EffectTypeEnum.AnimationChange,
        animationId: "BLOB_MIST_CREATURE",
        animationType: AnimationChangeTypeEnum.TemporaryChange,
      },
      { opcode: EffectTypeEnum.SetExtendedSpellState, state: SPELL_STATES.gaseousForm },
    ],
  });
  const self = { target: EffectTargetEnum.Self };
  const spell = cre.addSpell({
    id: Ids.VampireMistForm,
    name: "monster.undead.ability.vampireMistForm.name",
    description: "monster.undead.ability.vampireMistForm.description",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        target: ItemAbilityTargetEnum.Caster,
        effects: [
          // back from a wolf or bat form first
          ...[Ids.VampireWolfForm, Ids.VampireBatForm].map((id): Effect => ({
            opcode: EffectTypeEnum.RemoveEffectsByResource,
            type: RemoveEffectsByResourceTypeEnum.Default,
            resource: cre.spell(id).file,
            ...self,
          })),
          // the trait holds its minimum hit points, and the trigger casting this spell
          {
            opcode: EffectTypeEnum.RemoveItem,
            resource: trait.file,
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            ...self,
          },
          {
            opcode: EffectTypeEnum.CreateWeapon,
            amount: 1,
            resource: mist.file,
            timing: EffectTimingEnum.InstantLimited,
            duration: MIST_DURATION,
            ...self,
          },
          {
            opcode: EffectTypeEnum.PlayVisualEffect,
            playWhere: EffectVisualEffectLocationEnum.OverTargetUnattached,
            resource: "SPDISPM3",
            ...self,
          },
          { opcode: EffectTypeEnum.PlaySound, resource: "MSTCHNG" },
          {
            opcode: EffectTypeEnum.KillTarget,
            type: KillTargetDeathTypeEnum.Normal,
            displayText: false,
            timing: EffectTimingEnum.DelayPermanent,
            duration: MIST_DURATION,
            ...self,
          },
        ],
      },
    ],
  });
  trait.effects.push(
    effectService.getEffect({
      opcode: EffectTypeEnum.CastSpellOnCondition,
      conditionTarget: CastSpellOnConditionTargetEnum.Myself,
      condition: "HPLT(Myself,Extra)",
      special: 2,
      timing: EffectTimingEnum.InstantWhileEquipped,
      target: EffectTargetEnum.Self,
      resource: spell.file,
    }),
  );
  const inMist: Triggers.Trigger = {
    name: "CheckSpellState",
    params: [ScriptTarget.myself, SPELL_STATES.gaseousForm],
  };
  const xpGiven = "JA_VAMPIRE_MIST";
  return {
    location: "init",
    type: "insertBefore",
    statements: [
      {
        comment: "Gaseous form: the party defeated the vampire",
        triggers: [inMist, triggerFactory.global(xpGiven, 0)],
        responses: responseFactory.response([
          actionFactory.setGlobal(xpGiven, 1),
          { name: "AddExperienceParty", params: [age.xpv] },
        ]),
      },
      {
        comment: "Gaseous form: flee to its sanctuary",
        triggers: [inMist],
        responses: responseFactory.response([
          {
            name: "RunAwayFromNoLeaveArea",
            params: [`NearestEnemyOf(${ScriptTarget.myself})`, 90],
          },
        ]),
      },
    ],
  };
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
      movement: age.movement, // Fl 18 in mist form
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
  const effects: Effect[] = [effectFactory.regeneration(age.regeneration)];
  if (age.magicResistance) {
    effects.push({
      opcode: EffectTypeEnum.MagicResistanceModifier,
      type: EffectStatisticModifierEnum.Set,
      value: age.magicResistance,
    });
  }
  effects.push({ opcode: EffectTypeEnum.MinimumHP, value: 1 });
  const trait = cre.addTrait({
    immunities: [age.weaponImmunity, "coldResistance", "lightningResistance"],
    effects,
  });
  domination(cre, age.domination);
  batSwarm(cre);
  controlUndead(cre);
  wolfForm(cre, age);
  batForm(cre, age);
  cre.setBehavior({
    restHeal: true,
    abilities: [
      cre.ability(Ids.VampireBatForm),
      cre.ability(age.domination.id),
      cre.ability(Ids.VampireBatSwarm),
      cre.ability(Ids.VampireControlUndead),
      cre.ability(Ids.VampireWolfForm),
    ],
    customCodes: [mistForm(cre, age, trait)],
  });
  // Files called "... Vampire" (or "Vampyre") in game take their age's name; named vampires
  // (Salia...), vampire bats, child vampires and vampire mages keep their own
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

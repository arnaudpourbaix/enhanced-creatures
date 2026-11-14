import { MonsterItemIconEnum } from "../config/item";
import { CHARM_TARGET_LISTS } from "../config/presets/charm-presets";
import { SPELLS } from "../config/spells/spell-database";
import actionFactory from "../src/factories/action.factory";
import effectFactory from "../src/factories/effect.factory";
import responseFactory from "../src/factories/response.factory";
import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { JEWEL_SLOTS } from "../src/model/creature/item";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { Durations } from "../src/model/game-data/durations";
import { PartialCustomCode } from "../src/model/script/script";
import {
  CharmTypeEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ItemCategoryEnum,
  SaveTypeEnum,
  SpellTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { StringRefUtils } from "../src/services/utils/string-ref.utils";
import { EntryEnum } from "./entry";
import { addLeap, leapAttackEffects } from "./leap";
import { MonsterEnum } from "./monster";
import { createClaws } from "./types/undead";

enum Ids {
  Leap,
  MagicJar,
  MagicJarBackfire,
  DrainingTouch,
}

/**
 * Shadow fiends are at their best in darkness, where they are always met in the game: AC 1, +2 to
 * hit and half damage from every attack (the brighter AC and damage don't apply). Immune to fire,
 * cold and electricity whatever the light. Turned as "special" undead, though fiends of the Lower
 * Planes and not undead.
 */
export function shadowFiend(entry: CreatureEntry<Creature>): Creature {
  const fiend = entry.create({
    monster: MonsterEnum.ShadowFiend,
    name: "monster.shadowFiend.name",
    files: [],
    data: {
      level1: 7,
      bonusHp: 3,
      strength: 13,
      dexterity: 14,
      constitution: 12,
      intelligence: 11,
      wisdom: 12,
      charisma: 8,
      ac: 1, // darkness (dim light 5, bright light 9)
      apr: 3,
      xpv2e: 2000,
      alignment: "CHAOTIC_EVIL",
      morale: 15,
      general: "MONSTER",
      race: "SHADOW",
      class: "SHADOW",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      // like shadows, 90% undetectable in dim light or shadows: it surprises those who don't spot it
      hideShadow: 90,
      immunities: ["outsider", "incorporeal"],
      items: {
        remove: ["immune1", "ring95", "ghoul1", "s1-6"],
      },
      script: {
        // Rasaad's quest: its own casting of the game's fear, darkness and magic jar spells
        remove: ["ohrshad1", "O#LLEnem"],
      },
      spells: {
        // darkness 15' radius or fear, once a day: darkness, under which it fights at its best
        memorized: [{ file: SPELLS.Wizard.Darkness15Radius.file, memorizedCount: 1 }],
      },
    },
  });
  fiend.addTrait({
    immunities: ["planarEssence", "fire", "cold", "lightning"],
    effects: [
      // darkness: +2 to attack rolls
      {
        opcode: EffectTypeEnum.Thac0Bonus,
        type: EffectStatisticModifierEnum.Increment,
        value: 2,
      },
      // it sees in its own darkness
      {
        opcode: EffectTypeEnum.ProtectionFromSpell,
        resource: SPELLS.Wizard.Darkness15Radius.file,
      },
    ],
  });
  fiend.addNaturalWeapon("claws", { diceThrown: 1, diceSize: 6, speed: 5, slot: "WEAPON1" });
  fiend.addNaturalWeapon("jaws", { diceThrown: 1, diceSize: 8, speed: 3, slot: "SHIELD" });
  leap(fiend);
  magicJar(fiend);
  fiend.setBehavior({
    restHeal: true,
    abilities: {
      entries: [
        // a hidden fiend springs before anything else: casting would reveal it first
        { abilityId: Ids.Leap, insertFirst: true },
        { abilityId: Ids.MagicJar },
      ],
    },
    customCodes: [WAIT_HIDDEN],
  });
  fiend.turnedAsUndead = true;
  fiend.turnAs = "special";
  fiend.setAdjustments([{ files: ["SDSHADFI"], data: { level1: 12 } }]);
  shadowCreatureVariant(fiend);
  // the Shadow Creature's Demishadow Monsters (OHRDEMI): full fiends, worth no XP
  fiend.variant("Demishadow", {
    files: ["OHRSHFIE"],
    adjust: [{ files: ["OHRSHFIE"], summon: true }],
    behavior: { customCodes: [APPEAR_FROM_SHADOWS] },
  });
  return fiend;
}

/**
 * The Shadow Creature and its demishadows rise from the shadows: their own scripts' (OHRSHAD1)
 * visual on creation, OHRSHFIE.VVC
 */
const APPEAR_FROM_SHADOWS: PartialCustomCode = {
  location: "destroyUponDeath",
  type: "insertBefore",
  statements: [
    {
      comment: "Rise from the shadows",
      triggers: [{ name: "OnCreation" }],
      responses: responseFactory.response([
        { name: "SmallWait", params: [5] },
        { name: "CreateVisualEffectObject", params: ["OHRSHFIE", ScriptTarget.myself] },
      ]),
    },
  ],
};

/**
 * Rasaad's quest boss, a game-only elite shadow fiend, never below its own files: 110 HP, AC -3,
 * THAC0 9, Strength 16, immune to acid and to weapons below +2. It keeps its own Demishadow
 * Monsters (OHRDEMI, summoning two OHRSHFIE). OHRSHAD2 is the neutral one met in dialog: its MINHP1
 * stays, as the story needs it alive. As a boss, one more attack than an ordinary fiend (4: three
 * claws and a bite), its claws draining a level as a wraith's do (its file's WRAITH1).
 */
function shadowCreatureVariant(fiend: Creature) {
  const touch = fiend.addSpell({
    name: "monster.shadowFiend.ability.touch.name",
    description: "monster.shadowFiend.ability.touch.description",
    id: Ids.DrainingTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["levelDrain"],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [...effectFactory.levelDrain({ levels: 1 })],
      },
    ],
  });
  const drainingClaws = createClaws(fiend, {
    diceThrown: 1,
    diceSize: 6,
    equipped: false,
    castSpell: { spell: touch.file },
  });
  const bossTrait = fiend.addItem({
    stringRef: fiend.items.find((i) => i.trait)?.stringRef,
    immunities: ["acid", "plusOneWeapons"],
    effects: [],
    category: ItemCategoryEnum.Rings,
    icon: MonsterItemIconEnum.Traits,
  }).file;
  return fiend.variant("Shadow Creature", {
    data: {
      level1: 14, // 115 HP: its file's 110 at least
      ac: 0, // -3 with incorporeal's +3, as its file
      apr: 3, // and the off-hand bite: its file's 4
      strength: 16,
      morale: 18,
      items: {
        remove: ["immune2", "wraith1"],
        equipped: [
          { file: drainingClaws.file, slot: "WEAPON1" },
          { file: bossTrait, slot: JEWEL_SLOTS },
        ],
      },
      spells: {
        memorized: [{ file: SPELLS.Innate.ShadowCreatureDemiShadow.file, memorizedCount: 1 }],
      },
    },
    files: ["OHRSHAD1", "OHRSHAD2", "OHRSHAD3"],
    behavior: { customCodes: [APPEAR_FROM_SHADOWS] },
  });
}

/**
 * Before any enemy is seen, it waits hidden in the shadows, to surprise those who come near: the
 * generic hide in shadows only runs in a fight. Silent, unlike the fight's: nothing gives it away.
 */
const WAIT_HIDDEN: PartialCustomCode = {
  location: "detectCombat",
  type: "insertAfter",
  statements: [
    {
      comment: "Wait hidden in the shadows",
      triggers: [
        triggerFactory.global("JA_COMBAT", 0),
        { name: "Allegiance", params: [ScriptTarget.myself, "EVILCUTOFF"] },
        { name: "StateCheck", params: [ScriptTarget.myself, "STATE_INVISIBLE"], negation: true },
        { name: "StateCheck", params: [ScriptTarget.myself, "STATE_BLIND"], negation: true },
        triggerFactory.globalTimerExpired("HIDE_SHADOW"),
      ],
      responses: responseFactory.response([
        actionFactory.setGlobalTimer("HIDE_SHADOW", 6),
        { name: "Hide" },
      ]),
    },
  ],
};

/**
 * When it surprises its victim (hidden), it springs on it: it leaps up to 30 feet and strikes with
 * its four claws (1d6 each), but can't bite during the leap.
 */
function leap(fiend: Creature) {
  // the four claws in one hit
  const claws = fiend.addNaturalWeapon("claws", {
    id: Ids.Leap,
    slot: null,
    diceThrown: 4,
    diceSize: 6,
    speed: 5,
  });
  return addLeap(fiend, {
    id: Ids.Leap,
    range: 30,
    name: "monster.shadowFiend.ability.leap.name",
    description: "monster.shadowFiend.ability.leap.description",
    effects: leapAttackEffects(claws, "monster.shadowFiend.ability.leap.attack"),
    // hiding again in a fight is rare: its renewal isn't what limits it
    docUsage: "doc.usage.fromHiding",
    triggers: [{ name: "StateCheck", params: [ScriptTarget.myself, "STATE_INVISIBLE"] }],
  });
}

/**
 * Magic jar, once a week: in the game a domination, as the victim's body serves the fiend. A
 * victim saving vs. spell leaves the fiend stunned for 1d3 rounds: a second after the attempt,
 * a victim that isn't charmed casts the backfire, landing on the fiend. A pause, not a stun: being
 * incorporeal, it is immune to stun (and hold).
 */
function magicJar(fiend: Creature) {
  const backfire = fiend.addSpell({
    id: Ids.MagicJarBackfire,
    name: "monster.shadowFiend.ability.magicJar.name",
    doc: false,
    xpAbility: null,
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        target: ItemAbilityTargetEnum.LivingActor,
        range: 30,
        effects: [
          ...effectFactory.splitProbabilities(
            [1, 2, 3].map((rounds) => ({
              opcode: EffectTypeEnum.PauseTarget,
              target: EffectTargetEnum.OriginalCaster,
              timing: EffectTimingEnum.InstantLimited,
              duration: rounds * Durations.round,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            })),
          ),
          // PnP's status, though a pause in the game
          {
            opcode: EffectTypeEnum.DisplayString,
            target: EffectTargetEnum.OriginalCaster,
            stringRef: StringRefUtils.getString("Stunned"),
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
          },
        ],
      },
    ],
  });
  return fiend.addSpell({
    id: Ids.MagicJar,
    name: "monster.shadowFiend.ability.magicJar.name",
    description: "monster.shadowFiend.ability.magicJar.description",
    memorizedCount: 1,
    role: "disable",
    type: SpellTypeEnum.Wizard,
    level: 5,
    primaryType: ItemAbilityPrimaryTypeEnum.Necromancer,
    icon: SPELLS.Wizard.Domination.file,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["charm", "magicResistance"],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        target: ItemAbilityTargetEnum.LivingActor,
        range: 30,
        speed: 1,
        effects: [
          ...effectFactory.charm({
            charmType: CharmTypeEnum.HostileDomination,
            generalType: null,
            duration: 5 * Durations.turn,
            dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
            saveType: SaveTypeEnum.Spell,
          }),
          {
            opcode: EffectTypeEnum.ApplyEffectsList,
            type: "NOT_CHARMED",
            resource: backfire.file,
            timing: EffectTimingEnum.DelayLimited,
            duration: 1,
          },
        ],
      },
    ],
    ability: {
      targets: CHARM_TARGET_LISTS,
      // once: a forced cast keeps its memorized slot unless removed
      spell: { type: "force", remove: true },
    },
  });
}

export const createShadowFiendEntry = () => new SimpleEntry(EntryEnum.ShadowFiend, [shadowFiend]);

import { CHARM_TARGET_LISTS } from "../config/presets/charm-presets";
import { SPELLS } from "../config/spells/spell-database";
import actionFactory from "../src/factories/action.factory";
import effectFactory from "../src/factories/effect.factory";
import responseFactory from "../src/factories/response.factory";
import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { Durations } from "../src/model/game-data/durations";
import { PartialCustomCode } from "../src/model/script/script";
import {
  CharmTypeEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { EntryEnum } from "./entry";
import { addLeap, leapAttackEffects } from "./leap";
import { MonsterEnum } from "./monster";

enum Ids {
  Leap,
  MagicJar,
  MagicJarBackfire,
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
  fiend.setAdjustments([{ files: [] }]);
  return fiend;
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
        effects: effectFactory.splitProbabilities(
          [1, 2, 3].map((rounds) => ({
            opcode: EffectTypeEnum.PauseTarget,
            target: EffectTargetEnum.OriginalCaster,
            timing: EffectTimingEnum.InstantLimited,
            duration: rounds * Durations.round,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          })),
        ),
      },
    ],
  });
  return fiend.addSpell({
    id: Ids.MagicJar,
    name: "monster.shadowFiend.ability.magicJar.name",
    description: "monster.shadowFiend.ability.magicJar.description",
    memorizedCount: 1,
    role: "disable",
    // the 5th level wizard spell
    worthLevel: 5,
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

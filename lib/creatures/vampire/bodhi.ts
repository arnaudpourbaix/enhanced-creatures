import { MonsterItemIconEnum } from "../../config/item";
import { AT_WILL } from "../../config/common";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { RawCreatureAbility } from "../../src/model/creature/ability";
import { PartialCreatureAdjustment } from "../../src/model/creature/adjustment";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EquippedItem } from "../../src/model/creature/item";
import { ImmunityName } from "../../src/model/final/immunity";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  EffectDamageTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemCategoryEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { createClaws } from "../types/undead";
import { Ids, NOT_SHAPECHANGED, VampireAge, vampire, vampireTrait } from "./vampire";

/**
 * Bodhi's powers from SCS "Improved Bodhi" (stratagems/bodhi/bodhi.tpa): SCS's own ibodhi spells,
 * never copied, cast only once memorized (the ImprovedBodhi spellbook, when SCS is installed).
 * Targets and timers follow SCS's scripts (BODHI.md, "Her extra abilities").
 */
function improvedAbilities(): RawCreatureAbility[] {
  return [
    {
      name: "monster.vampire.ability.touchOfDeath.name",
      level: 6,
      timer: { name: "JA_TOUCH_OF_DEATH", value: 4 * Durations.round },
      targets: [
        {
          name: "NearestEnemies",
          triggers: [
            { name: "HPPercentLT", params: [ScriptTarget.token, 25] },
            { name: "HasItemEquiped", params: ["plat16", ScriptTarget.token], negation: true },
          ],
        },
        {
          name: "NearestEnemies",
          triggers: [
            { name: "Gender", params: [ScriptTarget.token, "SUMMONED"] },
            { name: "CheckStatGT", params: [ScriptTarget.token, 8, "LEVEL"] },
          ],
        },
      ],
      triggers: NOT_SHAPECHANGED,
      spell: { resource: "ibodhi5", type: "force" },
      spellcasting: false,
    },
    {
      name: "monster.vampire.ability.sepulchralSleep.name",
      level: 5,
      timer: { name: "JA_SEPULCHRAL_SLEEP", value: 1000 },
      targets: [
        {
          name: "NearestEnemies",
          triggers: [
            { name: "Race", params: [ScriptTarget.token, "ELF"], negation: true },
            {
              name: "CheckSpellState",
              params: [ScriptTarget.token, "SLEEP_IMMUNITY"],
              negation: true,
            },
            {
              name: "CheckSpellState",
              params: [ScriptTarget.token, "CHAOTIC_COMMANDS"],
              negation: true,
            },
            {
              name: "CheckStatGT",
              params: [ScriptTarget.token, 50, "RESISTMAGIC"],
              negation: true,
            },
          ],
        },
      ],
      triggers: NOT_SHAPECHANGED,
      spell: { resource: "ibodhi6", type: "force" },
      spellcasting: false,
    },
    {
      // PWILT, its area, only hits enemies: no allies check
      name: "monster.vampire.ability.chillOfTheGrave.name",
      level: 8,
      timer: { name: "JA_CHILL_OF_THE_GRAVE", value: 1000 },
      targets: [
        {
          name: "NearestEnemies",
          triggers: [
            { name: "CheckStatGT", params: [ScriptTarget.token, 8, "LEVEL"] },
            { name: "CheckStatGT", params: [ScriptTarget.token, 49, "RESISTCOLD"], negation: true },
            {
              name: "CheckStatGT",
              params: [ScriptTarget.token, 50, "RESISTMAGIC"],
              negation: true,
            },
          ],
        },
      ],
      triggers: NOT_SHAPECHANGED,
      spell: { resource: "ibodhi4", type: "force" },
      spellcasting: false,
    },
    {
      // SCS gives it on the hardest difficulty only
      name: "monster.vampire.ability.deathlyShroud.name",
      level: null,
      targets: [],
      triggers: [...NOT_SHAPECHANGED, { name: "Difficulty", params: ["HARDEST"] }],
      spell: { resource: "ibodhi7", type: "force", castOnSelf: true, remove: true },
      spellcasting: false,
    },
  ];
}

/** Bodhi's age, above Patriarch: her Ch2–3 strength (Bodhi only for now; see BODHI.md) */
export const ABOMINATION_AGE: VampireAge = {
  monster: MonsterEnum.VampireAbomination,
  name: "monster.vampire.name.abomination",
  level1: 25,
  bonusHp: 0,
  turnAs: "lich", // irrelevant: immune to turn undead
  strength: 24,
  intelligence: 20,
  dexterity: 24,
  charisma: 19,
  movement: 27,
  xpv: 21000,
  domination: { id: Ids.VampireWillDominationAbomination, mode: "will", saveBonus: -6 },
  weaponImmunity: "plusThreeWeapons",
  regeneration: 12,
  magicResistance: 75,
  ac: -10, // her files' natural -4 plus DEX 24 (the engine adds it)
  apr: 3,
  drainLevels: 3,
  extraImmunities: [
    "cold",
    "lightning",
    "magicDamageResistance",
    "deathEffects",
    "turnUndead",
    "seeInvisible",
  ],
  abilities: improvedAbilities,
  extraEffects: (
    [
      EffectTypeEnum.SlashingResistanceModifier,
      EffectTypeEnum.CrushingResistanceModifier,
      EffectTypeEnum.PiercingResistanceModifier,
      EffectTypeEnum.MissilesResistanceModifier,
    ] as const
  ).map((opcode) => ({ opcode, value: 25, type: EffectStatisticModifierEnum.Set })),
};

/** Blocks of Bodhi's own scripts that fight, move or cast: what makes a block not story */
const STORY_ONLY_REMOVED_BLOCKS = [
  "AttackOneRound",
  "SelectWeaponAbility",
  "MoveToObject",
  "RunAwayFrom",
  "RandomWalk",
  "ibodhi",
  "dw#nprun",
  "dw#hprem",
  "OpenDoor",
  "EscapeArea",
  "ClearActions",
  "VAMPIRE_DOMINATION",
  "BEHOLDER_DOMINATION",
  "WIZARD_CONTROL_UNDEAD",
];

/** Bodhi's items beyond the age's own: claws and traits per encounter, and her blood */
interface BodhiItems {
  /** The age's claws and traits, whose slots the encounters' own take */
  claws: EquippedItem;
  trait: EquippedItem;
  /** Claws draining 5 levels (Spellhold's VAMP3, Black Pits 2) */
  drain5: string;
  /** Claws as BODHI.ITM: 5 levels, 4 magic damage and +4 max HP for her (Ch6, ToB) */
  bodhiClaws: string;
  spellholdTrait: string;
  blackPitsTrait: string;
  /** +12 HP/round, the item the holy water destroys */
  blood: string;
}

/** A trait-like item of the creature's, worn only by the encounters that equip it */
function encounterTrait(
  cre: Creature,
  payload: { immunities: ImmunityName[]; effects: Effect[] },
): string {
  return cre.addItem({
    stringRef: cre.items.find((i) => i.trait)?.stringRef,
    effects: payload.effects.map((e) => ({
      ...e,
      timing: EffectTimingEnum.InstantWhileEquipped,
      target: EffectTargetEnum.Self,
    })),
    immunities: payload.immunities,
    category: ItemCategoryEnum.Rings,
    icon: MonsterItemIconEnum.Traits,
  }).file;
}

function bodhiItems(cre: Creature, age: VampireAge): BodhiItems {
  const [claws, trait] = cre.data.items.equipped;
  const newClaws = (effects: Effect[]) =>
    createClaws(cre, { effects, diceThrown: 1, diceSize: 6, equipped: false }).file;
  // Spellhold: she must hunt the party without winning (BODHI.md), at her own files' strength
  const spellholdTrait = encounterTrait(
    cre,
    vampireTrait({ ...age, magicResistance: 30, extraImmunities: [], extraEffects: [] }),
  );
  // Black Pits 2: her own campaign, as her file (cold/lightning 50, 60 HP/round, level 1-2 spells)
  const blackPitsTrait = encounterTrait(
    cre,
    vampireTrait({
      ...age,
      regeneration: 60,
      extraImmunities: (age.extraImmunities ?? []).filter((i) => i !== "cold" && i !== "lightning"),
      extraEffects: [
        ...(age.extraEffects ?? []),
        { opcode: EffectTypeEnum.ProtectionFromSpellLevels, level: 1 },
        { opcode: EffectTypeEnum.ProtectionFromSpellLevels, level: 2 },
      ],
    }),
  );
  const blood = encounterTrait(cre, {
    immunities: [],
    effects: effectFactory.regeneration(12),
  });
  const drain5 = newClaws(effectFactory.levelDrain({ levels: 5 }));
  const bodhiClaws = newClaws([
    ...effectFactory.levelDrain({ levels: 5 }),
    { opcode: EffectTypeEnum.Damage, type: EffectDamageTypeEnum.Magic, amount: 4 },
    {
      opcode: EffectTypeEnum.MaximumHPModifier,
      value: 4,
      type: EffectStatisticModifierEnum.Increment,
      target: EffectTargetEnum.Self,
      timing: EffectTimingEnum.InstantLimited,
      duration: 60,
    },
  ]);
  return {
    claws,
    trait,
    drain5,
    bodhiClaws,
    spellholdTrait,
    blackPitsTrait,
    blood,
  };
}

/**
 * Her scripts: the holy water in her lair (BLPOOL3 → C6BWEAK) destroys her blood instead of the
 * removed VAMPREG2, and her own scripts keep only their story (dialogues, death, spawns, the
 * Spellhold hunt): fighting, moving and casting are ours, on vanilla, SCS or UB versions alike.
 * Only on BG2, where her files are: never strip her scripts without patching her.
 */
function bodhiScripts(cre: Creature, items: BodhiItems) {
  cre.data.items.remove.push("dw#bldd3", "bodhi");
  cre.data.script.edits = [
    ...(cre.data.script.edits ?? []),
    {
      files: ["C6BWEAK"],
      game: "bg2",
      replaces: [['DestroyItem("VAMPREG2")', `DestroyItem("${items.blood}")`]],
    },
    {
      files: ["BODHI2", "C6BODHI", "finbodhi", "ppbodhi4"],
      game: "bg2",
      removeBlocks: STORY_ONLY_REMOVED_BLOCKS,
    },
  ];
  // the Pocket Plane challenge has no story of hers: chalDIE handles it
  cre.data.script.remove.push("dw#chbod");
}

/**
 * SCS's own Bodhi spells, memorized only when SCS installed them (never copied: they're SCS's);
 * each encounter keeps the ones its SCS script cast
 */
function improvedBodhiSpells(...spells: string[]) {
  return {
    memorized: [],
    spellbooks: [
      {
        mod: "ImprovedBodhi" as const,
        memorized: spells.map((file) => ({
          file,
          memorizedCount: file === "ibodhi7" ? 1 : AT_WILL,
        })),
      },
    ],
  };
}

/** Ch3, the lesson fight: Touch of Death and Sleep only */
function chapter3Encounter(): PartialCreatureAdjustment[] {
  return [{ files: ["BODHI2"], data: { spells: improvedBodhiSpells("ibodhi5", "ibodhi6") } }];
}

/**
 * Spellhold: level 15, as she must hunt the party without winning, but never below each file's
 * own values (AC is a final value: the file's natural -1 plus its DEX bonus; level 15 gives THAC0 5,
 * no worse than the files' 6 and 5)
 */
function chapter4Encounter({ claws, trait, drain5, spellholdTrait }: BodhiItems) {
  const spellhold = (
    file: string,
    p: { strength: number; dexterity: number; ac: number; drain5: boolean },
  ): PartialCreatureAdjustment => ({
    files: [file],
    data: {
      ac: p.ac,
      strength: p.strength,
      dexterity: p.dexterity,
      level1: 15,
      apr: 2.5, // the game's 8
      items: {
        remove: [trait.file],
        equipped: [
          ...(p.drain5 ? [{ ...claws, file: drain5 }] : []),
          { ...trait, file: spellholdTrait },
        ],
      },
    },
  });
  return [
    spellhold("PPBODHI3", { strength: 21, dexterity: 20, ac: -5, drain5: true }),
    spellhold("PPBODHI4", { strength: 22, dexterity: 21, ac: -6, drain5: false }),
    spellhold("VVBODHI", { strength: 22, dexterity: 21, ac: -6, drain5: true }),
  ];
}

/** Ch6, her lair, and ToB: BODHI.ITM's claws, her blood (24 HP/round) and all her SCS spells */
function chapter6Encounter({ claws, trait, bodhiClaws, blood }: BodhiItems) {
  const lair = (
    file: string,
    p: { xpv?: number; extra?: EquippedItem[] } = {},
  ): PartialCreatureAdjustment => ({
    files: [file],
    data: {
      ...(p.xpv ? { xpv: p.xpv } : {}),
      items: {
        remove: [],
        equipped: [{ ...claws, file: bodhiClaws }, { ...trait, file: blood }, ...(p.extra ?? [])],
      },
      spells: improvedBodhiSpells("ibodhi4", "ibodhi5", "ibodhi6", "ibodhi7"),
    },
  });
  return [
    lair("C6BODHI", { xpv: 91000 }),
    lair("CBBODH66"),
    lair("CHEVIL08", { extra: [{ file: "BOOT01", slot: "BOOTS" }] }),
    lair("FINBODH", { xpv: 26000 }),
  ];
}

/** Black Pits 2, her own campaign: as her file (AC -8 is her natural -4 plus DEX 20) */
function blackPitsEncounter({ claws, trait, drain5, blackPitsTrait }: BodhiItems) {
  const blackPits: PartialCreatureAdjustment = {
    files: ["OHB3BODH"],
    data: {
      strength: 21,
      dexterity: 20,
      ac: -8,
      xpv: 25000,
      items: {
        remove: [trait.file],
        equipped: [
          { ...claws, file: drain5 },
          { ...trait, file: blackPitsTrait },
        ],
      },
    },
  };
  return [blackPits];
}

/**
 * Bodhi: see BODHI.md and docs/superpowers/specs/2026-10-26-bodhi-abomination-design.md.
 * The age is her Ch2–3 strength; each other encounter adjusts it, never below its own files.
 */
export const abominationVampire = (entry: CreatureEntry<Creature>) => {
  const age = ABOMINATION_AGE;
  const cre = vampire(entry, age);
  const items = bodhiItems(cre, age);
  bodhiScripts(cre, items);
  cre.setAdjustments([
    ...chapter3Encounter(),
    ...chapter4Encounter(items),
    ...chapter6Encounter(items),
    ...blackPitsEncounter(items),
  ]);
  return cre;
};

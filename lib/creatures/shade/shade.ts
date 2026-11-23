import { NEW_CREATURES } from "../../config/creatures";
import { SPELLS } from "../../config/spells/spell-database";
import effectFactory from "../../src/factories/effect.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin, kinOf } from "../../src/model/creature/kin";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { Durations } from "../../src/model/game-data/durations";
import type { Effect } from "../../src/model/spell-item/effect";
import {
  EffectBonusToEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTeleportTypeEnum,
  EffectTimingEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SummonCreatureModeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import type { Spell } from "../../src/model/spell-item/spell-item";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { addQuasiRealDamage } from "../quasi-real";
import { SHADE_LEVEL, ShadeKin, shadePowers } from "./kin";

enum Ids {
  Blink,
  QuasiRealImages,
  SlaughterQuasiRealImages,
}

/**
 * Shades: humans or demihumans who traded their life force to the Plane of Shadow. Undead, as in
 * 5e (2e sources disagree): General UNDEAD, race/class SHADOW. Its shadow images and Shadow Door
 * are its kin's, shared with other shadow creatures.
 */
export function shade(entry: CreatureEntry<Creature>, kin: ShadeKin): Creature {
  const powers = shadePowers(kin);
  const shade = entry.create({
    monster: MonsterEnum.Shade,
    name: "monster.shade.name",
    files: [],
    data: {
      level1: SHADE_LEVEL,
      bonusHpPerHitDie: 3,
      strength: 6,
      dexterity: 14,
      constitution: 13,
      intelligence: 15,
      wisdom: 10,
      charisma: 8,
      ac: 10,
      apr: 1,
      xpv2e: 6000,
      alignment: "CHAOTIC_EVIL",
      morale: 14,
      general: "UNDEAD",
      race: "SHADOW",
      class: "SHADOW",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 18, // 15 base, 18 in full darkness
      immunities: ["undead"],
      items: {
        remove: ["immune1", "ring95", "s1-8"],
      },
      ...powers,
    },
  });
  shade.addTrait({
    // always met in full darkness: its darkness powers apply at all times
    immunities: ["infravision", "seeInvisible"],
    effects: [
      effectFactory.magicResistance(Math.min(3 * SHADE_LEVEL, 70)),
      ...effectFactory.regeneration(3),
      ...darknessBonuses(3),
      // -3 to damage rolls against it (minimum 1 per die): a flat -3 takes 30-50% of a typical
      // hit (1d8 to 1d8+6), 30% is the closest steady rate
      ...effectFactory.physicalResistance(30),
    ],
  });
  blink(shade);
  // summoning copies of itself: the base power makes the Chaos Shadow's, the Slaughter Shade
  // specializes it to make its own
  const images = quasiRealImages(shade, Ids.QuasiRealImages, NEW_CREATURES.ShadeImageChaos);
  shade.setBehavior({
    abilities: {
      entries: [
        { power: kin.shadowImages },
        { power: kin.shadowDoor },
        { power: entry.spell(Ids.Blink) },
        { power: images },
      ],
    },
  });
  shade.addNaturalWeapon("fists", { diceThrown: 1, diceSize: 8, speed: 1, slot: "WEAPON1" });
  blackheartsShades(shade, images);
  return shade;
}

/**
 * What the Blackhearts shades keep from their files: immune to electricity (their 30% vs missiles
 * is the shades' physical resistance).
 */
const BLACKHEARTS_SHADE = {
  resistElectricity: 100,
};

/**
 * The Red Woman's shades (Blackhearts, WIBH11). The Chaos Shadow keeps the spells its own script
 * casts on sight (Shadow Door and SPWI508: Chaos, or Waves of Fatigue with Spell Revisions; its
 * Mirror Image is the shades' shadow images); the rest of its file's spellbook, shared with SotSC's Shadow
 * Prophet, is never cast. The Slaughter Shade only keeps its file's two attacks; its SHDWKILL
 * script (quest kill count) stays.
 */
function blackheartsShades(shade: Creature, images: Spell) {
  // the Red Woman creates them: summons, declared here untagged (only Blackhearts has the files),
  // since variant scripts don't support creatures.csv's game-tagged summon files
  shade.setAdjustments([{ files: ["WIBHSHA1", "WIBHSHA2"], summon: true }]);
  const slaughterImages = quasiRealImages(
    shade,
    Ids.SlaughterQuasiRealImages,
    NEW_CREATURES.ShadeImageSlaughter,
    images.file,
  );
  shade.variant("Chaos Shadow", {
    data: {
      ...BLACKHEARTS_SHADE,
      spells: {
        memorized: [{ file: SPELLS.Wizard.WavesOfFatigue.file, memorizedCount: 1 }],
      },
      script: { remove: ["WIBHSHA1"] },
    },
    files: ["WIBHSHA1"],
  });
  shade.variant("Slaughter Shade", {
    data: {
      ...BLACKHEARTS_SHADE,
      apr: 2,
      spells: {
        removeMemorized: [images.file],
        memorized: [{ file: slaughterImages.file, memorizedCount: 1 }],
      },
    },
    files: ["WIBHSHA2"],
    behavior: {
      abilities: { entries: [{ power: slaughterImages }] },
    },
  });
  shadeImages(shade);
}

/**
 * Quasi-real images, once an hour (once a fight): 1d4 duplicates of the shade, as demishadow
 * monsters at its level, under its control. `image` is the duplicate file of this shade; without
 * `specializes`, the base shade's power (memorized), else a variant's version of that one.
 */
function quasiRealImages(shade: Creature, id: Ids, image: string, specializes?: string) {
  return shade.addSpell({
    id,
    ...(specializes ? { specializes } : { memorizedCount: 1 }),
    name: "monster.shade.ability.quasiRealImages.name",
    description: "monster.shade.ability.quasiRealImages.description",
    icon: SPELLS.Wizard.DemiShadowMonsters.file,
    worthLevel: 5,
    role: "summon",
    headers: [
      {
        type: ItemAbilityTypeEnum.Magical,
        target: ItemAbilityTargetEnum.Caster,
        speed: 1,
        effects: effectFactory.diceOutcomes(1, 4, (total) =>
          Array.from({ length: total }, (): Effect => ({
            opcode: EffectTypeEnum.SummonCreature,
            mode: SummonCreatureModeEnum.PositionTargetAllegianceMatchTarget,
            target: EffectTargetEnum.Self,
            timing: EffectTimingEnum.InstantLimited,
            // demishadow monsters: 1 round per level
            duration: SHADE_LEVEL * Durations.round,
            resource: image,
          })),
        ),
      },
    ],
    ability: {
      // once a fight: the cast uses up its memorized slot
      spell: { type: "force", castOnSelf: true, remove: true },
      requireVocal: false,
    },
  });
}

/**
 * The quasi-real duplicates, as demishadow monsters: 40% of the shade's hit points (it arrives
 * wounded), their own AC. Their fists deal 40% of its damage (1d3 for 1d8) to those who see
 * through them, the full damage (1d4 more) to those who believe them (one save each, see
 * addQuasiRealDamage). They keep the shade's trait (its core nature) but cast nothing: no spells,
 * nor their file's script (SHDWKILL counts the quest's kills).
 */
function shadeImages(shade: Creature) {
  const fists = shade.addNaturalWeapon("fists", {
    diceThrown: 1,
    diceSize: 3,
    speed: 1,
    slot: null,
  });
  addQuasiRealDamage(
    shade,
    [{ weapon: fists, extra: { diceThrown: 1, diceSize: 4 } }],
    SHADE_LEVEL * Durations.round,
  );
  shade.variant("Shade image", {
    data: {
      currentHpPercent: 40,
      items: {
        equipped: [{ file: fists.file, slot: "WEAPON1" }],
      },
      spells: { removeMemorized: true, removeKnown: true },
      script: { remove: ["WIBHSHA1", "SHDWKILL"] },
    },
    newFiles: [
      { files: [NEW_CREATURES.ShadeImageChaos], copyFromExisting: "WIBHSHA1" },
      { files: [NEW_CREATURES.ShadeImageSlaughter], copyFromExisting: "WIBHSHA2" },
    ],
    adjust: [
      { files: [NEW_CREATURES.ShadeImageChaos], summon: true },
      { files: [NEW_CREATURES.ShadeImageSlaughter], summon: true, data: { apr: 2 } },
    ],
  });
}

function darknessBonuses(value: number): Effect[] {
  const saves = [
    EffectTypeEnum.SaveVsDeathModifier,
    EffectTypeEnum.SaveVsWandModifier,
    EffectTypeEnum.SaveVsPetrificationModifier,
    EffectTypeEnum.SaveVsBreathModifier,
    EffectTypeEnum.SaveVsSpellModifier,
  ] as const;
  return [
    ...saves.map((opcode): Effect => ({
      opcode,
      value,
      type: EffectStatisticModifierEnum.Increment,
    })),
    { opcode: EffectTypeEnum.Thac0Bonus, type: EffectStatisticModifierEnum.Increment, value },
    {
      opcode: EffectTypeEnum.AttackDamageBonus,
      type: EffectStatisticModifierEnum.Increment,
      value,
    },
    { opcode: EffectTypeEnum.ArmorClassBonus, bonusTo: EffectBonusToEnum.AllWeapons, value },
  ];
}

/**
 * Controlled blink once every two rounds: it appears by an enemy (any very shadowy spot within
 * 100 yards, and it's always dark) and attacks.
 */
function blink(shade: Creature) {
  return shade.addSpell({
    id: Ids.Blink,
    name: "monster.shade.ability.blink",
    icon: SPELLS.Wizard.DimensionDoor.file,
    worthLevel: 3,
    role: "protection",
    memorizedCount: 1,
    options: { renew: 2 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 30,
        effects: [
          {
            opcode: EffectTypeEnum.Teleport,
            type: EffectTeleportTypeEnum.Default,
            target: EffectTargetEnum.Self,
          },
        ],
      },
    ],
    ability: {
      targets: [{ name: "FarthestEnemies", randomOrder: true }],
      minRange: 5,
      spell: { type: "force" },
      actionsAfter: [{ name: "AttackOneRound", params: [ScriptTarget.lastSeen] }],
    },
  });
}

export const createShadeEntry = (kins: Map<KinEnum, CreatureKin>) => {
  const kin = kinOf(kins, KinEnum.Shade, ShadeKin);
  return new SimpleEntry(EntryEnum.Shade, [(entry) => shade(entry, kin)], kin);
};

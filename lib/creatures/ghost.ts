import { SPELLS } from "../config/spells/spell-database";
import { CommonProjectileFiles } from "../spells/projectiles";
import effectFactory from "../src/factories/effect.factory";
import { Durations } from "../src/model/game-data/durations";
import {
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../src/model/spell-item/spell-protection";
import { MonsterEnum } from "./monster";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { createClaws } from "./types/undead";

enum Ids {
  GhostFearAura,
  GhostTouch,
}

function ghostFearAura(cre: Creature) {
  // causes any humanoid being to age 10 years and flee in panic for 8 turns unless a saving throw versus spell is made.
  // all humanoids above 8th level may add +2 to their saving throws.
  // Priests above 6th level are immune to this effect,
  const saveType = SaveTypeEnum.Spell;
  return cre.addSpell({
    name: "monster.ghost.ability.fearAura.name",
    description: "monster.ghost.ability.fearAura.description",
    id: Ids.GhostFearAura,
    memorizedCount: 1,
    icon: SPELLS.Priest.CloakOfFear.file,
    options: { renew: 2 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        speed: 0,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        range: 30,
        effects: [
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: {
              stat: SpellProtectionStat.General,
              relation: SpellProtectionRelation.NotEqual,
            },
            value: "HUMANOID",
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            duration: 1,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: "CLERIC",
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            minLevel: 7,
            duration: 1,
          },
          ...effectFactory.fear({
            saveType,
            duration: 8 * Durations.turn,
            saveBonus: 0,
            minLevel: 1,
            maxLevel: 7,
            stringRef: "monster.ghost.ability.fearAura.frightened",
          }),
          ...effectFactory.fear({
            saveType,
            duration: 8 * Durations.turn,
            saveBonus: 2,
            minLevel: 8,
            stringRef: "monster.ghost.ability.fearAura.frightened",
          }),
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration: Durations.turn,
          },
        ],
      },
    ],
    ability: {
      preset: SPELLS.Priest.CloakOfFear.file,
      spell: {
        type: "force",
        remove: true,
      },
    },
  });
}

function ghostTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.ghost.ability.touch.name",
    description: "monster.ghost.ability.touch.description",
    id: Ids.GhostTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["levelDrain", "magicDamage"],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          // TODO: If they strike an opponent it ages him 10-40 (1d4x10) years.
          ...effectFactory.levelDrain({
            levels: 2,
          }),
          {
            opcode: EffectTypeEnum.Damage,
            type: EffectDamageTypeEnum.Magic,
            amount: 10,
            dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
          },
        ],
      },
    ],
  });
}

export function ghost(entry: CreatureEntry<Creature>): Creature {
  const ghost = entry.create({
    monster: MonsterEnum.Ghost,
    name: "monster.ghost.name",
    files: [],
    data: {
      level1: 10,
      strength: 7,
      dexterity: 13,
      constitution: 9,
      intelligence: 14,
      wisdom: 12,
      charisma: 17,
      ac: 0,
      apr: 1,
      xpv: 7000,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "UNDEAD",
      race: "SPECTRE",
      class: "SPECTRE",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 9,
      immunities: ["undead"],
      items: {
        remove: [
          "bdringgh",
          "bdghost",
          "immune1",
          "ring94",
          "ring95",
          "ghost",
          "helm15",
          "B1-10",
          "B1-8",
        ],
      },
      script: {
        remove: [],
      },
    },
  });
  ghost.addTrait({
    immunities: ["cold", "incorporeal"],
  });
  ghostFearAura(ghost);
  ghostTouch(ghost);
  createClaws(ghost, {
    diceThrown: 0,
    diceSize: 0,
    castSpell: {
      spell: entry.spell(Ids.GhostTouch).file,
    },
  });
  ghost.setBehavior({
    abilities: [entry.ability(Ids.GhostFearAura)],
    spellcaster: {},
  });
  ghost.setAdjustments([]);
  return ghost;
}

export const createGhostEntry = () => new SimpleEntry(EntryEnum.Ghost, [ghost]);

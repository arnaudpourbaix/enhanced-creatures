import { SPELLS } from "../config/spells/spell-database";
import { createFearAura } from "../spells/fear_aura";
import { CommonProjectileFiles } from "../spells/projectiles";
import { Durations } from "../src/model/game-data/durations";
import {
  EffectIDSFileEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { MonsterEnum } from "./monster";
import { Ids } from "./undead/ids";
import { Undead } from "./undead/undead-creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { UndeadEntry } from "./undead/undead-entry";

function bansheeFearAura(cre: Undead) {
  return cre.addSpell(
    createFearAura({
      id: Ids.BansheeFearAura,
      description: "monster.undead.ability.bansheeFearAura.description",
      duration: Durations.turn,
      saveType: SaveTypeEnum.Spell,
    }),
  );
}

function deathWail(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.deathWail.name",
    description: "monster.undead.ability.deathWail.description",
    id: Ids.DeathWail,
    memorizedCount: 1,
    icon: SPELLS.Wizard.WailOfTheBanshee.file,
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        speed: 1,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        range: 30,
        effects: [
          {
            opcode: EffectTypeEnum.Slay,
            idsFile: EffectIDSFileEnum.EA,
            idsEntry: "ANYONE",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            saveTypes: [SaveTypeEnum.Spell],
          },
          {
            opcode: EffectTypeEnum.LightingEffects,
            effect: LightingEffectEnum.HitFingerOfDeath,
            lightingTarget: LightingEffectTargetEnum.SpellTarget,
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            saveTypes: [SaveTypeEnum.Spell],
          },
          {
            opcode: EffectTypeEnum.PlaySound,
            resource: "CAS_M07",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            saveTypes: [SaveTypeEnum.Spell],
          },
        ],
      },
    ],
    ability: {
      preset: SPELLS.Wizard.WailOfTheBanshee.file,
      spell: {
        type: "force",
        remove: true,
      },
    },
  });
}

export function banshee(family: CreatureEntry<Undead>): Undead {
  const banshee = family.create({
    monster: MonsterEnum.Banshee,
    name: "monster.undead.name.banshee",
    files: [],
    data: {
      level1: 7,
      strength: 9,
      dexterity: 14,
      constitution: 9,
      intelligence: 16,
      wisdom: 11,
      charisma: 17,
      ac: 0,
      apr: 1,
      xpv: 4000,
      alignment: "CHAOTIC_EVIL",
      morale: 13,
      general: "UNDEAD",
      race: "WRAITH",
      class: "SPECTRE",
      animation: "WAILING_VIRGIN",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 15,
      immunities: ["undead"],
      items: {
        remove: ["IMMUNE1", "B1-8M2", "IMMCHS", "S1-8", "RING95"],
      },
      script: {
        remove: ["BDBANSH", "banshe01", "f_wailin"],
      },
    },
  });
  bansheeFearAura(banshee);
  deathWail(banshee);
  banshee.addTrait({
    immunities: ["nonMagicalWeapons", "magicResistance", "incorporeal", "cold", "lightning"],
  });
  banshee.createTouch({
    diceThrown: 1,
    diceSize: 8,
    slot: "WEAPON1",
  });
  banshee.setBehavior({
    restHeal: true,
    abilities: [family.ability(Ids.BansheeFearAura), family.ability(Ids.DeathWail)],
  });
  banshee.turnAs = "special";
  return banshee;
}

export const createBansheeEntry = () => new UndeadEntry(EntryEnum.Banshee, [banshee]);

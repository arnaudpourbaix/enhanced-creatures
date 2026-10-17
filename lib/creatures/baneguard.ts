import { SPELLS } from "../config/spells/spell-database";
import effectFactory from "../src/factories/effect.factory";
import {
  EffectTargetEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { MonsterEnum } from "./monster";
import { Ids } from "./undead/ids";
import { Undead } from "./undead/undead-creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { UndeadEntry } from "./undead/undead-entry";

function blink(cre: Undead) {
  return cre.addSpell({
    icon: SPELLS.Wizard.TeleportField.file,
    options: { renew: 14 },
    name: "monster.undead.ability.blink",
    id: Ids.Blink,
    memorizedCount: 1,
    headers: [
      {
        type: ItemAbilityTypeEnum.Magical,
        speed: 1,
        target: ItemAbilityTargetEnum.Caster,
        effects: [
          ...effectFactory.repeatEffect(4, [
            {
              opcode: EffectTypeEnum.TeleportField,
              target: EffectTargetEnum.Self,
              maxRange: 100,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              target: EffectTargetEnum.Self,
              effect: LightingEffectEnum.AlterationWater,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              target: EffectTargetEnum.Self,
              resource: "EFF_M08",
            },
          ]),
        ],
      },
    ],
    ability: {
      spell: {
        castOnSelf: true,
      },
      requireVocal: false,
      triggers: [{ name: "Range", params: ["NearestEnemyOf", 5] }],
    },
  });
}

export function baneguard(family: CreatureEntry<Undead>): Undead {
  const baneguard = family.create({
    monster: MonsterEnum.Baneguard,
    name: "monster.undead.name.baneguard",
    files: [],
    data: {
      level1: 4,
      bonusHp: 4,
      level2: 3, // for magic missiles as a level 3 wizard
      strength: 16, // 19 in vanilla
      dexterity: 11,
      constitution: 9,
      intelligence: 1,
      wisdom: 8,
      charisma: 5,
      ac: 7,
      apr: 1, // 3 in vanilla
      xpv: 975,
      alignment: "NEUTRAL_EVIL",
      morale: 12,
      general: "UNDEAD",
      race: "SKELETON",
      class: "FIGHTER_MAGE", // SKELETON_BANEGUARD
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      script: {
        remove: ["AC#DTDIG"],
      },
      items: {
        remove: ["ring95", "ring99"],
      },
      spells: {
        memorized: [{ file: SPELLS.Wizard.MagicMissiles.file, memorizedCount: 1 }],
      },
    },
  });
  baneguard.addTrait({
    immunities: ["skeletal"],
  });
  blink(baneguard);
  baneguard.setBehavior({
    restHeal: true,
    abilities: [
      {
        preset: SPELLS.Wizard.MagicMissiles.file,
        spell: {
          type: "noDec",
        },
        requireVocal: false,
        timer: { name: "MagicMissiles", value: 18 },
      },
      family.ability(Ids.Blink),
    ],
  });
  baneguard.setAttack({
    ranged: true,
  });
  baneguard.setAdjustments([{ files: ["AC#DTDIG"], data: { level1: 6 } }]);
  return baneguard;
}

export const createBaneguardEntry = () => new UndeadEntry(EntryEnum.Baneguard, [baneguard]);

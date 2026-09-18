import { SPELLS } from "../../config/spells/spell-names";
import effectFactory from "../../src/factories/effect.factory";
import { Variant } from "../../src/model/creature/variant";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  ProficiencyTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../src/model/spell-item/spell-protection";
import spellService from "../../src/services/spell.service";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Ids } from "./ids";
import { Undead } from "./undead-creature";

function bonebatTouch(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.bonebatTouch.name",
    description: "monster.undead.ability.bonebatTouch.description",
    id: Ids.BonebatTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: {
              stat: SpellProtectionStat.Race,
              relation: SpellProtectionRelation.Equal,
            },
            value: "ELF",
          },
          ...effectFactory.paralyze({
            duration: 6 * Durations.round,
            saveType: SaveTypeEnum.ParalyzePoisonDeath,
          }),
        ],
      },
    ],
  });
}

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
        selfTarget: true,
      },
      requireVocal: false,
      triggers: [{ name: "Range", params: ["NearestEnemyOf", 5] }],
    },
  });
}

export function skeleton(family: UndeadFamily): Undead {
  const skeleton = family.create({
    monster: MonsterEnum.Skeleton,
    name: "monster.undead.name.skeleton",
    files: [],
    data: {
      level1: 1,
      strength: 10,
      dexterity: 14,
      constitution: 9,
      intelligence: 1,
      wisdom: 8,
      charisma: 5,
      ac: 7,
      apr: 1,
      thac0: 19,
      xpv: 65,
      alignment: "NEUTRAL",
      morale: 12,
      general: "UNDEAD",
      race: "SKELETON",
      class: "SKELETON",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "ring99", "undtype"],
      },
      script: {
        remove: ["L#HAUSK"],
      },
      // Enforce proper skeleton colours for all processed creatures (colours courtesy of rskel01)
      metalColor: 20,
      minorColor: 67,
      majorColor: 66,
      skinColor: 105,
      leatherColor: 14,
      armorColor: 20,
      hairColor: 0,
    },
  });
  skeleton.addTrait({
    immunities: ["skeletal"],
  });
  skeleton.setBehavior({
    restHeal: true,
  });
  skeleton.setAttack({
    ranged: true,
  });
  skeleton.setAdjustments([
    {
      files: ["GHASTSU", "SKELLESU", "0XYHDG"],
      data: { level1: 3 },
    },
    {
      files: ["C0DESUM1", "C0DESUM2", "C0DESUM3"],
      stringRef: "monster.undead.name.skeleton",
      data: { level1: 3 },
    },
    {
      files: ["C0DESUM2", "C0DESUM3"],
      data: {
        level1: 5,
        class: "FIGHTER",
        proficiencies: [
          {
            type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
            value: 3,
          },
        ],
      },
    },
    {
      files: ["KRYSKEL"],
      data: { level1: 2 },
    },
    {
      files: ["L#HAUSK"],
      data: {
        level1: 13,
        strength: 19,
        ac: -1,
        apr: 3,
        xpv: 3000,
      },
    },
    {
      files: ["SKELPETR"],
      data: { script: { location: "None" } },
    },
    {
      files: ["KNIGHTSK"],
      data: {
        level1: 9,
        xpv: 900,
        strength: 18,
        exceptionalStrength: 9,
        apr: 2,
      },
      scriptName: true,
    },
    {
      files: ["KRYSKEL1", "KRYSKEL2", "KRYSKEL3", "KRYSKEL4", "KRYSKEL5", "KRYSKEL6"],
      data: { level1: 2, xpv: 90 },
    },
    {
      // Restless Dead
      files: ["YSRSDEAD"],
      data: { level1: 2, xpv: 100, script: { location: "None" } },
    },
  ]);
  greaterSkeletonVariant(skeleton);
  // mageSkeleton(skeleton);
  return skeleton;
}

function greaterSkeletonVariant(base: Undead): Variant {
  const greater = base.variant("Greater Skeleton", {
    data: {
      level1: 6,
      strength: 12,
      dexterity: 16,
      constitution: 11,
      ac: 4,
      xpv: 400,
    },
    files: [
      "SKELGRSU",
      "GPSKEL1",
      "L#SKEST",
      "L#XZEP1B",
      "L#XZEP1C",
      "L#XZEP1D",
      "L#XZEP1E",
      "L#XZEP1F",
      "BDSKGR02",
      "CBUNDEAD",
      "RSKEL03",
      "D9SKL02",
      "D9SKL08",
      "HGSKL02",
      "C0DESUM3",
    ],
    adjust: [
      { files: ["CBUNDEAD"], data: { script: { location: "None" } } },
      { files: ["C0DESUM3"], data: { level1: 7 } },
      { files: ["L#SKEST"], data: { level1: 8, apr: 2 } },
      { files: ["L#XZEP1B"], data: { apr: 2, script: { location: "None" } } },
      { files: ["L#XZEP1C"], data: { level1: 9, ac: 0, apr: 3, script: { location: "None" } } },
      { files: ["L#XZEP1D"], data: { level1: 13, ac: -2, apr: 3.5, script: { location: "None" } } },
      { files: ["L#XZEP1E"], data: { level1: 17, ac: -4, apr: 4, script: { location: "None" } } },
      { files: ["L#XZEP1F"], data: { level1: 20, ac: -6, apr: 4.5, script: { location: "None" } } },
    ],
  });
  assasinVariant(greater);
  return greater;
}

function assasinVariant(base: Variant): Variant {
  const assasin = base.variant("Assasin", {
    data: {
      level1: 20,
      ac: -2,
      apr: 2,
      hideShadow: 100,
      moveSilent: 100,
      class: "THIEF",
      kit: "ASSASIN",
      xpv: 6000,
    },
    files: ["D9SKL02", "D9SKL08", "HGSKL02"],
  });
  return assasin;
}

function clericSkeletonVariant(base: Undead): Variant {
  return base.variant("Cleric Skeleton", {
    data: {
      class: "CLERIC",
      spells: {
        spellbooks: spellService.createSpellbooks({
          name: "EvilUndeadCleric",
          casterLevel: base.data.level1.pnpValue,
          type: "cleric",
        }),
      },
    },
    files: ["L#NIMF6"],
    adjust: [
      {
        files: ["L#NIMF6"],
        data: {
          level1: 20,
          ac: 1,
          xpv: 9500,
          apr: 2,
          spells: {
            cumulative: false,
            spellbooks: spellService.createSpellbooks({
              name: "EvilUndeadCleric",
              casterLevel: 20,
              type: "cleric",
            }),
          },
        },
      },
    ],
  });
}

export function spikeSkeleton(family: UndeadFamily): Undead {
  const monster = family.createFrom({
    name: "monster.undead.name.spikeSkeleton",
    monster: MonsterEnum.SpikeSkeleton,
    from: family.creature(MonsterEnum.Skeleton),
    removeAbilities: true,
    removeMemorized: true,
  });
  monster.setData({
    level1: 3,
    ac: 6,
    morale: 20,
    xpv: 650,
  });
  //TODO:
  // Further, each time the skeleton hits or is hit, 1d3 spikes explode in a bonespray,
  // inflicting 1d4 points of damage per spike in a 5-foot radius (save vs. breath weapon for half damage).
  // The skeleton itself suffers 1 point of damage for each spike it loses this way.
  // The purpose of the bonespray is to draw blood, so the blood burn ability can be used.
  //
  // Once blood is drawn, the creature nearest the skeleton within 5 feet and with open wounds must save vs. spell at a -3
  // or suffer 3d4 points of damage as the blood from its open wounds catches fire.
  // A saving throw is made at the end of each round for up to three rounds;
  // any success save ends the burning effect at that point.
  // A spike skeleton can use the blood burn only once, and must be recharged to cast it a second time.
  //
  return monster;
}

export function skeletonMonster(family: UndeadFamily): Undead {
  const monster = family.createFrom({
    name: "monster.undead.name.skeletonMonster",
    monster: MonsterEnum.SkeletonMonster,
    from: family.creature(MonsterEnum.Skeleton),
    removeAbilities: true,
    removeMemorized: true,
  });
  monster.setData({
    level1: 6,
    ac: 6,
    size: { value: "Large", tall: true, long: false },
    xpv: 650,
  });
  clericSkeletonVariant(monster);
  return monster;
}

export function giantSkeleton(family: UndeadFamily): Undead {
  const giant = family.createFrom({
    name: "monster.undead.name.giantSkeleton",
    monster: MonsterEnum.GiantSkeleton,
    from: family.creature(MonsterEnum.Skeleton),
    removeAbilities: true,
    removeMemorized: true,
  });
  giant.setData({
    level1: 4,
    bonusHp: 4,
    level2: 8, // for its fireball which is cast a level 8 mage
    ac: 4,
    morale: 20,
    size: { value: "Large", tall: true, long: false },
    class: "CLERIC_MAGE",
    xpv: 975,
    spells: {
      memorized: [{ file: SPELLS.Wizard.Fireball.file, memorizedCount: 1 }],
    },
  });
  giant.addTrait({
    immunities: ["skeletal", "fire"],
    effects: [
      {
        // 1 point of damage per die from all manner of arrows or missiles.
        opcode: EffectTypeEnum.MissilesResistanceModifier,
        type: EffectStatisticModifierEnum.Set,
        value: 90,
      },
    ],
  });
  // This flaming sphere can be hurled as if it were a fireball that delivers 8d6 points of damage.
  // Each blow that lands inflicts 1d12 points of damage.
  return giant;
}

export function archerSkeleton(family: UndeadFamily): Undead {
  const archer = family.createFrom({
    name: "monster.undead.name.archerSkeleton",
    monster: MonsterEnum.ArcherSkeleton,
    from: family.creature(MonsterEnum.Skeleton),
    removeAbilities: true,
    removeMemorized: true,
  });
  archer.setData({
    level1: 2,
    xpv: 175,
    morale: 20,
    script: {
      remove: ["0XUDDG"],
    },
  });
  archer.setAttack({
    ranged: true,
  });
  archer.setAdjustments([
    {
      files: ["SKELACI", "SKELICE", "SKELFIRE"],
      // original thac0: 14-15
      data: { level1: 2, xpv: 120 },
    },
    {
      // Restless Dead
      files: ["YSRSTDD1", "YSRSTDD2", "YSRSTDD3"],
      data: { script: { location: "None" } },
    },
    {
      files: ["SKELDIS"],
      // original thac0: 12
      data: { level1: 3, xpv: 120 },
    },
  ]);
  greaterArcherSkeletonVariant(archer);
  mageSkeletonVariant(archer);
  return archer;
}

function greaterArcherSkeletonVariant(base: Undead): Variant {
  return base.variant("Greater Archer Skeleton", {
    data: {
      level1: 5,
      strength: 12,
      dexterity: 16,
      constitution: 11,
      ac: 6,
      xpv: 420,
    },
    files: [
      "0XUDDG",
      "BDTEAM63",
      "BDSKGR04",
      "SKELAR01",
      "SKELAR02",
      "D9ELARAA",
      "D9ELARBB",
      "D9ELARFF",
      "D9ELARFX",
      "D9ELARGG",
      "D9ELARKK",
      "D9ELARTT",
      "D9ELARXX",
      "D9ELARYC",
      "D9ELARYY",
      "D9ELARZZ",
    ],
    adjust: [
      {
        files: [
          "SKELAR01",
          "SKELAR02",
          "D9ELARAA",
          "D9ELARBB",
          "D9ELARFF",
          "D9ELARFX",
          "D9ELARGG",
          "D9ELARKK",
          "D9ELARTT",
          "D9ELARXX",
          "D9ELARYC",
          "D9ELARYY",
          "D9ELARZZ",
        ],
        data: { level1: 6, xpv: 500 },
      },
      { files: ["0XUDDG"], data: { level1: 12, apr: 2, xpv: 750 } },
    ],
  });
}

function mageSkeletonVariant(base: Undead): Variant {
  return base.variant("Mage Skeleton", {
    data: {
      level1: 5,
      class: "MAGE",
      spells: {
        cumulative: false,
        spellbooks: spellService.createSpellbooks({
          name: "EvilUndeadMageNoFF",
          casterLevel: 5,
          type: "mage",
        }),
      },
      script: {
        remove: ["BDSKGR07"],
      },
      xpv: 900,
    },
    files: ["BDSKGR07", "BDTEAM60"],
    adjust: [
      {
        files: ["BDTEAM60"],
        data: {
          level1: 8,
          spells: {
            cumulative: false,
            spellbooks: spellService.createSpellbooks({
              name: "EvilUndeadMageNoFF",
              casterLevel: 8,
              type: "mage",
            }),
          },
          xpv: 2000,
        },
      },
    ],
  });
}

export function baneguard(family: UndeadFamily): Undead {
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
  return baneguard;
}

export function bonebat(family: UndeadFamily): Undead {
  const bonebat = family.create({
    monster: MonsterEnum.Bonebat,
    name: "monster.undead.name.bonebat",
    files: [],
    data: {
      level1: 4,
      strength: 12,
      dexterity: 13,
      constitution: 9,
      intelligence: 7,
      wisdom: 10,
      charisma: 14,
      ac: 7,
      apr: 1,
      xpv: 975,
      alignment: "NEUTRAL_EVIL",
      morale: 12,
      general: "UNDEAD",
      race: "SKELETON",
      class: "SKELETON",
      gender: "NIETHER",
      size: { value: "Medium", tall: false, long: true },
      movement: 18,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "bdbonbat"],
      },
    },
  });
  bonebat.addTrait({
    immunities: ["skeletal"],
  });
  bonebatTouch(bonebat);
  bonebat.createJaws(
    2,
    4,
    [
      {
        spell: family.spell(Ids.BonebatTouch).file,
      },
    ],
    "WEAPON1",
  );
  bonebat.setBehavior({
    restHeal: true,
  });
  return bonebat;
}

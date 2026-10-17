import { Variant } from "../../src/model/creature/variant";
import spellService from "../../src/services/spell.service";
import { MonsterEnum } from "../monster";
import { Undead } from "../undead/undead-creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { UndeadEntry } from "../undead/undead-entry";
import type { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { builtBefore, skeletonKin } from "./kin";

/** Derives from the Skeleton (`base`), built by the Skeleton entry. */
export function archerSkeleton(family: CreatureEntry<Undead>, base: Undead): Undead {
  const archer = family.createFrom({
    name: "monster.undead.name.archerSkeleton",
    monster: MonsterEnum.ArcherSkeleton,
    from: base,
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

export function createArcherSkeletonEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new UndeadEntry(
    EntryEnum.ArcherSkeleton,
    [(entry) => archerSkeleton(entry, builtBefore(kin?.skeleton, "Skeleton"))],
    kin,
  );
}

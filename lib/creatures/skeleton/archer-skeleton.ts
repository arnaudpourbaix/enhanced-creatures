import { Variant } from "../../src/model/creature/variant";
import { MonsterEnum } from "../monster";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { builtBefore, type CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { skeletonKin } from "./kin";

/** Derives from the Skeleton (`base`), built by the Skeleton entry. */
export function archerSkeleton(entry: CreatureEntry<Creature>, base: Creature): Creature {
  const archer = entry.createFrom({
    name: "monster.skeleton.name.archer",
    monster: MonsterEnum.ArcherSkeleton,
    from: base,
    removeAbilities: true,
    removeMemorized: true,
  });
  archer.setData({
    level1: 2,
    xpv2e: 175,
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
      data: { level1: 2 },
    },
    {
      // Restless Dead
      files: ["YSRSTDD1", "YSRSTDD2", "YSRSTDD3"],
      data: { script: { location: "None" } },
    },
    {
      files: ["SKELDIS"],
      // original thac0: 12
      data: { level1: 3 },
    },
  ]);
  greaterArcherSkeletonVariant(archer);
  return archer;
}

function greaterArcherSkeletonVariant(base: Creature): Variant {
  return base.variant("Greater Archer Skeleton", {
    data: {
      level1: 5,
      strength: 12,
      dexterity: 16,
      constitution: 11,
      ac: 6,
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
        data: { level1: 6 },
      },
      { files: ["0XUDDG"], data: { level1: 12, apr: 2 } },
    ],
  });
}

export function createArcherSkeletonEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new SimpleEntry(
    EntryEnum.ArcherSkeleton,
    [(entry) => archerSkeleton(entry, builtBefore(kin?.skeleton, "Skeleton"))],
    kin,
  ).requires(EntryEnum.Skeleton);
}

import { MonsterEnum } from "../monster";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { builtBefore, type CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { skeletonKin } from "./kin";

/** Derives from the Skeleton (`base`), built by the Skeleton entry. */
export function skeletonMonster(entry: CreatureEntry<Creature>, base: Creature): Creature {
  const monster = entry.createFrom({
    name: "monster.skeleton.name.monster",
    monster: MonsterEnum.SkeletonMonster,
    from: base,
    removeAbilities: true,
    removeMemorized: true,
  });
  monster.setData({
    level1: 6,
    strength: 17,
    ac: 6,
    animation: "SKELETON_MONSTER",
    size: { value: "Large", tall: true, long: false },
    xpv: 650,
  });
  monster.setAdjustments([
    {
      files: ["C0DESUM3"],
      stringRef: "monster.skeleton.name.monster",
      data: { level1: 7, class: "FIGHTER" },
    },
  ]);
  return monster;
}

export function createSkeletonMonsterEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new SimpleEntry(
    EntryEnum.SkeletonMonster,
    [(entry) => skeletonMonster(entry, builtBefore(kin?.skeleton, "Skeleton"))],
    kin,
  ).requires(EntryEnum.Skeleton);
}

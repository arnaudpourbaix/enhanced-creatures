import spellService from "../../src/services/spell.service";
import { MonsterEnum } from "../monster";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { builtBefore, type CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { skeletonKin } from "./kin";

function clericSpells(level: number) {
  return {
    cumulative: false,
    spellbooks: spellService.createSpellbooks({
      name: "UndeadCleric",
      casterLevel: level,
      type: "cleric",
    }),
  };
}

function clericSkeletonVariant(base: Creature, name: string, level: number, files: string[]) {
  base.variant(name, {
    data: { level1: level, spells: clericSpells(level) },
    files,
  });
}

export function clericSkeleton(entry: CreatureEntry<Creature>, base: Creature): Creature {
  const cleric = entry.createFrom({
    name: "monster.skeleton.name.cleric",
    monster: MonsterEnum.ClericSkeleton,
    from: base,
    removeAbilities: true,
    removeMemorized: true,
  });
  cleric.setData({
    level1: 7,
    class: "CLERIC",
    wisdom: 12,
    spells: clericSpells(7),
    script: {
      edits: [{ files: ["L#XZECLE"], replaces: [["Attack([PC])", ""]] }],
    },
  });
  cleric.setAdjustments([
    {
      // Arlg, The Skeletal Cleric
      files: ["L#XZECLE"],
      data: { level1: 6, immunities: ["turnUndead"] },
    },
  ]);
  clericSkeletonVariant(cleric, "Experienced Cleric Skeleton", 12, [
    "D9SC12",
    "D9SC12A",
    "D9SC12B",
    "D9SC13",
    "D9SC13A",
    "D9SC13B",
    "D9SC14",
    "D9SC14A",
    "D9SC14B",
    "D9SC16",
  ]);
  clericSkeletonVariant(cleric, "Elite Cleric Skeleton", 16, [
    "D9SC16B",
    "D9SC17",
    "D9SC17B",
    "D9SC18",
    "D9SC18B",
  ]);
  clericSkeletonVariant(cleric, "Master Cleric Skeleton", 20, ["D9SKL01", "D9SKL06", "L#RVSKLP"]);
  clericSkeletonVariant(cleric, "Ancient Cleric Skeleton", 25, ["HGSKL01"]);
  return cleric;
}

export function createClericSkeletonEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new SimpleEntry(
    EntryEnum.ClericSkeleton,
    [(entry) => clericSkeleton(entry, builtBefore(kin?.skeleton, "Skeleton"))],
    kin,
  ).requires(EntryEnum.Skeleton);
}

import spellService from "../../src/services/spell.service";
import { MonsterEnum } from "../monster";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { builtBefore, type CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { skeletonKin } from "./kin";

function mageSpells(level: number) {
  return {
    cumulative: false,
    spellbooks: spellService.createSpellbooks({
      name: "UndeadNecromancer",
      casterLevel: level,
      type: "mage",
    }),
  };
}

function mageSkeletonVariant(base: Creature, name: string, level: number, files: string[]) {
  base.variant(name, {
    data: { level1: level, spells: mageSpells(level) },
    files,
  });
}

export function mageSkeleton(entry: CreatureEntry<Creature>, base: Creature): Creature {
  const mage = entry.createFrom({
    name: "monster.skeleton.name.mage",
    monster: MonsterEnum.MageSkeleton,
    from: base,
    removeAbilities: true,
    removeMemorized: true,
  });
  mage.setData({
    level1: 7,
    class: "MAGE",
    intelligence: 12,
    spells: mageSpells(7),
  });
  mage.variant("Lesser Mage Skeleton", {
    data: {
      level1: 5,
      spells: mageSpells(5),
      script: { remove: ["BDSKGR07"] },
    },
    files: ["BDSKGR07"],
  });
  mage.variant("Adept Mage Skeleton", {
    data: { level1: 8, spells: mageSpells(8) },
    files: ["BDTEAM60"],
  });
  mageSkeletonVariant(mage, "Experienced Mage Skeleton", 12, [
    "D9SM12",
    "D9SM12A",
    "D9SM13",
    "D9SM13A",
    "D9SM14",
    "D9SM14A",
    "D9SM17",
    "D9SM17B",
  ]);
  mageSkeletonVariant(mage, "Elite Mage Skeleton", 16, [
    "D9SM12B",
    "D9SM13B",
    "D9SM14B",
    "D9SM16",
    "D9SM16B",
    "D9SM18",
    "D9SM18B",
  ]);
  mageSkeletonVariant(mage, "Master Mage Skeleton", 20, ["D9SKL03", "D9SKL07", "HGSKL03"]);
  return mage;
}

export function createMageSkeletonEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new SimpleEntry(
    EntryEnum.MageSkeleton,
    [(entry) => mageSkeleton(entry, builtBefore(kin?.skeleton, "Skeleton"))],
    kin,
  ).requires(EntryEnum.Skeleton);
}

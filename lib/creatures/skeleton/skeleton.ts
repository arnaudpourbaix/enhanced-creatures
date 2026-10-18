import { Variant } from "../../src/model/creature/variant";
import { MonsterEnum } from "../monster";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import type { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { skeletonKin } from "./kin";

export function skeleton(entry: CreatureEntry<Creature>): Creature {
  const skeleton = entry.create({
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
        remove: ["ring95", "ring99", "undtype", "HELMNOAN"],
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
      files: ["GHASTSU", "SKELLESU", "0XYHDG", "SKELSU01"],
      data: { level1: 3 },
    },
    {
      files: ["C0DESUM1", "C0DESUM2"],
      stringRef: "monster.undead.name.skeleton",
      data: { level1: 3 },
    },
    {
      files: ["C0DESUM2", "SKELSU07"],
      data: {
        level1: 5,
      },
    },
    {
      files: ["C0DESUM2"],
      data: {
        class: "FIGHTER",
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
  return skeleton;
}

function greaterSkeletonVariant(base: Creature): Variant {
  const greater = base.variant("Greater Skeleton", {
    data: {
      level1: 6,
      strength: 12,
      dexterity: 16,
      ac: 4,
      xpv: 400,
    },
    files: [
      "GPSKEL1",
      "L#SKEST",
      "L#XZEP1B",
      "L#XZEP1C",
      "L#XZEP1D",
      "L#XZEP1E",
      "L#XZEP1F",
      "CBUNDEAD",
      "RSKEL03",
      "D9SKL02",
      "D9SKL08",
      "HGSKL02",
      "SKELGRSU",
    ],
    adjust: [
      { files: ["CBUNDEAD"], data: { script: { location: "None" } } },
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
  return base.variant("Assasin", {
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
}

export function createSkeletonEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new SimpleEntry(
    EntryEnum.Skeleton,
    [
      (entry) => {
        const creature = skeleton(entry);
        if (kin) kin.skeleton = creature;
        return creature;
      },
    ],
    kin,
  );
}

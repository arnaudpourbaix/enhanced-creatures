import { Variant } from "../../src/model/creature/variant";
import spellService from "../../src/services/spell.service";
import { MonsterEnum } from "../monster";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { SimpleEntry } from "../../src/model/creature/simple-entry";
import { builtBefore, type CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { skeletonKin } from "./kin";

function clericSkeletonVariant(base: Creature): Variant {
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
  clericSkeletonVariant(monster);
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

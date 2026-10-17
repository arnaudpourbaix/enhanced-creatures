import { SPELLS } from "../../config/spells/spell-database";
import { EffectStatisticModifierEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { Creature } from "../../src/model/creature/creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { UndeadEntry } from "../undead/undead-entry";
import { builtBefore, type CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { skeletonKin } from "./kin";

/** Derives from the Skeleton (`base`), built by the Skeleton entry. */
export function giantSkeleton(entry: CreatureEntry<Creature>, base: Creature): Creature {
  const giant = entry.createFrom({
    name: "monster.undead.name.giantSkeleton",
    monster: MonsterEnum.GiantSkeleton,
    from: base,
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

export function createGiantSkeletonEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new UndeadEntry(
    EntryEnum.GiantSkeleton,
    [(entry) => giantSkeleton(entry, builtBefore(kin?.skeleton, "Skeleton"))],
    kin,
  ).requires(EntryEnum.Skeleton);
}

import { MonsterEnum } from "../monster";
import { Undead } from "../undead/undead-creature";
import type { CreatureEntry } from "../../src/model/creature/entry";
import { EntryEnum } from "../entry";
import { UndeadEntry } from "../undead/undead-entry";
import type { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { builtBefore, skeletonKin } from "./kin";

/** Derives from the Skeleton (`base`), built by the Skeleton entry. */
export function spikeSkeleton(family: CreatureEntry<Undead>, base: Undead): Undead {
  const spike = family.createFrom({
    name: "monster.undead.name.spikeSkeleton",
    monster: MonsterEnum.SpikeSkeleton,
    from: base,
    removeAbilities: true,
    removeMemorized: true,
  });
  spike.setData({
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
  return spike;
}

export function createSpikeSkeletonEntry(kins: Map<KinEnum, CreatureKin>) {
  const kin = skeletonKin(kins);
  return new UndeadEntry(
    EntryEnum.SpikeSkeleton,
    [(entry) => spikeSkeleton(entry, builtBefore(kin?.skeleton, "Skeleton"))],
    kin,
  );
}

import { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";
import { Undead } from "../undead/undead-creature";

/**
 * The Skeleton and the skeletons derived from it (Spike, Archer and Giant Skeletons, Skeleton
 * Monster). No shared resources: the kin hands the Skeleton built by its entry to the others.
 */
export class SkeletonKin extends CreatureKin {
  /** Set when the Skeleton entry builds: the other skeletons derive from it. */
  skeleton?: Undead;

  constructor() {
    super(KinEnum.Skeleton);
  }
}

/** The Skeleton kin among the built kins (undefined if missing). */
export function skeletonKin(kins: Map<KinEnum, CreatureKin>): SkeletonKin | undefined {
  const kin = kins.get(KinEnum.Skeleton);
  return kin instanceof SkeletonKin ? kin : undefined;
}

/** A creature another entry builds first and this entry derives from. */
export function builtBefore(creature: Undead | undefined, name: string): Undead {
  if (!creature) throw new Error(`The ${name} entry must build first`);
  return creature;
}

export const createSkeletonKin = () => new SkeletonKin();

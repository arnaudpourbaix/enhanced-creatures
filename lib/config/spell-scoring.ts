import { SpellRole } from "./spells/spell-role";

/**
 * Every weight of the cast order rules (see SpellScoringService and CastOrderService), tuned here
 * only. A score is around `base` for a caster's best spell of its role; each point is worth
 * `probability.perPoint` percent of chance to be cast when its turn comes.
 */
export const SPELL_SCORING = {
  base: 10,
  /** Lost per level below the caster's best for the spell's type */
  levelPenalty: { offensive: 2, other: 1 },
  role: {
    kill: 1.5,
    damage: 0,
    disable: 0,
    summon: 0,
    protection: 0,
    buff: -1,
    reactive: 0,
    shapeshift: 0,
    useless: 0,
  } satisfies Record<SpellRole, number>,
  /** Summons of this level and up can turn a battle */
  bigSummon: { level: 6, bonus: 2 },
  offensive: {
    area: 2.5,
    /** Instead of `area` when it hits the caster's allies too: they must keep out of it */
    areaHittingAllies: 1.5,
    /** The spell does nothing on a successful save */
    saveNegates: -1,
    /** Times the save bonus (negative: a penalty to the target, so a bonus here) */
    saveBonusFactor: -0.5,
    charm: 1.5,
  },
  /** + (center - casting time) * factor: fast spells first, and less often interrupted */
  castingTime: { center: 5, factor: 0.5 },
  secondaryRole: 1,
  /** A buff for every ally around (friendly and area) */
  partyBuff: 1,
  /** Per spell a sequencer casts beyond the first */
  extraSpell: 1,
  tier: { great: 3, good: 1.5, decent: 0 },
  /** A great spell counts as good once the caster's best level is this far above its own */
  tierDecayGap: 4,
  probability: { base: 40, perPoint: 5, min: 30, max: 90 },
  /** A great or good protection scoring this much opens the fight, before the alternation */
  openingProtection: 8,
};

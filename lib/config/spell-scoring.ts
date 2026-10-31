import { SpellDurationClass, SpellRole } from "./spells/spell-role";

/**
 * Every weight of the cast order rules (see SpellScoringService and CastOrderService), tuned here
 * only. A score is around `base` for a caster's best spell of its role; each point is worth
 * `probability.perPoint` percent of chance to be cast when its turn comes.
 */
export const SPELL_SCORING = {
  base: 10,
  /** The roles attacking the enemy: level penalty, attack bonuses */
  offensiveRoles: ["kill", "damage", "disable", "summon"] as SpellRole[],
  /** The roles alternating with attacks, and cast under cover */
  defensiveRoles: ["protection", "buff"] as SpellRole[],
  /** Under cover, at an equal score: the longer first, the shortest last */
  coveredDurationOrder: ["mid", "short", undefined] as (SpellDurationClass | undefined)[],
  /** Lost per level below the caster's best for the spell's type */
  levelPenalty: { offensive: 2, other: 1 },
  role: {
    kill: 1.5,
    damage: 0,
    disable: 1,
    summon: 6,
    protection: 0,
    buff: -1,
    reactive: 0,
    shapeshift: 0,
    useless: 0,
  } satisfies Record<SpellRole, number>,
  /**
   * A summon fights on even if its caster is interrupted or killed, so it comes early, but not
   * always (`maxProbability`) and not in a row: a finished cast starts a wait of `waitRounds` rounds
   * before the next one - the first needs time to be a threat and a caster chaining them is
   * predictable. (User.)
   */
  summon: { maxProbability: 75, waitRounds: 2 },
  offensive: {
    area: 2.5,
    /** Instead of `area` when it hits the caster's allies too: they must keep out of it */
    areaHittingAllies: 1.5,
    /** On top of the area bonus: disabling several enemies is worth more than damaging them */
    areaDisable: 1,
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
  /**
   * A sequencer scores as its strongest spell raised by `levelPerExtraSpell` per other spell it
   * casts (two Magic Missiles: a level 3 spell, three Fireballs: a level 7 one), at the speed of
   * its release. (User.)
   */
  sequencer: { castingTime: 1, levelPerExtraSpell: 2 },
  tier: { top: 6, great: 3, good: 1.5, decent: 0 },
  /** A great spell counts as good once the caster's best level is this far above its own */
  tierDecayGap: 4,
  probability: { base: 40, perPoint: 5, min: 30, max: 90, reactive: 100 },
  /**
   * The opening, before the alternation: at most `max` great or good protections scoring at least
   * `minScore`, each cast at most `maxProbability`% - short, and an attack can still come first
   * now and then. (User.)
   */
  opening: { minScore: 8, max: 2, maxProbability: 60 },
  /**
   * An at-will power costing the creature something better gets a cooldown of base + level x
   * perLevel rounds (see AtWillService): its spellbook, or its attacks when it takes longer to cast
   * than its fighting affords (speed 1-2 barely slows a melee creature)
   */
  atWillCooldown: { base: 1, perLevel: 0.5, affordedCastingTime: { melee: 2, ranged: 4 } },
};

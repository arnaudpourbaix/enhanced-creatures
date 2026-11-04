import { SPELL_SCORING } from "../../../config/spell-scoring";
import { COVER_SPELLS } from "../../../config/spells/cover-spells";
import { MIRROR_COUNTERS, mirrorCounterOf } from "../../../config/spells/mirror-counters";
import { SpellRole } from "../../../config/spells/spell-role";
import { SpellProfile } from "../spell-profile.service";
import spellScoringService from "../spell-scoring.service";
import { categoryRoll, isSingleTargetHostile } from "./memorized-checks";

type CastPass = "regular" | "counter" | "lastResort" | "self";

/** A spell's place in the cast order: tried in order, cast if its own roll succeeds. */
export interface PlannedCast {
  file: string;
  role: SpellRole;
  score: number;
  probability: number;
  /**
   * `counter` clears Mirror Image, `lastResort` aims at mirrored targets once nothing else can,
   * `self` is a heal's cast on the caster (see isSelfHeal)
   */
  pass: CastPass;
  /** A heal split in two (see isSelfHeal): its regular cast heals the allies, its `self` one the caster */
  healing?: "allies" | "self";
  /** Its category's shared roll, see categoryRoll */
  rollRange?: number;
  /** See RawCreatureAbility.mirrorTarget */
  mirrorTarget?: "avoid" | "require";
}

/** A buff for every ally around: worth more once there are summons to benefit from it */
const isPartyBuff = (profile: SpellProfile) =>
  profile.role === "buff" &&
  profile.keywords.includes("friendly") &&
  profile.keywords.includes("area");

/**
 * A heal on one target: healing an ally is worth it at once, but healing itself while still under
 * fire saves nothing - a player hits back first and heals after the fight. (User.)
 */
const isSelfHeal = (profile: SpellProfile) =>
  profile.role === "reactive" &&
  profile.keywords.includes("cureWounds") &&
  profile.keywords.includes("friendly") &&
  !profile.keywords.includes("area");

/** Plain byte order: the same on every machine, unlike localeCompare */
const byCodeUnits = (a: string, b: string) => Buffer.compare(Buffer.from(a), Buffer.from(b));

class CastOrderService {
  /**
   * The order a creature tries its spells in: reactive ones first, then the opening protections
   * (great or good ones scoring enough), then the rest alternating - never two defensive spells
   * in a row while attacks remain, so the caster stays useful - and shapeshifts last. The best
   * party buff comes right after the first summon, which it makes more dangerous. Useless spells
   * are never cast. Equal scores go by file, so the order never changes between runs.
   */
  plan(profiles: SpellProfile[]): PlannedCast[] {
    const caster = spellScoringService.casterReference(profiles);
    const scored = profiles
      .filter((profile) => profile.role !== "useless")
      .map((profile) => {
        const score = spellScoringService.score(profile, caster);
        return { profile, score, probability: spellScoringService.probability(profile, score) };
      })
      .sort((a, b) => b.score - a.score || byCodeUnits(a.profile.file, b.profile.file));
    const take = (keep: (profile: SpellProfile) => boolean) => {
      const taken = scored.filter((s) => keep(s.profile));
      for (const s of taken) scored.splice(scored.indexOf(s), 1);
      return taken;
    };
    // auras first: any other reactive cast ends the script pass before them (user)
    const reactive = [
      ...take((p) => p.role === "reactive" && p.keywords.includes("aura")),
      ...take((p) => p.role === "reactive"),
    ];
    const { minScore, max, maxProbability } = SPELL_SCORING.opening;
    const candidates = scored.filter(
      (s) => s.profile.role === "protection" && s.profile.tier !== "decent" && s.score >= minScore,
    );
    const openers = new Set(candidates.slice(0, max).map((s) => s.profile));
    const opening = take((p) => openers.has(p)).map((s) => ({
      ...s,
      probability: Math.min(s.probability, maxProbability),
    }));
    const shapeshifts = take((p) => p.role === "shapeshift");
    // the opening protections are defensive casts already: an attack comes next
    const partyBuff = scored.some((s) => s.profile.role === "summon")
      ? scored.find((s) => isPartyBuff(s.profile))
      : undefined;
    if (partyBuff) scored.splice(scored.indexOf(partyBuff), 1);
    const rest = this.alternate(scored, opening.length > 0, partyBuff);
    const cast = (
      { profile, score, probability }: (typeof scored)[number],
      pass: PlannedCast["pass"],
      shared = true,
    ): PlannedCast => ({
      score,
      probability,
      pass,
      file: profile.file,
      role: profile.role,
      rollRange: shared ? categoryRoll(profile) : undefined,
    });
    const regular = (s: (typeof scored)[number]): PlannedCast => ({
      ...cast(s, "regular"),
      mirrorTarget: isSingleTargetHostile(s.profile) ? "avoid" : undefined,
    });
    const ordered = this.withSelfHeals(rest, reactive);
    const main = [...ordered, ...shapeshifts].map((s) =>
      "self" in s ? { ...cast(s, "self", false), healing: "self" as const } : regular(s),
    );
    const counters = this.counters([...reactive, ...rest], main, cast);
    const lastResort = rest
      .filter((s) => isSingleTargetHostile(s.profile) && !mirrorCounterOf(s.profile.file))
      .map((s): PlannedCast => ({ ...cast(s, "lastResort"), mirrorTarget: "require" }));
    const mainCount = ordered.length;
    return this.capChances([
      // reactive spells fire on their own conditions, the opening is capped already (see opening)
      ...reactive.map((s) => ({
        ...cast(s, "regular", false),
        ...(isSelfHeal(s.profile) ? { healing: "allies" as const } : {}),
      })),
      ...opening.map((s) => cast(s, "regular", false)),
      ...counters,
      ...main.slice(0, mainCount),
      ...lastResort,
      ...main.slice(mainCount),
    ]);
  }

  /**
   * Each heal's cast on the caster (see isSelfHeal), right after the last spell of a higher level:
   * not the last thing it does, but never before a stronger spell. (User.)
   */
  private withSelfHeals<T extends { profile: SpellProfile }>(
    order: T[],
    reactive: T[],
  ): (T | (T & { self: true }))[] {
    const result: (T | (T & { self: true }))[] = [...order];
    for (const heal of reactive.filter((s) => isSelfHeal(s.profile))) {
      const higher = result.findLastIndex(
        (s) => !("self" in s) && s.profile.level > heal.profile.level,
      );
      result.splice(higher + 1, 0, { ...heal, self: true });
    }
    return result;
  }

  /**
   * One counter per memorized image remover (MIRROR_COUNTERS), in that list's order, with the best
   * chance of its category so it comes first in that roll (see categoryRoll).
   */
  private counters<T extends { profile: SpellProfile }>(
    scored: T[],
    main: PlannedCast[],
    cast: (s: T, pass: PlannedCast["pass"]) => PlannedCast,
  ): PlannedCast[] {
    const rank = (s: T) => MIRROR_COUNTERS.findIndex((c) => c === mirrorCounterOf(s.profile.file));
    return scored
      .filter((s) => mirrorCounterOf(s.profile.file))
      .sort((a, b) => rank(a) - rank(b))
      .map((s) => {
        const counter = cast(s, "counter");
        const chances = main
          .filter((c) => c.rollRange !== undefined && c.rollRange === counter.rollRange)
          .map((c) => c.probability);
        return { ...counter, probability: Math.max(counter.probability, ...chances) };
      });
  }

  /** A cast's chance never above an earlier one's of its category: a weaker spell can't come first */
  private capChances(casts: PlannedCast[]): PlannedCast[] {
    const lowest = new Map<number, number>();
    return casts.map((c) => {
      if (c.rollRange === undefined) return c;
      const probability = Math.min(c.probability, lowest.get(c.rollRange) ?? c.probability);
      lowest.set(c.rollRange, probability);
      return { ...c, probability };
    });
  }

  /**
   * The covered phase's order (see COVER_SPELLS): its reactive spells first, then its protections
   * and buffs, the long ones (precast) and the cover spells themselves aside, most valuable first -
   * at an equal score, mid before short, so short buffs land last and are still active when the
   * fight resumes.
   */
  coveredPlan(profiles: SpellProfile[]): PlannedCast[] {
    const caster = spellScoringService.casterReference(profiles);
    const durations = SPELL_SCORING.coveredDurationOrder;
    // reactive spells keep coming first: a wounded caster heals before buffing
    // without the Mirror Image passes: covered, the caster protects itself, it doesn't attack
    // a heal isn't split under cover: not under fire, the caster heals itself at once
    // an aura strikes enemies: it would break the cover
    const reactive = this.plan(
      profiles.filter((p) => p.role === "reactive" && !p.keywords.includes("aura")),
    )
      .filter((c) => c.pass === "regular")
      .map(({ healing: _healing, ...c }) => c);
    const protective = profiles
      .filter(
        (p) =>
          SPELL_SCORING.defensiveRoles.includes(p.role) &&
          p.duration !== "long" &&
          !COVER_SPELLS.includes(p.file.toUpperCase()),
      )
      .map((profile) => {
        const score = spellScoringService.score(profile, caster);
        return { profile, score, probability: spellScoringService.probability(profile, score) };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          durations.indexOf(a.profile.duration) - durations.indexOf(b.profile.duration) ||
          byCodeUnits(a.profile.file, b.profile.file),
      )
      .map(({ profile, score, probability }): PlannedCast => ({
        score,
        probability,
        file: profile.file,
        role: profile.role,
        pass: "regular",
      }));
    return [...reactive, ...protective];
  }

  /**
   * Highest score first, but never two defensive spells in a row while attacks remain (poor ones
   * aside), and
   * `partyBuff` right after the first summon.
   */
  private alternate<T extends { profile: SpellProfile }>(
    sorted: T[],
    afterDefensive: boolean,
    partyBuff?: T,
  ): T[] {
    const defensiveRoles = SPELL_SCORING.defensiveRoles;
    const defensive = sorted.filter((s) => defensiveRoles.includes(s.profile.role));
    const offensive = sorted.filter((s) => !defensiveRoles.includes(s.profile.role));
    const result: T[] = [];
    let lastDefensive = afterDefensive;
    // a poor attack (Command) is kept for last: it doesn't hold the buffs back (user)
    const holdsBuffs = (s: T) => s.profile.tier !== "poor";
    while (defensive.length || offensive.length) {
      const pickDefensive: boolean =
        defensive.length > 0 &&
        (!offensive.some(holdsBuffs) ||
          (!lastDefensive && sorted.indexOf(defensive[0]) < sorted.indexOf(offensive[0])));
      const next = pickDefensive ? defensive.shift() : offensive.shift();
      if (next) result.push(next);
      lastDefensive = pickDefensive;
      if (partyBuff && next?.profile.role === "summon") {
        result.push(partyBuff);
        partyBuff = undefined;
        lastDefensive = true;
      }
    }
    return result;
  }
}

const castOrderService = new CastOrderService();
export default castOrderService;

import { SPELL_SCORING } from "../../../config/spell-scoring";
import { COVER_SPELLS } from "../../../config/spells/cover-spells";
import { SpellRole } from "../../../config/spells/spell-role";
import { SpellProfile } from "../spell-profile.service";
import spellScoringService from "../spell-scoring.service";

/** A spell's place in the cast order: tried in order, cast if its own roll succeeds. */
export interface PlannedCast {
  file: string;
  role: SpellRole;
  score: number;
  probability: number;
}

/** A buff for every ally around: worth more once there are summons to benefit from it */
const isPartyBuff = (profile: SpellProfile) =>
  profile.role === "buff" &&
  profile.keywords.includes("friendly") &&
  profile.keywords.includes("area");

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
    const reactive = take((p) => p.role === "reactive");
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
    const ordered = [...reactive, ...opening, ...rest, ...shapeshifts];
    return ordered.map(({ profile, score, probability }) => ({
      file: profile.file,
      role: profile.role,
      score,
      probability,
    }));
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
    const reactive = this.plan(profiles.filter((p) => p.role === "reactive"));
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
      .map(({ profile, score, probability }) => ({
        file: profile.file,
        role: profile.role,
        score,
        probability,
      }));
    return [...reactive, ...protective];
  }

  /**
   * Highest score first, but never two defensive spells in a row while attacks remain, and
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
    while (defensive.length || offensive.length) {
      const pickDefensive: boolean =
        defensive.length > 0 &&
        (!offensive.length ||
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

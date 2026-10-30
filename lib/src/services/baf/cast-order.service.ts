import { SPELL_SCORING } from "../../../config/spell-scoring";
import { COVER_SPELLS } from "../../../config/spells/cover-spells";
import { SpellRole } from "../../../config/spells/spell-role";
import { SpellProfile } from "../spell-profile.service";
import spellScoringService from "../spell-scoring.service";

/** A spell's place in the cast order: tried in order, cast if its own roll succeeds. */
export interface PlannedCast {
  file: string;
  score: number;
  probability: number;
}

const DEFENSIVE: SpellRole[] = ["protection", "buff"];
/** Under cover, at an equal score: the longer first, the shortest last */
const DURATIONS = ["mid", "short", undefined];

/** Plain byte order: the same on every machine, unlike localeCompare */
const byCodeUnits = (a: string, b: string) => Buffer.compare(Buffer.from(a), Buffer.from(b));

class CastOrderService {
  /**
   * The order a creature tries its spells in: reactive ones first, then the opening protections
   * (great or good ones scoring enough), then the rest alternating - never two defensive spells
   * in a row while attacks remain, so the caster stays useful - and shapeshifts last. Useless
   * spells are never cast. Equal scores go by file, so the order never changes between runs.
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
    const opening = take(
      (p) =>
        p.role === "protection" &&
        p.tier !== "decent" &&
        spellScoringService.score(p, caster) >= SPELL_SCORING.openingProtection,
    );
    const shapeshifts = take((p) => p.role === "shapeshift");
    // the opening protections are defensive casts already: an attack comes next
    const rest = this.alternate(scored, opening.length > 0);
    const ordered = [...reactive, ...opening, ...rest, ...shapeshifts];
    return ordered.map(({ profile, score, probability }) => ({
      file: profile.file,
      score,
      probability,
    }));
  }

  /**
   * The covered phase's order (see COVER_SPELLS): its protections and buffs, the long ones aside
   * (precast) and the cover spells themselves, most valuable first - at an equal score, mid before
   * short, so short buffs land last and are still active when the fight resumes.
   */
  coveredPlan(profiles: SpellProfile[]): PlannedCast[] {
    const caster = spellScoringService.casterReference(profiles);
    return profiles
      .filter(
        (p) =>
          DEFENSIVE.includes(p.role) &&
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
          DURATIONS.indexOf(a.profile.duration) - DURATIONS.indexOf(b.profile.duration) ||
          byCodeUnits(a.profile.file, b.profile.file),
      )
      .map(({ profile, score, probability }) => ({ file: profile.file, score, probability }));
  }

  /** Highest score first, but never two defensive spells in a row while attacks remain. */
  private alternate<T extends { profile: SpellProfile }>(
    sorted: T[],
    afterDefensive: boolean,
  ): T[] {
    const defensive = sorted.filter((s) => DEFENSIVE.includes(s.profile.role));
    const offensive = sorted.filter((s) => !DEFENSIVE.includes(s.profile.role));
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
    }
    return result;
  }
}

const castOrderService = new CastOrderService();
export default castOrderService;

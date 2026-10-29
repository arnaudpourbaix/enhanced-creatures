import { SPELL_SCORING } from "../../config/spell-scoring";
import { SpellRole, SpellTier } from "../../config/spells/spell-role";
import { SpellTypeEnum } from "../model/spell-item/effect.enums";
import { SpellProfile } from "./spell-profile.service";

/** The highest spell level a caster memorizes, per class and overall. */
export interface CasterReference {
  wizard?: number;
  priest?: number;
  overall: number;
}

const OFFENSIVE: SpellRole[] = ["kill", "damage", "disable", "summon"];

class SpellScoringService {
  casterReference(profiles: SpellProfile[]): CasterReference {
    const highest = (type?: SpellTypeEnum) => {
      const levels = profiles.filter((p) => type === undefined || p.type === type);
      return levels.length ? Math.max(...levels.map((p) => p.level)) : undefined;
    };
    const reference: CasterReference = { overall: highest() ?? 1 };
    const wizard = highest(SpellTypeEnum.Wizard);
    const priest = highest(SpellTypeEnum.Priest);
    if (wizard !== undefined) reference.wizard = wizard;
    if (priest !== undefined) reference.priest = priest;
    return reference;
  }

  /**
   * How good a choice the spell is for this caster (see SPELL_SCORING): its level against the
   * caster's best of its class (overall for innates), its role, what makes an attack reliable,
   * its casting time, what else it does and its tier.
   */
  score(profile: SpellProfile, caster: CasterReference): number {
    const s = SPELL_SCORING;
    const best = this.best(profile, caster);
    const offensive = OFFENSIVE.includes(profile.role);
    const penalty = offensive ? s.levelPenalty.offensive : s.levelPenalty.other;
    let score = s.base - penalty * Math.max(0, best - profile.level) + s.role[profile.role];
    if (profile.role === "summon" && profile.level >= s.bigSummon.level) score += s.bigSummon.bonus;
    if (offensive && profile.role !== "summon") score += this.attack(profile);
    score += (s.castingTime.center - profile.castingTime) * s.castingTime.factor;
    score += profile.secondaryRoles.length * s.secondaryRole;
    if (profile.keywords.includes("friendly") && profile.keywords.includes("area")) {
      score += s.partyBuff;
    }
    score += (profile.spellCount - 1) * s.extraSpell;
    return score + s.tier[this.tier(profile, best)];
  }

  /** The chance to cast the spell when its turn comes, in percent. */
  probability(profile: SpellProfile, score: number): number {
    if (profile.role === "reactive") return 100;
    const p = SPELL_SCORING.probability;
    return Math.round(Math.min(p.max, Math.max(p.min, p.base + score * p.perPoint)));
  }

  private best(profile: SpellProfile, caster: CasterReference): number {
    if (profile.type === SpellTypeEnum.Wizard) return caster.wizard ?? caster.overall;
    if (profile.type === SpellTypeEnum.Priest) return caster.priest ?? caster.overall;
    return caster.overall;
  }

  /** An area spell hits more, a save the target can't make cheaply spares it less, a charm turns it. */
  private attack(profile: SpellProfile): number {
    const o = SPELL_SCORING.offensive;
    let score = profile.keywords.includes("area") ? o.area : 0;
    if (profile.saves?.length) {
      const bonus = Math.min(...profile.saves.map((save) => save.bonus ?? 0));
      score += o.saveNegates + bonus * o.saveBonusFactor;
    }
    return profile.keywords.includes("charm") ? score + o.charm : score;
  }

  /** A great spell the caster has clearly outgrown counts as good (Mirror Image). */
  private tier(profile: SpellProfile, best: number): SpellTier {
    const outgrown = best - profile.level >= SPELL_SCORING.tierDecayGap;
    return profile.tier === "great" && outgrown ? "good" : profile.tier;
  }
}

const spellScoringService = new SpellScoringService();
export default spellScoringService;

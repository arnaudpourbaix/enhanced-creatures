import { SPELL_SCORING } from "../../config/spell-scoring";
import { SpellTier } from "../../config/spells/spell-role";
import { SpellTypeEnum } from "../model/spell-item/effect.enums";
import { SpellProfile } from "./spell-profile.service";

/** The highest spell level a caster memorizes, per class and overall. */
export interface CasterReference {
  wizard?: number;
  priest?: number;
  overall: number;
}

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
   * its casting time, what else it does and its tier. A summon rated by hand counts as that level,
   * above the caster's best too (Call Woodland Beeings beats what a druid can otherwise cast).
   */
  score(spell: SpellProfile, caster: CasterReference): number {
    const s = SPELL_SCORING;
    const profile = this.asCast(spell);
    const best = this.best(profile, caster);
    const offensive = s.offensiveRoles.includes(profile.role);
    const penalty = offensive ? s.levelPenalty.offensive : s.levelPenalty.other;
    const levels =
      profile.worthLevel !== undefined
        ? best - profile.worthLevel
        : Math.max(0, best - profile.level);
    let score = s.base - penalty * levels + s.role[profile.role];
    if (offensive && profile.role !== "summon") score += this.attack(profile);
    score += (s.castingTime.center - profile.castingTime) * s.castingTime.factor;
    score += profile.secondaryRoles.length * s.secondaryRole;
    if (profile.keywords.includes("friendly") && profile.keywords.includes("area")) {
      score += s.partyBuff;
    }
    return score + s.tier[this.tier(profile, best)];
  }

  /** A sequencer as the spell it's worth, from its spells (see SPELL_SCORING.sequencer). */
  private asCast(profile: SpellProfile): SpellProfile {
    if (!profile.combo) return profile;
    const { castingTime, levelPerExtraSpell } = SPELL_SCORING.sequencer;
    const level = profile.level + (profile.spellCount - 1) * levelPerExtraSpell;
    return { ...profile, castingTime, level, worthLevel: undefined };
  }

  /** The chance to cast the spell when its turn comes, in percent. */
  probability(profile: SpellProfile, score: number): number {
    const p = SPELL_SCORING.probability;
    if (profile.role === "reactive") return p.reactive;
    const max = profile.role === "summon" ? SPELL_SCORING.summon.maxProbability : p.max;
    return Math.round(Math.min(max, Math.max(p.min, p.base + score * p.perPoint)));
  }

  private best(profile: SpellProfile, caster: CasterReference): number {
    if (profile.type === SpellTypeEnum.Wizard) return caster.wizard ?? caster.overall;
    if (profile.type === SpellTypeEnum.Priest) return caster.priest ?? caster.overall;
    return caster.overall;
  }

  /** An area spell hits more, a save the target can't make cheaply spares it less, a charm turns it. */
  private attack(profile: SpellProfile): number {
    const o = SPELL_SCORING.offensive;
    const area = profile.hitsAllies ? o.areaHittingAllies : o.area;
    let score = 0;
    if (profile.keywords.includes("area")) {
      score += area + (profile.role === "disable" ? o.areaDisable : 0);
    }
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

import { SpellStateValue } from "../../config/common";
import { GLOBAL_CONFIG } from "../../config/generate";
import { SpellKeyword } from "../../config/spells/keyword";
import {
  SPELL_CHECK_GATE_KEYWORDS,
  SPELL_CHECK_TRIGGERS,
  SpellLevelCheck,
  suppressedSpellLevelChecks,
} from "../../config/spells/spell-check";
import { keywordCheckCategory } from "../../config/spells/spell-check-config";
import { defaultAllySafe } from "../../config/target/ally-safe";
import { Counts } from "../../config/target/target-config";
import { TargetListName } from "../../config/target/target-name";
import { ScriptTarget } from "../model/constants";
import { AlignIdentifier } from "../model/ids/align";
import { AllegianceIdentifier } from "../model/ids/allegiance";
import { AStylesIdentifiers } from "../model/ids/astyles";
import { AlliesCheck } from "../model/creature/ability";
import { AreaTypeValue } from "../model/ids/misc";
import { SplStateIdentifier } from "../model/ids/splstate";
import { StateIdentifier } from "../model/ids/state";
import { StatsIdentifier } from "../model/ids/stats";
import { ParamObject } from "../model/parameter";
import { Aera } from "../model/script/aera";
import { Triggers } from "../model/script/triggers";
import { SaveTypeEnum } from "../model/spell-item/effect.enums";
import { SpellReference, SpellSaves } from "../model/spell-item/spell-reference";
import targetService from "../services/baf/target.service";
import utils from "../services/utils/utils.service";

/** The stat holding each saving throw (the other SaveTypeEnum values are flags, not saves). */
export const SAVE_STATS: Partial<Record<SaveTypeEnum, StatsIdentifier>> = {
  [SaveTypeEnum.Spell]: "SAVEVSSPELL",
  [SaveTypeEnum.Breath]: "SAVEVSBREATH",
  [SaveTypeEnum.ParalyzePoisonDeath]: "SAVEVSDEATH",
  [SaveTypeEnum.RodStaffWand]: "SAVEVSWANDS",
  [SaveTypeEnum.PetrifyPolymorph]: "SAVEVSPOLY",
};

/** Target objects picked among the party, whatever the caster's side */
const PARTY_OBJECTS = ["WorstAC"];

class TriggerFactory {
  or(triggers: Triggers.Trigger[]): Triggers.Trigger {
    return { name: "Or", triggers };
  }

  haveSpell(resources: SpellReference[], negation = false): Triggers.Trigger[] {
    return resources.map((r) =>
      r.id !== undefined
        ? {
            name: "HaveSpell",
            params: [r.id],
            negation,
          }
        : {
            name: "HaveSpellRES",
            params: [r.file],
            negation,
          },
    );
  }

  haveSpellRES(resources: string[], negation = false): Triggers.Trigger[] {
    return resources.map((r) => ({
      name: "HaveSpellRES",
      params: [r],
      negation,
    }));
  }

  hplt(value: number, negation = false): Triggers.Trigger {
    return { name: "HPLT", params: [ScriptTarget.token, value], negation };
  }

  hpgt(value: number, negation = false): Triggers.Trigger {
    return { name: "HPGT", params: [ScriptTarget.token, value], negation };
  }

  hpPercentLt(value: number, negation = false): Triggers.Trigger {
    return { name: "HPPercentLT", params: [ScriptTarget.token, value], negation };
  }

  levelLt(value: number, negation = false): Triggers.Trigger {
    return { name: "LevelLT", params: [ScriptTarget.token, value], negation };
  }

  levelGt(value: number, negation = false): Triggers.Trigger {
    return { name: "LevelGT", params: [ScriptTarget.token, value], negation };
  }

  range(value: number, negation = false): Triggers.Trigger {
    return { name: "Range", params: [ScriptTarget.token, value], negation };
  }

  name(value: string, negation = false): Triggers.Trigger {
    return { name: "Name", params: [value, ScriptTarget.token], negation };
  }

  attackedBy(obj: ParamObject, type: AStylesIdentifiers, negation = false): Triggers.Trigger {
    return { name: "AttackedBy", params: [obj, type], negation };
  }

  alignment(value: AlignIdentifier, negation = false): Triggers.Trigger {
    return { name: "Alignment", params: [ScriptTarget.token, value], negation };
  }

  detect(value: ParamObject, negation = false): Triggers.Trigger {
    return {
      name: "Detect",
      params: [value],
      negation,
    };
  }

  see(value: ParamObject, negation = false): Triggers.Trigger {
    return {
      name: "See",
      params: [value],
      negation,
    };
  }

  allegiance(value: AllegianceIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "Allegiance",
      params: [ScriptTarget.token, value],
      negation,
    };
  }

  checkSpellState(spell: SplStateIdentifier | SpellStateValue, negation = false): Triggers.Trigger {
    return {
      name: "CheckSpellState",
      params: [ScriptTarget.token, spell],
      negation,
    };
  }

  areaType(type: AreaTypeValue, negation = false): Triggers.Trigger {
    return { name: "AreaType", params: [type], negation };
  }

  hasItem(resources: string[], negation = false): Triggers.Trigger[] {
    return resources.map((r) => ({
      name: "HasItem",
      params: [r, ScriptTarget.myself],
      negation,
    }));
  }

  global(name: string, value: number, area: Aera = "LOCALS", negation = false): Triggers.Trigger {
    return {
      name: "Global",
      params: [name, area, value],
      negation,
    };
  }

  globalLT(name: string, value: number, area: Aera = "LOCALS", negation = false): Triggers.Trigger {
    return {
      name: "GlobalLT",
      params: [name, area, value],
      negation,
    };
  }

  globalGT(name: string, value: number, area: Aera = "LOCALS", negation = false): Triggers.Trigger {
    return {
      name: "GlobalGT",
      params: [name, area, value],
      negation,
    };
  }

  globalTimerReallyExpired(name: string): Triggers.Trigger {
    return {
      name: "GlobalTimerExpired",
      params: [name, "LOCALS"],
    };
  }

  globalTimerExpired(name: string): Triggers.Trigger {
    return {
      name: "GlobalTimerNotExpired",
      params: [name, "LOCALS"],
      negation: true,
    };
  }

  /** The creature is covered: invisible, or under Sanctuary (its own or an ally's) */
  covered(): Triggers.Trigger {
    return {
      name: "Or",
      triggers: [
        { name: "StateCheck", params: [ScriptTarget.myself, "STATE_INVISIBLE"] },
        { name: "CheckStatGT", params: [ScriptTarget.myself, 0, "SANCTUARY"] },
      ],
    };
  }

  globalRoundTimerExpired(): Triggers.Trigger {
    return {
      name: "GlobalTimerNotExpired",
      params: [GLOBAL_CONFIG.bafConstants.roundTimer, "LOCALS"],
      negation: true,
    };
  }

  hasBounceEffects(negation = false): Triggers.Trigger {
    return {
      name: "HasBounceEffects",
      params: [ScriptTarget.token],
      negation,
    };
  }

  hasImmunityEffects(negation = false): Triggers.Trigger {
    return {
      name: "HasImmunityEffects",
      params: [ScriptTarget.token],
      negation,
    };
  }

  checkStatGT(value: number, stat: StatsIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "CheckStatGT",
      params: [ScriptTarget.token, value, stat],
      negation,
    };
  }

  checkStatLT(value: number, stat: StatsIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "CheckStatLT",
      params: [ScriptTarget.token, value, stat],
      negation,
    };
  }

  checkStat(value: number, stat: StatsIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "CheckStat",
      params: [ScriptTarget.token, value, stat],
      negation,
    };
  }

  /**
   * True when the target is immune to spells of `level` (Minor Globe, Globe of Invulnerability,
   * Spell Immunity, ...) - the engine's own generic spell-level-immunity check (see
   * BaseCreatureAbility.level). It doesn't see level-decrementing reflections/absorptions, which
   * spellReflections covers.
   */
  immuneToSpellLevel(level: number, negation = false): Triggers.Trigger {
    return { name: "ImmuneToSpellLevel", params: [ScriptTarget.token, level], negation };
  }

  /**
   * Excludes targets protected by Spell Turning, Spell Trap, Spell Deflection or Shield of the
   * Archons - missed by ImmuneToSpellLevel (tested in game). These only stop single-target spells,
   * not area ones.
   */
  spellReflections(): Triggers.Trigger[] {
    const stats: StatsIdentifier[] = [
      "WIZARD_SPELL_TURNING",
      "WIZARD_SPELL_TRAP",
      "WIZARD_SPELL_DEFLECTION",
      "CLERIC_SHIELD_OF_THE_ARCHONS",
    ];
    return stats.map((stat) => this.checkStatGT(0, stat, true));
  }

  /**
   * The level-driven checks (see SpellLevelCheck) excluding protected targets, minus those
   * suppressed by `keywords` (see suppressedSpellLevelChecks).
   */
  spellLevelChecks(level: number, keywords: SpellKeyword[] = []): Triggers.Trigger[] {
    const suppressed = suppressedSpellLevelChecks(keywords);
    const checks: Record<SpellLevelCheck, () => Triggers.Trigger[]> = {
      immuneToSpellLevel: () => [this.immuneToSpellLevel(level, true)],
      spellReflections: () => this.spellReflections(),
    };
    return (Object.keys(checks) as SpellLevelCheck[])
      .filter((check) => !suppressed.has(check))
      .flatMap((check) => checks[check]());
  }

  stateCheck(state: StateIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "StateCheck",
      params: [ScriptTarget.token, state],
      negation,
    };
  }

  validTrackTarget({
    isTargetPlayer,
    seeInvisible,
  }: {
    isTargetPlayer: boolean;
    seeInvisible: boolean;
  }): Triggers.Trigger[] {
    const results: Triggers.Trigger[] = [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "SANCTUARY"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_CHARMED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_REALLY_DEAD"],
        negation: true,
      },
    ];
    if (!seeInvisible) {
      results.unshift({
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_INVISIBLE"],
        negation: true,
      });
      results.unshift({
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_IMPROVEDINVISIBILITY"],
        negation: true,
      });
    }
    if (!isTargetPlayer)
      results.unshift({
        name: "General",
        params: [ScriptTarget.token, "WEAPON"],
        negation: true,
      });
    return results;
  }

  validSpellTarget({
    isTargetPlayer,
    seeInvisible,
  }: {
    isTargetPlayer: boolean;
    seeInvisible: boolean;
  }): Triggers.Trigger[] {
    const results: Triggers.Trigger[] = [
      { name: "See", params: [ScriptTarget.token] },
      {
        name: "CheckStatGT",
        params: [ScriptTarget.lastSeen, 0, "SANCTUARY"],
        negation: true,
      },
      // {
      //   name: "StateCheck",
      //   params: [ScriptTarget.token, "STATE_CHARMED"],
      //   negation: true,
      // },
      {
        name: "StateCheck",
        params: [ScriptTarget.lastSeen, "STATE_REALLY_DEAD"],
        negation: true,
      },
    ];
    if (!seeInvisible) {
      results.push({
        name: "StateCheck",
        params: [ScriptTarget.lastSeen, "STATE_IMPROVEDINVISIBILITY"],
        negation: true,
      });
    }
    if (!isTargetPlayer)
      results.push({
        name: "General",
        params: [ScriptTarget.lastSeen, "WEAPON"],
        negation: true,
      });
    return results;
  }

  validAttackTarget({
    isTargetPlayer,
    maxRange,
  }: {
    isTargetPlayer: boolean;
    maxRange?: number;
  }): Triggers.Trigger[] {
    const results: Triggers.Trigger[] = [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "SANCTUARY"],
        negation: true,
      },
      // {
      //   name: "StateCheck",
      //   params: [ScriptTarget.token, "STATE_CHARMED"],
      //   negation: true,
      // },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_REALLY_DEAD"],
        negation: true,
      },
      { name: "See", params: [ScriptTarget.token] },
    ];
    if (GLOBAL_CONFIG.weaponCheck) {
      results.push(
        { name: "WeaponEffectiveVs", params: [ScriptTarget.token, "MAINHAND"] },
        { name: "WeaponCanDamage", params: [ScriptTarget.token, "MAINHAND"] },
      );
    }
    if (!isTargetPlayer)
      results.unshift({
        name: "General",
        params: [ScriptTarget.token, "WEAPON"],
        negation: true,
      });
    if (maxRange) {
      results.push({
        name: "Range",
        params: [ScriptTarget.token, maxRange],
      });
    }
    return results;
  }

  /**
   * LastSeenBy is an enemy of the caster now: an evil caster won't target an evil LastSeenBy, a
   * good one a good one, charm swapping these. LastSeenBy keeps its last value when no See()
   * succeeds, so without this an attack aimed at it can land on an ally - typically a party
   * member the caster just charmed, once no real enemy is left in sight.
   */
  lastSeenIsOpponent(): Triggers.Trigger[] {
    // Charm swaps sides (the engine's Enemy/Ally objects follow it) but never Allegiance: an enemy
    // now is on the other side and not charmed, or on the caster's own side and charmed by the party
    const target = ScriptTarget.lastSeen;
    return [false, true].flatMap((charmed) =>
      (["EVILCUTOFF", "GOODCUTOFF"] as const).map((cutoff): Triggers.Trigger => ({
        name: "Or",
        triggers: [
          { name: "Allegiance", params: [ScriptTarget.myself, cutoff], negation: true },
          { name: "Allegiance", params: [target, cutoff], negation: !charmed },
          { name: "StateCheck", params: [target, "STATE_CHARMED"], negation: charmed },
        ],
      })),
    );
  }

  /**
   * A party target object (WorstAC: the party member with the worst AC) is an enemy only to a
   * hostile caster, and only while not charmed (then on the caster's side). Nothing for the other
   * objects, which are enemies by definition.
   */
  sideCheck(target: string): Triggers.Trigger[] {
    if (!PARTY_OBJECTS.includes(target)) return [];
    // Allegiance never changes through effects: a charmed target is told by its state (a charmed
    // caster runs no script)
    return [
      { name: "Allegiance", params: [ScriptTarget.myself, "EVILCUTOFF"] },
      { name: "StateCheck", params: [target, "STATE_CHARMED"], negation: true },
    ];
  }

  // this: void - doesn't use `this`, and is passed around unbound (e.g. baf.factory.ts's
  // `.map(triggerFactory.inverseNegation)`).
  inverseNegation(this: void, trigger: Triggers.Trigger): Triggers.Trigger {
    return { ...trigger, negation: !trigger.negation };
  }

  inverseNegations(triggers: Triggers.Trigger[]): Triggers.Trigger[] {
    return triggers.reduce<Triggers.Trigger[]>((acc, trigger) => {
      if ("triggers" in trigger) {
        acc.push(...this.inverseNegations(trigger.triggers));
      } else {
        acc.push(this.inverseNegation(trigger));
      }
      return acc;
    }, []);
  }

  seeOneInTargetList(targetListName: TargetListName): Triggers.Trigger[] {
    const list = targetService.getList(targetListName);
    const triggers = list.targets.map<Triggers.Trigger>((t) => ({
      name: "See",
      params: [t],
    }));
    return [{ name: "Or", triggers }];
  }

  hasPoisonWeapon(negation = false): Triggers.Trigger {
    return triggerFactory.checkStat(4, "SCRIPTINGSTATE4", negation);
  }

  /**
   * Triggers testing whether the target is protected against the given causes (e.g.
   * SPELLS.Wizard.Horror.keywords), skipping any keyword whose SpellCheckConfig category (see
   * SPELL_CHECK_CONFIG_KEYWORDS) is disabled via GLOBAL_CONFIG.spellChecks. A keyword with no
   * assigned category is never filtered out - it's unaffected by every toggle.
   *
   * Gate keywords (SPELL_CHECK_GATE_KEYWORDS) must all pass. Effect keywords only need one to
   * pass: "not protected from A, or not protected from B", each side being the AND of its
   * keyword's triggers. BAF has no AND inside OR, so that's distributed into OR clauses (one
   * trigger per effect keyword each), dropping any clause implied by a smaller one.
   */
  spellChecks(keywords: SpellKeyword[] = []): Triggers.Trigger[] {
    const enabled = keywords.filter((keyword) => {
      const category = keywordCheckCategory(keyword);
      return category === undefined || GLOBAL_CONFIG.spellChecks[category];
    });
    const gates = enabled
      .filter((keyword) => SPELL_CHECK_GATE_KEYWORDS.has(keyword))
      .flatMap((keyword) => SPELL_CHECK_TRIGGERS[keyword]);
    return [...gates, ...this.effectChecks(enabled)];
  }

  private effectChecks(keywords: SpellKeyword[]): Triggers.Trigger[] {
    const effects = keywords
      .filter((keyword) => !SPELL_CHECK_GATE_KEYWORDS.has(keyword))
      .map((keyword) => SPELL_CHECK_TRIGGERS[keyword])
      // group tags (cloud, castOnSelf, ...) and effects with no known protection check nothing
      .filter((triggers) => triggers.length);
    return this.anyOf(effects);
  }

  /**
   * Triggers skipping a target unlikely to fail the spell's saving throws: a target only escapes
   * the spell by saving against all its effects, and it escapes an effect when any of its save
   * types is too good. A save is good enough to keep the target when it's above the save's bonus
   * plus 1 per 5% of GLOBAL_CONFIG.saveCheckMinFailChance (a d20): at 0%, the target only needs to
   * be able to fail, like SCS (save above 0 without a bonus). Empty when
   * GLOBAL_CONFIG.spellChecks.stats is off.
   */
  saveChecks(saves: SpellSaves = []): Triggers.Trigger[] {
    if (!GLOBAL_CONFIG.spellChecks.stats) return [];
    const margin = Math.round(GLOBAL_CONFIG.saveCheckMinFailChance / 5);
    return this.anyOf(
      saves
        .map(({ types, bonus }) => ({
          threshold: (bonus ?? 0) + margin,
          stats: [...new Set(types.map((type) => SAVE_STATS[type]))].filter((s) => s !== undefined),
        }))
        .filter(({ stats }) => stats.length)
        .map(({ threshold, stats }) => stats.map((stat) => this.checkStatGT(threshold, stat))),
    );
  }

  /**
   * "One of these groups passes", each group being the AND of its triggers. BAF has no AND inside
   * OR, so that's distributed into OR clauses (one trigger per group each), dropping any clause
   * implied by a smaller one.
   */
  private anyOf(groups: Triggers.Trigger[][]): Triggers.Trigger[] {
    if (groups.length <= 1) return groups.flat();
    let clauses: Triggers.Trigger[][] = [[]];
    for (const triggers of groups) {
      clauses = clauses.flatMap((clause) => triggers.map((t) => [...clause, t]));
    }
    const keyed = clauses.map((clause) => {
      const byKey = new Map(clause.map((t) => [JSON.stringify(t), t]));
      return { keys: new Set(byKey.keys()), triggers: [...byKey.values()] };
    });
    const minimal = keyed.filter(
      (clause, i) =>
        !keyed.some(
          (other, j) =>
            j !== i &&
            [...other.keys].every((k) => clause.keys.has(k)) &&
            (other.keys.size < clause.keys.size || j < i),
        ),
    );
    return minimal.map(({ triggers }) => (triggers.length === 1 ? triggers[0] : this.or(triggers)));
  }

  triggerOverride(object: string, trigger: Triggers.Trigger, negation = false): Triggers.Trigger {
    return { name: "TriggerOverride", object, trigger, negation };
  }

  /**
   * Triggers checking that an area ability aimed at `target` spares the caster's allies (see
   * BaseCreatureAbility.alliesCheck). BAF can't loop over allies, but the target's nearest enemies
   * are the caster's side sorted by distance to the impact point: each of the first `count` ones
   * must be out of `range` or match one of `safeIf`, and the next one must be out of `range`
   * (too many allies around: don't gamble). A missing ally fails Range(), so it passes. The caster
   * is part of that list too, which is right since it's hit as well when within range. Dropped for
   * a Myself target (exceptMyself), where the target's enemies aren't the caster's allies.
   *
   * Every check runs through TriggerOverride(target, ...): Range() is always measured from the
   * active creature, so only the target itself can tell how far its enemies are.
   *
   * With `aroundCaster`, the caster measures its own nearest allies instead, and isn't one of them.
   */
  alliesSafe(
    check: AlliesCheck,
    keywords?: SpellKeyword[],
    level?: number | null,
    target = `${ScriptTarget.lastSeen}(${ScriptTarget.myself})`,
  ): Triggers.Trigger[] {
    const count = check.count ?? 3;
    if (count < 0 || count >= Counts.length) throw new Error(`Invalid alliesCheck count ${count}`);
    const safeIf = check.safeIf ?? defaultAllySafe(keywords, level);
    const ally = (index: number) =>
      `${Counts[index]}${check.aroundCaster ? "NearestAllyOf" : "NearestEnemyOf"}(${ScriptTarget.myself})`;
    const outOfRange = (index: number): Triggers.Trigger => {
      const range: Triggers.Trigger = { name: "Range", params: [ally(index), check.range] };
      return check.aroundCaster
        ? { ...range, negation: true }
        : this.triggerOverride(target, range, true);
    };
    const allies = Counts.slice(0, count).map((_, index) => ({
      ...this.or([
        outOfRange(index),
        ...utils
          .replaceTriggerTokens(safeIf, [{ key: ScriptTarget.token, value: ally(index) }])
          .map((t) => (check.aroundCaster ? t : this.triggerOverride(target, t))),
      ]),
      exceptMyself: true,
    }));
    return [...allies, { ...outOfRange(count), exceptMyself: true }];
  }

  /**
   * Trigger checking that another enemy stands within `range` of the target, so an area spell hits
   * several of them. Inside the TriggerOverride, Myself is the target: its nearest ally is one of
   * the caster's enemies. Skipped for a Myself target (exceptMyself).
   */
  enemyNearTarget(
    range: number,
    target = `${ScriptTarget.lastSeen}(${ScriptTarget.myself})`,
  ): Triggers.Trigger {
    return {
      ...this.triggerOverride(target, {
        name: "Range",
        params: [`NearestAllyOf(${ScriptTarget.myself})`, range],
      }),
      exceptMyself: true,
    };
  }

  /**
   * Triggers checking that `enemy` (one of the active creature's enemies) stands within melee
   * `range` and that its main hand weapon can hit and damage the active creature, which may be
   * immune to it (+1 weapons...). WeaponEffectiveVs and WeaponCanDamage test the weapon of the
   * creature running them, so they run through TriggerOverride(enemy, ...), where Myself is the
   * enemy: the active creature, right next to it, is taken to be its nearest enemy.
   */
  enemyCanHurtInMelee(enemy: string, range = 4): Triggers.Trigger[] {
    const self = `NearestEnemyOf(${ScriptTarget.myself})`;
    return [
      { name: "Range", params: [enemy, range] },
      this.triggerOverride(enemy, { name: "WeaponEffectiveVs", params: [self, "MAINHAND"] }),
      this.triggerOverride(enemy, { name: "WeaponCanDamage", params: [self, "MAINHAND"] }),
    ];
  }

  /**
   * Trigger checking that the caster itself matches the alliesCheck's safeIf (any of them), or
   * undefined when there's no condition to match.
   */
  casterSafe(
    check: AlliesCheck,
    keywords?: SpellKeyword[],
    level?: number | null,
  ): Triggers.Trigger | undefined {
    const safeIf = utils.replaceTriggerTokens(check.safeIf ?? defaultAllySafe(keywords, level), [
      { key: ScriptTarget.token, value: ScriptTarget.myself },
    ]);
    if (safeIf.length <= 1) return safeIf[0];
    return this.or(safeIf);
  }
}

const triggerFactory = new TriggerFactory();
export default triggerFactory;

import { GLOBAL_CONFIG } from "../../config/generate";
import { SPELL_CHECK_TRIGGERS } from "../../config/spells/spell-check";
import { keywordCheckCategory } from "../../config/spells/spell-check-config";
import { SpellKeyword } from "../../config/spells/keyword";
import { SpellReference } from "../model/spell-item/spell-reference";
import { TargetListName } from "../../config/target/target-name";
import { ScriptTarget } from "../model/constants";
import { AlignIdentifier } from "../model/ids/align";
import { AllegianceIdentifier } from "../model/ids/allegiance";
import { AStylesIdentifiers } from "../model/ids/astyles";
import { AreaTypeValue } from "../model/ids/misc";
import { StateIdentifier } from "../model/ids/state";
import { StatsIdentifier } from "../model/ids/stats";
import { ParamObject } from "../model/parameter";
import { Aera } from "../model/script/aera";
import { Triggers } from "../model/script/triggers";
import targetService from "../services/baf/target.service";

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

  checkSpellState(spell: string, negation = false): Triggers.Trigger {
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
   * True when the target is immune to spells of `level` for any reason currently active on it
   * (Minor Globe, Globe of Invulnerability, Spell Deflection, Spell Turning, Spell Immunity,
   * Shield of the Archons, ...) - the engine's own generic spell-level-immunity check, so this
   * needs no protection-specific stat or SpellKeyword (see BaseCreatureAbility.level).
   */
  immuneToSpellLevel(level: number, negation = false): Triggers.Trigger {
    return { name: "ImmuneToSpellLevel", params: [ScriptTarget.token, level], negation };
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
   */
  spellChecks(keywords: SpellKeyword[] = []): Triggers.Trigger[] {
    return keywords
      .filter((keyword) => {
        const category = keywordCheckCategory(keyword);
        return category === undefined || GLOBAL_CONFIG.spellChecks[category];
      })
      .flatMap((keyword) => SPELL_CHECK_TRIGGERS[keyword]);
  }
}

const triggerFactory = new TriggerFactory();
export default triggerFactory;

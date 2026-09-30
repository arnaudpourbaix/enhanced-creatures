import { ScriptTarget } from "../model/constants";
import { Response, Statements } from "../model/script/script";
import { Triggers } from "../model/script/triggers";
import utils from "../services/utils/utils.service";
import responseFactory from "./response.factory";
import triggerFactory from "./trigger.factory";

class BafFactory {
  addStatementsFromTargetList = (p: {
    statements: Statements;
    triggers: Triggers.Trigger[];
    targets: string[];
    responses: Response[];
    reverse?: boolean;
    comment?: string;
  }): void => {
    p.reverse = p.reverse ?? false;
    const targets = p.reverse ? [...p.targets].reverse() : [...p.targets];
    for (const [index, target] of targets.entries()) {
      const isMyself = target === ScriptTarget.myself;
      const triggers = isMyself
        ? this.selfTriggers(p.triggers)
        : utils.replaceTriggerTokens(p.triggers, [{ key: ScriptTarget.token, value: target }]);
      // Actions built for a target list (e.g. AbilityService's Spell(LastSeenBy, ...)) aim at
      // LastSeenBy directly, which for Myself would render as LastSeenBy(Myself).
      const responseTokens = isMyself
        ? [
            { key: ScriptTarget.token, value: ScriptTarget.myself },
            { key: ScriptTarget.lastSeen, value: ScriptTarget.myself },
          ]
        : [{ key: ScriptTarget.token, value: ScriptTarget.lastSeen }];
      p.statements.push({
        triggers,
        comment: index === 0 ? p.comment : "",
        responses: utils.replaceResponseTokens(p.responses, responseTokens),
      });
    }
  };

  /**
   * Makes a target-list statement for Myself behave like a self ability (no target list): whether
   * See(Myself) sets LastSeenBy to the caster is uncertain, so the target's See(token) is dropped
   * and every LastSeenBy after it (which refers to that target) becomes Myself. Triggers flagged
   * exceptMyself (ExcludeUnwantedTargetsTriggers) are dropped too. Triggers before See(token)
   * belong to the ability and keep their own LastSeenBy.
   */
  private selfTriggers(triggers: Triggers.Trigger[]): Triggers.Trigger[] {
    const kept = this.withoutExceptMyself(triggers);
    const seeIndex = kept.findIndex(
      (t) => t.name === "See" && !t.negation && t.params[0] === ScriptTarget.token,
    );
    const tokens = [{ key: ScriptTarget.token, value: ScriptTarget.myself }];
    if (seeIndex === -1) return utils.replaceTriggerTokens(kept, tokens);
    return [
      ...utils.replaceTriggerTokens(kept.slice(0, seeIndex), tokens),
      ...utils.replaceTriggerTokens(kept.slice(seeIndex + 1), [
        ...tokens,
        { key: ScriptTarget.lastSeen, value: ScriptTarget.myself },
      ]),
    ];
  }

  private withoutExceptMyself(triggers: Triggers.Trigger[]): Triggers.Trigger[] {
    return triggers
      .filter((t) => !t.exceptMyself)
      .map((t) => ("triggers" in t ? { ...t, triggers: this.withoutExceptMyself(t.triggers) } : t))
      .filter((t) => !("triggers" in t) || t.triggers.length);
  }

  addOneBlockTargetList = (p: {
    statements: Statements;
    triggers?: Triggers.Trigger[];
    targets: string[];
    targetTriggers: Triggers.Trigger[];
    responses: Response[];
    reverse?: boolean;
    comment?: string;
    inBetweenStatements?: Statements;
  }): void => {
    p.reverse = p.reverse ?? false;
    const targets = p.reverse ? [...p.targets].reverse() : [...p.targets];
    const triggers: Triggers.Trigger[] = [...(p.triggers ?? [])];
    for (const target of targets) {
      const orTrigger: Triggers.Trigger = {
        name: "Or",
        triggers: utils
          .replaceTriggerTokens(p.targetTriggers, [{ key: ScriptTarget.token, value: target }])
          .map(triggerFactory.inverseNegation),
      };
      triggers.push(orTrigger);
    }
    p.statements.push({
      triggers,
      comment: p.comment,
      responses: responseFactory.response([{ name: "Continue" }]),
    });
    if (p.inBetweenStatements) p.statements.push(...p.inBetweenStatements);
    const lastSeenBy = ScriptTarget.lastSeen;
    const responses = utils.replaceResponseTokens(p.responses, [
      { key: ScriptTarget.token, value: lastSeenBy },
    ]);
    const finalTriggers = [...(p.triggers ?? []), ...p.targetTriggers];
    p.statements.push({
      triggers: utils.replaceTriggerTokens(finalTriggers, [
        { key: ScriptTarget.token, value: lastSeenBy },
      ]),
      responses,
    });
  };
}

const bafFactory = new BafFactory();
export default bafFactory;

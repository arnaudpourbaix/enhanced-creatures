import path from "path";
import statementBuilderService from "./statement-builder.service";
import { Creature } from "../../model/creature/creature";
import { ConditionalStatement, Statements } from "../../model/script/script";
import { CR, TAB } from "../../model/constants";
import { State } from "../../state";
import { Triggers } from "../../model/script/triggers";
import { Actions } from "../../model/script/actions";
import { GenericScriptParameterData } from "../../model/script/data";
import { OBJECT_IDENTIFIERS, ObjectIdentifier } from "../../model/ids/object";
import { ALLEGIANCE_IDENTIFIERS } from "../../model/ids/allegiance";
import { GENERAL_IDENTIFIERS } from "../../model/ids/general";
import { RACE_IDENTIFIERS } from "../../model/ids/race";
import { CLASS_IDENTIFIERS } from "../../model/ids/class";
import { SPECIFIC_IDENTIFIERS } from "../../model/ids/specific";
import { GENDER_IDENTIFIER } from "../../model/ids/gender";
import { ALIGN_IDENTIFIERS } from "../../model/ids/align";
import translationService from "../translation.service";
import utils from "../utils/utils.service";
import weiduCreatureService from "../weidu/weidu-creature.service";

class BafGeneratorService {
  generate(creature: Creature): void {
    const folder = utils.getFamilyFolder(creature.family);
    utils.writeFile(
      path.join(folder, weiduCreatureService.getScriptName(creature, { ext: true })),
      this.buildContent(creature, { summon: false }),
    );
    if (creature.adjustments.some((a) => a.summon)) {
      utils.writeFile(
        path.join(
          folder,
          weiduCreatureService.getScriptName(creature, {
            ext: true,
            summon: true,
          }),
        ),
        this.buildContent(creature, { summon: true }),
      );
    }
  }

  buildContent(creature: Creature, options: { summon: boolean }): string {
    const statements: Statements = statementBuilderService.buildStatements(creature, options);
    const code = statements.map((statement) => this.generateStatement(statement)).join("");
    if (options.summon) return code;
    return `// ${translationService.from(creature.name)}${CR}${CR}${code}`;
  }

  generateStatement(statement: ConditionalStatement): string {
    const lines: string[] = [];
    if (statement.comment) lines.push(`// ${statement.comment}`);
    lines.push("IF");
    lines.push(...this.generateTriggers(statement.triggers, false));
    lines.push("THEN");
    for (const r of statement.responses) {
      lines.push(`${TAB}RESPONSE #${r.weight}`);
      lines.push(...this.generateActions(r.actions));
    }
    lines.push("END");
    lines.push(CR);
    return lines.join(CR);
  }

  generateTriggers(triggers: Triggers.Trigger[], isOr: boolean): string[] {
    const lines: string[] = [];
    for (const t of triggers) {
      if ("triggers" in t) {
        if (t.triggers.length < 2)
          throw new Error(
            `OR trigger should have at least 2 conditions: ${JSON.stringify(t.triggers)}`,
          );
        lines.push(`${TAB}OR(${t.triggers.length})`);
        lines.push(...this.generateTriggers(t.triggers, true));
      } else {
        lines.push(this.generateTrigger(t, isOr));
      }
    }
    return lines;
  }

  generateTrigger(trigger: Triggers.Trigger, isOr: boolean): string {
    const params: string[] = [];
    const paramsRef = this.getTriggerParameters(trigger.name);
    const triggerParams = "params" in trigger ? trigger.params : [];
    if (triggerParams.length !== paramsRef.length)
      throw new Error(
        `Not enough parameters for trigger\n ${JSON.stringify(
          trigger,
          null,
          4,
        )}\nExpected: ${paramsRef.length} from\n${JSON.stringify(paramsRef, null, 4)})`,
      );
    for (const [index, p] of triggerParams.entries()) {
      const paramRef = paramsRef[index];
      // paramsRef[index] is always in-bounds given the length check above for real config, but
      // this guards a malformed trigger definition (a hole in matching-length metadata) - see
      // baf-generator.service.test.ts's "Unexpected parameter x for trigger" test.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!paramRef) throw new Error(`Unexpected parameter ${p} for trigger ${trigger.name}`);
      params.push(this.getParamValue(p, paramRef));
    }
    return `${TAB.repeat(isOr ? 2 : 1)}${trigger.negation ? "!" : ""}${
      trigger.name
    }(${params.join(",")})`;
  }

  generateActions(actions: Actions.Action[]): string[] {
    const lines: string[] = [];
    for (const a of actions) {
      lines.push(this.generateAction(a));
    }
    return lines;
  }

  generateAction(action: Actions.Action): string {
    const params: string[] = [];
    const paramsRef = this.getActionParameters(action.name);
    const actionParams = "params" in action ? action.params : [];
    if (actionParams.length !== paramsRef.length)
      throw new Error(
        `Not enough parameters for action\n ${JSON.stringify(
          action,
          null,
          4,
        )}\nExpected: ${paramsRef.length} from\n${JSON.stringify(paramsRef, null, 4)})`,
      );
    for (const [index, p] of actionParams.entries()) {
      const paramRef = paramsRef[index];
      // same reasoning as generateTrigger()'s guard above.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!paramRef) throw new Error(`Unexpected parameter ${p} for action ${action.name}`);
      const value = this.getParamValue(p, paramRef);
      params.push(value);
    }
    return `${TAB.repeat(2)}${action.name}(${params.join(",")})`;
  }

  getParamValue(value: string | number, param: GenericScriptParameterData): string {
    const val = typeof value === "string" ? value : value.toString();
    if (param.isNumber) return val;
    else if (param.isObject) return this.getObjectParamValue(val);
    return `"${val}"`;
  }

  getObjectParamValue(value: string): string {
    if (value.startsWith("[") || value.endsWith(")")) return value;
    const startsWithObject = OBJECT_IDENTIFIERS.some((v) => value.startsWith(v));
    const objectType = this.getObjectType(value);
    if (!startsWithObject && objectType) return objectType;
    else if (this.requireParameter(value as ObjectIdentifier) && !objectType)
      return `${value}(Myself)`;
    else if (Object.values(OBJECT_IDENTIFIERS).includes(value as ObjectIdentifier)) {
      return value;
    }
    return `"${value}"`;
  }

  getObjectType(value: string): string | undefined {
    const tests = [
      ALLEGIANCE_IDENTIFIERS.some((v) => value.includes(v)),
      GENERAL_IDENTIFIERS.some((v) => value.includes(v)),
      RACE_IDENTIFIERS.some((v) => value.includes(v)),
      CLASS_IDENTIFIERS.some((v) => value.includes(v)),
      SPECIFIC_IDENTIFIERS.some((v) => value.includes(v)),
      GENDER_IDENTIFIER.some((v) => value.includes(v)),
      ALIGN_IDENTIFIERS.some((v) => value.includes(v)),
    ];
    if (!tests.some((t) => t)) return;
    //[EA.GENERAL.RACE.CLASS.SPECIFIC.GENDER.ALIGN]
    const result = tests
      .reduce<string[]>((acc, v) => {
        if (!acc.some((i) => i !== "0")) acc.push(v ? value : "0");
        return acc;
      }, [])
      .join(".");
    return `[${result}]`;
  }

  getActionParameters(name: string): GenericScriptParameterData[] {
    const actionRef = State.actions.find((a) => a.name === name);
    if (!actionRef) throw new Error(`Unknown action ${name}`);
    return actionRef.parameters;
  }

  getTriggerParameters(name: string): GenericScriptParameterData[] {
    const triggerRef = State.triggers.find((a) => a.name === name);
    if (!triggerRef) throw new Error(`Unknown trigger ${name}`);
    return triggerRef.parameters;
  }

  requireParameter(objectParam: ObjectIdentifier): boolean {
    return objectParam.endsWith("Of") || objectParam.endsWith("By");
  }
}

const bafGeneratorService = new BafGeneratorService();
export default bafGeneratorService;

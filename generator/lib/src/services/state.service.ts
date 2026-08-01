import { IMMUNITIES, RESISTANCES, TRAITS } from "../../config/immunity-config";
import { GenericScriptParameterData } from "../model/script/data";
import { ImmunityConfig } from "../model/final/immunity";
import { Actions } from "../model/script/actions";
import { Triggers } from "../model/script/triggers";
import { State } from "../state";
import effectService from "./effects/effect.service";
import { EffectTargetEnum, EffectTimingEnum } from "../model/spell-item/effect.enums";
import descriptionService from "./doc/description.service";

class StateService {
  // async so a synchronous throw below becomes a proper promise rejection (with the original
  // error, not a wrapped one).
  // eslint-disable-next-line @typescript-eslint/require-await
  async init(): Promise<void> {
    State.modFolder = "..";
    this.loadActions();
    this.loadTriggers();
    this.loadImmunities();
  }

  private loadActions(): void {
    State.actions = Actions.ACTIONS.map((c) => ({
      ...c,
      parameters: this.buildParameters(c.parameters),
    }));
  }

  private loadTriggers(): void {
    State.triggers = Triggers.TRIGGERS.map((c) => ({
      ...c,
      parameters: this.buildParameters(c.parameters),
    }));
  }

  private buildParameters(params: string): GenericScriptParameterData[] {
    if (!params.length) return [];
    return params.split(",").map((p) => {
      const name = p.substring(p.indexOf(":") + 1, p.indexOf("*"));
      const isNumber = p.includes("I:") && p !== "I:Object*";
      const isObject = p.includes("O:") || p === "I:Object*";
      return { raw: p, name, isNumber, isObject };
    });
  }

  private loadImmunities(): void {
    State.immunities = [...IMMUNITIES, ...RESISTANCES, ...TRAITS].map((i) => {
      const result: ImmunityConfig = {
        ...i,
        doc: i.doc ?? true,
        immunities: i.immunities ?? [],
        preventEffects: i.preventEffects ?? [],
        preventIcons: i.preventIcons ?? [],
        displayIcons: i.displayIcons ?? [],
        strings: i.strings ?? [],
        animations: i.animations ?? [],
        spellGroups: i.spellGroups ?? [],
        displaySpellIneffective: !!i.displaySpellIneffective,
        effects: effectService.getEffects(i.effects ?? [], {
          base: {
            target: EffectTargetEnum.Self,
            timing: EffectTimingEnum.InstantWhileEquipped,
          },
        }),
        overrides: i.overrides ?? [],
      };
      return result;
    });
    // Must run in this (insertion) order, before the sort below: generateImmunity() mints new
    // translation stringRefs for generated descriptions via translationService's sequential
    // counter, so this loop's iteration order determines which immunity gets which stringRef
    // number in the generated .tra files.
    for (const i of State.immunities) {
      if (i.type !== "resistance") {
        descriptionService.generateImmunity(i);
      }
    }
    // Sorted once here (after stringRef assignment above, which must stay in insertion order),
    // establishing State.immunities' order as an invariant for every later consumer
    // (documentationService.getTraits()'s trait listing, weiduFunctionService's generated
    // DEFINE_PATCH_FUNCTION block order). Previously this sort only happened as an incidental
    // side effect of getTraits() itself, which meant WeiDU codegen's output order was silently
    // controlled by whether/when documentation generation ran first in the pipeline.
    State.immunities.sort((a, b) => (a.name > b.name ? 1 : -1));
  }
}

const stateService = new StateService();
export default stateService;

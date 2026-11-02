import { Creature } from "../../model/creature/creature";
import { Variant } from "../../model/creature/variant";
import { getResourceName } from "../utils/misc.func";

/** The base script and its summon script keep their counters: scripted variants come after. */
const FIRST_VARIANT_COUNTER = 2;

/** One BAF script of a creature, with the files running it. */
export interface CreatureScript {
  /** e.g. "jabm4j02" */
  name: string;
  /** Present when the script has summon files: "jabm4j01" for the base, the next counter for a variant */
  summonName?: string;
  /** undefined for the base script */
  variant?: Variant;
  /** Uppercased files running `name` */
  files: string[];
  /** Uppercased summon files running `summonName` */
  summonFiles: string[];
  /** The creature as this script sees it: the creature itself when it has no scripted variant */
  view: Creature;
}

/**
 * A creature's scripts: the base one, then one per variant bringing spells or abilities of its own
 * (see Variant.scripted), so a file only runs the spells its own variant has.
 */
class ScriptPlanService {
  plan(creature: Creature): CreatureScript[] {
    const noScript = new Set(
      creature.adjustments.filter((a) => a.data.script.location === "None").flatMap((a) => a.files),
    );
    const summons = new Set(creature.adjustments.filter((a) => a.summon).flatMap((a) => a.files));
    const scripted = this.scriptedVariants(creature.variants);
    const owners = this.owners(scripted);
    const runs = (files: string[]) => files.filter((f) => !noScript.has(f));

    const baseFiles = runs(creature.fileNames.map((f) => f.toUpperCase())).filter(
      (f) => !owners.has(f),
    );
    const base: CreatureScript = {
      name: getResourceName("b", "m", creature.id, 0),
      files: baseFiles.filter((f) => !summons.has(f)),
      summonFiles: baseFiles.filter((f) => summons.has(f)),
      view: creature,
    };
    if (base.summonFiles.length) base.summonName = getResourceName("b", "m", creature.id, 1);

    let counter = FIRST_VARIANT_COUNTER;
    const scripts = [base];
    for (const variant of scripted) {
      const own = runs(variant.files).filter((f) => owners.get(f) === variant);
      const script: CreatureScript = {
        name: getResourceName("b", "m", creature.id, counter),
        files: own.filter((f) => !summons.has(f)),
        summonFiles: own.filter((f) => summons.has(f)),
        view: creature,
        variant,
      };
      counter++;
      if (script.summonFiles.length) {
        script.summonName = getResourceName("b", "m", creature.id, counter);
        counter++;
      }
      scripts.push(script);
    }
    return scripts;
  }

  /** Scripted variants, depth first: a sub-variant right after its parent. */
  private scriptedVariants(variants: Variant[]): Variant[] {
    return variants.flatMap((v) => [
      ...(v.scripted ? [v] : []),
      ...this.scriptedVariants(v.children),
    ]);
  }

  /** Each file's script owner: its nearest scripted variant (a sub-variant overrides its parent). */
  private owners(scripted: Variant[]): Map<string, Variant> {
    const owners = new Map<string, Variant>();
    for (const variant of scripted) {
      for (const file of variant.files) {
        const owner = owners.get(file);
        if (owner && !this.isAncestor(owner, variant)) {
          throw new Error(
            `'${file}' is in scripted variants "${owner.label}" and "${variant.label}" - a file runs one script`,
          );
        }
        owners.set(file, variant);
      }
    }
    return owners;
  }

  private isAncestor(ancestor: Variant, variant: Variant): boolean {
    for (let v = variant.parent; v; v = v.parent) if (v === ancestor) return true;
    return false;
  }
}

const scriptPlanService = new ScriptPlanService();
export default scriptPlanService;

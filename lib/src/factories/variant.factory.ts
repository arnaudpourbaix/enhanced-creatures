import deepmerge from "deepmerge";
import { PartialCreatureAdjustment } from "../model/creature/adjustment";
import { Creature } from "../model/creature/creature";
import { InputCreatureData } from "../model/creature/data-input";
import { Variant, VariantInput } from "../model/creature/variant";
import logService from "../services/log.service";
import translationService from "../services/translation.service";
import creatureFactory from "./creature.factory";

class VariantFactory {
  add(cre: Creature, label: string, input: VariantInput, parent?: Variant): Variant {
    creatureFactory.checkValidation(cre);

    const members = [...new Set((input.files ?? []).map((f) => f.toUpperCase()))];
    const adjustFiles = (input.adjust ?? []).flatMap((a) => a.files.map((f) => f.toUpperCase()));
    assertFiles(cre, label, members, adjustFiles);

    const base: InputCreatureData = parent
      ? deepmerge<InputCreatureData>(parent.data, input.data ?? {})
      : (input.data ?? {});
    const variant = new Variant(cre, label, base, members, parent);

    // Stamp the variant onto every entry so the documentation can group the cards under it.
    creatureFactory.setAdjustments(
      cre,
      buildAdjustments(input, base, label).map((a) => ({ ...a, variant })),
    );
    linkToParent(cre, variant, members);
    return variant;
  }
}

function buildAdjustments(
  input: VariantInput,
  base: InputCreatureData,
  label: string,
): PartialCreatureAdjustment[] {
  const adjustments: PartialCreatureAdjustment[] = [];
  if (input.files?.length && hasKeys(base)) {
    adjustments.push({ files: input.files, data: base });
  } else if (input.files?.length) {
    logService.warn(
      `variant "${label}" lists files but resolves to no data - those files get no adjustment`,
    );
  }
  for (const entry of input.adjust ?? []) {
    const merged = entry.data
      ? deepmerge<InputCreatureData>(base, entry.data, { customMerge })
      : base;
    adjustments.push({ ...entry, data: hasKeys(merged) ? merged : undefined });
  }
  return adjustments;
}

// `memorized` is a complete snapshot of what's memorized, not an accumulating list like
// `items.remove` - an `adjust` entry that recomputes its own spellbook (e.g. via
// spellService.createSpellbook) means to replace the shared variant data's list, not stack on top
// of it, so it gets replace semantics while every other array keeps deepmerge's default concat.
function customMerge(key: string): ((target: unknown[], source: unknown[]) => unknown[]) | undefined {
  if (key !== "memorized") return undefined;
  return (_target, source) => source;
}

function linkToParent(cre: Creature, variant: Variant, members: string[]): void {
  if (!variant.parent) {
    cre.variants.push(variant);
    return;
  }
  variant.parent.children.push(variant);
  // A sub-variant's files fold back into its parent - a greater lacedon is still a lacedon.
  for (const file of members) {
    if (!variant.parent.files.includes(file)) variant.parent.files.push(file);
  }
}

/**
 * A variant only refines files the creature already owns, and every `adjust` entry must refine a
 * declared member - a stray `adjust` for a non-member is usually a leftover from a file that
 * turned out not to belong to the variant.
 */
function assertFiles(cre: Creature, label: string, members: string[], adjustFiles: string[]): void {
  const owned = new Set(cre.fileNames.map((f) => f.toUpperCase()));
  const memberSet = new Set(members);
  const errors: string[] = [];
  for (const file of new Set([...members, ...adjustFiles])) {
    if (!owned.has(file)) {
      errors.push(`'${file}' is not one of ${translationService.from(cre.name)}'s files`);
    }
  }
  for (const file of new Set(adjustFiles)) {
    if (!memberSet.has(file)) {
      errors.push(`adjust entry targets '${file}', which is not a member - add it to \`files\``);
    }
  }
  if (errors.length) {
    throw new Error(`variant "${label}": ${errors.join("; ")}`);
  }
}

function hasKeys(value: object): boolean {
  return Object.keys(value).length > 0;
}

export default new VariantFactory();

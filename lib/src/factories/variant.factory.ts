import deepmerge from "deepmerge";
import { PartialCreatureAdjustment } from "../model/creature/adjustment";
import { Creature, CreatureAutoGenerate } from "../model/creature/creature";
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
    adjustments.push({ files: input.files, data: base, autoGenerate: input.autoGenerate });
  } else if (input.files?.length) {
    logService.warn(
      `variant "${label}" lists files but resolves to no data - those files get no adjustment`,
    );
  }

  // Each WeiDU adjustment is a separate, sequential patch on the same .cre file: a later one
  // overwrites any field it defines, regardless of what an earlier one for the same file already
  // set (see weidu-creature.service's writeCreatureDataField - there's no diffing against a prior
  // pass). So an `adjust` entry that narrows a file already covered by an earlier entry must merge
  // on top of THAT entry's result, not re-derive from the shared `base` - otherwise every field
  // the narrowing entry doesn't restate (its Hit Dice, class, spells, ...) silently reverts to the
  // generic profile and clobbers the earlier entry's more specific values.
  const stateByFile = new Map<string, InputCreatureData>();
  const autoGenerateByFile = new Map<string, Partial<CreatureAutoGenerate> | undefined>();
  for (const file of input.files ?? []) {
    stateByFile.set(file.toUpperCase(), base);
    autoGenerateByFile.set(file.toUpperCase(), input.autoGenerate);
  }

  for (const entry of input.adjust ?? []) {
    const files = entry.files.map((f) => f.toUpperCase());
    const priorStates = new Set(files.map((f) => stateByFile.get(f) ?? base));
    if (priorStates.size > 1) {
      throw new Error(
        `variant "${label}": adjust entry for [${entry.files.join(", ")}] mixes files that were narrowed differently by earlier adjust entries - split it so each group shares one prior state`,
      );
    }
    const priorState = priorStates.values().next().value ?? base;
    const merged = entry.data
      ? deepmerge<InputCreatureData>(priorState, entry.data, { customMerge })
      : priorState;
    // autoGenerate is deliberately NOT deep-merged (see VariantInput.adjust doc): an entry
    // inherits the nearest ancestor's autoGenerate (this file's own chain, then the variant's
    // shared one) as-is unless it declares its own (even `{}`), so a sub-entry with its own
    // level1 can opt out of a shared nominal-level override.
    const priorAutoGenerate = autoGenerateByFile.get(files[0]) ?? input.autoGenerate;
    const autoGenerate = entry.autoGenerate ?? priorAutoGenerate;
    adjustments.push({ ...entry, data: hasKeys(merged) ? merged : undefined, autoGenerate });
    for (const file of files) {
      stateByFile.set(file, merged);
      autoGenerateByFile.set(file, autoGenerate);
    }
  }
  return adjustments;
}

// `memorized`/`spellbooks` are each a complete snapshot of what's memorized, not an accumulating
// list like `items.remove` - an `adjust` entry that recomputes its own spellbook (e.g. via
// spellService.createSpellbook/createSpellbooks) means to replace the shared variant data's list,
// not stack on top of it, so both get replace semantics while every other array keeps deepmerge's
// default concat. Without this, an adjust entry's `spellbooks` would concatenate onto the shared
// variant's own `spellbooks` - duplicating each mod's entry (one from the shared profile's caster
// level, one from the adjust entry's) and making weidu-creature.service's `.find()` fallback pick
// the shared profile's (wrong, weaker) one instead of the adjust entry's override.
function customMerge(key: string): ((target: unknown[], source: unknown[]) => unknown[]) | undefined {
  if (key !== "memorized" && key !== "spellbooks") return undefined;
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

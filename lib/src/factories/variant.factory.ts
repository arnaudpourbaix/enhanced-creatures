import deepmerge from "deepmerge";
import { PartialCreatureAdjustment } from "../model/creature/adjustment";
import { Creature } from "../model/creature/creature";
import { InputCreatureData } from "../model/creature/data-input";
import { Game, gamesOverlap } from "../model/creature/game";
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

  // Each WeiDU adjustment is a separate, independent patch on the same .cre file: a later one
  // overwrites any field it defines, regardless of what an earlier one for the same file already
  // set (see weidu-creature.service's writeCreatureDataField - there's no diffing against a prior
  // pass). So every `adjust` entry's data is layered directly on top of the variant's own `base`
  // (never on top of a sibling entry's result) - a file may appear in at most one `adjust` entry,
  // enforced below. That keeps every entry's resolved data self-contained: it always carries the
  // variant's own fields (Hit Dice, class, spells, ...) forward, so nothing can silently fall back
  // to the plain creature profile the way chaining entries together could.
  assertNoDuplicateAdjustFiles(input.adjust ?? [], label);

  for (const entry of input.adjust ?? []) {
    const merged = entry.data ? deepmerge<InputCreatureData>(base, entry.data, { customMerge }) : base;
    // autoGenerate is deliberately NOT deep-merged (see VariantInput.adjust doc): an entry
    // inherits the variant's shared autoGenerate as-is unless it declares its own (even `{}`), so
    // a sub-entry with its own level1 can opt out of a shared nominal-level override.
    const autoGenerate = entry.autoGenerate ?? input.autoGenerate;
    adjustments.push({ ...entry, data: hasKeys(merged) ? merged : undefined, autoGenerate });
  }
  return adjustments;
}

/**
 * A file's full override set for a given install must live in one `adjust` entry - see
 * buildAdjustments above for why layering a second entry for the same file on top of the first
 * isn't safe to do implicitly. Two entries for the same file are only exempt when their `game`
 * scopes can't both be active in one install (see gamesOverlap) - e.g. a bg1-only entry and a
 * bg2-only entry for the same file never coexist, so there's nothing to reconcile between them.
 */
function assertNoDuplicateAdjustFiles(adjust: PartialCreatureAdjustment[], label: string): void {
  const seenByFile = new Map<string, (Game | undefined)[]>();
  for (const entry of adjust) {
    for (const file of entry.files.map((f) => f.toUpperCase())) {
      const seenGames = seenByFile.get(file) ?? [];
      if (seenGames.some((game) => gamesOverlap(game, entry.game))) {
        throw new Error(
          `variant "${label}": '${file}' appears in more than one adjust entry that can both apply to the same install - merge them into a single entry, or scope them to non-overlapping \`game\` values`,
        );
      }
      seenGames.push(entry.game);
      seenByFile.set(file, seenGames);
    }
  }
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

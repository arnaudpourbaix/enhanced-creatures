import deepmerge from "deepmerge";
import { PartialCreatureAdjustment } from "../model/creature/adjustment";
import { Creature } from "../model/creature/creature";
import { InputCreatureData } from "../model/creature/data-input";
import { Variant, VariantInput } from "../model/creature/variant";
import logService from "../services/log.service";
import creatureFactory from "./creature.factory";

class VariantFactory {
  add(cre: Creature, label: string, input: VariantInput, parent?: Variant): Variant {
    creatureFactory.checkValidation(cre);
    logService.header(`Creating ${label} variant...`);

    const base: InputCreatureData = parent
      ? deepmerge<InputCreatureData>(parent.data, input.data ?? {})
      : (input.data ?? {});
    const baseHasData = hasKeys(base);

    const adjustments: PartialCreatureAdjustment[] = [];
    const plainFiles = input.files ?? [];
    if (plainFiles.length && baseHasData) {
      adjustments.push({ files: plainFiles, data: base });
    } else if (plainFiles.length) {
      logService.warn(
        `variant "${label}" lists files but resolves to no data - those files get no adjustment`,
      );
    }
    for (const entry of input.adjust ?? []) {
      const merged = entry.data ? deepmerge<InputCreatureData>(base, entry.data) : base;
      adjustments.push({ ...entry, data: hasKeys(merged) ? merged : undefined });
    }
    creatureFactory.setAdjustments(cre, adjustments);

    const files = [
      ...new Set(
        [...plainFiles, ...(input.adjust ?? []).flatMap((a) => a.files)].map((f) =>
          f.toUpperCase(),
        ),
      ),
    ];
    // A sub-variant's files fold back into its parent - a greater lacedon is still a lacedon.
    if (parent) {
      for (const file of files) if (!parent.files.includes(file)) parent.files.push(file);
    }
    return new Variant(cre, label, base, files);
  }
}

function hasKeys(value: object): boolean {
  return Object.keys(value).length > 0;
}

export default new VariantFactory();

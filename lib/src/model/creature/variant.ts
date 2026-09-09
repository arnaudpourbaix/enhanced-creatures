import { PartialCreatureAdjustment } from "./adjustment";
import type { Creature } from "./creature";
import { InputCreatureData } from "./data-input";

/**
 * A *variant* is a named stat profile applied to a set of existing creature files via the
 * ordinary adjustment mechanism - no new `MonsterEnum`, no new doc section. It exists purely to
 * keep `setAdjustments` readable: the shared "greater ghast" / "lacedon" profile is declared
 * once, and the files that need more than the shared profile (a boss, a weaker minion) are
 * declared *inside* the same variant rather than as loose adjustment entries elsewhere.
 *
 * `Creature.variant()` (root) / `Variant.variant()` (derived) expand the input to an ordered
 * `PartialCreatureAdjustment[]` and push it through the normal `setAdjustments` path, so
 * everything downstream (WeiDU generation, the documentation adjustment cards) treats it exactly
 * like a hand-written adjustment.
 */
export interface VariantInput {
  /** Stat delta applied over the base creature (and, for a derived variant, its parent). */
  data?: InputCreatureData;
  /** Member files that carry only the merged variant data. */
  files?: string[];
  /**
   * Member files needing more than the shared profile: each is a full adjustment (its own
   * `data`, `noWeapon`, `scriptName`, `stringRef`, `game`, ...), with its `data` layered on top
   * of the merged variant data (`deepmerge(variantData, entry.data)`). Array values (e.g.
   * `items.remove`) are concatenated, not replaced.
   */
  adjust?: PartialCreatureAdjustment[];
}

/**
 * Handle for a declared variant. Call {@link variant} on it to derive a sub-variant
 * ("greater lacedon" from "lacedon"): the child's `data` stacks on top of this one's, and the
 * child's member files fold back into this variant's {@link files} (a greater lacedon is still
 * a lacedon).
 */
export class Variant {
  constructor(
    private readonly creature: Creature,
    /** Free-text label, used only for the generator log section header - not a translation key. */
    readonly label: string,
    /** Merged `InputCreatureData`: the parent chain plus this variant's own `data`. */
    readonly data: InputCreatureData,
    /** Every member file this variant and its sub-variants touch, uppercased. */
    readonly files: string[],
  ) {}

  /** Derive a sub-variant whose `data` stacks on top of this one's. */
  variant(label: string, input: VariantInput): Variant {
    return this.creature.variant(label, input, this);
  }
}

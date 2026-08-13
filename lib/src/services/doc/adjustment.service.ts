import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature } from "../../model/creature/creature";
import { CreatureData, MemorizedSpell } from "../../model/creature/data";
import { EquippedItem, ItemSlot } from "../../model/creature/item";
import { ImmunityName } from "../../model/final/immunity";
import creatureService from "../creature.service";

export interface AdjustmentField<T> {
  value: T;
  changed: boolean;
}

export interface EffectiveAdjustment {
  files: string[];
  noWeapon: boolean;
  level: AdjustmentField<number>;
  hp: AdjustmentField<number>;
  thac0: AdjustmentField<number>;
  ac: AdjustmentField<number>;
  apr: AdjustmentField<number>;
  movement: AdjustmentField<number>;
  morale: AdjustmentField<number>;
  alignment: AdjustmentField<string>;
  size: AdjustmentField<string>;
  xpv: AdjustmentField<number>;
  strength: AdjustmentField<number>;
  exceptionalStrength: AdjustmentField<number | undefined>;
  dexterity: AdjustmentField<number>;
  constitution: AdjustmentField<number>;
  intelligence: AdjustmentField<number>;
  wisdom: AdjustmentField<number>;
  charisma: AdjustmentField<number>;
  equipped: { item: EquippedItem; changed: boolean }[];
  immunities: { name: ImmunityName; changed: boolean }[];
  memorized: { spell: MemorizedSpell; changed: boolean }[];
}

class AdjustmentService {
  getEffectiveAdjustments(creature: Creature): EffectiveAdjustment[] {
    const files = this.getAllFiles(creature.adjustments);
    const perFile = files.map((file) => this.getEffectiveDataForFile(creature, file));
    return this.group(perFile.filter((effective) => this.hasVisibleChanges(effective))).sort(
      (a, b) => a.level.value - b.level.value,
    );
  }

  private getAllFiles(adjustments: CreatureAdjustment[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const adjustment of adjustments) {
      for (const file of adjustment.files) {
        if (seen.has(file)) continue;
        seen.add(file);
        result.push(file);
      }
    }
    return result;
  }

  private getEffectiveDataForFile(creature: Creature, file: string): EffectiveAdjustment {
    const matching = creature.adjustments.filter((a) => a.files.includes(file));
    const base = creature.data;

    return {
      files: [file],
      noWeapon: matching.some((a) => a.noWeapon),
      level: this.field(
        this.lastDefined(matching, (d) => d.level1?.pnpValue),
        base.level1.pnpValue,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      hp: this.field(
        this.lastDefined(matching, (d) => d.hp),
        base.hp!,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      thac0: this.field(
        this.lastDefined(matching, (d) => d.thac0),
        base.thac0!,
      ),
      ac: this.getAc(matching, creature),
      apr: this.getApr(matching, creature),
      movement: this.field(
        this.lastDefined(matching, (d) => d.movement?.pnpValue),
        base.movement.pnpValue,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      morale: this.field(
        this.lastDefined(matching, (d) => d.morale),
        base.morale!,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      alignment: this.field(
        this.lastDefined(matching, (d) => d.alignment),
        base.alignment!,
      ),
      size: this.field(
        this.lastDefined(matching, (d) => d.size),
        base.size,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      xpv: this.field(
        this.lastDefined(matching, (d) => d.xpv),
        base.xpv!,
      ),
      strength: this.field(
        this.lastDefined(matching, (d) => d.strength),
        base.strength,
      ),
      exceptionalStrength: this.field(
        this.lastDefined(matching, (d) => d.exceptionalStrength),
        base.exceptionalStrength,
      ),
      dexterity: this.field(
        this.lastDefined(matching, (d) => d.dexterity),
        base.dexterity,
      ),
      constitution: this.field(
        this.lastDefined(matching, (d) => d.constitution),
        base.constitution,
      ),
      intelligence: this.field(
        this.lastDefined(matching, (d) => d.intelligence),
        base.intelligence,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      wisdom: this.field(
        this.lastDefined(matching, (d) => d.wisdom),
        base.wisdom!,
      ),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      charisma: this.field(
        this.lastDefined(matching, (d) => d.charisma),
        base.charisma!,
      ),
      equipped: this.getEquipped(matching, base),
      immunities: this.getImmunities(matching, base),
      memorized: this.getMemorized(matching, base),
    };
  }

  private lastDefined<T>(
    adjustments: CreatureAdjustment[],
    get: (data: CreatureData) => T | undefined,
  ): T | undefined {
    let result: T | undefined;
    for (const adjustment of adjustments) {
      const value = get(adjustment.data);
      if (value !== undefined) result = value;
    }
    return result;
  }

  private field<T>(overridden: T | undefined, base: T): AdjustmentField<T> {
    const value = overridden ?? base;
    return { value, changed: value !== base };
  }

  // checkData already ran checkDexterityArmorClassBonus on every adjustment's own data using only
  // that adjustment's own dexterity (never falling back to the base's) - so a folded `ac` is
  // already a finished, display-ready value whenever the adjustment sets its own dexterity too.
  // No adjustment does that today (see the spec's Non-goals), so this is never exercised in
  // practice, but the base side always needs getFinalArmorClass() since the base's own raw
  // data.ac has had its dexterity bonus stripped out for WeiDU generation by that same pass.
  private getAc(matching: CreatureAdjustment[], creature: Creature): AdjustmentField<number> {
    const base = creatureService.getFinalArmorClass(creature);
    return this.field(
      this.lastDefined(matching, (d) => d.ac),
      base,
    );
  }

  // Mirrors documentationService.getEffectiveApr (raw apr * doubleApr multiplier, plus the +1 the
  // engine grants automatically for an off-hand weapon) - duplicated rather than imported because
  // documentation.service.ts already imports this file. The base creature's own dual-wielding
  // status is reused as-is (never re-derived per adjustment - see the spec's Non-goals).
  private getApr(matching: CreatureAdjustment[], creature: Creature): AdjustmentField<number> {
    const dualWieldingBonus = creature.attack.dualWielding ? 1 : 0;
    const rawApr = this.lastDefined(matching, (d) => d.apr) ?? creature.data.apr;
    const doubleApr = this.lastDefined(matching, (d) => d.doubleApr) ?? creature.data.doubleApr;
    const value = rawApr * (doubleApr ? 2 : 1) + dualWieldingBonus;
    const base = creature.data.apr * (creature.data.doubleApr ? 2 : 1) + dualWieldingBonus;
    return { value, changed: value !== base };
  }

  // Mirrors Creature.addItem's replacement rule (creature.ts): an incoming item only replaces an
  // existing one when *both* target a genuine single slot and that slot matches; anything
  // involving a multi-slot array is simply added alongside. Keying by a joined slot string
  // instead would collapse every JEWEL_SLOTS trait carrier (addTrait's default) into one entry
  // and silently drop all but the last of the base creature's own traits. Base-authored order is
  // preserved (no sort) so getAdjustmentAttacks sees main hand before off-hand, exactly like the
  // main creature block does.
  private getEquipped(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { item: EquippedItem; changed: boolean }[] {
    const isSingleSlot = (item: EquippedItem): boolean =>
      Array.isArray(item.slot) ? item.slot.length === 1 : true;
    const singleSlotValue = (item: EquippedItem): ItemSlot =>
      Array.isArray(item.slot) ? item.slot[0] : item.slot;

    const result: { item: EquippedItem; changed: boolean }[] = base.items.equipped.map((item) => ({
      item,
      changed: false,
    }));

    for (const adjustment of matching) {
      // adjustment.data is typed as the full CreatureData (real adjustments always go through
      // creatureFactory.setAdjustments, which fully populates it via getData()), but
      // documentation.service.test.ts fixtures construct adjustments via `as unknown as` casts
      // that skip that and leave nested collections genuinely undefined at runtime - keep the
      // optional chain.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const item of adjustment.data.items?.equipped ?? []) {
        const existingIndex = isSingleSlot(item)
          ? result.findIndex(
              (r) => isSingleSlot(r.item) && singleSlotValue(r.item) === singleSlotValue(item),
            )
          : -1;
        if (existingIndex !== -1) {
          const changed = result[existingIndex].item.file !== item.file;
          result[existingIndex] = { item, changed };
        } else {
          result.push({ item, changed: true });
        }
      }
    }

    return result;
  }

  private getImmunities(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { name: ImmunityName; changed: boolean }[] {
    const granted = new Set<ImmunityName>(base.immunities);
    for (const adjustment of matching) {
      // See getEquipped's comment above - test fixtures can leave this undefined at runtime
      // despite the non-optional type.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const name of adjustment.data.immunities ?? []) granted.add(name);
    }
    return [...granted]
      .map((name) => ({ name, changed: !base.immunities.includes(name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // An adjustment's authored memorizedCount for a spell the base already has is a delta on top of
  // the base's own count (not an absolute replacement) - e.g. base has 1, an adjustment authored
  // with memorizedCount: 1 means "+1", i.e. an effective count of 2. Later adjustments win over
  // earlier ones (same fold order as every other field here), but their deltas don't stack: only
  // the latest adjustment's own delta is added to the base count. A spell the base doesn't have at
  // all has no base count to add to, so the adjustment's authored value is the effective count
  // directly (base 0 + delta).
  private getMemorized(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { spell: MemorizedSpell; changed: boolean }[] {
    const baseByFile = new Map(base.spells.memorized.map((s) => [s.file, s]));
    const deltaByFile = new Map<string, MemorizedSpell>();
    for (const adjustment of matching) {
      // See getEquipped's comment above - test fixtures can leave this undefined at runtime
      // despite the non-optional type.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const spell of adjustment.data.spells?.memorized ?? [])
        deltaByFile.set(spell.file, spell);
    }
    const files = new Set([...baseByFile.keys(), ...deltaByFile.keys()]);
    return [...files]
      .map((file) => {
        const baseSpell = baseByFile.get(file);
        const delta = deltaByFile.get(file);
        const baseCount = baseSpell?.memorizedCount ?? 0;
        const effectiveCount = baseCount + (delta?.memorizedCount ?? 0);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const spell = delta ? { ...delta, memorizedCount: effectiveCount } : baseSpell!;
        return { spell, changed: effectiveCount !== baseCount };
      })
      .sort((a, b) => a.spell.file.localeCompare(b.spell.file));
  }

  // A flat one-field-per-line OR chain over every trackable field - each check is independent and
  // self-contained (no shared state, no nesting), same reasoning as adjustment rendering's own
  // field dispatch previously here.
  private hasVisibleChanges(effective: EffectiveAdjustment): boolean {
    return (
      effective.noWeapon || // eslint-disable-line sonarjs/expression-complexity
      effective.level.changed ||
      effective.hp.changed ||
      effective.thac0.changed ||
      effective.ac.changed ||
      effective.apr.changed ||
      effective.movement.changed ||
      effective.morale.changed ||
      effective.alignment.changed ||
      effective.size.changed ||
      effective.strength.changed ||
      effective.exceptionalStrength.changed ||
      effective.dexterity.changed ||
      effective.constitution.changed ||
      effective.intelligence.changed ||
      effective.wisdom.changed ||
      effective.charisma.changed ||
      effective.equipped.some((e) => e.changed) ||
      effective.immunities.some((i) => i.changed) ||
      effective.memorized.some((m) => m.changed)
    );
  }

  private group(effectives: EffectiveAdjustment[]): EffectiveAdjustment[] {
    const bySignature = new Map<string, EffectiveAdjustment>();
    const order: string[] = [];
    for (const effective of effectives) {
      const { files, ...rest } = effective;
      const signature = JSON.stringify(rest);
      const existing = bySignature.get(signature);
      if (existing) {
        existing.files.push(...files);
      } else {
        bySignature.set(signature, { ...effective, files: [...files] });
        order.push(signature);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return order.map((signature) => bySignature.get(signature)!);
  }
}

const adjustmentService = new AdjustmentService();
export default adjustmentService;

import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature } from "../../model/creature/creature";
import { CreatureData, MemorizedSpell } from "../../model/creature/data";
import { EquippedItem } from "../../model/creature/item";
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
    return this.group(perFile.filter((effective) => this.hasVisibleChanges(effective)));
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
      level: this.field(this.lastDefined(matching, (d) => d.level1?.pnpValue), base.level1.pnpValue),
      hp: this.field(this.lastDefined(matching, (d) => d.hp), base.hp),
      thac0: this.field(this.lastDefined(matching, (d) => d.thac0), base.thac0),
      ac: this.getAc(matching, creature),
      apr: this.getApr(matching, creature),
      movement: this.field(
        this.lastDefined(matching, (d) => d.movement?.pnpValue),
        base.movement.pnpValue,
      ),
      morale: this.field(this.lastDefined(matching, (d) => d.morale), base.morale),
      alignment: this.field(this.lastDefined(matching, (d) => d.alignment), base.alignment),
      size: this.field(this.lastDefined(matching, (d) => d.size), base.size),
      xpv: this.field(this.lastDefined(matching, (d) => d.xpv), base.xpv),
      strength: this.field(this.lastDefined(matching, (d) => d.strength), base.strength),
      exceptionalStrength: this.field(
        this.lastDefined(matching, (d) => d.exceptionalStrength),
        base.exceptionalStrength,
      ),
      dexterity: this.field(this.lastDefined(matching, (d) => d.dexterity), base.dexterity),
      constitution: this.field(
        this.lastDefined(matching, (d) => d.constitution),
        base.constitution,
      ),
      intelligence: this.field(
        this.lastDefined(matching, (d) => d.intelligence),
        base.intelligence,
      ),
      wisdom: this.field(this.lastDefined(matching, (d) => d.wisdom), base.wisdom),
      charisma: this.field(this.lastDefined(matching, (d) => d.charisma), base.charisma),
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
    const value = overridden === undefined ? base : overridden;
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
    return this.field(this.lastDefined(matching, (d) => d.ac), base);
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

  private slotKey(item: EquippedItem): string {
    return Array.isArray(item.slot) ? item.slot.join(",") : item.slot;
  }

  private getEquipped(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { item: EquippedItem; changed: boolean }[] {
    const baseBySlot = new Map(base.items.equipped.map((item) => [this.slotKey(item), item]));
    const bySlot = new Map(baseBySlot);
    for (const adjustment of matching) {
      // adjustment.data is typed as the full CreatureData (real adjustments always go through
      // creatureFactory.setAdjustments, which fully populates it via getData()), but
      // documentation.service.test.ts fixtures construct adjustments via `as unknown as` casts
      // that skip that and leave nested collections genuinely undefined at runtime - keep the
      // optional chain.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const item of adjustment.data.items?.equipped ?? []) {
        bySlot.set(this.slotKey(item), item);
      }
    }
    return [...bySlot.entries()]
      .map(([slot, item]) => ({ item, changed: baseBySlot.get(slot)?.file !== item.file }))
      .sort((a, b) => this.slotKey(a.item).localeCompare(this.slotKey(b.item)));
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

  private getMemorized(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { spell: MemorizedSpell; changed: boolean }[] {
    const baseByFile = new Map(base.spells.memorized.map((s) => [s.file, s]));
    const byFile = new Map(baseByFile);
    for (const adjustment of matching) {
      // See getEquipped's comment above - test fixtures can leave this undefined at runtime
      // despite the non-optional type.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const spell of adjustment.data.spells?.memorized ?? []) byFile.set(spell.file, spell);
    }
    return [...byFile.entries()]
      .map(([file, spell]) => ({
        spell,
        changed: baseByFile.get(file)?.memorizedCount !== spell.memorizedCount,
      }))
      .sort((a, b) => a.spell.file.localeCompare(b.spell.file));
  }

  // A flat one-field-per-line OR chain over every trackable field - each check is independent and
  // self-contained (no shared state, no nesting), same reasoning as adjustment rendering's own
  // field dispatch previously here.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private hasVisibleChanges(effective: EffectiveAdjustment): boolean {
    return (
      effective.noWeapon ||
      effective.level.changed ||
      effective.hp.changed ||
      effective.thac0.changed ||
      effective.ac.changed ||
      effective.apr.changed ||
      effective.movement.changed ||
      effective.morale.changed ||
      effective.alignment.changed ||
      effective.size.changed ||
      effective.xpv.changed ||
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
    return order.map((signature) => bySignature.get(signature) as EffectiveAdjustment);
  }
}

const adjustmentService = new AdjustmentService();
export default adjustmentService;

import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature } from "../../model/creature/creature";
import { CreatureData, MemorizedSpell } from "../../model/creature/data";
import { EquippedItem } from "../../model/creature/item";
import { ImmunityName } from "../../model/final/immunity";
import creatureService from "../creature.service";

export interface AdjustmentDiff {
  files: string[];
  noWeapon: boolean;
  level?: number;
  hp?: number;
  thac0?: number;
  ac?: number;
  apr?: number;
  doubleApr?: boolean;
  movement?: number;
  morale?: number;
  alignment?: string;
  size?: string;
  xpv?: number;
  strength?: number;
  exceptionalStrength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  equipped?: EquippedItem[];
  immunities?: ImmunityName[];
  memorized?: MemorizedSpell[];
}

class AdjustmentService {
  getAdjustmentDiffs(creature: Creature): AdjustmentDiff[] {
    const files = this.getAllFiles(creature.adjustments);
    const perFile = files.map((file) => this.getDiffForFile(creature, file));
    return this.group(perFile.filter((diff) => this.hasChanges(diff)));
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

  private getDiffForFile(creature: Creature, file: string): AdjustmentDiff {
    const matching = creature.adjustments.filter((a) => a.files.includes(file));
    const base = creature.data;

    return {
      files: [file],
      noWeapon: matching.some((a) => a.noWeapon),
      level: this.diff(
        this.lastDefined(matching, (d) => d.level1?.pnpValue),
        base.level1.pnpValue,
      ),
      hp: this.diff(this.lastDefined(matching, (d) => d.hp), base.hp),
      thac0: this.diff(this.lastDefined(matching, (d) => d.thac0), base.thac0),
      ac: this.getAcChange(matching, creature),
      apr: this.diff(this.lastDefined(matching, (d) => d.apr), base.apr),
      doubleApr: this.diff(this.lastDefined(matching, (d) => d.doubleApr), base.doubleApr),
      movement: this.diff(
        this.lastDefined(matching, (d) => d.movement?.pnpValue),
        base.movement.pnpValue,
      ),
      morale: this.diff(this.lastDefined(matching, (d) => d.morale), base.morale),
      alignment: this.diff(this.lastDefined(matching, (d) => d.alignment), base.alignment),
      size: this.diff(this.lastDefined(matching, (d) => d.size), base.size),
      xpv: this.diff(this.lastDefined(matching, (d) => d.xpv), base.xpv),
      strength: this.diff(this.lastDefined(matching, (d) => d.strength), base.strength),
      exceptionalStrength: this.diff(
        this.lastDefined(matching, (d) => d.exceptionalStrength),
        base.exceptionalStrength,
      ),
      dexterity: this.diff(this.lastDefined(matching, (d) => d.dexterity), base.dexterity),
      constitution: this.diff(
        this.lastDefined(matching, (d) => d.constitution),
        base.constitution,
      ),
      intelligence: this.diff(
        this.lastDefined(matching, (d) => d.intelligence),
        base.intelligence,
      ),
      wisdom: this.diff(this.lastDefined(matching, (d) => d.wisdom), base.wisdom),
      charisma: this.diff(this.lastDefined(matching, (d) => d.charisma), base.charisma),
      equipped: this.getEquippedChange(matching, base),
      immunities: this.getImmunitiesChange(matching, base),
      memorized: this.getMemorizedChange(matching, base),
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

  private diff<T>(effective: T | undefined, base: T | undefined): T | undefined {
    if (effective === undefined) return undefined;
    return effective === base ? undefined : effective;
  }

  // creatureService.checkData runs checkDexterityArmorClassBonus on every adjustment's own data
  // using only that adjustment's own dexterity (never falling back to the base creature's), so an
  // adjustment's folded `ac` is already the final value - no bonus reconstruction needed here,
  // just a direct compare against the base's own displayed final AC.
  private getAcChange(matching: CreatureAdjustment[], creature: Creature): number | undefined {
    const ac = this.lastDefined(matching, (d) => d.ac);
    if (ac === undefined) return undefined;
    const baseFinal = creatureService.getFinalArmorClass(creature);
    return ac === baseFinal ? undefined : ac;
  }

  private slotKey(item: EquippedItem): string {
    return Array.isArray(item.slot) ? item.slot.join(",") : item.slot;
  }

  private getEquippedChange(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): EquippedItem[] | undefined {
    const bySlot = new Map<string, EquippedItem>();
    for (const adjustment of matching) {
      // adjustment.data is typed as the full CreatureData (real adjustments always go through
      // creatureFactory.setAdjustments, which fully populates it via getData()), but doc-service
      // test fixtures construct adjustments via `as unknown as` casts that skip that and leave
      // nested collections genuinely undefined at runtime - keep the optional chain.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const item of adjustment.data.items?.equipped ?? []) {
        bySlot.set(this.slotKey(item), item);
      }
    }
    if (bySlot.size === 0) return undefined;
    const baseBySlot = new Map(base.items.equipped.map((item) => [this.slotKey(item), item]));
    const changed = [...bySlot.entries()]
      .filter(([slot, item]) => baseBySlot.get(slot)?.file !== item.file)
      .map(([, item]) => item)
      .sort((a, b) => this.slotKey(a).localeCompare(this.slotKey(b)));
    return changed.length ? changed : undefined;
  }

  private getImmunitiesChange(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): ImmunityName[] | undefined {
    const granted = new Set<ImmunityName>();
    for (const adjustment of matching) {
      // See getEquippedChange's comment above - test fixtures can leave this undefined at
      // runtime despite the non-optional type.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const name of adjustment.data.immunities ?? []) granted.add(name);
    }
    const added = [...granted].filter((name) => !base.immunities.includes(name)).sort();
    return added.length ? added : undefined;
  }

  private getMemorizedChange(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): MemorizedSpell[] | undefined {
    const byFile = new Map<string, MemorizedSpell>();
    for (const adjustment of matching) {
      // See getEquippedChange's comment above - test fixtures can leave this undefined at
      // runtime despite the non-optional type.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const spell of adjustment.data.spells?.memorized ?? []) byFile.set(spell.file, spell);
    }
    if (byFile.size === 0) return undefined;
    const baseByFile = new Map(base.spells.memorized.map((s) => [s.file, s]));
    const changed = [...byFile.entries()]
      .filter(([file, spell]) => baseByFile.get(file)?.memorizedCount !== spell.memorizedCount)
      .map(([, spell]) => spell)
      .sort((a, b) => a.file.localeCompare(b.file));
    return changed.length ? changed : undefined;
  }

  private hasChanges(diff: AdjustmentDiff): boolean {
    return (
      diff.noWeapon ||
      diff.level !== undefined ||
      diff.hp !== undefined ||
      diff.thac0 !== undefined ||
      diff.ac !== undefined ||
      diff.apr !== undefined ||
      diff.doubleApr !== undefined ||
      diff.movement !== undefined ||
      diff.morale !== undefined ||
      diff.alignment !== undefined ||
      diff.size !== undefined ||
      diff.xpv !== undefined ||
      diff.strength !== undefined ||
      diff.exceptionalStrength !== undefined ||
      diff.dexterity !== undefined ||
      diff.constitution !== undefined ||
      diff.intelligence !== undefined ||
      diff.wisdom !== undefined ||
      diff.charisma !== undefined ||
      diff.equipped !== undefined ||
      diff.immunities !== undefined ||
      diff.memorized !== undefined
    );
  }

  private group(diffs: AdjustmentDiff[]): AdjustmentDiff[] {
    const bySignature = new Map<string, AdjustmentDiff>();
    const order: string[] = [];
    for (const diff of diffs) {
      const { files, ...rest } = diff;
      const signature = JSON.stringify(rest);
      const existing = bySignature.get(signature);
      if (existing) {
        existing.files.push(...files);
      } else {
        bySignature.set(signature, { ...diff, files: [...files] });
        order.push(signature);
      }
    }
    return order.map((signature) => bySignature.get(signature) as AdjustmentDiff);
  }
}

const adjustmentService = new AdjustmentService();
export default adjustmentService;

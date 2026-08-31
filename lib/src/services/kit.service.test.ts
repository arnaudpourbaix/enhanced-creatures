import { describe, expect, it, vi } from "vitest";
import { BaseCreature, Creature } from "../model/creature/creature";
import { KitAbility } from "../model/creature/kit";
import kitService from "./kit.service";

function fakeCreature(
  p: {
    kit?: string;
    level1?: number;
    immunities?: string[];
    abilities?: { resource: string }[];
    adjustments?: unknown[];
  } = {},
): Creature {
  return {
    name: "common.potion.use",
    data: {
      kit: p.kit,
      level1: { pnpValue: p.level1 ?? 1, value: p.level1 ?? 1, type: "none" },
      immunities: p.immunities ?? [],
      spells: { memorized: [] },
    },
    behavior: { abilities: p.abilities ?? [] },
    adjustments: p.adjustments ?? [],
    setBehavior: vi.fn(),
  } as unknown as Creature;
}

function fakeAdjustment(p: {
  files: string[];
  kit?: string;
  level1?: number;
}): BaseCreature & { files: string[] } {
  return {
    files: p.files,
    data: {
      kit: p.kit,
      level1:
        p.level1 !== undefined ? { pnpValue: p.level1, value: p.level1, type: "none" } : undefined,
      immunities: [],
      spells: { memorized: [] },
    },
  } as unknown as BaseCreature & { files: string[] };
}

function fakeBaseCreature(
  p: {
    kit?: string;
    level1?: number;
    immunities?: string[];
    removeMemorized?: boolean | string[];
  } = {},
): BaseCreature {
  return {
    data: {
      kit: p.kit,
      level1:
        p.level1 !== undefined ? { pnpValue: p.level1, value: p.level1, type: "none" } : undefined,
      immunities: p.immunities,
      spells: { memorized: [], removeMemorized: p.removeMemorized },
    },
  } as unknown as BaseCreature;
}

function fakeAbility(
  p: {
    resource?: string;
    count?: (level: number) => number;
  } = {},
): KitAbility {
  return {
    resource: p.resource ?? "SPCL152",
    count: p.count ?? (() => 1),
  };
}

describe("applyKit", () => {
  it("does nothing when neither the creature nor base has a kit registered in KITS", () => {
    const creature = fakeCreature({ kit: "TRUECLASS" });
    kitService.applyKit(creature, undefined);
    // creature.setBehavior is a vi.fn() mock (see fakeCreature()), not a bound Creature method -
    // the rule can't see past the static Creature type to know that.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(creature.setBehavior).not.toHaveBeenCalled();
  });

  it("does nothing when data.kit is unset", () => {
    const creature = fakeCreature();
    kitService.applyKit(creature, undefined);
    // creature.setBehavior is a vi.fn() mock (see fakeCreature()), not a bound Creature method -
    // the rule can't see past the static Creature type to know that.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(creature.setBehavior).not.toHaveBeenCalled();
  });

  it("applies the root kit's immunities and abilities for the main creature (no baseCreature)", () => {
    const creature = fakeCreature({ kit: "BARBARIAN", level1: 5 });
    kitService.applyKit(creature, undefined);
    expect(creature.data.immunities).toContain("backstab");
    // eslint-disable-next-line @typescript-eslint/unbound-method -- see the note above.
    expect(creature.setBehavior).toHaveBeenCalledWith({
      abilities: [{ preset: "SPCL152" }],
    });
  });

  it("applies the root kit at the adjustment's level when the adjustment has no kit override", () => {
    const creature = fakeCreature({ kit: "BERSERKER", level1: 1 });
    const adjustment = fakeBaseCreature({ level1: 9 });
    kitService.applyKit(creature, adjustment);
    // BerserkerRage count(level) = 1 + floor((level-1)/4)
    // adjustment (level 9) count=3, minus creature's own level (1) count=1 -> delta of 2
    expect(adjustment.data.spells.memorized).toEqual([
      // expect.any() is typed `any` by vitest itself.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { file: expect.any(String), memorizedCount: 2 },
    ]);
  });

  it("inherits the level from an earlier adjustment sharing a file when the kit block sets none", () => {
    const creature = fakeCreature({ level1: 2 });
    const levelBlock = fakeAdjustment({ files: ["TAZOK", "TAZOK2", "L#CHIEN"], level1: 9 });
    const kitBlock = fakeAdjustment({ files: ["TAZOK", "TAZOK2"], kit: "BERSERKER" });
    creature.adjustments = [levelBlock, kitBlock] as unknown as Creature["adjustments"];
    kitService.applyKit(creature, kitBlock);
    // BerserkerRage count(level) = 1 + floor((level-1)/4); at the inherited level 9 -> 3.
    // The kit block sets its own kit, so no own-level subtraction applies.
    expect(kitBlock.data.spells.memorized).toEqual([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { file: expect.any(String), memorizedCount: 3 },
    ]);
  });

  it("subtracts the previous overlapping block's level, not the base level, for stacked leveled blocks", () => {
    const creature = fakeCreature({ kit: "BERSERKER", level1: 4 });
    const chieftain = fakeAdjustment({ files: ["A", "B"], level1: 7 });
    const veteran = fakeAdjustment({ files: ["B"], level1: 9 });
    creature.adjustments = [chieftain, veteran] as unknown as Creature["adjustments"];
    kitService.applyKit(creature, veteran);
    // BerserkerRage count: c(9)=3, c(7)=2 -> delta 1 (not c(9)-c(4)=2)
    expect(veteran.data.spells.memorized).toEqual([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { file: expect.any(String), memorizedCount: 1 },
    ]);
  });

  it("adds nothing for a later block that neither raises the inherited level nor changes the kit", () => {
    const creature = fakeCreature({ kit: "BERSERKER", level1: 4 });
    const chieftain = fakeAdjustment({ files: ["A", "B"], level1: 7 });
    const acOnly = fakeAdjustment({ files: ["B"] });
    creature.adjustments = [chieftain, acOnly] as unknown as Creature["adjustments"];
    kitService.applyKit(creature, acOnly);
    expect(acOnly.data.spells.memorized).toEqual([]);
  });

  it("emits the incremental rage count for a later level-only block once an earlier block set the kit", () => {
    const creature = fakeCreature({ kit: "TRUECLASS", level1: 2 });
    const levelNine = fakeAdjustment({ files: ["TAZOK", "TAZOK2", "L#CHIEN"], level1: 9 });
    const kitBlock = fakeAdjustment({ files: ["TAZOK", "TAZOK2"], kit: "BERSERKER" });
    const levelNineteen = fakeAdjustment({ files: ["TAZOK"], level1: 19 });
    creature.adjustments = [
      levelNine,
      kitBlock,
      levelNineteen,
    ] as unknown as Creature["adjustments"];

    kitService.applyKit(creature, kitBlock);
    kitService.applyKit(creature, levelNineteen);

    // kit block sets the kit -> full count(9) = 3
    expect(kitBlock.data.spells.memorized).toEqual([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { file: expect.any(String), memorizedCount: 3 },
    ]);
    // level-19 block inherits BERSERKER -> count(19) - count(9) = 5 - 3 = 2
    expect(levelNineteen.data.spells.memorized).toEqual([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { file: expect.any(String), memorizedCount: 2 },
    ]);
  });

  it("emits nothing for a later level-only block whose level does not raise the inherited kit's count", () => {
    const creature = fakeCreature({ kit: "TRUECLASS", level1: 2 });
    const levelNine = fakeAdjustment({ files: ["TAZOK", "TAZOK2"], level1: 9 });
    const kitBlock = fakeAdjustment({ files: ["TAZOK", "TAZOK2"], kit: "BERSERKER" });
    const levelEleven = fakeAdjustment({ files: ["TAZOK2"], level1: 11 });
    creature.adjustments = [
      levelNine,
      kitBlock,
      levelEleven,
    ] as unknown as Creature["adjustments"];

    kitService.applyKit(creature, levelEleven);

    // count(11) - count(9) = 3 - 3 = 0
    expect(levelEleven.data.spells.memorized).toEqual([]);
  });

  it("removes the root kit's abilities from the adjustment and applies the child kit when they differ", () => {
    const creature = fakeCreature({ kit: "BERSERKER", level1: 5 });
    const adjustment = fakeBaseCreature({ kit: "BARBARIAN", level1: 5 });
    kitService.applyKit(creature, adjustment);
    expect(adjustment.data.spells.removeMemorized).toEqual([expect.any(String)]);
    expect(adjustment.data.immunities).toContain("backstab");
  });
});

describe("removeKit", () => {
  it("throws when removeMemorized is already a boolean", () => {
    const baseCreature = fakeBaseCreature({ removeMemorized: true });
    expect(() => {
      kitService.removeKit(baseCreature, {
        name: "BERSERKER",
        immunities: () => [],
        movement: () => 0,
        abilities: [fakeAbility({ resource: "SPWI999" })],
      });
    }).toThrow("removeMemorized already set");
  });

  it("initializes removeMemorized to an array and pushes ability resources when unset", () => {
    const baseCreature = fakeBaseCreature({});
    kitService.removeKit(baseCreature, {
      name: "BERSERKER",
      immunities: () => [],
      movement: () => 0,
      abilities: [fakeAbility({ resource: "SPWI001" }), fakeAbility({ resource: "SPWI002" })],
    });
    expect(baseCreature.data.spells.removeMemorized).toEqual(["SPWI001", "SPWI002"]);
  });

  it("pushes onto an existing removeMemorized array", () => {
    const baseCreature = fakeBaseCreature({ removeMemorized: ["SPWI000"] });
    kitService.removeKit(baseCreature, {
      name: "BERSERKER",
      immunities: () => [],
      movement: () => 0,
      abilities: [fakeAbility({ resource: "SPWI001" })],
    });
    expect(baseCreature.data.spells.removeMemorized).toEqual(["SPWI000", "SPWI001"]);
  });
});

describe("applyKitImmunities", () => {
  it("initializes baseCreature.data.immunities when unset", () => {
    const creature = fakeCreature({ immunities: [] });
    const baseCreature = fakeBaseCreature({ immunities: undefined });
    kitService.applyKitImmunities(creature, baseCreature, ["backstab"]);
    expect(baseCreature.data.immunities).toEqual(["backstab"]);
  });

  it("skips an immunity already present on the creature (not the baseCreature)", () => {
    const creature = fakeCreature({ immunities: ["backstab"] });
    const baseCreature = fakeBaseCreature({ immunities: [] });
    kitService.applyKitImmunities(creature, baseCreature, ["backstab"]);
    expect(baseCreature.data.immunities).toEqual([]);
  });

  it("skips an immunity already present on baseCreature itself, even if absent from the creature", () => {
    const creature = fakeCreature({ immunities: [] });
    const baseCreature = fakeBaseCreature({ immunities: ["backstab"] });
    kitService.applyKitImmunities(creature, baseCreature, ["backstab"]);
    expect(baseCreature.data.immunities).toEqual(["backstab"]);
  });
});

describe("applyKitAbilities", () => {
  it("uses the full ability count when baseCreature has its own kit", () => {
    const creature = fakeCreature({ level1: 1 });
    const baseCreature = fakeBaseCreature({ kit: "BARBARIAN", level1: 9 });
    kitService.applyKitAbilities(
      creature,
      baseCreature,
      [fakeAbility({ resource: "SPCL152", count: (level) => level })],
      9,
    );
    expect(baseCreature.data.spells.memorized).toEqual([{ file: "SPCL152", memorizedCount: 9 }]);
  });

  it("subtracts the creature's own-level count when baseCreature has no kit (adjustment inheriting root kit)", () => {
    const creature = fakeCreature({ level1: 1 });
    const baseCreature = fakeBaseCreature({ kit: undefined, level1: 9 });
    kitService.applyKitAbilities(
      creature,
      baseCreature,
      [fakeAbility({ resource: "SPCL152", count: (level) => level })],
      9,
    );
    // count(9) - count(creature's level1.pnpValue=1) = 9 - 1 = 8
    expect(baseCreature.data.spells.memorized).toEqual([{ file: "SPCL152", memorizedCount: 8 }]);
  });

  it("does not push a memorized entry when the resulting count is not positive", () => {
    const creature = fakeCreature({ level1: 9 });
    const baseCreature = fakeBaseCreature({ kit: undefined, level1: 9 });
    kitService.applyKitAbilities(
      creature,
      baseCreature,
      [fakeAbility({ resource: "SPCL152", count: (level) => level })],
      9,
    );
    // count(9) - count(9) = 0, not > 0
    expect(baseCreature.data.spells.memorized).toEqual([]);
  });

  it("skips setBehavior when the creature already has an ability with this resource", () => {
    const creature = fakeCreature({ abilities: [{ resource: "SPCL152" }] });
    const baseCreature = fakeBaseCreature({ kit: "BARBARIAN", level1: 1 });
    kitService.applyKitAbilities(creature, baseCreature, [fakeAbility({ resource: "SPCL152" })], 1);
    // creature.setBehavior is a vi.fn() mock (see fakeCreature()), not a bound Creature method -
    // the rule can't see past the static Creature type to know that.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(creature.setBehavior).not.toHaveBeenCalled();
  });

  it("calls setBehavior when the creature does not already have this ability", () => {
    const creature = fakeCreature({ abilities: [] });
    const baseCreature = fakeBaseCreature({ kit: "BARBARIAN", level1: 1 });
    const ability = fakeAbility({ resource: "SPCL152" });
    kitService.applyKitAbilities(creature, baseCreature, [ability], 1);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- see the note above.
    expect(creature.setBehavior).toHaveBeenCalledWith({
      abilities: [{ preset: "SPCL152" }],
    });
  });
});

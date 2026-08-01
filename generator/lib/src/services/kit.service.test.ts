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
  } = {},
): Creature {
  return {
    data: {
      kit: p.kit,
      level1: { pnpValue: p.level1 ?? 1, value: p.level1 ?? 1, type: "none" },
      immunities: p.immunities ?? [],
      spells: { memorized: [] },
    },
    behavior: { abilities: p.abilities ?? [] },
    setBehavior: vi.fn(),
  } as unknown as Creature;
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
    spellResource?: string;
    hasSpell?: boolean;
  } = {},
): KitAbility {
  return {
    resource: p.resource ?? "SPWI001",
    count: p.count ?? (() => 1),
    ability: {
      name: 12345,
      spell: p.hasSpell === false ? undefined : { resource: p.spellResource },
    },
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
      abilities: [expect.objectContaining({ name: "ability.enrage" })],
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
      [fakeAbility({ resource: "SPWI001", count: (level) => level })],
      9,
    );
    expect(baseCreature.data.spells.memorized).toEqual([{ file: "SPWI001", memorizedCount: 9 }]);
  });

  it("subtracts the creature's own-level count when baseCreature has no kit (adjustment inheriting root kit)", () => {
    const creature = fakeCreature({ level1: 1 });
    const baseCreature = fakeBaseCreature({ kit: undefined, level1: 9 });
    kitService.applyKitAbilities(
      creature,
      baseCreature,
      [fakeAbility({ resource: "SPWI001", count: (level) => level })],
      9,
    );
    // count(9) - count(creature's level1.pnpValue=1) = 9 - 1 = 8
    expect(baseCreature.data.spells.memorized).toEqual([{ file: "SPWI001", memorizedCount: 8 }]);
  });

  it("does not push a memorized entry when the resulting count is not positive", () => {
    const creature = fakeCreature({ level1: 9 });
    const baseCreature = fakeBaseCreature({ kit: undefined, level1: 9 });
    kitService.applyKitAbilities(
      creature,
      baseCreature,
      [fakeAbility({ resource: "SPWI001", count: (level) => level })],
      9,
    );
    // count(9) - count(9) = 0, not > 0
    expect(baseCreature.data.spells.memorized).toEqual([]);
  });

  it("defaults the ability's spell resource when the spell has no resource of its own", () => {
    const creature = fakeCreature();
    const baseCreature = fakeBaseCreature({ kit: "BARBARIAN", level1: 1 });
    const ability = fakeAbility({ resource: "SPWI001", hasSpell: true });
    kitService.applyKitAbilities(creature, baseCreature, [ability], 1);
    expect(ability.ability.spell?.resource).toBe("SPWI001");
  });

  it("does not overwrite an already-set spell resource", () => {
    const creature = fakeCreature();
    const baseCreature = fakeBaseCreature({ kit: "BARBARIAN", level1: 1 });
    const ability = fakeAbility({
      resource: "SPWI001",
      spellResource: "SPWI999",
    });
    kitService.applyKitAbilities(creature, baseCreature, [ability], 1);
    expect(ability.ability.spell?.resource).toBe("SPWI999");
  });

  it("skips setBehavior when the creature already has an ability with this resource", () => {
    const creature = fakeCreature({ abilities: [{ resource: "SPWI001" }] });
    const baseCreature = fakeBaseCreature({ kit: "BARBARIAN", level1: 1 });
    kitService.applyKitAbilities(creature, baseCreature, [fakeAbility({ resource: "SPWI001" })], 1);
    // creature.setBehavior is a vi.fn() mock (see fakeCreature()), not a bound Creature method -
    // the rule can't see past the static Creature type to know that.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(creature.setBehavior).not.toHaveBeenCalled();
  });

  it("calls setBehavior when the creature does not already have this ability", () => {
    const creature = fakeCreature({ abilities: [] });
    const baseCreature = fakeBaseCreature({ kit: "BARBARIAN", level1: 1 });
    const ability = fakeAbility({ resource: "SPWI001" });
    kitService.applyKitAbilities(creature, baseCreature, [ability], 1);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- see the note above.
    expect(creature.setBehavior).toHaveBeenCalledWith({
      abilities: [ability.ability],
    });
  });
});

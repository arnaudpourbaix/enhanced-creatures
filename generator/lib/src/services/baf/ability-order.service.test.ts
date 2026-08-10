import { describe, expect, it, vi } from "vitest";
import { Creature } from "../../model/creature/creature";
import { MainCreatureData } from "../../model/creature/data";
import { AbilityEntry, CreatureAbility, RawCreatureAbility } from "../../model/creature/ability";
import abilityOrderService from "./ability-order.service";
import { SPELL_PRIORITY_ORDER } from "../../../config/spell-priority-order";
import logService from "../log.service";

function fakeCreature(
  p: {
    memorized?: { file: string }[];
    entries?: AbilityEntry[];
    customSpells?: { id: number; file: string; ability: RawCreatureAbility }[];
    behaviorAbilities?: CreatureAbility[];
    customCodeAbilities?: CreatureAbility[][];
  } = {},
): Creature {
  const creature = new Creature(1);
  creature.name = "common.potion.use";
  creature.data = { spells: { memorized: p.memorized ?? [] } } as unknown as MainCreatureData;
  creature.adjustments = [];
  creature.pendingAbilityEntries = p.entries;
  creature.spells = (p.customSpells ?? []).map((s) => ({
    id: s.id,
    file: s.file,
    ability: s.ability,
  })) as unknown as Creature["spells"];
  creature.behavior = {
    abilities: p.behaviorAbilities ?? [],
    customCodes: (p.customCodeAbilities ?? []).map((abilities) => ({ abilities })),
  } as unknown as Creature["behavior"];
  return creature;
}

function fakeAbility(resource: string): CreatureAbility {
  return { resource, actions: [], triggers: [], targets: [] } as unknown as CreatureAbility;
}

describe("resolve", () => {
  it("orders memorized spells by their SPELL_PRIORITY_ORDER index", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-a", "test-priority-b");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-b" }, { file: "test-priority-a" }],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "test-priority-a" },
        { preset: "test-priority-b" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("returns an empty array when nothing is memorized", () => {
    const creature = fakeCreature();
    expect(abilityOrderService.resolve(creature)).toEqual([]);
  });

  it("excludes a spell-exception's file from the auto block and inserts it via its own directive", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-c", "test-priority-d");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-c" }, { file: "test-priority-d" }],
        entries: [{ spell: { file: "test-priority-d" }, insertFirst: true }],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "test-priority-d" },
        { preset: "test-priority-c" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("appends a custom abilityId entry at the end with insertLast", () => {
    const creature = fakeCreature({
      memorized: [],
      customSpells: [{ id: 7, file: "custom-spell-file", ability: { preset: "custom-ability-preset" } }],
      entries: [{ abilityId: 7, insertLast: true }],
    });
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: "custom-ability-preset" }]);
  });

  it("excludes a custom abilityId entry's own memorized file from the auto block (memorizedCount auto-push case)", () => {
    // Creature.addSpell pushes to data.spells.memorized whenever memorizedCount is set,
    // even for custom addSpell-created abilities - so a custom ability's own generated
    // file can legitimately appear in memorizedSpellFiles(). It must not be double-processed
    // (once via its entries position, once via auto-derivation, which would also spuriously
    // error since custom files are never registered in SPELL_PRIORITY_ORDER).
    const creature = fakeCreature({
      memorized: [{ file: "custom-spell-file-x" }],
      customSpells: [
        { id: 5, file: "custom-spell-file-x", ability: { preset: "custom-ability-preset" } },
      ],
      entries: [{ abilityId: 5, insertFirst: true }],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: "custom-ability-preset" }]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("inserts a custom abilityId entry before a memorized spell via insertBefore", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-e");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-e" }],
        customSpells: [
          { id: 9, file: "custom-spell-file-2", ability: { preset: "custom-ability-preset" } },
        ],
        entries: [{ abilityId: 9, insertBefore: "test-priority-e" }],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "custom-ability-preset" },
        { preset: "test-priority-e" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("resolves an insertAfter anchor pointing at a custom abilityId entry by its own spell file, not its ability's preset field", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-h");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-h" }],
        customSpells: [
          // this custom ability's own generated file differs from what it actually casts
          // (preset borrows another spell's config) - the GreaterMummyFearAura pattern.
          { id: 13, file: "custom-spell-file-a", ability: { preset: "unrelated-borrowed-preset" } },
          { id: 14, file: "custom-spell-file-b", ability: { preset: "second-custom-preset" } },
        ],
        entries: [
          { abilityId: 13, insertFirst: true },
          { abilityId: 14, insertAfter: 13 },
        ],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "unrelated-borrowed-preset" },
        { preset: "second-custom-preset" },
        { preset: "test-priority-h" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("resolves an anchor value of 0 correctly instead of treating it as unset", () => {
    const creature = fakeCreature({
      customSpells: [
        { id: 0, file: "custom-spell-file-zero", ability: { preset: "zero-preset" } },
        { id: 1, file: "custom-spell-file-one", ability: { preset: "one-preset" } },
      ],
      entries: [
        { abilityId: 0, insertFirst: true },
        { abilityId: 1, insertBefore: 0 },
      ],
    });
    expect(abilityOrderService.resolve(creature)).toEqual([
      { preset: "one-preset" },
      { preset: "zero-preset" },
    ]);
  });

  it("warns and casts last a memorized spell missing from SPELL_PRIORITY_ORDER, rather than dropping it", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-first");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "not-in-priority-order" }, { file: "test-priority-first" }],
      });
      const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "test-priority-first" },
        { preset: "not-in-priority-order" },
      ]);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("not-in-priority-order"));
      warnSpy.mockRestore();
    } finally {
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("errors and appends at the end when an insertBefore anchor doesn't resolve", () => {
    const creature = fakeCreature({
      memorized: [],
      customSpells: [{ id: 20, file: "custom-file", ability: { preset: "custom-preset" } }],
      entries: [{ abilityId: 20, insertBefore: "does-not-exist" }],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: "custom-preset" }]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("does-not-exist"));
    errorSpy.mockRestore();
  });

  it("throws when an entry sets neither spell nor abilityId", () => {
    const creature = fakeCreature({ entries: [{ insertFirst: true }] });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/exactly one/);
  });

  it("throws when an entry sets both spell and abilityId", () => {
    const creature = fakeCreature({
      entries: [{ spell: { file: "x" }, abilityId: 1, insertFirst: true }],
    });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/exactly one/);
  });

  it("throws when an entry sets more than one position directive", () => {
    const creature = fakeCreature({
      entries: [{ spell: { file: "x" }, insertFirst: true, insertLast: true }],
    });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/at most one/);
  });

  it("excludes a memorized spell already covered by an existing plain-array ability, with no entries at all", () => {
    // A creature that only ever used the legacy plain-array form (no `entries`, so
    // pendingAbilityEntries stays undefined) must still get its already-covered memorized
    // spells excluded from auto-derivation - resolve() now runs unconditionally.
    const creature = fakeCreature({
      memorized: [{ file: "test-priority-covered" }],
      behaviorAbilities: [fakeAbility("test-priority-covered")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("excludes a memorized spell whose ability lives in customCodes[].abilities", () => {
    const creature = fakeCreature({
      memorized: [{ file: "test-priority-customcode" }],
      customCodeAbilities: [[fakeAbility("test-priority-customcode")]],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("auto-derives only the leftover memorized spell when another is already covered by a plain-array ability", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-leftover");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-leftover" }, { file: "test-priority-covered-2" }],
        behaviorAbilities: [fakeAbility("test-priority-covered-2")],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([{ preset: "test-priority-leftover" }]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
    }
  });
});

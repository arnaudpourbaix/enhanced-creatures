import { beforeEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../../model/creature/creature";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import { State } from "../../state";
import logService from "../log.service";
import immunityService from "./immunity.service";

function fakeImmunity(p: Partial<ImmunityConfig>): ImmunityConfig {
  return {
    name: p.name ?? "fire",
    immunities: p.immunities ?? [],
    overrides: p.overrides ?? [],
    itemSlot: p.itemSlot,
  } as unknown as ImmunityConfig;
}

function fakeCreature(
  p: {
    immunities?: ImmunityName[];
    equippedItems?: Creature["data"]["items"]["equipped"];
    items?: Creature["items"];
    adjustments?: Creature["adjustments"];
  } = {},
): Creature {
  return {
    data: {
      immunities: p.immunities ?? [],
      items: { equipped: p.equippedItems ?? [] },
    },
    items: p.items ?? [],
    adjustments: p.adjustments ?? [],
    autoImmunities: [],
  } as unknown as Creature;
}

beforeEach(() => {
  State.immunities = [];
  vi.spyOn(logService, "log").mockImplementation(() => {});
});

describe("handleImmunities", () => {
  it("does nothing when the immunity has no itemSlot", () => {
    State.immunities = [fakeImmunity({ name: "fire" })];
    const creature = fakeCreature({ immunities: ["fire"] });
    immunityService.handleImmunities(creature);
    expect(creature.data.items.equipped).toEqual([]);
  });

  it("adds the immunity's itemSlot to data.items.equipped", () => {
    State.immunities = [
      fakeImmunity({
        name: "fire",
        itemSlot: { file: "fireimm", slot: "HELMET" },
      }),
    ];
    const creature = fakeCreature({ immunities: ["fire"] });
    immunityService.handleImmunities(creature);
    expect(creature.data.items.equipped).toEqual([
      { file: "fireimm", slot: "HELMET" },
    ]);
  });

  it("also adds a helmet when an immunity granting critical-hit immunity uses a non-helmet slot and none is equipped", () => {
    // Mirrors the real config shape: a trait (e.g. "construct") references "criticalHit"
    // in its own `immunities` list and has a non-helmet itemSlot; the terminal
    // "criticalHit" entry itself always carries the HELMET slot.
    State.immunities = [
      fakeImmunity({
        name: "construct",
        immunities: ["criticalHit"],
        itemSlot: { file: "constructimm", slot: "AMULET" },
      }),
      fakeImmunity({
        name: "criticalHit",
        itemSlot: { file: "critimm", slot: "HELMET" },
      }),
    ];
    const creature = fakeCreature({ immunities: ["construct"] });
    immunityService.handleImmunities(creature);
    expect(creature.data.immunities).toEqual(["construct", "criticalHit"]);
    expect(creature.data.items.equipped).toEqual([
      { file: "constructimm", slot: "AMULET" },
      { file: "critimm", slot: "HELMET" },
    ]);
    // Documentation excludes this - it's an engine restriction (crit immunity needs a
    // helmet), not something worth mentioning separately from the "construct" trait.
    expect(creature.autoImmunities).toEqual(["criticalHit"]);
  });

  it("skips adding the helmet when the creature already has one for a critical-hit immunity", () => {
    State.immunities = [
      fakeImmunity({
        name: "construct",
        immunities: ["criticalHit"],
        itemSlot: { file: "constructimm", slot: "AMULET" },
      }),
      fakeImmunity({
        name: "criticalHit",
        itemSlot: { file: "critimm", slot: "HELMET" },
      }),
    ];
    const creature = fakeCreature({
      immunities: ["construct"],
      equippedItems: [{ file: "helmet1", slot: "HELMET" }],
    });
    immunityService.handleImmunities(creature);
    expect(creature.data.immunities).toEqual(["construct"]);
    expect(creature.data.items.equipped).toEqual([
      { file: "helmet1", slot: "HELMET" },
      { file: "constructimm", slot: "AMULET" },
    ]);
  });

  it("skips adding the item when another item overwrites this immunity (copyFrom)", () => {
    State.immunities = [
      fakeImmunity({
        name: "fire",
        itemSlot: { file: "fireimm", slot: "AMULET" },
      }),
    ];
    const creature = fakeCreature({
      immunities: ["fire"],
      items: [{ copyFrom: "fire" }] as unknown as Creature["items"],
    });
    immunityService.handleImmunities(creature);
    expect(creature.data.items.equipped).toEqual([]);
  });

  it("skips adding the item when the target slot is already assigned", () => {
    State.immunities = [
      fakeImmunity({
        name: "fire",
        itemSlot: { file: "fireimm", slot: "AMULET" },
      }),
    ];
    const creature = fakeCreature({
      immunities: ["fire"],
      equippedItems: [{ file: "otheramulet", slot: "AMULET" }],
    });
    immunityService.handleImmunities(creature);
    expect(creature.data.items.equipped).toEqual([
      { file: "otheramulet", slot: "AMULET" },
    ]);
  });

  it("skips adding the item when it is already equipped (e.g. cloned via createFrom from an already-validated creature)", () => {
    // Mirrors "construct"'s real shape: itemSlot.slot is an array (JEWEL_SLOTS), so
    // isSlotIncluded() can't catch this via overwrittingSlot - only the exact-file check can.
    State.immunities = [
      fakeImmunity({
        name: "construct",
        itemSlot: { file: "constructimm", slot: ["AMULET", "BELT"] },
      }),
    ];
    const creature = fakeCreature({
      immunities: ["construct"],
      equippedItems: [{ file: "constructimm", slot: ["AMULET", "BELT"] }],
    });
    immunityService.handleImmunities(creature);
    expect(creature.data.items.equipped).toEqual([
      { file: "constructimm", slot: ["AMULET", "BELT"] },
    ]);
  });

  it("also processes adjustments that declare their own immunities", () => {
    State.immunities = [
      fakeImmunity({
        name: "cold",
        itemSlot: { file: "coldimm", slot: "AMULET" },
      }),
    ];
    const creature = fakeCreature({
      adjustments: [
        {
          data: { immunities: ["cold"], items: { equipped: [] } },
          files: [],
        },
      ] as unknown as Creature["adjustments"],
    });
    immunityService.handleImmunities(creature);
    expect(creature.adjustments[0].data.items.equipped).toEqual([
      { file: "coldimm", slot: "AMULET" },
    ]);
  });
});

describe("getOverrides", () => {
  it("collects files from adjustments whose immunities override the given immunity", () => {
    State.immunities = [
      fakeImmunity({ name: "fire", overrides: ["cold"] }),
      fakeImmunity({ name: "acid", overrides: [] }),
    ];
    const adjustments = [
      { data: { immunities: ["fire"] }, files: ["a.itm", "b.itm"] },
      { data: { immunities: ["acid"] }, files: ["c.itm"] },
    ] as unknown as Parameters<typeof immunityService.getOverrides>[1];
    const files = immunityService.getOverrides("cold", adjustments);
    expect(files).toEqual(["a.itm", "b.itm"]);
  });

  it("returns an empty array when no adjustment overrides the immunity", () => {
    State.immunities = [fakeImmunity({ name: "fire", overrides: [] })];
    const adjustments = [
      { data: { immunities: ["fire"] }, files: ["a.itm"] },
    ] as unknown as Parameters<typeof immunityService.getOverrides>[1];
    const files = immunityService.getOverrides("cold", adjustments);
    expect(files).toEqual([]);
  });
});

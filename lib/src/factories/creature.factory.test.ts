import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../model/creature/creature";
import { EquippedItem } from "../model/creature/item";
import { MainCreatureData } from "../model/creature/data";
import { Item } from "../model/spell-item/spell-item";
import { PartialCreatureAdjustment } from "../model/creature/adjustment";
import { MonsterFamilyEnum } from "../../creatures/monster";
import creatureFactory from "./creature.factory";
import logService from "../services/log.service";
import abilityOrderService from "../services/baf/ability-order.service";
import creatureService from "../services/creature.service";
import immunityService from "../services/effects/immunity.service";
import descriptionService from "../services/doc/description.service";
import { State } from "../state";

// Several tests below spy on logService.log without restoring it themselves, relying on getting a
// fresh spy (no leftover call history) in the next test.
afterEach(() => {
  vi.restoreAllMocks();
});

function fakeCreature(): Creature {
  const creature = new Creature(1);
  creature.data = { items: { equipped: [] } } as unknown as MainCreatureData;
  creature.items = [];
  return creature;
}

// Reused across several describe blocks below purely as a placeholder ability/name value - a
// shared constant avoids sonarjs/no-duplicate-string flagging the repeated literal.
const PLACEHOLDER_NAME_KEY = "common.potion.use";

describe("checkValidation", () => {
  it("throws when the creature was already validated", () => {
    const creature = fakeCreature();
    creature.valid = true;
    creature.name = PLACEHOLDER_NAME_KEY;
    expect(() => {
      creatureFactory.checkValidation(creature);
    }).toThrow(/has already been validated/);
  });

  it("does not throw when valid is still unset", () => {
    const creature = fakeCreature();
    creature.valid = undefined;
    expect(() => {
      creatureFactory.checkValidation(creature);
    }).not.toThrow();
  });
});

describe("equipItem", () => {
  it("throws when no slot is given and the item has no equippedSlot either", () => {
    const creature = fakeCreature();
    const item = { file: "itm01", stringRef: 123 } as unknown as Item;
    expect(() => {
      creatureFactory.equipItem(creature, item);
    }).toThrow(/No slot defined for 123/);
  });

  it("pushes the item onto data.items.equipped", () => {
    const creature = fakeCreature();
    const item = { file: "itm01" } as unknown as Item;
    creatureFactory.equipItem(creature, item, ["LRING"]);
    expect(creature.data.items.equipped).toEqual([{ file: "itm01", slot: ["LRING"] }]);
  });

  it("warns when the target slot is already occupied by an item on the creature", () => {
    const creature = fakeCreature();
    const existingItem = { file: "old01", stringRef: 456 } as unknown as Item;
    creature.items.push(existingItem);
    creature.data.items.equipped.push({ file: "old01", slot: ["LRING"] });
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const newItem = { file: "new01" } as unknown as Item;
    creatureFactory.equipItem(creature, newItem, ["LRING"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("already attributed to"));
  });

  it("does not detect the conflict when the existing entry's slot is stored as a bare string rather than an array (known gap, cosmetic-only warning)", () => {
    const creature = fakeCreature();
    const existingItem = { file: "old01", stringRef: 456 } as unknown as Item;
    creature.items.push(existingItem);
    // some real creature configs store slot as a bare string, e.g. ogres.ts:553
    creature.data.items.equipped.push({
      file: "old01",
      slot: "LRING",
    } as unknown as EquippedItem);
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const newItem = { file: "new01" } as unknown as Item;
    creatureFactory.equipItem(creature, newItem, ["LRING"]);
    expect(logSpy).not.toHaveBeenCalled();
    // the item is still equipped regardless - this warning is purely informational
    expect(creature.data.items.equipped).toContainEqual({
      file: "new01",
      slot: ["LRING"],
    });
  });
});

describe("setAdjustments", () => {
  it("uppercases a lowercase files entry, since generated WeiDU STRING_EQUAL_CASE comparisons against creature.files (always uppercase, from creatures.csv) are case-sensitive", () => {
    const creature = fakeCreature();
    const adjustment = { files: ["ghastgsu"] } as unknown as PartialCreatureAdjustment;
    creatureFactory.setAdjustments(creature, [adjustment]);
    expect(creature.adjustments[0].files).toEqual(["GHASTGSU"]);
  });
});

describe("setBehavior", () => {
  it("stores entries as pendingAbilityEntries without resolving them immediately", () => {
    const creature = fakeCreature();
    const entries = [{ spell: { file: "sppr101" }, insertFirst: true as const }];
    creatureFactory.setBehavior(creature, { abilities: { entries } });
    expect(creature.pendingAbilityEntries).toBe(entries);
    expect(creature.behavior.abilities).toEqual([]);
  });

  it("still resolves a plain array eagerly, unchanged from today", () => {
    const creature = fakeCreature();
    creatureFactory.setBehavior(creature, {
      abilities: [{ name: PLACEHOLDER_NAME_KEY, triggers: [], targets: [] }],
    });
    expect(creature.behavior.abilities).toHaveLength(1);
    expect(creature.pendingAbilityEntries).toBeUndefined();
  });
});

describe("resolveAbilities", () => {
  it("appends nothing when there is nothing to auto-derive (no pending entries, nothing memorized)", () => {
    const creature = fakeCreature();
    creature.data = {
      items: { equipped: [] },
      spells: { memorized: [] },
    } as unknown as MainCreatureData;
    creature.behavior = { abilities: [], customCodes: [] } as unknown as Creature["behavior"];
    creatureFactory.resolveAbilities(creature);
    expect(creature.behavior.abilities).toEqual([]);
  });

  it("always calls AbilityOrderService.resolve and appends the result to behavior.abilities, with or without pending entries", () => {
    const creature = fakeCreature();
    creature.behavior = { abilities: [], customCodes: [] } as unknown as Creature["behavior"];
    creature.pendingAbilityEntries = [{ spell: { file: "sppr101" }, insertFirst: true }];
    const resolveSpy = vi
      .spyOn(abilityOrderService, "resolve")
      .mockReturnValue([{ name: PLACEHOLDER_NAME_KEY, triggers: [], targets: [] }]);
    creatureFactory.resolveAbilities(creature);
    expect(resolveSpy).toHaveBeenCalledWith(creature);
    expect(creature.behavior.abilities).toHaveLength(1);
    resolveSpy.mockRestore();
  });

  it("auto-derives a memorized spell even for a creature that never used the entries form", () => {
    const creature = fakeCreature();
    creature.behavior = { abilities: [], customCodes: [] } as unknown as Creature["behavior"];
    const resolveSpy = vi
      .spyOn(abilityOrderService, "resolve")
      .mockReturnValue([{ name: PLACEHOLDER_NAME_KEY, triggers: [], targets: [] }]);
    creatureFactory.resolveAbilities(creature);
    expect(creature.pendingAbilityEntries).toBeUndefined();
    expect(resolveSpy).toHaveBeenCalledWith(creature);
    expect(creature.behavior.abilities).toHaveLength(1);
    resolveSpy.mockRestore();
  });
});

describe("validate", () => {
  afterEach(() => {
    State.creatures.length = 0;
  });

  it("marks the creature invalid when checkDialog fails, even though every other check passes", () => {
    const creature = fakeCreature();
    creature.family = MonsterFamilyEnum.Ankheg;
    creature.files = ["TESTCRE"];
    creature.name = PLACEHOLDER_NAME_KEY;

    vi.spyOn(creatureService, "check").mockImplementation(() => {});
    vi.spyOn(creatureFactory, "resolveAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkSpellAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDuplicateAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDialog").mockReturnValue(false);
    vi.spyOn(immunityService, "handleImmunities").mockImplementation(() => {});

    creatureFactory.validate(creature, MonsterFamilyEnum.Ankheg);

    expect(creature.valid).toBe(false);
  });

  it("keeps the creature valid when checkDialog passes and every other check passes", () => {
    const creature = fakeCreature();
    creature.family = MonsterFamilyEnum.Ankheg;
    creature.files = ["TESTCRE2"];
    creature.name = PLACEHOLDER_NAME_KEY;

    vi.spyOn(creatureService, "check").mockImplementation(() => {});
    vi.spyOn(creatureFactory, "resolveAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkSpellAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDuplicateAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDialog").mockReturnValue(true);
    vi.spyOn(immunityService, "handleImmunities").mockImplementation(() => {});

    creatureFactory.validate(creature, MonsterFamilyEnum.Ankheg);

    expect(creature.valid).toBe(true);
  });
});

import { describe, expect, it, afterEach } from "vitest";
import { EquippedItem, ItemSlot } from "../model/creature/item";
import { ItemAbilityTypeEnum, ProficiencyTypeEnum } from "../model/spell-item/effect.enums";
import { Item, ItemHeader } from "../model/spell-item/spell-item";
import { State } from "../state";
import itemService from "./item.service";

function fakeEquippedItem(slot: EquippedItem["slot"]): EquippedItem {
  return { file: "wpn01", slot };
}

function assertHeader(item: Item): asserts item is Item & { header: ItemHeader } {
  if (!item.header) throw new Error("expected header to be set");
}

describe("isEquippedWeapon", () => {
  it("returns true for a single weapon slot", () => {
    expect(itemService.isEquippedWeapon(fakeEquippedItem("WEAPON1"))).toBe(true);
  });

  it("returns false for a single non-weapon slot", () => {
    expect(itemService.isEquippedWeapon(fakeEquippedItem("HELMET"))).toBe(false);
  });

  it("returns true when every slot in the array is a weapon slot", () => {
    expect(itemService.isEquippedWeapon(fakeEquippedItem(["WEAPON1", "SHIELD"]))).toBe(true);
  });

  it("returns false when any slot in the array is not a weapon slot", () => {
    expect(itemService.isEquippedWeapon(fakeEquippedItem(["WEAPON1", "HELMET"]))).toBe(false);
  });

  it("returns false for a single-element array with a non-weapon slot", () => {
    expect(itemService.isEquippedWeapon(fakeEquippedItem(["HELMET"]))).toBe(false);
  });

  it("returns false for an empty slot array", () => {
    expect(itemService.isEquippedWeapon(fakeEquippedItem([]))).toBe(false);
  });
});

describe("getMainHandWeaponProficiency", () => {
  const originalItems = State.items;

  afterEach(() => {
    State.items = originalItems;
  });

  it("returns the proficiency of the single equipped weapon", () => {
    State.items = [
      { file: "SWORD01", proficiency: ProficiencyTypeEnum.PROFICIENCYLONGSWORD },
    ] as unknown as typeof State.items;
    const equipped: EquippedItem[] = [{ file: "SWORD01", slot: "WEAPON1" }];

    expect(itemService.getMainHandWeaponProficiency(equipped)).toBe(
      ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
    );
  });

  it("skips the SHIELD (offhand) slot and returns the main hand weapon's proficiency", () => {
    State.items = [
      { file: "SWORD01", proficiency: ProficiencyTypeEnum.PROFICIENCYLONGSWORD },
      { file: "DAGGER01", proficiency: ProficiencyTypeEnum.PROFICIENCYDAGGER },
    ] as unknown as typeof State.items;
    const equipped: EquippedItem[] = [
      { file: "DAGGER01", slot: "SHIELD" },
      { file: "SWORD01", slot: "WEAPON1" },
    ];

    expect(itemService.getMainHandWeaponProficiency(equipped)).toBe(
      ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
    );
  });

  it("returns undefined when the only equipped weapon is in the SHIELD slot", () => {
    State.items = [
      { file: "DAGGER01", proficiency: ProficiencyTypeEnum.PROFICIENCYDAGGER },
    ] as unknown as typeof State.items;
    const equipped: EquippedItem[] = [{ file: "DAGGER01", slot: "SHIELD" }];

    expect(itemService.getMainHandWeaponProficiency(equipped)).toBeUndefined();
  });

  it("returns undefined when there is no equipped weapon at all", () => {
    const equipped: EquippedItem[] = [{ file: "HELM01", slot: "HELMET" }];

    expect(itemService.getMainHandWeaponProficiency(equipped)).toBeUndefined();
  });

  it("returns undefined when the equipped weapon has no proficiency requirement", () => {
    State.items = [{ file: "FIST01" }] as unknown as typeof State.items;
    const equipped: EquippedItem[] = [{ file: "FIST01", slot: "WEAPON1" }];

    expect(itemService.getMainHandWeaponProficiency(equipped)).toBeUndefined();
  });

  it("returns undefined for an empty equipped list", () => {
    expect(itemService.getMainHandWeaponProficiency([])).toBeUndefined();
  });
});

describe("getItem", () => {
  it("normalizes equippedSlot to an array via getItemSlots", () => {
    const result = itemService.getItem({ equippedSlot: "LRING" as unknown as ItemSlot[] }, "itm01");
    expect(result.equippedSlot).toEqual(["LRING"]);
  });

  it("defaults equippedSlot to an empty array when omitted", () => {
    const result = itemService.getItem({}, "itm02");
    expect(result.equippedSlot).toEqual([]);
  });
});

describe("setHeader", () => {
  function fakeItem(): Item {
    return {
      file: "itm01",
      doc: true,
      immunities: [],
      effects: [],
      equippedSlot: [],
      projectiles: [],
      trait: false,
    };
  }

  it("defaults location/target/damageType when copyFrom is unset", () => {
    const item = fakeItem();
    itemService.setHeader(item, { type: ItemAbilityTypeEnum.Melee }, "itm01");
    assertHeader(item);
    expect(item.header.location).toBeDefined();
    expect(item.header.target).toBeDefined();
    expect(item.header.damageType).toBeDefined();
  });

  it("does not force location/target/damageType when copyFrom is set", () => {
    const item = fakeItem();
    item.copyFrom = "ITM01";
    itemService.setHeader(item, { type: ItemAbilityTypeEnum.Melee }, "itm01");
    assertHeader(item);
    expect(item.header.location).toBeUndefined();
    expect(item.header.target).toBeUndefined();
    expect(item.header.damageType).toBeUndefined();
  });

  it("adds a projectile and sets header.projectile when given an object projectile", () => {
    const item = fakeItem();
    itemService.setHeader(
      item,
      {
        type: ItemAbilityTypeEnum.Ranged,
        projectile: { name: "Test Projectile" },
      },
      "itm01",
    );
    expect(item.projectiles).toHaveLength(1);
    assertHeader(item);
    expect(item.header.projectile).toBe("itm01");
  });

  it("does not add a duplicate projectile when called twice for the same item file", () => {
    const item = fakeItem();
    const proj = { name: "Test Projectile" };
    itemService.setHeader(item, { type: ItemAbilityTypeEnum.Ranged, projectile: proj }, "itm01");
    itemService.setHeader(item, { type: ItemAbilityTypeEnum.Ranged, projectile: proj }, "itm01");
    expect(item.projectiles).toHaveLength(1);
  });

  it("does not add a projectile when the header has none", () => {
    const item = fakeItem();
    itemService.setHeader(item, { type: ItemAbilityTypeEnum.Melee }, "itm01");
    expect(item.projectiles).toHaveLength(0);
  });
});

describe("isSlotIncluded", () => {
  it("finds a slot present on one of the equipped items", () => {
    const equipped = [fakeEquippedItem("LRING")];
    expect(itemService.isSlotIncluded(equipped, "LRING")).toBe(true);
  });

  it("returns false when the slot isn't present on any equipped item", () => {
    const equipped = [fakeEquippedItem("LRING")];
    expect(itemService.isSlotIncluded(equipped, "RRING")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { Movement } from "./movement";

describe("Movement.getGameValue", () => {
  it("converts the tabletop movement rate with the 0.8 engine coefficient", () => {
    expect(new Movement(12).getGameValue()).toBe(10); // round(12 * 0.8)
  });

  it("rounds to the nearest engine tick", () => {
    expect(new Movement(9).getGameValue()).toBe(7); // round(9 * 0.8) = round(7.2)
  });

  it("adds the flat bonus after conversion", () => {
    const movement = new Movement(12);
    movement.bonus = 2;
    expect(movement.getGameValue()).toBe(12); // round(12*0.8) + 2 = 10 + 2
  });

  it("halves the converted value when improved haste is active, before adding bonus", () => {
    const movement = new Movement(12);
    movement.hasImprovedHaste = true;
    movement.bonus = 1;
    expect(movement.getGameValue()).toBe(6); // round(round(12*0.8) / 2) + 1 = round(10/2) + 1
  });
});

describe("Movement.hasItem / hasValue", () => {
  it("has no item by default", () => {
    expect(new Movement(12).hasItem()).toBe(false);
  });

  it("reports an item once bound", () => {
    const movement = new Movement(12);
    movement.bindItem("SOME_ITEM");
    expect(movement.hasItem()).toBe(true);
    expect(movement.itemFile).toBe("SOME_ITEM");
  });

  it("hasValue is true whenever pnpValue is set (including 0)", () => {
    expect(new Movement(0).hasValue()).toBe(true);
  });
});

describe("Movement.clone", () => {
  it("copies pnpValue, bonus, improved haste and item binding independently", () => {
    const movement = new Movement(12);
    movement.bonus = 3;
    movement.hasImprovedHaste = true;
    movement.bindItem("SOME_ITEM");

    const clone = movement.clone();
    clone.bonus = 99;

    expect(clone.pnpValue).toBe(12);
    expect(clone.hasImprovedHaste).toBe(true);
    expect(clone.itemFile).toBe("SOME_ITEM");
    expect(movement.bonus).toBe(3); // original untouched by mutating the clone
  });
});

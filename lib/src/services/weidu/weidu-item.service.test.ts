import { afterEach, describe, expect, it } from "vitest";
import { CodeLine } from "../../model/misc";
import { ImmunityConfig } from "../../model/final/immunity";
import { ItemAbilityTypeEnum } from "../../model/spell-item/effect.enums";
import { Item, ItemHeader } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import weiduItemService from "./weidu-item.service";

interface WeiduItemServicePrivate {
  createItemHeader(lines: CodeLine[], header: ItemHeader, tab: number): void;
}

function fakeItem(p: Partial<Item> = {}): Item {
  return {
    file: "itm01",
    doc: true,
    immunities: [],
    effects: [],
    equippedSlot: [],
    projectiles: [],
    ...p,
  } as unknown as Item;
}

function fakeHeader(p: Partial<ItemHeader> = {}): ItemHeader {
  return {
    type: ItemAbilityTypeEnum.Melee,
    effects: [],
    ...p,
  };
}

function codes(lines: CodeLine[]): string[] {
  return lines.map((l) => l.code);
}

describe("createItem", () => {
  const originalImmunities = State.immunities;

  afterEach(() => {
    State.immunities = originalImmunities;
  });

  it("adds a comment line with the translated stringRef when present", () => {
    const lines: CodeLine[] = [];
    weiduItemService.createItem(lines, fakeItem({ stringRef: undefined }));
    expect(codes(lines).some((c) => c.startsWith("// "))).toBe(false);
  });

  it("creates a new item from scratch when copyFrom is unset", () => {
    const lines: CodeLine[] = [];
    weiduItemService.createItem(lines, fakeItem());
    expect(codes(lines)).toContain(`CREATE ITM "itm01"`);
    expect(codes(lines)).toContain(`COPY_EXISTING ~itm01.itm~ ~override~`);
  });

  it("copies from a plain file name when copyFrom matches no immunity", () => {
    State.immunities = [];
    const lines: CodeLine[] = [];
    weiduItemService.createItem(lines, fakeItem({ copyFrom: "SOMEITM" }));
    expect(codes(lines)).toContain(`COPY_EXISTING ~SOMEITM.ITM~  ~override/itm01.ITM~`);
    // copyFrom path never CREATE's or does the plain override COPY_EXISTING
    expect(codes(lines)).not.toContain(`CREATE ITM "itm01"`);
    expect(codes(lines)).not.toContain(`COPY_EXISTING ~itm01.itm~ ~override~`);
  });

  it("copies from the immunity's itemSlot file when copyFrom matches a registered immunity", () => {
    State.immunities = [
      { name: "poison", itemSlot: { file: "IMMITM", slot: "AMULET" } },
    ] as unknown as ImmunityConfig[];
    const lines: CodeLine[] = [];
    weiduItemService.createItem(lines, fakeItem({ copyFrom: "poison" }));
    expect(codes(lines)).toContain(`COPY_EXISTING ~IMMITM.ITM~  ~override/itm01.ITM~`);
  });

  it("throws when copyFrom matches an immunity with no itemSlot configured", () => {
    State.immunities = [{ name: "poison", itemSlot: undefined }] as unknown as ImmunityConfig[];
    const lines: CodeLine[] = [];
    expect(() => {
      weiduItemService.createItem(lines, fakeItem({ copyFrom: "poison" }));
    }).toThrow(/No file configured for immunity poison/);
  });

  it("does not emit the header INSERT_BYTES block when the item has no header", () => {
    const lines: CodeLine[] = [];
    weiduItemService.createItem(lines, fakeItem({ header: undefined }));
    expect(codes(lines).some((c) => c.includes("INSERT_BYTES"))).toBe(false);
  });

  it("emits the header INSERT_BYTES block when the item has a header", () => {
    const lines: CodeLine[] = [];
    weiduItemService.createItem(
      lines,
      fakeItem({ header: fakeHeader({ type: ItemAbilityTypeEnum.Melee }) }),
    );
    expect(codes(lines)).toContain(`INSERT_BYTES 0x72 0x38`);
  });

  it("resolves a string projectile into an IDS_OF_SYMBOL expression", () => {
    const lines: CodeLine[] = [];
    weiduItemService.createItem(lines, fakeItem({ header: fakeHeader({ projectile: "arrow01" }) }));
    expect(codes(lines).some((c) => c.includes("(IDS_OF_SYMBOL (~projectl~ ~arrow01~)) + 1"))).toBe(
      true,
    );
  });

  it("throws when the header projectile was never resolved to a string", () => {
    const lines: CodeLine[] = [];
    expect(() => {
      weiduItemService.createItem(
        lines,
        fakeItem({
          header: fakeHeader({
            projectile: { file: "p1" } as unknown as ItemHeader["projectile"],
          }),
        }),
      );
    }).toThrow(/Unhandled projectile!/);
  });

  it("emits an LPF line for each item immunity", () => {
    State.immunities = [{ name: "poison", type: "immunity" }] as unknown as ImmunityConfig[];
    const lines: CodeLine[] = [];
    weiduItemService.createItem(lines, fakeItem({ immunities: ["poison"] }));
    expect(codes(lines).some((c) => c.startsWith("LPF "))).toBe(true);
  });
});

describe("createItemHeader (private)", () => {
  const service = weiduItemService as unknown as WeiduItemServicePrivate;

  it("writes default melee swing animations when animationSwing is unset", () => {
    const lines: CodeLine[] = [];
    service.createItemHeader(lines, fakeHeader({ type: ItemAbilityTypeEnum.Melee }), 1);
    expect(codes(lines)).toContain("WRITE_SHORT 0x9e 34");
    expect(codes(lines)).toContain("WRITE_SHORT 0xa0 33");
    expect(codes(lines)).toContain("WRITE_SHORT 0xa2 33");
  });

  it("uses the provided animationSwing values for melee when set", () => {
    const lines: CodeLine[] = [];
    service.createItemHeader(
      lines,
      fakeHeader({
        type: ItemAbilityTypeEnum.Melee,
        animationSwing: { overhand: 1, backhand: 2, thrust: 3 },
      }),
      1,
    );
    expect(codes(lines)).toContain("WRITE_SHORT 0x9e 1");
    expect(codes(lines)).toContain("WRITE_SHORT 0xa0 2");
    expect(codes(lines)).toContain("WRITE_SHORT 0xa2 3");
  });

  it("writes ranged-specific bytes and default swing animations of 0 when animationSwing is unset", () => {
    const lines: CodeLine[] = [];
    service.createItemHeader(lines, fakeHeader({ type: ItemAbilityTypeEnum.Ranged }), 1);
    expect(codes(lines)).toContain("WRITE_SHORT 0x38 1");
    expect(codes(lines)).toContain("WRITE_SHORT 0xa4 1");
    // defaults of 0 are falsy, so write() no-ops and skips them entirely
    expect(codes(lines)).not.toContain("WRITE_SHORT 0x9e 0");
  });

  it("writes neither melee nor ranged swing bytes for a Magical (neither) header type", () => {
    const lines: CodeLine[] = [];
    service.createItemHeader(lines, fakeHeader({ type: ItemAbilityTypeEnum.Magical }), 1);
    expect(codes(lines).some((c) => c.includes("0x9e"))).toBe(false);
    expect(codes(lines).some((c) => c.includes("0x38"))).toBe(false);
  });

  it("writes abilityflags when present", () => {
    const lines: CodeLine[] = [];
    service.createItemHeader(
      lines,
      fakeHeader({ type: ItemAbilityTypeEnum.Magical, abilityflags: [0, 1] }),
      1,
    );
    expect(codes(lines)).toContain("WRITE_LONG 0x98 3");
  });
});

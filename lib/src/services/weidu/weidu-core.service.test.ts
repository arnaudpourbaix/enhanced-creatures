import { describe, expect, it } from "vitest";
import { JEWEL_SLOTS } from "../../model/creature/item";
import weiduCoreService from "./weidu-core.service";

describe("getIcon", () => {
  it("returns the ring icon for the exact JEWEL_SLOTS reference", () => {
    expect(weiduCoreService.getIcon({ file: "x", slot: JEWEL_SLOTS })).toBe("IRING16");
  });

  it("returns undefined for a value-equal but distinct array (only the shared JEWEL_SLOTS constant matches, by design)", () => {
    expect(
      weiduCoreService.getIcon({
        file: "x",
        slot: ["LRING", "RRING", "AMULET", "BELT", "GLOVES", "CLOAK"],
      }),
    ).toBeUndefined();
  });

  it("returns the matching single-slot icon for known single slots", () => {
    expect(weiduCoreService.getIcon({ file: "x", slot: "HELMET" })).toBe("IHELM01");
    expect(weiduCoreService.getIcon({ file: "x", slot: "BOOTS" })).toBe("IBOOT01");
  });
});

describe("generateImmunityStates", () => {
  const codes = () =>
    (weiduCoreService as unknown as { lines: { code: string }[] }).lines.map((l) => l.code);

  it("scans the game's spells and items, except this mod's", () => {
    weiduCoreService.generateImmunityStates();
    expect(codes()).toContain(
      String.raw`COPY_EXISTING_REGEXP GLOB ~^.+\.\(itm\|spl\)$~ ~override~`,
    );
    expect(codes().some((c) => c.includes("STRING_COMPARE_REGEXP ~^ja.*~"))).toBe(true);
  });

  it("resolves each state once, before scanning the files", () => {
    weiduCoreService.generateImmunityStates();
    const lines = codes();
    const resolved = lines.lastIndexOf(
      "OUTER_SET state_CHARM_IMMUNITY = IDS_OF_SYMBOL (~splstate~ ~CHARM_IMMUNITY~)",
    );
    const scan = lines.findIndex((c, i) => i > resolved && c.startsWith("COPY_EXISTING_REGEXP"));
    expect(resolved).toBeGreaterThan(-1);
    expect(scan).toBeGreaterThan(resolved);
    expect(lines.slice(scan).filter((c) => c.includes("IDS_OF_SYMBOL"))).toEqual([]);
  });

  it("replaces each immunity's state with a clone of the immunity", () => {
    weiduCoreService.generateImmunityStates();
    const lines = codes();
    const check = lines.lastIndexOf("PATCH_IF immune_5 BEGIN");
    expect(lines.slice(check + 1, check + 3)).toEqual([
      "LPF DELETE_EFFECT INT_VAR match_opcode=328 match_parameter2=state_CHARM_IMMUNITY END",
      "LPF CLONE_EFFECT INT_VAR match_opcode=101 match_parameter2=5 opcode=328 parameter1=0 parameter2=state_CHARM_IMMUNITY special=1 END",
    ]);
  });
});

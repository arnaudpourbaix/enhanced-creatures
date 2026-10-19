import { describe, expect, it } from "vitest";
import { clabAbilities, grantedStates, immuneOpcodes, read2da } from "./immunity-states";

/** A SPL or ITM whose effects (opcode, parameter2) follow the header at 0x72. */
function file(signature: string, effects: [number, number][]) {
  const buffer = Buffer.alloc(0x72 + effects.length * 0x30);
  buffer.write(signature, 0, "latin1");
  buffer.writeUInt32LE(0x72, 0x6a);
  effects.forEach(([opcode, parameter2], i) => {
    buffer.writeUInt16LE(opcode, 0x72 + i * 0x30);
    buffer.writeUInt32LE(parameter2, 0x72 + i * 0x30 + 8);
  });
  return buffer;
}

describe("immuneOpcodes", () => {
  it("lists the opcodes a spell or item grants immunity to", () => {
    const cavalier = file("SPL V1  ", [
      [101, 5],
      [101, 24],
      [142, 5],
    ]);
    expect([...immuneOpcodes(cavalier)]).toEqual([5, 24]);
    expect([...immuneOpcodes(file("ITM V1  ", [[101, 25]]))]).toEqual([25]);
  });

  it("ignores another file type", () => {
    expect(immuneOpcodes(file("CRE V1.0", [[101, 5]])).size).toBe(0);
  });
});

describe("grantedStates", () => {
  const states = [
    { state: "RESIST_FEAR", opcode: 24 },
    { state: "PANIC_IMMUNITY", opcode: 24 },
    { state: "DEATH_IMMUNITY", opcode: 209 },
  ] as const;

  it("gives every state of an immunity whose opcode is blocked", () => {
    expect(grantedStates(new Set([24, 106]), [...states])).toEqual([
      "RESIST_FEAR",
      "PANIC_IMMUNITY",
    ]);
  });

  it("needs the immunity's first opcode: slay alone isn't death immunity", () => {
    expect(grantedStates(new Set([55]), [...states])).toEqual([]);
  });
});

describe("read2da / clabAbilities", () => {
  const clab = [
    "2DA V1.0",
    "****",
    "     1           2           3",
    "ABILITY1 AP_SPCL221 **** ****",
    "ABILITY2 GA_SPCL211 **** ap_spcl222",
    "ABILITY3 **** AP_SPCL221 ****",
  ].join("\r\n");

  it("reads rows by column name", () => {
    expect(read2da(clab)[1]).toEqual({
      name: "ABILITY2",
      values: { "1": "GA_SPCL211", "2": "****", "3": "ap_spcl222" },
    });
  });

  it("lists the granted (AP_) abilities once, not the learnt (GA_) ones", () => {
    expect(clabAbilities(clab)).toEqual(["SPCL221", "SPCL222"]);
  });
});

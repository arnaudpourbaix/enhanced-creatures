import { describe, expect, it } from "vitest";
import { createdItems } from "./spell-items";

const EFFECTS = 0x72;

/** An SPL with one header per list of effects. */
function spl(...headers: { opcode: number; resource: string }[][]): Buffer {
  const effects = headers.flat();
  const headersAt = EFFECTS + effects.length * 0x30;
  const buffer = Buffer.alloc(headersAt + headers.length * 0x28);
  buffer.writeUInt32LE(headersAt, 0x64);
  buffer.writeUInt16LE(headers.length, 0x68);
  buffer.writeUInt32LE(EFFECTS, 0x6a);
  effects.forEach(({ opcode, resource }, i) => {
    const offset = EFFECTS + i * 0x30;
    buffer.writeUInt16LE(opcode, offset);
    buffer.write(resource, offset + 0x14, "latin1");
  });
  let first = 0;
  headers.forEach((list, h) => {
    const header = headersAt + h * 0x28;
    buffer.writeUInt16LE(list.length, header + 0x1e);
    buffer.writeUInt16LE(first, header + 0x20);
    first += list.length;
  });
  return buffer;
}

const read = (spells: Record<string, Buffer>) => (file: string) => spells[file];

describe("createdItems", () => {
  it("reads every header, once per item, in uppercase", () => {
    const spell = spl(
      [{ opcode: 111, resource: "blade1" }],
      [{ opcode: 111, resource: "BLADE2" }],
      [{ opcode: 111, resource: "BLADE2" }],
    );
    expect(createdItems("A", read({ A: spell }))).toEqual(["BLADE1", "BLADE2"]);
  });

  it("ignores other effects", () => {
    const spell = spl([{ opcode: 122, resource: "POTION" }]);
    expect(createdItems("A", read({ A: spell }))).toEqual([]);
  });

  it("follows a subspell, and survives a loop", () => {
    const spells = {
      A: spl([{ opcode: 146, resource: "B" }]),
      B: spl([
        { opcode: 111, resource: "HARM" },
        { opcode: 146, resource: "A" },
      ]),
    };
    expect(createdItems("A", read(spells))).toEqual(["HARM"]);
  });

  it("finds nothing for a missing spell", () => {
    expect(createdItems("A", read({}))).toEqual([]);
  });
});

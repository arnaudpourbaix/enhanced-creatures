import { describe, expect, it } from "vitest";
import { readTlk } from "./tlk";

/** A TLK V1 file holding `texts`, string reference = index */
function tlk(texts: string[]): Buffer {
  const entries = 0x12 + texts.length * 26;
  const data = Buffer.from(texts.join(""), "latin1");
  const buffer = Buffer.alloc(entries + data.length);
  buffer.write("TLK V1  ", 0, "latin1");
  buffer.writeUInt32LE(texts.length, 0x0a);
  buffer.writeUInt32LE(entries, 0x0e);
  let offset = 0;
  texts.forEach((text, i) => {
    const entry = 0x12 + i * 26;
    buffer.writeUInt16LE(1, entry);
    buffer.writeUInt32LE(offset, entry + 0x12);
    buffer.writeUInt32LE(text.length, entry + 0x16);
    offset += text.length;
  });
  data.copy(buffer, entries);
  return buffer;
}

describe("readTlk", () => {
  it("reads a string by its reference", () => {
    const text = readTlk(tlk(["<NO TEXT>", "Fireball", "A ball of fire."]));
    expect(text(1)).toBe("Fireball");
    expect(text(2)).toBe("A ball of fire.");
  });

  it("has no text for a reference out of range or unset", () => {
    const text = readTlk(tlk(["<NO TEXT>"]));
    expect(text(5)).toBeUndefined();
    expect(text(-1)).toBeUndefined();
  });

  it("rejects another file type", () => {
    expect(() => readTlk(Buffer.alloc(0x20))).toThrow(/Not a TLK V1 file/);
  });
});

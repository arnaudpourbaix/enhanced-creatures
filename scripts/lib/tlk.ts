/** The text of a string reference in a TLK V1 file (dialog.tlk), or undefined when there is none. */
export function readTlk(tlk: Buffer): (strref: number) => string | undefined {
  if (tlk.toString("latin1", 0, 8) !== "TLK V1  ") throw new Error("Not a TLK V1 file");
  const count = tlk.readUInt32LE(0x0a);
  const dataOffset = tlk.readUInt32LE(0x0e);
  return (strref) => {
    if (strref < 0 || strref >= count) return undefined;
    const entry = 0x12 + strref * 26;
    const offset = dataOffset + tlk.readUInt32LE(entry + 0x12);
    return tlk.toString("utf8", offset, offset + tlk.readUInt32LE(entry + 0x16));
  };
}

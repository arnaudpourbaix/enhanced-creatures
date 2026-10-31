/** Opcodes read from an SPL's effects. */
const CREATE_WEAPON = 111;
const CAST_SUBSPELL = 146;

const EFFECT_SIZE = 0x30;
const HEADER_SIZE = 0x28;

/** An effect's opcode and uppercase resource. */
function effectAt(spl: Buffer, index: number): { opcode: number; resource: string } | undefined {
  const offset = spl.readUInt32LE(0x6a) + index * EFFECT_SIZE;
  if (offset + EFFECT_SIZE > spl.length) return undefined;
  const resource = spl
    .toString("latin1", offset + 0x14, offset + 0x1c)
    .split("\0")[0]
    .toUpperCase();
  return { opcode: spl.readUInt16LE(offset), resource };
}

/** Every effect of the SPL: its global ones, then those of all its headers (one per caster level). */
function effects(spl: Buffer): { opcode: number; resource: string }[] {
  const ranges = [{ count: spl.readUInt16LE(0x70), first: spl.readUInt16LE(0x6e) }];
  const headers = spl.readUInt32LE(0x64);
  for (let h = 0; h < spl.readUInt16LE(0x68); h++) {
    const header = headers + h * HEADER_SIZE;
    ranges.push({ count: spl.readUInt16LE(header + 0x1e), first: spl.readUInt16LE(header + 0x20) });
  }
  return ranges.flatMap(({ count, first }) =>
    Array.from({ length: count }, (_, i) => effectAt(spl, first + i) ?? []).flat(),
  );
}

/**
 * The weapons a spell puts in its caster's hand (SpellReference.createsItems), at every caster
 * level, following the subspells it casts (Faiths and Powers' Harm casts the vanilla one). `read`
 * gives an SPL by name.
 */
export function createdItems(
  file: string,
  read: (file: string) => Buffer | undefined,
  seen = new Set<string>(),
): string[] {
  if (seen.has(file)) return [];
  seen.add(file);
  const spl = read(file);
  if (!spl) return [];
  const found = effects(spl).flatMap(({ opcode, resource }) => {
    if (opcode === CREATE_WEAPON) return [resource];
    return opcode === CAST_SUBSPELL && resource ? createdItems(resource, read, seen) : [];
  });
  return [...new Set(found)];
}

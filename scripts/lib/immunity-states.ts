import type { ImmunityState } from "../../lib/config/immunity-config";

const IMMUNITY_OPCODE = 101;

/**
 * The opcodes a SPL V1 or ITM V1 file grants immunity to (opcode 101), in any of its effects:
 * from the effects offset to the end of the file, as the core component's install pass reads it.
 * Empty for another file type.
 */
export function immuneOpcodes(file: Buffer): Set<number> {
  const opcodes = new Set<number>();
  const signature = file.toString("latin1", 0, 8);
  if (file.length < 0x72 || (signature !== "SPL V1  " && signature !== "ITM V1  ")) return opcodes;
  for (let offset = file.readUInt32LE(0x6a); offset + 0x30 <= file.length; offset += 0x30) {
    if (file.readUInt16LE(offset) === IMMUNITY_OPCODE) opcodes.add(file.readUInt32LE(offset + 8));
  }
  return opcodes;
}

/** The states the install pass gives a file immune to these opcodes (see CHECKED_IMMUNITY_STATES). */
export function grantedStates(opcodes: Set<number>, states: ImmunityState[]): string[] {
  return [...new Set(states.filter(({ opcode }) => opcodes.has(opcode)).map(({ state }) => state))];
}

/** The rows of a 2DA file: its first column, then the others by column name. */
export function read2da(
  text: string,
): { name: string; values: Record<string, string | undefined> }[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  // signature, default value, then the column names
  const columns = lines[2]?.split(/\s+/) ?? [];
  return lines.slice(3).map((line) => {
    const [name, ...cells] = line.split(/\s+/);
    return { name, values: Object.fromEntries(columns.map((column, i) => [column, cells[i]])) };
  });
}

/** The spells a CLAB table grants (AP_ entries; GA_ ones are only learnt). */
export function clabAbilities(text: string): string[] {
  const spells = read2da(text).flatMap(({ values }) =>
    Object.values(values).flatMap((cell) =>
      cell?.toUpperCase().startsWith("AP_") ? [cell.slice(3).toUpperCase()] : [],
    ),
  );
  return [...new Set(spells)];
}

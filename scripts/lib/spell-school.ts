// Primary schools of spells, from the `school` column of assets/spells/spells_source.csv.

import { ItemAbilityPrimaryTypeEnum } from "../../lib/src/model/spell-item/effect.enums";

/** A spells_source.csv row (file;level;type;ids;school;name) */
export interface SchoolRow {
  file: string;
  ids: string;
  school: string;
}

/** The enum member of an SPL's primary type byte (0x25), null for none. */
export function schoolOfType(type: number): keyof typeof ItemAbilityPrimaryTypeEnum | null {
  const name = ItemAbilityPrimaryTypeEnum[type] as keyof typeof ItemAbilityPrimaryTypeEnum;
  if (name === undefined) throw new Error(`unknown primary type ${type}`);
  return name === "None" ? null : name;
}

/** The enum member for each school name of the CSV; None is no school. */
const SCHOOLS: Record<string, keyof typeof ItemAbilityPrimaryTypeEnum | null> = {
  Abjuration: "Abjurer",
  Alteration: "Transmuter",
  Conjuration: "Conjurer",
  Divination: "Diviner",
  Enchantment: "Enchanter",
  Evocation: "Invoker",
  Generalist: "Generalist",
  Illusion: "Illusionist",
  Necromancy: "Necromancer",
  None: null,
};

interface SchoolSpell {
  file: string;
  id?: string;
  variants?: { file: string; id?: string }[];
}

/**
 * The ItemAbilityPrimaryTypeEnum member of `spell`'s school, null for a spell of no school, or
 * undefined when no row matches it. A row matches on file and, when the spell declares one, ids:
 * a file can hold a different spell once a mod repurposes it. `ownsFile` tells a file no other
 * spell of the database claims: its row matches whatever its ids, spell.ids naming the same
 * spell several ways (WIZARD_ACID_FOG and WIZARD_DEATH_FOG). The spell's own file is tried first,
 * then its variants.
 */
export function schoolOf(
  rows: SchoolRow[],
  spell: SchoolSpell,
  ownsFile: (file: string) => boolean = () => false,
): keyof typeof ItemAbilityPrimaryTypeEnum | null | undefined {
  for (const { file, id } of [spell, ...(spell.variants ?? [])]) {
    const row = rows.find(
      (row) =>
        row.file.toUpperCase() === file.toUpperCase() &&
        (id === undefined || ownsFile(file) || row.ids.toUpperCase() === id.toUpperCase()),
    );
    if (!row) continue;
    if (!(row.school in SCHOOLS)) throw new Error(`${row.file}: unknown school ${row.school}`);
    return SCHOOLS[row.school];
  }
  return undefined;
}

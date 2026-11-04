import { describe, expect, it } from "vitest";
import { ABILITY_PRESETS } from "./ability-presets";
import { FNP_SPELLS } from "./spells/fnp-spell-database";
import { SPELLS } from "./spells/spell-database";

/**
 * Left out: shapeshifts need their own work, Teleport Without Error and Lesser Restoration are
 * special or have no use yet, and Nahal's Reckless Dweomer opens a menu no script can choose from.
 */
const NO_PRESET = [
  SPELLS.Wizard.TeleportWithoutError.file,
  SPELLS.Priest.LesserRestoration.file,
  SPELLS.Wizard.NahalRecklessDweomer.file,
];

describe("ABILITY_PRESETS", () => {
  it("has a preset for every wizard and priest spell, but the ones left out", () => {
    const presets = new Set(ABILITY_PRESETS.map((p) => p.preset));
    const spells = [SPELLS.Wizard, SPELLS.Priest, FNP_SPELLS.Priest].flatMap((s) =>
      Object.values(s),
    );
    const missing = spells
      .filter((s) => s.role !== "shapeshift" && !NO_PRESET.includes(s.file))
      .map((s) => s.file)
      .filter((file) => !presets.has(file));
    expect(missing).toEqual([]);
  });
});

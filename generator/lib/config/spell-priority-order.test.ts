import { describe, expect, it } from "vitest";
import { SPELL_PRIORITY_ORDER } from "./spell-priority-order";
import { SPELLS } from "./spells/spell-names";

describe("SPELL_PRIORITY_ORDER", () => {
  it("is a non-empty list containing spells seeded from the ability presets", () => {
    expect(SPELL_PRIORITY_ORDER.length).toBeGreaterThan(0);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.Sanctuary.file);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.FingerOfDeath.file);
  });

  it("ranks buffs (e.g. Sanctuary) before death spells (e.g. Finger of Death)", () => {
    const buffIndex = SPELL_PRIORITY_ORDER.indexOf(SPELLS.Priest.Sanctuary.file);
    const deathIndex = SPELL_PRIORITY_ORDER.indexOf(SPELLS.Priest.FingerOfDeath.file);
    expect(buffIndex).toBeLessThan(deathIndex);
  });
});

import { describe, expect, it } from "vitest";
import { SPELL_PRIORITY_ORDER, SPELL_PRIORITY_ORDER_UNVETTED } from "./spell-priority-order";
import { SPELLS } from "./spells/spell-names";

describe("SPELL_PRIORITY_ORDER", () => {
  it("is a non-empty list containing spells seeded from the ability presets", () => {
    expect(SPELL_PRIORITY_ORDER.length).toBeGreaterThan(0);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.Sanctuary.file);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.FingerOfDeath.file);
  });

  it("ranks a buff with real cast evidence (Stoneskin) before an attack with real cast evidence (Finger of Death)", () => {
    const buffIndex = SPELL_PRIORITY_ORDER.indexOf(SPELLS.Wizard.Stoneskin.file);
    const deathIndex = SPELL_PRIORITY_ORDER.indexOf(SPELLS.Priest.FingerOfDeath.file);
    expect(buffIndex).toBeGreaterThanOrEqual(0);
    expect(deathIndex).toBeGreaterThanOrEqual(0);
    expect(buffIndex).toBeLessThan(deathIndex);
  });

  it("never lists the same entry in both SPELL_PRIORITY_ORDER and SPELL_PRIORITY_ORDER_UNVETTED", () => {
    const overlap = SPELL_PRIORITY_ORDER_UNVETTED.filter((f) => SPELL_PRIORITY_ORDER.includes(f));
    expect(overlap).toEqual([]);
  });
});

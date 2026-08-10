import { describe, expect, it } from "vitest";
import {
  SPELL_PRIORITY_ORDER,
  SPELL_PRIORITY_ORDER_RANKED,
  SPELL_PRIORITY_ORDER_UNVETTED,
} from "./spell-priority-order";
import { SPELLS } from "./spells/spell-names";

describe("SPELL_PRIORITY_ORDER", () => {
  it("is a non-empty list containing spells seeded from the ability presets", () => {
    expect(SPELL_PRIORITY_ORDER.length).toBeGreaterThan(0);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.Sanctuary.file);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.FingerOfDeath.file);
  });

  it("is exactly the ranked entries followed by the unvetted ones", () => {
    expect(SPELL_PRIORITY_ORDER).toEqual([
      ...SPELL_PRIORITY_ORDER_RANKED,
      ...SPELL_PRIORITY_ORDER_UNVETTED,
    ]);
  });

  it("ranks a buff with real cast evidence (Stoneskin) before an attack with real cast evidence (Finger of Death)", () => {
    const buffIndex = SPELL_PRIORITY_ORDER_RANKED.indexOf(SPELLS.Wizard.Stoneskin.file);
    const deathIndex = SPELL_PRIORITY_ORDER_RANKED.indexOf(SPELLS.Priest.FingerOfDeath.file);
    expect(buffIndex).toBeGreaterThanOrEqual(0);
    expect(deathIndex).toBeGreaterThanOrEqual(0);
    expect(buffIndex).toBeLessThan(deathIndex);
  });

  it("has no direct cast evidence for Sanctuary, so it sits in the unvetted list rather than the ranked one", () => {
    expect(SPELL_PRIORITY_ORDER_UNVETTED).toContain(SPELLS.Priest.Sanctuary.file);
    expect(SPELL_PRIORITY_ORDER_RANKED).not.toContain(SPELLS.Priest.Sanctuary.file);
  });
});

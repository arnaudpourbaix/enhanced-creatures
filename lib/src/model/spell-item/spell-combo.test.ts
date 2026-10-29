import { describe, expect, it } from "vitest";
import { SPELLS } from "../../../config/spells/spell-database";
import {
  chainContingency,
  COMBO_RULES,
  contingency,
  contingencyMaxLevel,
  minorSequencer,
  registerCombos,
  spellSequencer,
  validateCombo,
  type SpellCombo,
} from "./spell-combo";

const W = SPELLS.Wizard;
const MM = W.MagicMissiles;
const KNOWN = [...Object.values(W), ...Object.values(SPELLS.Priest)];

/** Wraps a helper's result as a combo, as registerCombos would. */
const combo = (entry: Omit<SpellCombo, "key">): SpellCombo => ({ key: "Test", ...entry });

describe("COMBO_RULES", () => {
  it("derives the minimum caster levels from the mage spell table", () => {
    const levels = Object.fromEntries(
      Object.entries(COMBO_RULES).map(([kind, rule]) => [kind, rule.minCasterLevel]),
    );
    expect(levels).toEqual({
      minorSequencer: 7,
      spellSequencer: 14,
      contingency: 12,
      chainContingency: 18,
    });
  });
});

describe("contingencyMaxLevel", () => {
  it.each([[12, 4], [14, 4], [15, 5], [18, 6], [30, 8]])("caster level %i -> %i", (cl, max) => {
    expect(contingencyMaxLevel(cl)).toBe(max);
  });
});

describe("validateCombo", () => {
  it("accepts a double Magic Missile minor sequencer", () => {
    expect(() => validateCombo(combo(minorSequencer([MM, MM])))).not.toThrow();
  });

  it("accepts a chain contingency of 1 spell", () => {
    expect(() => validateCombo(combo(chainContingency("hit", [MM])))).not.toThrow();
  });

  it("rejects a chain contingency of 0 spells", () => {
    expect(() => validateCombo(combo(chainContingency("hit", [])))).toThrow(/Test/);
  });

  it.each([
    ["a minor sequencer of 3 spells", minorSequencer([MM, MM, MM])],
    ["a minor sequencer holding a level 3 spell", minorSequencer([MM, W.Slow])],
    ["a spell sequencer holding a level 5 spell", spellSequencer([MM, MM, W.Cloudkill])],
    ["a contingency of 2 spells", contingency("hit", [MM, MM])],
    ["a contingency holding a level 9 spell", contingency("hit", [W.PowerWordKill])],
    ["a chain contingency of 4 spells", chainContingency("hit", [MM, MM, MM, MM])],
    ["a contingency without condition", { kind: "contingency" as const, spells: [MM] }],
    ["a sequencer with a condition", { ...minorSequencer([MM, MM]), condition: "hit" as const }],
  ])("throws for %s", (_, entry) => {
    expect(() => validateCombo(combo(entry))).toThrow(/Test/);
  });
});

describe("registerCombos", () => {
  it("sets the key from the registry key", () => {
    expect(registerCombos({ A: minorSequencer([MM, MM]) }, KNOWN).A.key).toBe("A");
  });

  it("throws on the same kind, spells and condition under two keys", () => {
    expect(() => registerCombos({ A: minorSequencer([MM, MM]), B: minorSequencer([MM, MM]) }, KNOWN))
      .toThrow(/A.*B/);
  });

  it("accepts the same spells with another kind or condition", () => {
    expect(() => registerCombos({
      A: minorSequencer([MM, MM]),
      B: spellSequencer([MM, MM, MM]),
      C: contingency("hit", [MM]),
      D: contingency("hp50", [MM]),
    }, KNOWN)).not.toThrow();
  });

  it.each([
    ["a class spell", Object.values(SPELLS.Class)[0]],
    ["an innate spell", Object.values(SPELLS.Innate)[0]],
  ])("throws for %s, naming the combo", (_, spell) => {
    expect(() => registerCombos({ Bad: minorSequencer([MM, { ...spell, level: 1 }]) }, KNOWN))
      .toThrow(/Bad.*isn't a wizard or priest spell/);
  });

  it("accepts priest spells", () => {
    const bless = SPELLS.Priest.Bless;
    expect(() => registerCombos({ A: minorSequencer([bless, bless]) }, KNOWN)).not.toThrow();
  });
});

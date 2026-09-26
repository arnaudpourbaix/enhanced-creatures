import { describe, expect, it } from "vitest";
import { SPELLS } from "../../config/spells/spell-database";
import { SpellReference } from "../model/spell-item/spell-reference";
import presetFactory from "./preset.factory";

const DEFAULT_ABILITY_NAME = "ability.unknown";

describe("createSpell", () => {
  it("copies the spell's range onto the resulting ability", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.BurningHands, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.range).toBe(SPELLS.Wizard.BurningHands.range);
  });

  it("leaves range unset when the spell has none", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.Domination, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.range).toBeUndefined();
  });

  it("keeps the override's own range instead of the spell's", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.BurningHands, {
      name: DEFAULT_ABILITY_NAME,
      range: 30,
    });
    expect(result.ability.range).toBe(30);
  });

  it("copies the spell's own state checks onto the resulting ability's spell", () => {
    const spell: SpellReference = {
      file: "SPWI999",
      includeStateChecks: ["STATE_BLESS"],
      excludeStateChecks: ["STATE_INVISIBLE"],
      excludeSpellStates: ["STONESKIN"],
    };
    const [result] = presetFactory.createSpell(spell, { name: DEFAULT_ABILITY_NAME });
    expect(result.ability.spell?.includeStateChecks).toEqual(["STATE_BLESS"]);
    expect(result.ability.spell?.excludeStateChecks).toEqual(["STATE_INVISIBLE"]);
    expect(result.ability.spell?.excludeSpellStates).toEqual(["STONESKIN"]);
  });

  it("accumulates the override's own exclusion checks alongside the spell's, rather than replacing them", () => {
    const spell: SpellReference = { file: "SPWI999", excludeStateChecks: ["STATE_INVISIBLE"] };
    const [result] = presetFactory.createSpell(spell, {
      name: DEFAULT_ABILITY_NAME,
      spell: { excludeStateChecks: ["STATE_SLEEPING"] },
    });
    expect(result.ability.spell?.excludeStateChecks).toEqual(["STATE_INVISIBLE", "STATE_SLEEPING"]);
  });

  it("leaves the spell's state-check fields unset when the spell has none", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.BurningHands, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.spell?.includeStateChecks).toBeUndefined();
    expect(result.ability.spell?.excludeStateChecks).toBeUndefined();
    expect(result.ability.spell?.excludeSpellStates).toBeUndefined();
  });

  it("emits one preset per mod variant file, sharing the same ability", () => {
    const results = presetFactory.createSpell(SPELLS.Priest.PhysicalMirror, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(results.map((r) => r.preset)).toEqual(["SPPR613", "SPPR531"]);
    expect(results[1].ability).toEqual(results[0].ability);
  });
});

describe("createOrderedSpells", () => {
  it("copies each spell's own range onto its resulting ability", () => {
    const spells: SpellReference[] = [SPELLS.Wizard.BurningHands, SPELLS.Wizard.Domination];
    const [withRange, withoutRange] = presetFactory.createOrderedSpells(spells);
    expect(withRange.ability.range).toBe(SPELLS.Wizard.BurningHands.range);
    expect(withoutRange.ability.range).toBeUndefined();
  });
});

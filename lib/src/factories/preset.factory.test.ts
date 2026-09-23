import { describe, expect, it } from "vitest";
import { FNP_SPELLS } from "../../config/spells/fnp-spell-database";
import { SPELLS } from "../../config/spells/spell-database";
import presetFactory from "./preset.factory";

const DEFAULT_ABILITY_NAME = "ability.unknown";

describe("create", () => {
  it("builds one preset per name, each with its own preset field", () => {
    const results = presetFactory.create(["FILE_A", "FILE_B"], { name: DEFAULT_ABILITY_NAME });
    expect(results).toEqual([
      { preset: "FILE_A", ability: { name: DEFAULT_ABILITY_NAME } },
      { preset: "FILE_B", ability: { name: DEFAULT_ABILITY_NAME } },
    ]);
  });

  it("clones the ability so mutating one result doesn't affect another", () => {
    const [first, second] = presetFactory.create(["FILE_A", "FILE_B"], {
      name: DEFAULT_ABILITY_NAME,
      triggers: [],
    });
    first.ability.triggers?.push({ name: "See", params: ["Myself"] });
    expect(second.ability.triggers).toEqual([]);
  });

  it("auto-resolves keywords from a real SPELLS entry when the ability doesn't set them", () => {
    const [result] = presetFactory.create([SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.keywords).toEqual(SPELLS.Priest.CloakOfFear.keywords);
  });

  it("resolves once and shares the result across every name, even one that isn't a SPELLS entry", () => {
    const results = presetFactory.create(["NOT_IN_SPELLS", SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(results[0].ability.keywords).toEqual(SPELLS.Priest.CloakOfFear.keywords);
    expect(results[1].ability.keywords).toEqual(SPELLS.Priest.CloakOfFear.keywords);
  });

  it("leaves keywords unset when no name resolves to a SPELLS entry", () => {
    const [result] = presetFactory.create(["NOT_IN_SPELLS"], { name: DEFAULT_ABILITY_NAME });
    expect(result.ability.keywords).toBeUndefined();
  });

  it("keeps an explicit ability.keywords instead of auto-resolving", () => {
    const [result] = presetFactory.create([SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
      keywords: ["poison"],
    });
    expect(result.ability.keywords).toEqual(["poison"]);
  });

  it("auto-resolves level from a real SPELLS entry when the ability doesn't set it", () => {
    const [result] = presetFactory.create([SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.level).toBe(SPELLS.Priest.CloakOfFear.level);
  });

  it("resolves level once and shares it across every name, even one that isn't a SPELLS entry", () => {
    const results = presetFactory.create(["NOT_IN_SPELLS", SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(results[0].ability.level).toBe(SPELLS.Priest.CloakOfFear.level);
    expect(results[1].ability.level).toBe(SPELLS.Priest.CloakOfFear.level);
  });

  it("resolves each name's own level from SPELLS instead of sharing the first name's level", () => {
    const results = presetFactory.create(
      [SPELLS.Priest.HoldPerson.file, SPELLS.Wizard.HoldPerson.file],
      { name: DEFAULT_ABILITY_NAME },
    );
    expect(results[0].ability.level).toBe(SPELLS.Priest.HoldPerson.level);
    expect(results[1].ability.level).toBe(SPELLS.Wizard.HoldPerson.level);
    expect(results[1].ability.level).not.toBe(results[0].ability.level);
  });

  it("resolves an FNP_SPELLS-only name's own level instead of the SPELLS name's level", () => {
    const results = presetFactory.create(
      [SPELLS.Priest.CauseDisease.file, FNP_SPELLS.Priest.CauseDisease.file],
      { name: DEFAULT_ABILITY_NAME },
    );
    expect(results[0].ability.level).toBe(SPELLS.Priest.CauseDisease.level);
    expect(results[1].ability.level).toBe(FNP_SPELLS.Priest.CauseDisease.level);
    expect(results[1].ability.level).not.toBe(results[0].ability.level);
  });

  it("leaves level unset when no name resolves to a SPELLS entry", () => {
    const [result] = presetFactory.create(["NOT_IN_SPELLS"], { name: DEFAULT_ABILITY_NAME });
    expect(result.ability.level).toBeUndefined();
  });

  it("keeps an explicit ability.level instead of auto-resolving", () => {
    const [result] = presetFactory.create([SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
      level: 99,
    });
    expect(result.ability.level).toBe(99);
  });
});

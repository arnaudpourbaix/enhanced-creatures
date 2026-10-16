import { afterEach, describe, expect, it } from "vitest";
import { Creature } from "../model/creature/creature";
import { ImmunityConfig } from "../model/final/immunity";
import { State } from "../state";
import creatureTypeService from "./creature-type.service";

const cfg = (name: string, immunities: string[] = []) =>
  ({ name, type: "trait", immunities }) as unknown as ImmunityConfig;

const creature = (immunities: string[], itemImmunities?: string[]) =>
  ({
    data: { immunities },
    items: itemImmunities ? [{ trait: true, immunities: itemImmunities }] : [],
  }) as unknown as Creature;

describe("getCreatureTypes", () => {
  const saved = State.immunities;
  afterEach(() => {
    State.immunities = saved;
  });

  it("returns direct type traits in TYPE_TRAITS order, ignoring non-types", () => {
    State.immunities = [cfg("undead"), cfg("vermin"), cfg("skeletal")];
    expect(
      creatureTypeService.getCreatureTypes(creature(["undead", "skeletal", "vermin"])),
    ).toEqual(["undead", "vermin"]);
  });

  it("follows nested traits transitively", () => {
    State.immunities = [cfg("spider", ["vermin", "web"]), cfg("vermin", ["mindSpells"])];
    expect(creatureTypeService.getCreatureTypes(creature(["spider"]))).toEqual(["vermin"]);
  });

  it("reads the creature's trait item immunities", () => {
    State.immunities = [cfg("undead")];
    expect(creatureTypeService.getCreatureTypes(creature([], ["undead", "cold"]))).toEqual([
      "undead",
    ]);
  });

  it("returns no type when none is declared", () => {
    State.immunities = [cfg("cat", ["infravision"])];
    expect(creatureTypeService.getCreatureTypes(creature(["cat"]))).toEqual([]);
  });
});

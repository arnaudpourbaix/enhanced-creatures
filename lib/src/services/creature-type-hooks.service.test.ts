import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../model/creature/creature";
import creatureTypeHooksService from "./creature-type-hooks.service";
import creatureTypeService from "./creature-type.service";

afterEach(() => {
  vi.restoreAllMocks();
});

const creature = {} as unknown as Creature;

describe("creatureTypeHooksService.afterBuild", () => {
  it("has no type module yet", () => {
    expect(creatureTypeHooksService.modules).toEqual([]);
  });

  it("runs the hook of each of the creature's types once, in the creature's type order", () => {
    vi.spyOn(creatureTypeService, "getCreatureTypes").mockReturnValue(["undead", "ooze"]);
    const calls: string[] = [];
    const service = creatureTypeHooksService.withModules([
      { type: "ooze", afterBuild: () => calls.push("ooze") },
      { type: "fey", afterBuild: () => calls.push("fey") },
      { type: "undead", afterBuild: () => calls.push("undead") },
      { type: "undead" },
    ]);
    service.afterBuild(creature);
    expect(calls).toEqual(["undead", "ooze"]);
  });

  it("does nothing without modules", () => {
    const types = vi.spyOn(creatureTypeService, "getCreatureTypes");
    creatureTypeHooksService.afterBuild(creature);
    expect(types).not.toHaveBeenCalled();
  });
});

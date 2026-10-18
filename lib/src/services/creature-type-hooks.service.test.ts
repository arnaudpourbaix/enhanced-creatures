import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../model/creature/creature";
import { CreatureData } from "../model/creature/data";
import { ImmunityConfig, ImmunityName } from "../model/final/immunity";
import { State } from "../state";
import creatureTypeHooksService from "./creature-type-hooks.service";
import creatureTypeService from "./creature-type.service";

afterEach(() => {
  vi.restoreAllMocks();
});

const creature = (
  immunities: ImmunityName[] = [],
  adjustments: Partial<CreatureData>[] = [],
): Creature =>
  ({
    data: { immunities },
    items: [],
    adjustments: adjustments.map((data) => ({ data })),
  }) as unknown as Creature;

describe("creatureTypeHooksService modules", () => {
  it("registers the type modules with their hit dice", () => {
    expect(
      Object.fromEntries(creatureTypeHooksService.modules.map((m) => [m.type, m.hitDie])),
    ).toEqual({ construct: 10, dragon: 12, fey: 6, magicalBeast: 10, ooze: 10, undead: 12 });
  });

  // Checked by effect: importing types/undead here would load it before the registry (cycle).
  it("registers the undead module's hook (General and turn level: types/undead.test.ts)", () => {
    const undead = creatureTypeHooksService.modules.find((m) => m.type === "undead");
    const spider = {
      data: { general: "MONSTER", immunities: ["undead"], level1: { pnpValue: 2, value: 2 } },
      items: [],
      adjustments: [],
    } as unknown as Creature;
    undead?.afterBuild?.(spider);
    expect(spider.data.general).toBe("UNDEAD");
  });
});

describe("creatureTypeHooksService.afterBuild", () => {
  it("runs the hook of each of the creature's types once, in TYPE_TRAITS order", () => {
    vi.spyOn(creatureTypeService, "getCreatureTypes").mockReturnValue(["undead", "fey"]);
    const calls: string[] = [];
    const service = creatureTypeHooksService.withModules([
      { type: "ooze", afterBuild: () => calls.push("ooze") },
      { type: "fey", afterBuild: () => calls.push("fey") },
      { type: "undead", afterBuild: () => calls.push("undead") },
      { type: "undead" },
    ]);
    service.afterBuild(creature());
    expect(calls).toEqual(["fey", "undead"]);
  });

  it("runs once for a type both the creature and its adjustments have", () => {
    const calls: string[] = [];
    const service = creatureTypeHooksService.withModules([
      { type: "undead", afterBuild: () => calls.push("undead") },
    ]);
    service.afterBuild(creature(["undead"], [{ immunities: ["undead"] }]));
    expect(calls).toEqual(["undead"]);
  });

  it("runs the hook of a type that only a trait item gives (Dread Wolf: undead via its trait)", () => {
    const calls: string[] = [];
    const service = creatureTypeHooksService.withModules([
      { type: "undead", afterBuild: () => calls.push("undead") },
    ]);
    const dreadWolf = {
      ...creature(["animal"]),
      items: [{ trait: true, immunities: ["undead"] }],
    } as unknown as Creature;
    service.afterBuild(dreadWolf);
    expect(calls).toEqual(["undead"]);
    expect(service.getHitDie(dreadWolf)).toBeUndefined();
    expect(creatureTypeHooksService.getHitDie(dreadWolf)).toBe(12);
  });

  it("runs the hook of a type only an adjustment adds", () => {
    const calls: string[] = [];
    const service = creatureTypeHooksService.withModules([
      { type: "magicalBeast", afterBuild: () => calls.push("magicalBeast") },
      { type: "undead", afterBuild: () => calls.push("undead") },
    ]);
    service.afterBuild(
      creature(["magicalBeast"], [{ level1: undefined }, { immunities: ["undead"] }]),
    );
    expect(calls).toEqual(["magicalBeast", "undead"]);
  });
});

describe("creatureTypeHooksService.getHitDie", () => {
  const saved = State.immunities;
  afterEach(() => {
    State.immunities = saved;
  });

  it("is undefined for a creature without a type having a hit die", () => {
    expect(creatureTypeHooksService.getHitDie(creature(["animal"]))).toBeUndefined();
  });

  it("takes the largest die among the creature's types (Wraith Spider: vermin + undead -> 12)", () => {
    State.immunities = [{ name: "spider", immunities: ["vermin"] } as unknown as ImmunityConfig];
    expect(creatureTypeHooksService.getHitDie(creature(["spider", "undead"]))).toBe(12);
    expect(creatureTypeHooksService.getHitDie(creature(["fey", "ooze"]))).toBe(10);
  });

  it("ignores the types adjustments add (adjustments keep their base creature's die)", () => {
    expect(
      creatureTypeHooksService.getHitDie(creature(["magicalBeast"], [{ immunities: ["undead"] }])),
    ).toBe(10);
  });
});

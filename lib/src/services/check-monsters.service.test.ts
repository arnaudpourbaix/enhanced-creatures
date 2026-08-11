import { afterEach, describe, expect, it, vi } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import { Creature } from "../model/creature/creature";
import { Family } from "../model/creature/family";
import logService from "./log.service";
import mainService from "./main.service";
import stateService from "./state.service";
import checkMonstersService, { diffMonsters } from "./check-monsters.service";

describe("diffMonsters", () => {
  it("reports a built, valid monster as neither missing nor unvalidated", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: true }]);

    expect(result.missing).not.toContain("Wolf");
    expect(result.unvalidated).not.toContain("Wolf");
  });

  it("reports a monster with no built creature as missing", () => {
    const result = diffMonsters([]);

    expect(result.missing).toContain("Wolf");
  });

  it("reports a built creature with valid: false as unvalidated, not missing", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: false }]);

    expect(result.unvalidated).toContain("Wolf");
    expect(result.missing).not.toContain("Wolf");
  });

  it("reports a built creature with valid: undefined as unvalidated", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: undefined }]);

    expect(result.unvalidated).toContain("Wolf");
  });

  it("returns name lists sorted alphabetically", () => {
    const result = diffMonsters([]);

    expect(result.missing).toEqual([...result.missing].sort((a, b) => a.localeCompare(b)));
  });

  it("returns the total count of MonsterEnum members", () => {
    const result = diffMonsters([]);

    const expectedTotal = Object.values(MonsterEnum).filter((v) => typeof v === "number").length;
    expect(result.total).toBe(expectedTotal);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// No default value: every call site deliberately passes undefined/false/true to distinguish
// the real Creature.valid field's 3 meaningful states ("never validated" vs "invalid" vs
// "valid") - a default would obscure that this is a tri-state field, not an optional flag.
// eslint-disable-next-line sonarjs/bool-param-default
function fakeCreature(id: MonsterEnum, valid: boolean | undefined): Creature {
  return { id, valid } as unknown as Creature;
}

function fakeFamily(creatures: Creature[]): Family {
  return { id: 0, items: [], projectiles: [], spells: [], creatures };
}

describe("CheckMonstersService.check", () => {
  function stubPipeline() {
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(stateService, "init").mockResolvedValue(undefined);
    vi.spyOn(mainService, "checkPresets").mockImplementation(() => {});
    vi.spyOn(mainService, "checkSpells").mockImplementation(() => {});
  }

  it("collects creatures from every factory and diffs them against MonsterEnum", async () => {
    stubPipeline();
    const factories = [
      () => fakeFamily([fakeCreature(MonsterEnum.Wolf, true)]),
      () => fakeFamily([fakeCreature(MonsterEnum.Ankheg, false)]),
    ];

    const result = await checkMonstersService.check(factories);

    expect(result.missing).toContain("Medusa");
    expect(result.missing).not.toContain("Wolf");
    expect(result.missing).not.toContain("Ankheg");
    expect(result.unvalidated).toEqual(["Ankheg"]);
  });

  it("runs preflight steps in order, before building any family", async () => {
    const calls: string[] = [];
    vi.spyOn(logService, "init").mockImplementation(() => {
      calls.push("logService.init");
    });
    vi.spyOn(stateService, "init").mockImplementation(() => {
      calls.push("stateService.init");
      return Promise.resolve();
    });
    vi.spyOn(mainService, "checkPresets").mockImplementation(() => {
      calls.push("checkPresets");
    });
    vi.spyOn(mainService, "checkSpells").mockImplementation(() => {
      calls.push("checkSpells");
    });
    const factories = [
      () => {
        calls.push("factory");
        return fakeFamily([]);
      },
    ];

    await checkMonstersService.check(factories);

    expect(calls).toEqual([
      "logService.init",
      "stateService.init",
      "checkPresets",
      "checkSpells",
      "factory",
    ]);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../model/creature/creature";
import bafGeneratorService from "./baf/baf-generator.service";
import logService from "./log.service";
import mainService from "./main.service";
import stateService from "./state.service";
import weiduCreatureService from "./weidu/weidu-creature.service";

// Several tests below spy on logService.log without restoring it themselves, relying on getting a
// fresh spy (no leftover call history) in the next test.
afterEach(() => {
  vi.restoreAllMocks();
});

// No default value: every call site deliberately passes undefined/false/true to distinguish
// the real Creature.valid field's 3 meaningful states ("never validated" vs "invalid" vs
// "valid") - a default would obscure that this is a tri-state field, not an optional flag.
// eslint-disable-next-line sonarjs/bool-param-default
function fakeCreature(valid: boolean | undefined): Creature {
  return { valid, name: "test" } as unknown as Creature;
}

describe("isCreatureValid", () => {
  it("returns false and warns when valid is undefined (not yet validated)", () => {
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    expect(mainService.isCreatureValid(fakeCreature(undefined))).toBe(false);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("has not been validated"));
  });

  it("returns false without warning when valid is explicitly false (already warned at validate() time)", () => {
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    expect(mainService.isCreatureValid(fakeCreature(false))).toBe(false);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("returns true without warning when valid is true", () => {
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    expect(mainService.isCreatureValid(fakeCreature(true))).toBe(true);
    expect(logSpy).not.toHaveBeenCalled();
  });
});

describe("generateCreature", () => {
  it("skips baf/weidu generation for an invalid creature", () => {
    vi.spyOn(logService, "warn").mockImplementation(() => {});
    const bafSpy = vi.spyOn(bafGeneratorService, "generate").mockImplementation(() => {});
    const weiduSpy = vi
      .spyOn(weiduCreatureService, "generateWeiduScript")
      .mockImplementation(() => {});
    mainService.generateCreature(fakeCreature(false));
    expect(bafSpy).not.toHaveBeenCalled();
    expect(weiduSpy).not.toHaveBeenCalled();
  });

  it("logs the error and invalidates the creature when baf generation throws, without propagating", () => {
    vi.spyOn(logService, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    vi.spyOn(bafGeneratorService, "generate").mockImplementation(() => {
      throw new Error("boom");
    });
    const weiduSpy = vi
      .spyOn(weiduCreatureService, "generateWeiduScript")
      .mockImplementation(() => {});

    const creature = fakeCreature(true);
    expect(() => {
      mainService.generateCreature(creature);
    }).not.toThrow();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    expect(creature.valid).toBe(false);
    expect(weiduSpy).not.toHaveBeenCalled();
  });

  it("logs the error and invalidates the creature when weidu script generation throws", () => {
    vi.spyOn(logService, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    vi.spyOn(bafGeneratorService, "generate").mockImplementation(() => {});
    vi.spyOn(weiduCreatureService, "generateWeiduScript").mockImplementation(() => {
      throw new Error("weidu boom");
    });

    const creature = fakeCreature(true);
    expect(() => {
      mainService.generateCreature(creature);
    }).not.toThrow();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("weidu boom"));
    expect(creature.valid).toBe(false);
  });
});

describe("generateAll", () => {
  function stubPipeline() {
    vi.spyOn(stateService, "init").mockResolvedValue(undefined);
    vi.spyOn(mainService, "checkPresets").mockImplementation(() => {});
    vi.spyOn(mainService, "checkSpells").mockImplementation(() => {});
    vi.spyOn(mainService, "generateCreatures").mockImplementation(() => {});
    vi.spyOn(mainService, "generateCommonCode").mockImplementation(() => {});
    vi.spyOn(mainService, "generateTranslations").mockImplementation(() => {});
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(logService, "section").mockImplementation(() => {});
    vi.spyOn(logService, "summary").mockImplementation(() => {});
  }

  it("resolves without throwing when generation has no errors", async () => {
    stubPipeline();
    vi.spyOn(logService, "hasErrors").mockReturnValue(false);

    await expect(mainService.generateAll()).resolves.toBeUndefined();
  });

  it("throws when generation finishes with errors", async () => {
    stubPipeline();
    vi.spyOn(logService, "hasErrors").mockReturnValue(true);

    await expect(mainService.generateAll()).rejects.toThrow(/finished with errors/);
  });
});

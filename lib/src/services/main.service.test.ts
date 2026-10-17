import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EntryEnum } from "../../creatures/entry";
import { KinEnum } from "../../creatures/kin";
import { MonsterEnum } from "../../creatures/monster";
import { Creature } from "../model/creature/creature";
import { CreatureEntry } from "../model/creature/entry";
import { CreatureKin } from "../model/creature/kin";
import { State } from "../state";
import documentationService from "./doc/documentation.service";
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
    vi.spyOn(mainService, "checkSpellbooks").mockImplementation(() => {});
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

describe("generateKinsAndEntries", () => {
  class FakeKin extends CreatureKin {}
  class FakeEntry extends CreatureEntry<Creature> {
    createCreature(id: MonsterEnum): Creature {
      return new Creature(id);
    }
  }
  let tempDir: string;
  let originalModFolder: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ec-main-"));
    originalModFolder = State.modFolder;
    State.modFolder = tempDir;
    vi.spyOn(logService, "header").mockImplementation(() => {});
  });

  afterEach(() => {
    State.modFolder = originalModFolder;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const read = (file: string) =>
    fs.readFileSync(path.join(tempDir, "lib/pnp-monster", file), "utf-8");

  it("generates kins, then entries given the kins, then the index", () => {
    const addFamily = vi.spyOn(documentationService, "addFamily").mockImplementation(() => {});
    let received: Map<KinEnum, CreatureKin> | undefined;
    mainService.generateKinsAndEntries(
      [() => new FakeKin(KinEnum.Fey)],
      [
        () => new FakeEntry(EntryEnum.Vampire),
        (kins) => {
          received = kins;
          return new FakeEntry(EntryEnum.Dryad, kins.get(KinEnum.Fey));
        },
      ],
    );
    expect(received?.get(KinEnum.Fey)?.id).toBe(KinEnum.Fey);
    for (const folder of ["kin/fey", "vampire", "dryad"])
      expect(read(`${folder}/main.tpa`)).toBe("LAM load_secondary_types\r\n");
    expect(read("index.tpa").split("\r\n")).toEqual([
      'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/kin/fey/main.tpa"',
      'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/vampire/main.tpa"',
      'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/dryad/main.tpa"',
      "",
    ]);
    expect(JSON.parse(read("index.json"))).toEqual({ vampire: null, dryad: "fey" });
    // Entries' creatures are documented like families'.
    const documented = addFamily.mock.calls.map(([group]) => group.id);
    expect(documented).toEqual([KinEnum.Fey, EntryEnum.Vampire, EntryEnum.Dryad]);
  });

  it("throws on an entry declared twice", () => {
    expect(() => {
      mainService.generateKinsAndEntries(
        [],
        [() => new FakeEntry(EntryEnum.Vampire), () => new FakeEntry(EntryEnum.Vampire)],
      );
    }).toThrow(/lib\/pnp-monster\/vampire' already generated/);
  });

  it("writes an empty index with the real (empty) registries", () => {
    mainService.generateKinsAndEntries();
    expect(read("index.tpa")).toBe("");
    expect(JSON.parse(read("index.json"))).toEqual({});
  });
});

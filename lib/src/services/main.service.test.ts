import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { entryFactories } from "../../creatures/entries";
import { ENTRY_FOLDERS, EntryEnum } from "../../creatures/entry";
import { KIN_FOLDERS, KinEnum } from "../../creatures/kin";
import { kinFactories } from "../../creatures/kins";
import { MonsterEnum } from "../../creatures/monster";
import { ABILITY_PRESETS } from "../../config/ability-presets";
import { SPELL_PRIORITY_ORDER } from "../../config/spell-priority-order";
import { SPELL_COMBOS } from "../../config/spells/spell-combos";
import { SPELLS } from "../../config/spells/spell-database";
import { Creature } from "../model/creature/creature";
import { SpellTypeEnum } from "../model/spell-item/effect.enums";
import { SpellReference } from "../model/spell-item/spell-reference";
import { CreatureEntry } from "../model/creature/entry";
import { CreatureKin } from "../model/creature/kin";
import { State } from "../state";
import documentationService from "./doc/documentation.service";
import bafGeneratorService from "./baf/baf-generator.service";
import logService from "./log.service";
import spellComboService from "./spell-combo.service";
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

describe("checkSpellCombos", () => {
  beforeEach(() => {
    spellComboService.usePresets(ABILITY_PRESETS);
    vi.spyOn(logService, "section").mockImplementation(() => {});
  });

  it("accepts the registry", () => {
    expect(() => mainService.checkSpellCombos()).not.toThrow();
  });

  it("throws for a sequencer whose file is missing from SPELL_PRIORITY_ORDER", () => {
    const combo = {
      key: "TestUnorderedSequencer",
      kind: "minorSequencer" as const,
      spells: [SPELLS.Wizard.Shield, SPELLS.Wizard.Blur],
    };
    const file = spellComboService.comboFile(combo, "Vanilla");
    expect(SPELL_PRIORITY_ORDER).not.toContain(file);
    expect(() => mainService.checkSpellCombos([...SPELL_COMBOS, combo])).toThrow(
      `${combo.key}: ${file} is missing from SPELL_PRIORITY_ORDER`,
    );
  });
});

describe("checkSpellPriorities", () => {
  beforeEach(() => {
    vi.spyOn(logService, "section").mockImplementation(() => {});
  });

  it("accepts spells that all have a priority", () => {
    const file = SPELL_PRIORITY_ORDER[0];
    expect(() => mainService.checkSpellPriorities([{ id: "TestOrdered", file }])).not.toThrow();
  });

  it("throws listing every spell file missing from SPELL_PRIORITY_ORDER, variants included", () => {
    const spells = [
      { id: "TestUnordered", file: "TESTNO1" },
      { id: "TestVariant", file: SPELL_PRIORITY_ORDER[0], variants: [{ file: "TESTNO2" }] },
    ] as SpellReference[];
    expect(() => mainService.checkSpellPriorities(spells)).toThrow(
      "Spells missing from SPELL_PRIORITY_ORDER (2):\n  - TESTNO1 (TestUnordered)\n  - TESTNO2 (TestVariant)",
    );
  });
});

describe("checkSpellProfiles", () => {
  beforeEach(() => {
    vi.spyOn(logService, "section").mockImplementation(() => {});
  });

  it("accepts the database", () => {
    expect(() => mainService.checkSpellProfiles()).not.toThrow();
  });

  it("lists every spell missing a role or casting time, one per line, naming what's missing", () => {
    const spells: SpellReference[] = [
      { id: "TestComplete", file: "TESTOK", role: "damage", castingTime: 1 },
      { id: "TestNoRole", file: "TESTNO1", castingTime: 3 },
      { file: "TESTNO2" },
    ];
    expect(() => mainService.checkSpellProfiles(spells)).toThrow(
      "Spells missing role/castingTime (2):\n  - TESTNO1 (TestNoRole): role\n  - TESTNO2: role, castingTime",
    );
  });

  it("checks Faiths and Powers spells the same way", () => {
    const fnp = [{ file: "D5PTEST", type: SpellTypeEnum.Priest, level: 1 }];
    expect(() => mainService.checkSpellProfiles([], fnp)).toThrow(
      "Spells missing role/castingTime (1):\n  - D5PTEST: role, castingTime",
    );
  });

  it("needs a profile for every spell this mod creates and casters memorize", () => {
    expect(() => mainService.checkSpellProfiles([], [], ["jasc9999"])).toThrow(
      "Spells missing role/castingTime (1):\n  - jasc9999: no NEW_SPELL_PROFILES entry",
    );
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
    vi.spyOn(mainService, "checkSpellPriorities").mockImplementation(() => {});
    vi.spyOn(mainService, "checkSpellProfiles").mockImplementation(() => {});
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
    const addGroup = vi.spyOn(documentationService, "addGroup").mockImplementation(() => {});
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
    expect(JSON.parse(read("index.json"))).toEqual({
      vampire: { kin: null, dependsOn: [] },
      dryad: { kin: "fey", dependsOn: [] },
    });
    const documented = addGroup.mock.calls.map(([group]) => group.id);
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

  // Smoke test with the real registries: the index maps exactly the registered entries' folders,
  // each to its kin's folder or null. Building is real; generating each group's files is skipped.
  it("writes an index.json of every registered entry with the real registries", async () => {
    await stateService.init();
    State.modFolder = tempDir; // init() points it back at the real mod folder
    mainService.checkPresets();
    vi.spyOn(
      mainService as unknown as { generateGroup: () => void },
      "generateGroup",
    ).mockImplementation(() => {});
    const built: CreatureEntry<Creature>[] = [];
    mainService.generateKinsAndEntries(
      kinFactories,
      entryFactories.map((factory) => (kins: Map<KinEnum, CreatureKin>) => {
        const entry = factory(kins);
        built.push(entry);
        return entry;
      }),
    );
    expect(built).toHaveLength(entryFactories.length);
    const index = JSON.parse(read("index.json")) as Record<
      string,
      { kin: string | null; dependsOn: string[] }
    >;
    expect(Object.keys(index).sort()).toEqual(built.map((e) => ENTRY_FOLDERS[e.id]).sort());
    for (const entry of built) {
      const kin = entry.kin === undefined ? null : KIN_FOLDERS[entry.kin.id];
      expect(index[ENTRY_FOLDERS[entry.id]]).toEqual({
        kin,
        dependsOn: entry.dependsOn.map((id) => ENTRY_FOLDERS[id]),
      });
    }
    expect(Object.values(index).filter((e) => e.kin !== null).length).toBeGreaterThan(0);
  }, 60000);
});

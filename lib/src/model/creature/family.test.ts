import { afterEach, describe, expect, it, vi } from "vitest";
import { MonsterEnum } from "../../../creatures/monster";
import { Item, Spell } from "../spell-item/spell-item";
import { Projectile } from "../spell-item/projectile";
import { CreatureFamily, collapseFilesByGame } from "./family";
import { Creature } from "./creature";
import { TranslationKey } from "../../../translations/i18n";
import { InputMainCreatureData } from "./data-input";
import logService from "../../services/log.service";
import monsterFilesService from "../../services/monster-files.service";
import creatureFactory from "../../factories/creature.factory";
import translationService from "../../services/translation.service";

class TestFamily extends CreatureFamily<Creature> {
  createCreature(id: MonsterEnum): Creature {
    return new Creature(id);
  }
}

function fakeFamily(): TestFamily {
  return new TestFamily(1);
}

const CREATURE_NAME_KEY: TranslationKey = "common.creatureTraits";

// Several tests below spy on logService.warn without restoring it themselves, relying on getting
// a fresh spy (no leftover call history) in the next test.
afterEach(() => {
  vi.restoreAllMocks();
});

describe("creature", () => {
  it("throws when no creature in the family has the given id", () => {
    const family = fakeFamily();
    expect(() => family.creature(99)).toThrow(/No creature found with id 99/);
  });

  it("returns the creature with the matching id", () => {
    const family = fakeFamily();
    const cre = new Creature(5);
    family.creatures.push(cre);
    expect(family.creature(5)).toBe(cre);
  });
});

describe("sequencer", () => {
  it("delegates to abilityService.getSequencer", () => {
    const family = fakeFamily();
    const result = family.sequencer(["SPWI219", "SPWI219", "SPWI219"] as string[] & { length: 3 });
    expect(result).toBeDefined();
  });
});

describe("item (override, family-wide fallback)", () => {
  // Same descriptions reused across item/spell/projectile describe blocks below for analogous
  // family-wide-fallback behavior - a shared constant would hurt searchability in test output.
  // eslint-disable-next-line sonarjs/no-duplicate-string
  it("falls back to searching creatures in the family when not found directly", () => {
    const family = fakeFamily();
    const cre = new Creature(1);
    const item = { id: 7, file: "itm01" } as unknown as Item;
    cre.items.push(item);
    family.creatures.push(cre);
    expect(family.item(7)).toBe(item);
  });

  // eslint-disable-next-line sonarjs/no-duplicate-string
  it("re-throws the original error when not found anywhere in the family", () => {
    const family = fakeFamily();
    expect(() => family.item(99)).toThrow(/No item found with id 99/);
  });
});

describe("spell (override, family-wide fallback)", () => {
  it("falls back to searching creatures in the family when not found directly", () => {
    const family = fakeFamily();
    const cre = new Creature(1);
    const spell = { id: 7, file: "spl01" } as unknown as Spell;
    cre.spells.push(spell);
    family.creatures.push(cre);
    expect(family.spell(7)).toBe(spell);
  });

  it("re-throws the original error when not found anywhere in the family", () => {
    const family = fakeFamily();
    expect(() => family.spell(99)).toThrow(/No spell found with id 99/);
  });
});

describe("projectile (override, family-wide fallback)", () => {
  it("falls back to searching creatures in the family when not found directly", () => {
    const family = fakeFamily();
    const cre = new Creature(1);
    const proj = { id: 7, file: "pro01" } as unknown as Projectile;
    cre.projectiles.push(proj);
    family.creatures.push(cre);
    expect(family.projectile(7)).toBe(proj);
  });

  it("keeps checking later creatures when an earlier one doesn't have it", () => {
    const family = fakeFamily();
    const first = new Creature(1);
    const second = new Creature(2);
    const proj = { id: 7, file: "pro01" } as unknown as Projectile;
    second.projectiles.push(proj);
    family.creatures.push(first, second);
    expect(family.projectile(7)).toBe(proj);
  });

  it("re-throws the original error when not found anywhere in the family", () => {
    const family = fakeFamily();
    expect(() => family.projectile(99)).toThrow(/No projectile found with id 99/);
  });
});

describe("create (files resolution)", () => {
  it("merges creatures.csv-validated files with the hand-authored backup list, deduped", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      files: ["ANKHEG", "SOME_BACKUP_FILE"],
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.fileNames).toEqual(
      expect.arrayContaining(["ANKHEG", "BDNEO", "BDANKH01", "SOME_BACKUP_FILE"]),
    );
    expect(cre.fileNames.filter((f) => f === "ANKHEG")).toHaveLength(1);
  });

  it("works with no backup files at all", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.fileNames).toEqual(expect.arrayContaining(["ANKHEG", "BDNEO"]));
  });

  it("uppercases a lowercase backup file, since generated WeiDU comparisons against creature.files are case-sensitive", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      files: ["some_backup_file"],
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.fileNames).toContain("SOME_BACKUP_FILE");
    expect(cre.fileNames).not.toContain("some_backup_file");
  });

  it("uppercases notEnforceFiles entries", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      notEnforceFiles: ["some_backup_file"],
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.notEnforceFiles).toEqual(["SOME_BACKUP_FILE"]);
  });
});

describe("createFrom (files resolution)", () => {
  it("merges creatures.csv-validated files with the hand-authored backup list, deduped", () => {
    const family = fakeFamily();
    const from = {
      name: CREATURE_NAME_KEY,
      data: { movement: {} },
      attack: { dualWielding: false },
    } as unknown as Creature;

    const cre = family.createFrom({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      files: ["SOME_BACKUP_FILE"],
      from,
    });

    // `from` is a bare stub without Creature.prototype, so read names off `files` directly.
    expect(cre.files.map((f) => f.name)).toEqual(
      expect.arrayContaining(["ANKHEG", "BDNEO", "SOME_BACKUP_FILE"]),
    );
  });

  it("uppercases a lowercase backup file, since generated WeiDU comparisons against creature.files are case-sensitive", () => {
    const family = fakeFamily();
    const from = {
      name: CREATURE_NAME_KEY,
      data: { movement: {} },
      attack: { dualWielding: false },
    } as unknown as Creature;

    const cre = family.createFrom({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      files: ["some_backup_file"],
      from,
    });

    const names = cre.files.map((f) => f.name);
    expect(names).toContain("SOME_BACKUP_FILE");
    expect(names).not.toContain("some_backup_file");
  });
});

describe("create (game collapse)", () => {
  it("collapses a resref present in both games to an unconditional entry", () => {
    const family = fakeFamily();
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([
      { name: "GORF", game: "bg1" },
      { name: "GORF", game: "bg2" },
    ]);
    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.files).toEqual([{ name: "GORF", game: undefined }]);
  });

  it("keeps a single-game resref scoped to that game", () => {
    const family = fakeFamily();
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([{ name: "BG1ONLY", game: "bg1" }]);
    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.files).toEqual([{ name: "BG1ONLY", game: "bg1" }]);
  });

  it("treats a game='' row as both games even when a single-game row for the same name exists", () => {
    const family = fakeFamily();
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([
      { name: "MIX", game: "bg1" },
      { name: "MIX", game: undefined },
    ]);
    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.files).toEqual([{ name: "MIX", game: undefined }]);
  });

  it("accepts and uppercases object backup entries with a game", () => {
    const family = fakeFamily();
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([]);
    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      files: [{ name: "bar", game: "bg2" }, "foo"],
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.files).toEqual(
      expect.arrayContaining([
        { name: "BAR", game: "bg2" },
        { name: "FOO", game: undefined },
      ]),
    );
  });

  it("preserves first-seen order of names", () => {
    const family = fakeFamily();
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([
      { name: "SECOND", game: "bg1" },
      { name: "FIRST", game: "bg2" },
      { name: "SECOND", game: "bg2" },
    ]);
    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.fileNames).toEqual(["SECOND", "FIRST"]);
  });
});

describe("applyCsvSummonFiles", () => {
  it("appends game-agnostic synthetic summon adjustments for CSV-confirmed files", () => {
    const family = fakeFamily();
    vi.spyOn(creatureFactory, "validate").mockImplementation(() => {});
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([
      { name: "BOTH", game: undefined },
      { name: "BG1SUM", game: "bg1" },
    ]);
    vi.spyOn(monsterFilesService, "getSummonFiles").mockReturnValue([
      { name: "BOTH", game: "bg1" },
      { name: "BOTH", game: "bg2" },
      { name: "BG1SUM", game: "bg1" },
    ]);

    family.addCreature(() =>
      family.create({
        name: CREATURE_NAME_KEY,
        monster: MonsterEnum.Ankheg,
        data: {} as unknown as InputMainCreatureData,
      }),
    );

    const summonAdjustments = family.creatures[0].adjustments.filter((a) => a.summon);
    // Dedup by name (BOTH appears once), correct files, and NO game tag on any synthetic summon -
    // single-game scoping comes from patchCreatures' per-game loop, not from the adjustment.
    expect(summonAdjustments).toEqual([
      expect.objectContaining({ files: ["BOTH"], summon: true }),
      expect.objectContaining({ files: ["BG1SUM"], summon: true }),
    ]);
    for (const a of summonAdjustments) expect(a.game).toBeUndefined();
  });

  it("leaves hand-authored summon:true files alone (no duplicate synthetic entry)", () => {
    const family = fakeFamily();
    vi.spyOn(creatureFactory, "validate").mockImplementation(() => {});
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([{ name: "HANDSUM", game: undefined }]);
    vi.spyOn(monsterFilesService, "getSummonFiles").mockReturnValue([
      { name: "HANDSUM", game: undefined },
    ]);

    family.addCreature(() => {
      const cre = family.create({
        name: CREATURE_NAME_KEY,
        monster: MonsterEnum.Ankheg,
        data: {} as unknown as InputMainCreatureData,
      });
      cre.setAdjustments([{ files: ["HANDSUM"], summon: true }]);
      return cre;
    });

    const summonAdjustments = family.creatures[0].adjustments.filter((a) => a.summon);
    expect(summonAdjustments).toHaveLength(1);
    expect(summonAdjustments[0].files).toEqual(["HANDSUM"]);
  });
});

describe("collapseFilesByGame", () => {
  it("collapses both-game coverage to undefined and keeps lone games scoped", () => {
    expect(
      collapseFilesByGame([
        { name: "A", game: "bg1" },
        { name: "A", game: "bg2" },
        { name: "B", game: "bg1" },
        { name: "C", game: undefined },
        { name: "C", game: "bg2" },
      ]),
    ).toEqual([
      { name: "A", game: undefined },
      { name: "B", game: "bg1" },
      { name: "C", game: undefined },
    ]);
  });
});

describe("create/createFrom (unvalidated creatures.csv guesses warning)", () => {
  it("warns with the monster's unvalidated creatures.csv guesses", () => {
    const family = fakeFamily();
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});

    family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Wolf,
      data: {} as unknown as InputMainCreatureData,
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("9XDOG"));
  });

  it("does not warn when the monster has no unvalidated guesses at all", () => {
    const family = fakeFamily();
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});

    // MutatedSpider is declared in MonsterEnum but never implemented in any creature family
    // definition, so monster-id-mapping can never assign it a MonsterId - guaranteed zero rows.
    family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.MutatedSpider,
      data: {} as unknown as InputMainCreatureData,
    });

    expect(logSpy).not.toHaveBeenCalled();
  });
});

describe("addCreature", () => {
  it("builds, validates, and keeps the creature when nothing throws", () => {
    const family = fakeFamily();
    const validateSpy = vi.spyOn(creatureFactory, "validate").mockImplementation(() => {});
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});

    family.addCreature(() =>
      family.create({
        name: CREATURE_NAME_KEY,
        monster: MonsterEnum.Ankheg,
        data: {} as unknown as InputMainCreatureData,
      }),
    );

    expect(family.creatures).toHaveLength(1);
    expect(validateSpy).toHaveBeenCalledWith(family.creatures[0], family.id);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs and continues, without adding a creature, when the builder throws before create()", () => {
    const family = fakeFamily();
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});

    expect(() => {
      family.addCreature(() => {
        throw new Error("boom");
      });
    }).not.toThrow();

    expect(family.creatures).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
  });

  it("logs, invalidates, and keeps the partially-built creature when the builder throws after create()", () => {
    const family = fakeFamily();
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});

    expect(() => {
      family.addCreature(() => {
        family.create({
          name: CREATURE_NAME_KEY,
          monster: MonsterEnum.Ankheg,
          data: {} as unknown as InputMainCreatureData,
        });
        throw new Error("boom");
      });
    }).not.toThrow();

    expect(family.creatures).toHaveLength(1);
    expect(family.creatures[0].valid).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    // The .at(-1) fallback (see family.ts's addCreature()) recovers the actual creature, so the
    // log message names it - not the generic "creature" label used when the builder throws
    // before create() ever runs (see the previous test).
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(translationService.from(CREATURE_NAME_KEY)),
    );
  });

  it("logs and invalidates the creature when validate() throws", () => {
    const family = fakeFamily();
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    vi.spyOn(creatureFactory, "validate").mockImplementation(() => {
      throw new Error("validate boom");
    });

    expect(() => {
      family.addCreature(() =>
        family.create({
          name: CREATURE_NAME_KEY,
          monster: MonsterEnum.Ankheg,
          data: {} as unknown as InputMainCreatureData,
        }),
      );
    }).not.toThrow();

    expect(family.creatures).toHaveLength(1);
    expect(family.creatures[0].valid).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("validate boom"));
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { MonsterEnum } from "../../../creatures/monster";
import { Item, Spell } from "../spell-item/spell-item";
import { Projectile } from "../spell-item/projectile";
import { CreatureFamily } from "./family";
import { Creature } from "./creature";
import { TranslationKey } from "../../../translations/i18n";
import { InputMainCreatureData } from "./data-input";
import logService from "../../services/log.service";

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
    expect(() => family.creature(99 as MonsterEnum)).toThrow(/No creature found with id 99/);
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

    expect(cre.files).toEqual(
      expect.arrayContaining(["ANKHEG", "BDNEO", "BDANKH01", "SOME_BACKUP_FILE"]),
    );
    expect(cre.files.filter((f) => f === "ANKHEG")).toHaveLength(1);
  });

  it("works with no backup files at all", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.files).toEqual(expect.arrayContaining(["ANKHEG", "BDNEO"]));
  });

  it("uppercases a lowercase backup file, since generated WeiDU comparisons against creature.files are case-sensitive", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      files: ["some_backup_file"],
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.files).toContain("SOME_BACKUP_FILE");
    expect(cre.files).not.toContain("some_backup_file");
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

    expect(cre.files).toEqual(expect.arrayContaining(["ANKHEG", "BDNEO", "SOME_BACKUP_FILE"]));
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

    expect(cre.files).toContain("SOME_BACKUP_FILE");
    expect(cre.files).not.toContain("some_backup_file");
  });
});

describe("create/createFrom (unvalidated creatures.csv guesses warning)", () => {
  it("warns with the monster's unvalidated creatures.csv guesses", () => {
    const family = fakeFamily();
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});

    family.create({
      name: CREATURE_NAME_KEY,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("L#MIMMI"));
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

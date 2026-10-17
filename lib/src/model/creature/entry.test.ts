import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryEnum } from "../../../creatures/entry";
import { KinEnum } from "../../../creatures/kin";
import { MonsterEnum } from "../../../creatures/monster";
import { TranslationKey } from "../../../translations/i18n";
import logService from "../../services/log.service";
import { Creature } from "./creature";
import { InputMainCreatureData } from "./data-input";
import { CreatureEntry } from "./entry";
import { CreatureKin } from "./kin";

class TestKin extends CreatureKin {}

class TestEntry extends CreatureEntry<Creature> {
  createCreature(id: MonsterEnum): Creature {
    return new Creature(id);
  }
}

const NAME: TranslationKey = "common.creatureTraits";
const DATA = {} as unknown as InputMainCreatureData;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CreatureEntry", () => {
  it("logs its own section header", () => {
    const header = vi.spyOn(logService, "header").mockImplementation(() => {});
    new TestEntry(EntryEnum.Vampire);
    expect(header).toHaveBeenCalledWith("Creating entry Vampire...");
  });

  it("names its own resources with scope e and its code", () => {
    const entry = new TestEntry(EntryEnum.Basilisk);
    expect(entry.addSpell({}).file).toBe("jase0100");
    expect(entry.addProjectile({} as never).file).toBe("jape0100");
    expect(new TestEntry(EntryEnum.Ankheg).addSpell({}).file).toBe("jase0a00");
  });

  it("stamps its members with the entry and its folder, without family", () => {
    const entry = new TestEntry(EntryEnum.ClayGolem);
    const base = entry.create({ name: NAME, monster: MonsterEnum.ClayGolem, data: DATA });
    // A bare stub as `from`, as in family.test.ts (create() with empty data has no movement).
    const stub = {
      name: NAME,
      family: 9,
      data: { movement: {} },
      attack: { dualWielding: false },
    } as unknown as Creature;
    const from = entry.createFrom({ name: NAME, monster: MonsterEnum.LesserClayGolem, from: stub });
    for (const c of [base, from]) {
      expect(c.entry).toBe(EntryEnum.ClayGolem);
      expect(c.folder).toBe("lib/pnp-monster/clay-golem");
      expect(c.family).toBeUndefined();
    }
    expect(entry.creatures).toEqual([base, from]);
    expect(entry.folder).toBe("lib/pnp-monster/clay-golem");
  });

  it("builds members through addCreature and validates them without family", () => {
    const entry = new TestEntry(EntryEnum.Ankheg);
    const validate = vi.spyOn(Creature.prototype, "validate").mockImplementation(() => {});
    entry.addCreature(() => entry.create({ name: NAME, monster: MonsterEnum.Ankheg, data: DATA }));
    expect(entry.creature(MonsterEnum.Ankheg).entry).toBe(EntryEnum.Ankheg);
    expect(validate).toHaveBeenCalledWith(undefined);
  });

  it("stamps a member whose builder threw after create()", () => {
    vi.spyOn(logService, "error").mockImplementation(() => {});
    const entry = new TestEntry(EntryEnum.Ankheg);
    entry.addCreature(() => {
      entry.create({ name: NAME, monster: MonsterEnum.Ankheg, data: DATA });
      throw new Error("boom");
    });
    expect(entry.creatures[0].valid).toBe(false);
    expect(entry.creatures[0].entry).toBe(EntryEnum.Ankheg);
  });

  it("reaches its kin's resources, after its own and its members'", () => {
    const kin = new TestKin(KinEnum.Fey);
    const kinSpell = kin.addSpell({ id: 1 });
    const kinItem = kin.addItem({ id: 2 });
    const entry = new TestEntry(EntryEnum.Dryad, kin);
    expect(entry.kin).toBe(kin);
    expect(entry.spell(1)).toBe(kinSpell);
    expect(entry.item(2)).toBe(kinItem);
    const own = entry.addSpell({ id: 3 });
    expect(entry.spell(3)).toBe(own);
    expect(() => entry.spell(99)).toThrow(/No spell found with id 99/);
    expect(() => new TestEntry(EntryEnum.Ankheg).spell(1)).toThrow(/No spell found with id 1/);
  });
});

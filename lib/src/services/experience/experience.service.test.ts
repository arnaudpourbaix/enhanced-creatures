import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import { Game } from "../../model/creature/game";
import monsterFilesService, { CreatureCsvRow } from "../monster-files.service";
import experienceService from "./experience.service";

const FILE = "F";

afterEach(() => {
  vi.restoreAllMocks();
});

function level(value: number) {
  return { pnpValue: value, type: "none", value } as CreatureData["level1"];
}

function emptyData(): Partial<CreatureData> {
  return {
    script: { remove: [] },
    proficiencies: [],
    immunities: [],
    items: { equipped: [], remove: [] },
    spells: { memorized: [] },
    effects: { list: [] },
  } as unknown as Partial<CreatureData>;
}

function fakeCreature(p: {
  xpv?: number;
  level?: number;
  files?: { name: string; game?: Game }[];
  adjustments?: { game?: Game; summon?: boolean; data: Partial<CreatureData> }[];
}): Creature {
  const data = {
    ...emptyData(),
    level1: level(p.level ?? 4),
    movement: { pnpValue: 12 },
    strength: 10,
    dexterity: 10,
    constitution: 12,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hp: 40,
    ac: 5,
    thac0: 15,
    apr: 1,
    doubleApr: false,
    xpv: p.xpv,
    alignment: "NEUTRAL",
    morale: 10,
    size: "Large",
  } as unknown as CreatureData;
  return {
    data,
    id: 1,
    files: p.files ?? [{ name: FILE }],
    attack: { dualWielding: false, melee: true, ranged: false },
    behavior: { abilities: [] },
    autoImmunities: [],
    items: [],
    spells: [],
    experience: [],
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: [FILE],
      noWeapon: false,
      game: a.game,
      summon: a.summon ?? false,
      scriptName: false,
      data: { ...emptyData(), ...a.data },
    })),
  } as unknown as Creature;
}

function row(xpv: number | undefined, game?: Game): CreatureCsvRow {
  return {
    file: FILE,
    game,
    level: undefined,
    xpv,
    items: [],
    scripts: [],
    validatedLevel: false,
    validatedItems: false,
    validatedScript: false,
  };
}

function mockRows(...rows: CreatureCsvRow[]) {
  vi.spyOn(monsterFilesService, "getCreatureRows").mockImplementation((_file, game) =>
    rows.filter((r) => r.game === undefined || game === undefined || r.game === game),
  );
}

const BUMP = { data: { level1: level(9) } };

/** The synthetic entries apply() appended after the creature's own adjustments. */
function appended(creature: Creature, ownCount: number) {
  return creature.adjustments.slice(ownCount).map((a) => ({
    files: a.files,
    game: a.game,
    variant: a.variant,
    xpv: a.data.xpv,
  }));
}

describe("experienceService.evaluate", () => {
  it("keeps the book XP for a file no adjustment covers", () => {
    mockRows(row(650));
    const { rows } = experienceService.evaluate(fakeCreature({ xpv: 120 }));
    expect(rows).toEqual([
      expect.objectContaining({ file: FILE, status: "book", inGameXp: 650, newXp: 120 }),
    ]);
  });

  it("marks a script-only adjustment as base and appends nothing", () => {
    mockRows(row(100));
    const creature = fakeCreature({
      xpv: 120,
      adjustments: [{ data: { script: { remove: [], location: "X" } } as Partial<CreatureData> }],
    });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({
        status: "asBase",
        reason: "adjustment changes nothing the formula reads: base creature XP",
        newXp: 120,
      }),
    ]);
    expect(appended(creature, 1)).toEqual([]);
  });

  it("turns an as-base row into a drop when the book XP is below the in-game XP", () => {
    mockRows(row(91000));
    const creature = fakeCreature({
      xpv: 21000,
      adjustments: [{ data: { script: { remove: [], location: "X" } } as Partial<CreatureData> }],
    });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ status: "drop", inGameXp: 91000, newXp: 91000 }),
    ]);
    expect(creature.experience[0].reason).toBe(creature.experience[0].score.breakdown);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: undefined, variant: undefined, xpv: 91000 },
    ]);
  });

  it("keeps an as-base row when the book XP is at least the in-game XP", () => {
    mockRows(row(120));
    const creature = fakeCreature({
      xpv: 120,
      adjustments: [{ data: { script: { remove: [], location: "X" } } as Partial<CreatureData> }],
    });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ status: "asBase", newXp: 120 }),
    ]);
    expect(appended(creature, 1)).toEqual([]);
  });

  it("keeps a book row below the in-game XP as book", () => {
    mockRows(row(91000));
    expect(experienceService.evaluate(fakeCreature({ xpv: 21000 })).rows).toEqual([
      expect.objectContaining({ status: "book", newXp: 21000 }),
    ]);
  });

  it("writes the formula XP when it beats the in-game XP", () => {
    mockRows(row(650));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ status: "formula", inGameXp: 650, newXp: 975 }),
    ]);
    expect(creature.experience[0].reason).toBe(creature.experience[0].score.breakdown);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: undefined, variant: undefined, xpv: 975 },
    ]);
  });

  it("keeps the in-game XP when the formula would drop it", () => {
    mockRows(row(91000));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ status: "drop", inGameXp: 91000, newXp: 91000 }),
    ]);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: undefined, variant: undefined, xpv: 91000 },
    ]);
  });

  it("zeroes a summon file and appends nothing", () => {
    mockRows(row(650));
    const creature = fakeCreature({ xpv: 120, adjustments: [{ summon: true, data: {} }, BUMP] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ status: "zero", reason: "summon", newXp: 0 }),
    ]);
    expect(appended(creature, 2)).toEqual([]);
  });

  it("zeroes an adjustment that sets xpv 0", () => {
    mockRows(row(650));
    const creature = fakeCreature({ xpv: 120, adjustments: [{ data: { xpv: 0 } }] });
    expect(experienceService.evaluate(creature).rows).toEqual([
      expect.objectContaining({ status: "zero", reason: "xpv 0", newXp: 0 }),
    ]);
  });

  it("zeroes a file worth 0 in game and writes xpv 0", () => {
    mockRows(row(0));
    const creature = fakeCreature({ xpv: 120 });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ status: "zero", reason: "0 in game", inGameXp: 0, newXp: 0 }),
    ]);
    expect(appended(creature, 0)).toEqual([
      { files: [FILE], game: undefined, variant: undefined, xpv: 0 },
    ]);
  });

  it("splits a file whose game rows disagree on the in-game XP", () => {
    mockRows(row(650, "bg1"), row(1400, "bg2"));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ game: "bg1", status: "formula", inGameXp: 650, newXp: 975 }),
      expect.objectContaining({ game: "bg2", status: "drop", inGameXp: 1400, newXp: 1400 }),
    ]);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: "bg1", variant: undefined, xpv: 975 },
      { files: [FILE], game: "bg2", variant: undefined, xpv: 1400 },
    ]);
  });

  it("tags the untagged row's patch with the remaining game in a mixed split", () => {
    mockRows(row(650), row(1400, "bg2"));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ game: "bg1", status: "formula", inGameXp: 650, newXp: 975 }),
      expect.objectContaining({ game: "bg2", status: "drop", inGameXp: 1400, newXp: 1400 }),
    ]);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: "bg1", variant: undefined, xpv: 975 },
      { files: [FILE], game: "bg2", variant: undefined, xpv: 1400 },
    ]);
  });

  it("does not split a file whose game rows agree", () => {
    mockRows(row(650, "bg1"), row(650, "bg2"));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ game: undefined, status: "formula", newXp: 975 }),
    ]);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: undefined, variant: undefined, xpv: 975 },
    ]);
  });

  it("scores each game of a file with game-tagged adjustments", () => {
    mockRows(row(650));
    const creature = fakeCreature({
      xpv: 120,
      adjustments: [
        { game: "bg1", data: { level1: level(9) } },
        { game: "bg2", data: { level1: level(10) } },
      ],
    });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ game: "bg1", status: "formula", newXp: 975 }),
      expect.objectContaining({ game: "bg2", status: "formula", newXp: 1400 }),
    ]);
    expect(appended(creature, 2)).toEqual([
      { files: [FILE], game: "bg1", variant: undefined, xpv: 975 },
      { files: [FILE], game: "bg2", variant: undefined, xpv: 1400 },
    ]);
  });

  it("scores the file's other games next to a game-tagged adjustment", () => {
    mockRows(row(650, "bg1"), row(1400, "bg2"));
    const creature = fakeCreature({
      xpv: 120,
      adjustments: [BUMP, { game: "bg1", data: { hp: 50 } }],
    });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ game: "bg1", status: "formula", inGameXp: 650, newXp: 975 }),
      expect.objectContaining({ game: "bg2", status: "drop", inGameXp: 1400, newXp: 1400 }),
    ]);
    expect(appended(creature, 2)).toEqual([
      { files: [FILE], game: "bg1", variant: undefined, xpv: 975 },
      { files: [FILE], game: "bg2", variant: undefined, xpv: 1400 },
    ]);
  });

  it("adds no other game for a file in the tagged game only", () => {
    mockRows(row(650, "bg1"));
    const creature = fakeCreature({ xpv: 120, adjustments: [{ game: "bg1", ...BUMP }] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ game: "bg1", status: "formula", newXp: 975 }),
    ]);
  });

  it("does not split on duplicate rows of one game, using its first row", () => {
    mockRows(row(650, "bg2"), row(1400, "bg2"));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    experienceService.apply(creature);
    expect(creature.experience).toEqual([
      expect.objectContaining({ game: undefined, status: "formula", inGameXp: 650, newXp: 975 }),
    ]);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: undefined, variant: undefined, xpv: 975 },
    ]);
  });

  it("splits only into the file's games when one game has duplicate rows", () => {
    mockRows(row(650, "bg1"), row(1400, "bg2"), row(900, "bg2"));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    experienceService.apply(creature);
    expect(appended(creature, 1)).toEqual([
      { files: [FILE], game: "bg1", variant: undefined, xpv: 975 },
      { files: [FILE], game: "bg2", variant: undefined, xpv: 1400 },
    ]);
  });

  it("uses the formula when the file has no in-game XP", () => {
    mockRows(row(undefined));
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    expect(experienceService.evaluate(creature).rows).toEqual([
      expect.objectContaining({ status: "formula", inGameXp: undefined, newXp: 975 }),
    ]);
  });

  it("uses the formula when the file has no creatures.csv row", () => {
    mockRows();
    const creature = fakeCreature({ xpv: 120, adjustments: [BUMP] });
    expect(experienceService.evaluate(creature).rows).toEqual([
      expect.objectContaining({ status: "formula", newXp: 975 }),
    ]);
  });

  it("reports a conflict when the book XP differs from the base formula", () => {
    mockRows(row(270));
    const creature = fakeCreature({ xpv: 300, level: 6 });
    experienceService.apply(creature);
    expect(creature.baseExperience).toEqual(
      expect.objectContaining({ bookXp: 300, score: expect.objectContaining({ xp: 270 }) }),
    );
  });

  it("reports a conflict when the creature has no book XP", () => {
    mockRows(row(270));
    const { conflict } = experienceService.evaluate(fakeCreature({ level: 6 }));
    expect(conflict).toEqual(expect.objectContaining({ bookXp: undefined }));
  });

  it("reports no conflict when the book XP matches the base formula", () => {
    mockRows(row(270));
    const creature = fakeCreature({ xpv: 270, level: 6 });
    experienceService.apply(creature);
    expect(creature.baseExperience).toBeUndefined();
  });

  it("does not read its own synthetic entries when applied twice", () => {
    mockRows(row(0));
    const creature = fakeCreature({ xpv: 120 });
    experienceService.apply(creature);
    experienceService.apply(creature);
    expect(creature.adjustments).toHaveLength(1);
    expect(experienceService.evaluate(creature).rows).toEqual([
      expect.objectContaining({ status: "zero", reason: "0 in game" }),
    ]);
  });
});

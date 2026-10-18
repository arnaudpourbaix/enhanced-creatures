import { describe, expect, it } from "vitest";
import { Creature } from "../src/model/creature/creature";
import { CreatureKin } from "../src/model/creature/kin";
import mainService from "../src/services/main.service";
import stateService from "../src/services/state.service";
import { entryFactories } from "./entries";
import { ENTRY_FOLDERS, ENTRY_NAMES, EntryEnum } from "./entry";
import { KIN_FOLDERS, KinEnum } from "./kin";
import { kinFactories } from "./kins";
import { MonsterEnum } from "./monster";

const entryIds = Object.values(EntryEnum).filter((v): v is EntryEnum => typeof v === "number");

describe("ENTRY_FOLDERS", () => {
  it("is the kebab-case of the enum key", () => {
    expect(ENTRY_FOLDERS[EntryEnum.ClayGolem]).toBe("clay-golem");
    expect(ENTRY_FOLDERS[EntryEnum.Vampire]).toBe("vampire");
    expect(ENTRY_FOLDERS[EntryEnum.GiantPoisonousSnake]).toBe("giant-poisonous-snake");
    for (const id of entryIds) expect(ENTRY_FOLDERS[id]).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("is unique and never a reserved pnp-monster folder", () => {
    const folders = entryIds.map((id) => ENTRY_FOLDERS[id]);
    expect(new Set(folders).size).toBe(folders.length);
    expect(folders).not.toContain("common");
    expect(folders).not.toContain("kin");
  });
});

describe("EntryEnum", () => {
  it("keeps the ids of the multi-member entries", () => {
    expect(EntryEnum.Basilisk).toBe(1);
    expect(EntryEnum.ClayGolem).toBe(2);
    expect(EntryEnum.Zombie).toBe(9);
    expect(EntryEnum.Ankheg).toBe(10);
  });

  it("keeps the doc.entry names of the multi-member entries", () => {
    expect(ENTRY_NAMES[EntryEnum.ClayGolem]).toBe("doc.entry.clayGolem");
  });
});

describe("KIN_FOLDERS", () => {
  it("is the lowercase enum key", () => {
    expect(KIN_FOLDERS[KinEnum.Bear]).toBe("bear");
    expect(KIN_FOLDERS[KinEnum.Skeleton]).toBe("skeleton");
    expect(KinEnum.Bear).toBe(1);
    expect(KinEnum.Wolf).toBe(10);
    expect(KinEnum.Skeleton).toBe(12);
  });
});

// Builds every kin and entry like the generator does: each entry builds its own members.
describe("entries against a full build", () => {
  it("builds each monster once, stamped with its entry; names exactly the multi-member entries", async () => {
    await stateService.init();
    mainService.checkPresets();
    const kins = new Map<KinEnum, CreatureKin>();
    for (const factory of kinFactories) {
      const kin = factory();
      kins.set(kin.id, kin);
    }
    const built = new Map<EntryEnum, Creature[]>();
    for (const factory of entryFactories) {
      const entry = factory(kins);
      built.set(entry.id, entry.creatures);
    }
    expect([...built.keys()].sort((a, b) => a - b)).toEqual(entryIds);

    const monsters = [...built.values()].flat().map((c) => c.id as MonsterEnum);
    expect(new Set(monsters).size).toBe(monsters.length);
    for (const [id, members] of built) {
      expect(members.length, EntryEnum[id]).toBeGreaterThan(0);
      for (const c of members) expect(c.entry).toBe(id);
    }

    // A single-member entry is named after its creature: only multi-member entries need a name.
    const multi = [...built].filter(([, members]) => members.length > 1).map(([id]) => id);
    const named = Object.keys(ENTRY_NAMES).map(Number);
    expect(named.sort((a, b) => a - b)).toEqual(multi.sort((a, b) => a - b));
  }, 60000);
});

// Cross-entry needs found during the migration; `copy` relies on them to keep a working subset.
describe("entry dependencies", () => {
  const expected: [EntryEnum, EntryEnum[]][] = [
    // Build/install: derived from another entry's creature.
    [EntryEnum.BattleHorror, [EntryEnum.HelmedHorror]],
    [EntryEnum.DoomSayer, [EntryEnum.BattleHorror]],
    [EntryEnum.OgreShaman, [EntryEnum.Ogre]],
    [EntryEnum.SpikeSkeleton, [EntryEnum.Skeleton]],
    [EntryEnum.ArcherSkeleton, [EntryEnum.Skeleton]],
    [EntryEnum.GiantSkeleton, [EntryEnum.Skeleton]],
    [EntryEnum.SkeletonMonster, [EntryEnum.Skeleton]],
    // Runtime: summons or creates a creature file of another entry.
    [EntryEnum.Nereid, [EntryEnum.GiantPoisonousSnake]],
    [EntryEnum.OliveSlime, [EntryEnum.OliveSlimeCreature]],
  ];

  it("declares every known dependency", async () => {
    await stateService.init();
    mainService.checkPresets();
    const kins = new Map<KinEnum, CreatureKin>();
    for (const factory of kinFactories) {
      const kin = factory();
      kins.set(kin.id, kin);
    }
    const built = new Map<EntryEnum, EntryEnum[]>();
    for (const factory of entryFactories) {
      const entry = factory(kins);
      built.set(entry.id, entry.dependsOn);
    }
    for (const [id, deps] of expected) {
      expect(built.get(id), EntryEnum[id]).toEqual(expect.arrayContaining(deps));
    }
    // Nothing else is declared: a new dependency must be added to this list on purpose.
    const declared = [...built].filter(([, deps]) => deps.length).map(([id]) => id);
    expect(declared.sort((a, b) => a - b)).toEqual(
      expected.map(([id]) => id).sort((a, b) => a - b),
    );
  }, 60000);
});

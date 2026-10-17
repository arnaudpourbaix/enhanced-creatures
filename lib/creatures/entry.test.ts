import { describe, expect, it } from "vitest";
import { Creature } from "../src/model/creature/creature";
import { CreatureKin } from "../src/model/creature/kin";
import mainService from "../src/services/main.service";
import stateService from "../src/services/state.service";
import { entryFactories } from "./entries";
import { ENTRY_FOLDERS, ENTRY_MEMBERS, ENTRY_NAMES, EntryEnum } from "./entry";
import { familyFactories } from ".";
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

  it("maps every monster to at most one entry", () => {
    const members = entryIds.flatMap((id) => ENTRY_MEMBERS[id]);
    expect(new Set(members).size).toBe(members.length);
  });

  it("keeps the doc.entry names of the multi-member entries", () => {
    expect(ENTRY_NAMES[EntryEnum.ClayGolem]).toBe("doc.entry.clayGolem");
  });
});

describe("KIN_FOLDERS", () => {
  it("is the lowercase enum key", () => {
    expect(KIN_FOLDERS[KinEnum.Bear]).toBe("bear");
    expect(KIN_FOLDERS[KinEnum.Spectral]).toBe("spectral");
    expect(KinEnum.Bear).toBe(1);
    expect(KinEnum.Zombie).toBe(14);
  });
});

// Builds every family, kin and entry like the generator does: the creatures they build must be
// exactly ENTRY_MEMBERS (each once, entry members in declared order), so that the families'
// migration into entries can neither lose nor duplicate a creature.
describe("ENTRY_MEMBERS against a full build", () => {
  it("matches every creature built by the families and entries", async () => {
    await stateService.init();
    mainService.checkPresets();
    const creatures: Creature[] = [];
    for (const factory of familyFactories) creatures.push(...factory().creatures);
    const kins = new Map<KinEnum, CreatureKin>();
    for (const factory of kinFactories) {
      const kin = factory();
      kins.set(kin.id, kin);
    }
    for (const factory of entryFactories) creatures.push(...factory(kins).creatures);

    const built = creatures.map((c) => c.id as MonsterEnum).sort((a, b) => a - b);
    const mapped = entryIds.flatMap((id) => ENTRY_MEMBERS[id]).sort((a, b) => a - b);
    expect(built).toEqual(mapped);

    for (const id of entryIds) {
      const members = creatures.filter((c) => ENTRY_MEMBERS[id].includes(c.id));
      expect(members.map((c) => c.id)).toEqual(ENTRY_MEMBERS[id]);
      if (members.length > 1) {
        for (const c of members) expect(c.entry).toBe(id);
      } else {
        // A single-member entry is named after its creature (no translation of its own).
        expect(ENTRY_NAMES[id]).toBe(members[0].name);
        // Unstamped while still built by a family, stamped once built by its CreatureEntry.
        expect([undefined, id]).toContain(members[0].entry);
      }
    }
  }, 60000);
});

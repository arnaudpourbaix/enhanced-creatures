import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../model/creature/creature";
import { MainCreatureData } from "../model/creature/data";
import { PartialCreatureAdjustment } from "../model/creature/adjustment";
import creatureFactory from "./creature.factory";
import variantFactory from "./variant.factory";
import logService from "../services/log.service";

afterEach(() => {
  vi.restoreAllMocks();
});

const NAME_KEY = "common.potion.use";
const GREATER_GHAST = "greater ghast";

function fakeCreature(): Creature {
  const creature = new Creature(1);
  creature.data = { items: { equipped: [] } } as unknown as MainCreatureData;
  creature.name = NAME_KEY;
  return creature;
}

function captureAdjustments(): () => PartialCreatureAdjustment[] {
  const spy = vi.spyOn(creatureFactory, "setAdjustments").mockImplementation(() => undefined);
  return () => spy.mock.calls[0][1];
}

describe("variantFactory.add", () => {
  it("expands files + data into one grouped adjustment", () => {
    const get = captureAdjustments();
    variantFactory.add(fakeCreature(), GREATER_GHAST, {
      data: { level1: 6, strength: 18 },
      files: ["GRON", "GMAYOR"],
    });
    expect(get()).toEqual([{ files: ["GRON", "GMAYOR"], data: { level1: 6, strength: 18 } }]);
  });

  it("layers an adjust entry's data on top of the variant data, after the grouped entry", () => {
    const get = captureAdjustments();
    variantFactory.add(fakeCreature(), GREATER_GHAST, {
      data: { level1: 6, strength: 18 },
      files: ["GRON"],
      adjust: [{ files: ["CD41COR"], data: { level1: 10 } }],
    });
    expect(get()).toEqual([
      { files: ["GRON"], data: { level1: 6, strength: 18 } },
      { files: ["CD41COR"], data: { level1: 10, strength: 18 } },
    ]);
  });

  it("keeps an adjust entry's noWeapon / stringRef", () => {
    const get = captureAdjustments();
    variantFactory.add(fakeCreature(), GREATER_GHAST, {
      data: { strength: 18 },
      adjust: [
        {
          files: ["AC#BOSS"],
          data: { level1: 14 },
          noWeapon: true,
          stringRef: "monster.undead.name.ghast",
        },
      ],
    });
    expect(get()).toEqual([
      {
        files: ["AC#BOSS"],
        data: { level1: 14, strength: 18 },
        noWeapon: true,
        stringRef: "monster.undead.name.ghast",
      },
    ]);
  });

  it("drops an adjust entry's data key entirely when nothing resolves (noWeapon-only)", () => {
    const get = captureAdjustments();
    variantFactory.add(fakeCreature(), "unarmed", {
      adjust: [{ files: ["BDJUNIA2"], noWeapon: true }],
    });
    expect(get()).toEqual([{ files: ["BDJUNIA2"], noWeapon: true, data: undefined }]);
  });

  it("warns and emits nothing for the grouped entry when files resolve to no data", () => {
    const get = captureAdjustments();
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    variantFactory.add(fakeCreature(), "empty", { files: ["GRON"] });
    expect(get()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('variant "empty"'));
  });

  it("returns a handle with member files uppercased and deduped", () => {
    captureAdjustments();
    const variant = variantFactory.add(fakeCreature(), "lacedon", {
      data: { level1: 5 },
      files: ["AC#DTLAC", "lacedo01"],
      adjust: [{ files: ["AC#DTLAC"], data: { ac: 3 } }],
    });
    expect(variant.files).toEqual(["AC#DTLAC", "LACEDO01"]);
    expect(variant.data).toEqual({ level1: 5 });
  });

  it("throws when the creature was already validated", () => {
    const creature = fakeCreature();
    creature.valid = true;
    expect(() => variantFactory.add(creature, "x", { data: { level1: 1 }, files: ["A"] })).toThrow(
      /has already been validated/,
    );
  });
});

describe("derived variant (Variant.variant)", () => {
  it("merges the parent's data underneath the child's, in one adjustment", () => {
    const spy = vi.spyOn(creatureFactory, "setAdjustments").mockImplementation(() => undefined);
    const creature = fakeCreature();
    const lacedon = variantFactory.add(creature, "lacedon", {
      data: { level1: 5, strength: 18 },
      files: ["AC#DTLAC"],
    });
    lacedon.variant("greater lacedon", {
      data: { level1: 9, strength: 19, xpv: 1800 },
      files: ["AC#DT01L"],
    });
    expect(spy.mock.calls[1][1]).toEqual([
      { files: ["AC#DT01L"], data: { level1: 9, strength: 19, xpv: 1800 } },
    ]);
  });

  it("folds the child's member files back into the parent", () => {
    captureAdjustments();
    const creature = fakeCreature();
    const lacedon = variantFactory.add(creature, "lacedon", {
      data: { level1: 5, strength: 18 },
      files: ["AC#DTLAC", "LACEDO01"],
    });
    lacedon.variant("greater lacedon", { data: { xpv: 1800 }, files: ["AC#DT01L"] });
    expect(lacedon.files).toEqual(["AC#DTLAC", "LACEDO01", "AC#DT01L"]);
  });
});

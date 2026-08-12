import { describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import adjustmentService from "./adjustment.service";

function fakeCreature(p: {
  data?: Partial<CreatureData>;
  adjustments?: {
    files: string[];
    noWeapon?: boolean;
    data: Partial<CreatureData>;
  }[];
}): Creature {
  const data: CreatureData = {
    level1: { pnpValue: 5, type: "none", value: 5 },
    movement: { pnpValue: 12 },
    strength: 10,
    dexterity: 12,
    constitution: 12,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hp: 40,
    ac: 5,
    thac0: 15,
    apr: 2,
    xpv: 500,
    alignment: "NEUTRAL",
    morale: 10,
    size: "Large",
    script: { remove: [] },
    proficiencies: [],
    immunities: [],
    items: { equipped: [], remove: [] },
    spells: { memorized: [] },
    effects: { list: [] },
    ...p.data,
  } as unknown as CreatureData;

  return {
    id: 1,
    data,
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: a.files,
      noWeapon: a.noWeapon ?? false,
      summon: false,
      scriptName: false,
      data: {
        script: { remove: [] },
        proficiencies: [],
        immunities: [],
        items: { equipped: [], remove: [] },
        spells: { memorized: [] },
        effects: { list: [] },
        ...a.data,
      },
    })),
  } as unknown as Creature;
}

describe("adjustmentService.getAdjustmentDiffs", () => {
  it("returns an empty array when the creature has no adjustments", () => {
    const creature = fakeCreature({});

    expect(adjustmentService.getAdjustmentDiffs(creature)).toEqual([]);
  });

  it("folds cumulative adjustments per file (later entry wins) and groups files with an identical result", () => {
    // Reproduces the real Ogre chieftain case (lib/creatures/ogres.ts:463-493): three separate
    // adjustment entries touch BDSOGR1/BDSOGR2, one of which (the weapon swap) also covers
    // AC#FP2OT, and one file (AC#WRIM1) is only ever touched by the first entry.
    const creature = fakeCreature({
      adjustments: [
        {
          files: ["AC#WRIM1", "BDSOGR1", "BDSOGR2"],
          data: { level1: { pnpValue: 7, type: "none", value: 7 }, ac: 2, xpv: 975 },
        },
        {
          files: ["AC#FP2OT", "BDSOGR1", "BDSOGR2"],
          noWeapon: true,
          data: {},
        },
        {
          files: ["BDSOGR1", "BDSOGR2"],
          data: { xpv: 1000 },
        },
      ],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    const bdsogr = diffs.find((d) => d.files.includes("BDSOGR1"));
    expect(bdsogr?.files).toEqual(["BDSOGR1", "BDSOGR2"]);
    expect(bdsogr?.level).toBe(7);
    expect(bdsogr?.ac).toBe(2);
    expect(bdsogr?.xpv).toBe(1000); // the third entry's xpv wins over the first's
    expect(bdsogr?.noWeapon).toBe(true);

    const acWrim = diffs.find((d) => d.files.includes("AC#WRIM1"));
    expect(acWrim?.files).toEqual(["AC#WRIM1"]);
    expect(acWrim?.xpv).toBe(975);
    expect(acWrim?.noWeapon).toBe(false);

    const acFp2ot = diffs.find((d) => d.files.includes("AC#FP2OT"));
    expect(acFp2ot?.files).toEqual(["AC#FP2OT"]);
    expect(acFp2ot?.noWeapon).toBe(true);
    expect(acFp2ot?.level).toBeUndefined();
    expect(acFp2ot?.xpv).toBeUndefined();
  });

  it("excludes a file whose only change is to a field with no doc presence (e.g. class)", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["WELT"], data: { class: "INNOCENT" } as Partial<CreatureData> }],
    });

    expect(adjustmentService.getAdjustmentDiffs(creature)).toEqual([]);
  });

  it("still produces a line for a file whose only change is noWeapon", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["KAHRK"], noWeapon: true, data: {} }],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    expect(diffs).toEqual([expect.objectContaining({ files: ["KAHRK"], noWeapon: true })]);
  });
});

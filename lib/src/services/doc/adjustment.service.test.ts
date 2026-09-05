import { afterEach, describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import { ItemSlot } from "../../model/creature/item";
import { ProficiencyTypeEnum } from "../../model/spell-item/effect.enums";
import { State } from "../../state";
import adjustmentService from "./adjustment.service";

function fakeCreature(p: {
  data?: Partial<CreatureData>;
  dualWielding?: boolean;
  adjustments?: {
    files: string[];
    noWeapon?: boolean;
    game?: "bg1" | "bg2";
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
    doubleApr: false,
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
    data,
    id: 1,
    attack: { dualWielding: p.dualWielding ?? false },
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: a.files,
      noWeapon: a.noWeapon ?? false,
      game: a.game,
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

describe("adjustmentService.getEffectiveAdjustments", () => {
  it("returns an empty array when the creature has no adjustments", () => {
    expect(adjustmentService.getEffectiveAdjustments(fakeCreature({}))).toEqual([]);
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

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    const bdsogr = effectives.find((e) => e.files.includes("BDSOGR1"));
    expect(bdsogr?.files).toEqual(["BDSOGR1", "BDSOGR2"]);
    expect(bdsogr?.level).toEqual({ value: 7, changed: true });
    expect(bdsogr?.ac).toEqual({ value: 2, changed: true });
    expect(bdsogr?.xpv).toEqual({ value: 1000, changed: true }); // third entry's xpv wins over the first's
    expect(bdsogr?.noWeapon).toBe(true);

    const acWrim = effectives.find((e) => e.files.includes("AC#WRIM1"));
    expect(acWrim?.files).toEqual(["AC#WRIM1"]);
    expect(acWrim?.xpv).toEqual({ value: 975, changed: true });
    expect(acWrim?.noWeapon).toBe(false);

    const acFp2ot = effectives.find((e) => e.files.includes("AC#FP2OT"));
    expect(acFp2ot?.files).toEqual(["AC#FP2OT"]);
    expect(acFp2ot?.noWeapon).toBe(true);
    expect(acFp2ot?.level).toEqual({ value: 5, changed: false }); // inherited from the base
    expect(acFp2ot?.xpv).toEqual({ value: 500, changed: false });
  });

  it("sorts effective adjustments ascending by level, regardless of authored file order", () => {
    const creature = fakeCreature({
      adjustments: [
        { files: ["HIGH"], data: { level1: { pnpValue: 10, type: "none", value: 10 } } },
        { files: ["LOW"], data: { level1: { pnpValue: 3, type: "none", value: 3 } } },
        { files: ["MID"], data: { level1: { pnpValue: 7, type: "none", value: 7 } } },
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives.map((e) => e.files)).toEqual([["LOW"], ["MID"], ["HIGH"]]);
    expect(effectives.map((e) => e.level.value)).toEqual([3, 7, 10]);
  });

  it("excludes a file whose only authored change is to a field with no doc presence (e.g. class)", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["WELT"], data: { class: "INNOCENT" } }],
    });

    expect(adjustmentService.getEffectiveAdjustments(creature)).toEqual([]);
  });

  it("still produces an entry for a file whose only change is noWeapon", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["KAHRK"], noWeapon: true, data: {} }],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives).toEqual([expect.objectContaining({ files: ["KAHRK"], noWeapon: true })]);
  });

  // creatureService.checkData autogenerates hp/thac0 for every adjustment (from bonusHp,
  // constitution, etc.) even when the adjustment never touches hp/thac0 directly - so by the time
  // this runs, an adjustment driven purely by bonusHp already has its own final hp/thac0 baked
  // into `.data`. changed must reflect whether that final value actually differs from the base's
  // own - not merely that hp/thac0 are always present.
  it("flags hp/thac0 changed only when the autogenerated final value actually differs from the base", () => {
    const creature = fakeCreature({
      data: { hp: 40, thac0: 15 },
      adjustments: [
        { files: ["SAME"], data: { hp: 40, thac0: 15 } },
        { files: ["DIFFERENT"], data: { hp: 52, thac0: 14 } },
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives.find((e) => e.files.includes("SAME"))).toBeUndefined();
    const different = effectives.find((e) => e.files.includes("DIFFERENT"));
    expect(different?.hp).toEqual({ value: 52, changed: true });
    expect(different?.thac0).toEqual({ value: 14, changed: true });
  });

  it("compares AC against the base creature's own final (dexterity-adjusted) armor class", () => {
    const creature = fakeCreature({
      data: { ac: 10, dexterity: 18 }, // final AC = 10 + (-4) = 6, see creature.service.test.ts
      adjustments: [
        { files: ["SAME_FINAL"], data: { ac: 6 } },
        { files: ["DIFFERENT"], data: { ac: 2 } },
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives.find((e) => e.files.includes("SAME_FINAL"))).toBeUndefined();
    expect(effectives.find((e) => e.files.includes("DIFFERENT"))?.ac).toEqual({
      value: 2,
      changed: true,
    });
  });

  it("falls back to the base's own final AC when the adjustment never sets ac", () => {
    const creature = fakeCreature({
      data: { ac: 10, dexterity: 18 },
      adjustments: [{ files: ["NOAC"], data: { xpv: 999 } }],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("NOAC"));

    expect(effective?.ac).toEqual({ value: 6, changed: false });
  });

  // Mirrors documentationService.getEffectiveApr's own apr*doubleApr(+dual-wielding) formula so an
  // adjustment card's APR number and its "changed" flag agree with what the main block would show
  // for the same raw apr/doubleApr - duplicated here (not imported) because documentation.service
  // already imports this file, and importing it back would be circular.
  it("combines apr, doubleApr, and the base creature's own dual-wielding bonus consistently", () => {
    const creature = fakeCreature({
      data: { apr: 2, doubleApr: false },
      dualWielding: true, // base's own effective apr = 2 + 1 = 3
      adjustments: [
        { files: ["SAME"], data: { apr: 2 } }, // 2 + 1 = 3, same as base
        { files: ["DOUBLED"], data: { apr: 2, doubleApr: true } }, // 2*2 + 1 = 5
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives.find((e) => e.files.includes("SAME"))).toBeUndefined();
    expect(effectives.find((e) => e.files.includes("DOUBLED"))?.apr).toEqual({
      value: 5,
      changed: true,
    });
  });

  describe("fighter attack bonus", () => {
    const originalItems = State.items;

    afterEach(() => {
      State.items = originalItems;
    });

    it("flags apr as changed when an adjustment turns the file into a specialized fighter, even though it never sets apr itself", () => {
      State.items = [
        { file: "SWORD01", proficiency: ProficiencyTypeEnum.PROFICIENCYLONGSWORD },
      ] as unknown as typeof State.items;
      const creature = fakeCreature({
        data: { apr: 1, doubleApr: false },
        adjustments: [
          {
            files: ["FIGHTERFILE"],
            data: {
              class: "FIGHTER",
              items: { equipped: [{ file: "SWORD01", slot: "WEAPON1" }], remove: [] },
              proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
            },
          },
        ],
      });

      const effective = adjustmentService
        .getEffectiveAdjustments(creature)
        .find((e) => e.files.includes("FIGHTERFILE"));

      // base apr 1 + specialization bonus 1.0 (rank 5's own tier, not stacked with rank-2's)
      expect(effective?.apr).toEqual({ value: 2, changed: true });
    });

    it("does not flag apr as changed when the base creature is already a specialized fighter and the adjustment leaves that untouched", () => {
      State.items = [
        { file: "SWORD01", proficiency: ProficiencyTypeEnum.PROFICIENCYLONGSWORD },
      ] as unknown as typeof State.items;
      const creature = fakeCreature({
        data: {
          apr: 1,
          doubleApr: false,
          class: "FIGHTER",
          items: { equipped: [{ file: "SWORD01", slot: "WEAPON1" }], remove: [] },
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
        } as unknown as Partial<CreatureData>,
        // xpv forces this file to be visible without touching apr/class/proficiency itself.
        adjustments: [{ files: ["NOAC"], data: { xpv: 999 } }],
      });

      const effective = adjustmentService
        .getEffectiveAdjustments(creature)
        .find((e) => e.files.includes("NOAC"));

      expect(effective?.apr).toEqual({ value: 2, changed: false });
    });
  });

  it("shows the full effective equipped set, flagging only the slot that changed", () => {
    const creature = fakeCreature({
      data: {
        items: {
          equipped: [
            { file: "BASEWEAP", slot: "WEAPON1" },
            { file: "BASERING", slot: "LRING" },
          ],
          remove: [],
        },
      },
      adjustments: [
        {
          files: ["SWAP"],
          data: {
            items: {
              equipped: [{ file: "NEWWEAP", slot: "WEAPON1" }],
              remove: [],
            },
          },
        },
      ],
    });

    const swap = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("SWAP"));

    expect(swap?.equipped).toEqual(
      expect.arrayContaining([
        { item: { file: "NEWWEAP", slot: "WEAPON1" }, changed: true },
        { item: { file: "BASERING", slot: "LRING" }, changed: false },
      ]),
    );
    expect(swap?.equipped).toHaveLength(2);
  });

  // Regression: Creature.addTrait equips every trait carrier with the same multi-slot JEWEL_SLOTS
  // array, so keying equipped items by a joined slot string collapsed them all into one entry and
  // silently dropped all but the last (e.g. the Skeleton lost its "Skeletal" trait from every
  // adjustment card). Multi-slot items must never replace one another.
  it("keeps every base item that shares a multi-slot slot array", () => {
    const jewelSlots: ItemSlot[] = ["LRING", "RRING", "AMULET", "BELT", "GLOVES", "CLOAK"];
    const creature = fakeCreature({
      data: {
        items: {
          equipped: [
            { file: "BASEWEAP", slot: "WEAPON1" },
            { file: "TRAIT1", slot: jewelSlots },
            { file: "TRAIT2", slot: jewelSlots },
          ],
          remove: [],
        },
      },
      adjustments: [
        {
          files: ["SWAP", "OTHER"],
          data: {
            items: { equipped: [{ file: "NEWWEAP", slot: "WEAPON1" }], remove: [] },
          },
        },
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives).toHaveLength(1);
    for (const effective of effectives) {
      expect(effective.equipped).toEqual([
        { item: { file: "NEWWEAP", slot: "WEAPON1" }, changed: true },
        { item: { file: "TRAIT1", slot: jewelSlots }, changed: false },
        { item: { file: "TRAIT2", slot: jewelSlots }, changed: false },
      ]);
    }
  });

  it("adds a multi-slot adjustment item alongside existing multi-slot items instead of replacing them", () => {
    const jewelSlots: ItemSlot[] = ["LRING", "RRING", "AMULET", "BELT", "GLOVES", "CLOAK"];
    const creature = fakeCreature({
      data: {
        items: { equipped: [{ file: "TRAIT1", slot: jewelSlots }], remove: [] },
      },
      adjustments: [
        {
          files: ["EXTRA"],
          data: {
            items: { equipped: [{ file: "TRAIT2", slot: jewelSlots }], remove: [] },
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("EXTRA"));

    expect(effective?.equipped).toEqual([
      { item: { file: "TRAIT1", slot: jewelSlots }, changed: false },
      { item: { file: "TRAIT2", slot: jewelSlots }, changed: true },
    ]);
  });

  // Regression: Garock/Rock (lib/creatures/minotaurs.ts) are noWeapon adjustments that never
  // re-equip anything - the base creature's Huge Axe was still showing up as their effective
  // weapon, contradicting the "uses his own weapon" note. Confirmed against the generated .tpa
  // (weidu-creature.service.ts's addItemSlots excludes every base item, not just weapons, from a
  // noWeapon file's own patch block), so the base's items shouldn't be seeded here at all.
  it("excludes the base creature's own equipped items entirely for a noWeapon adjustment", () => {
    const creature = fakeCreature({
      data: {
        items: {
          equipped: [{ file: "BASEWEAP", slot: "WEAPON1" }],
          remove: [],
        },
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 2 }],
      },
      adjustments: [
        {
          files: ["OWNWEAPON"],
          noWeapon: true,
          data: {
            proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYAXE, value: 5 }],
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("OWNWEAPON"));

    expect(effective?.equipped).toEqual([]);
  });

  // The ogre's real morning-star swap (lib/creatures/ogres.ts): a noWeapon adjustment can still
  // equip its own weapon explicitly - that goes through the adjustment's own patch block, never
  // the excluded base loadout, so it must still show up.
  it("still shows a weapon a noWeapon adjustment explicitly equips itself", () => {
    const creature = fakeCreature({
      data: {
        items: { equipped: [{ file: "BASEWEAP", slot: "WEAPON1" }], remove: [] },
      },
      adjustments: [
        {
          files: ["OWNWEAPON"],
          noWeapon: true,
          data: {
            items: { equipped: [{ file: "MORNINGSTAR", slot: "WEAPON1" }], remove: [] },
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("OWNWEAPON"));

    expect(effective?.equipped).toEqual([
      { item: { file: "MORNINGSTAR", slot: "WEAPON1" }, changed: true },
    ]);
  });

  it("shows the full effective immunities set, flagging only newly granted ones", () => {
    const creature = fakeCreature({
      data: { immunities: ["giant"] },
      adjustments: [{ files: ["IMMUNE"], data: { immunities: ["giant", "undead"] } }],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("IMMUNE"));

    expect(effective?.immunities).toEqual(
      expect.arrayContaining([
        { name: "giant", changed: false },
        { name: "undead", changed: true },
      ]),
    );
    expect(effective?.immunities).toHaveLength(2);
  });

  it("shows the full effective memorized spellbook, flagging only entries whose count changed", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [
            { file: "SPPR101", memorizedCount: 1 },
            { file: "SPPR201", memorizedCount: 2 },
          ],
        },
      },
      adjustments: [
        {
          files: ["CASTER"],
          data: {
            spells: {
              memorized: [{ file: "SPPR101", memorizedCount: 3 }],
            },
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("CASTER"));

    // SPPR101: base 1 + adjustment delta 3 = 4 (delta, not absolute replacement)
    // SPPR201: untouched by any adjustment, stays at base 2
    expect(effective?.memorized).toEqual(
      expect.arrayContaining([
        { spell: { file: "SPPR101", memorizedCount: 4 }, changed: true },
        { spell: { file: "SPPR201", memorizedCount: 2 }, changed: false },
      ]),
    );
    expect(effective?.memorized).toHaveLength(2);
  });

  it("stacks every matching chained adjustment's delta on top of the base count", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [{ file: "SPPR101", memorizedCount: 1 }],
        },
      },
      adjustments: [
        {
          files: ["BDSOGR1"],
          data: {
            spells: {
              memorized: [{ file: "SPPR101", memorizedCount: 1 }],
            },
          },
        },
        {
          files: ["BDSOGR1", "BDSOGR2"],
          data: {
            spells: {
              memorized: [{ file: "SPPR101", memorizedCount: 2 }],
            },
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("BDSOGR1"));

    // ADD_MEMORIZED_SPELL is cumulative and the generator emits one per matching adjustment:
    // base 1 + delta 1 + delta 2 = 4.
    expect(effective?.memorized).toEqual([{ spell: { file: "SPPR101", memorizedCount: 4 }, changed: true }]);
  });

  it("treats a memorizedCount:0 delta as a reset, with later deltas adding back on top", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [{ file: "SPPR101", memorizedCount: 3 }],
        },
      },
      adjustments: [
        {
          files: ["BDSOGR1"],
          data: {
            spells: {
              memorized: [{ file: "SPPR101", memorizedCount: 0 }],
            },
          },
        },
        {
          files: ["BDSOGR1"],
          data: {
            spells: {
              memorized: [{ file: "SPPR101", memorizedCount: 2 }],
            },
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("BDSOGR1"));

    // base 3 -> reset to 0 -> +2 = 2
    expect(effective?.memorized).toEqual([{ spell: { file: "SPPR101", memorizedCount: 2 }, changed: true }]);
  });

  it("overrides a same-type proficiency's value rather than adding a second entry, and keeps untouched types", () => {
    // Reproduces the ogre chieftain case (lib/creatures/ogres.ts): base has
    // PROFICIENCYTWOHANDEDSWORD rank 2, a variant bumps that same type to rank 5.
    const creature = fakeCreature({
      data: {
        proficiencies: [
          { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 },
          { type: ProficiencyTypeEnum.PROFICIENCYDAGGER, value: 1 },
        ],
      },
      adjustments: [
        {
          files: ["CHIEFTAIN"],
          data: {
            proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5 }],
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("CHIEFTAIN"));

    expect(effective?.proficiencies).toEqual(
      expect.arrayContaining([
        { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5, changed: true },
        { type: ProficiencyTypeEnum.PROFICIENCYDAGGER, value: 1, changed: false },
      ]),
    );
    expect(effective?.proficiencies).toHaveLength(2);
  });

  it("carries game onto the effective adjustment when all matching entries agree", () => {
    const creature = fakeCreature({
      adjustments: [
        { files: ["GORF"], game: "bg2", data: { level1: { pnpValue: 8, type: "none", value: 8 } } },
      ],
    });

    const [eff] = adjustmentService.getEffectiveAdjustments(creature);

    expect(eff.game).toBe("bg2");
  });

  it("splits one file into a per-game card when its adjustments target different games", () => {
    // The real GORF case (lib/creatures/ogres.ts): a bg1 level-9 lieutenant and a weaker bg2
    // level-5 "Squisher" both patch the file GORF - they must never fold together.
    const creature = fakeCreature({
      adjustments: [
        {
          files: ["GORF"],
          game: "bg1",
          data: { level1: { pnpValue: 9, type: "none", value: 9 }, xpv: 2000 },
        },
        {
          files: ["GORF"],
          game: "bg2",
          data: { level1: { pnpValue: 5, type: "none", value: 5 }, xpv: 2500 },
        },
        // an untagged entry folds into both game scopes
        { files: ["GORF"], data: { morale: 15 } },
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives).toHaveLength(2);
    const bg1 = effectives.find((e) => e.game === "bg1");
    const bg2 = effectives.find((e) => e.game === "bg2");
    expect(bg1?.files).toEqual(["GORF"]);
    expect(bg1?.level).toEqual({ value: 9, changed: true });
    expect(bg1?.morale).toEqual({ value: 15, changed: true });
    expect(bg2?.level).toEqual({ value: 5, changed: false });
    expect(bg2?.xpv).toEqual({ value: 2500, changed: true });
  });

  it("adds a brand new proficiency type the base creature never had", () => {
    const creature = fakeCreature({
      data: { proficiencies: [] },
      adjustments: [
        {
          files: ["ARMED"],
          data: {
            proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 2 }],
          },
        },
      ],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("ARMED"));

    expect(effective?.proficiencies).toEqual([
      { type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 2, changed: true },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { SPELLS } from "../../../config/spells/spell-database";
import triggerFactory from "../../factories/trigger.factory";
import { Triggers } from "../../model/script/triggers";
import { AT_WILL } from "../../../config/common";
import { memorizedChecks, recastRisks, sharedRoll, sharedRollOutOfOrder } from "./memorized-checks";

const { Harm, SlayLiving, FlameBlade, Heal } = SPELLS.Priest;

const itemsOf = (triggers: Triggers.Trigger[]) =>
  triggers.flatMap((t) => ("name" in t && t.name === "HasItem" ? [t.params[0]] : []));

describe("memorizedChecks", () => {
  it("drops a !HaveSpell on a spell the creature doesn't memorize", () => {
    const triggers = triggerFactory.haveSpell([Harm, Heal], true);
    expect(memorizedChecks(triggers, [], [Heal.file])).toEqual(
      triggerFactory.haveSpell([Heal], true),
    );
  });

  it("drops a !HaveSpellRES the same way", () => {
    const triggers = triggerFactory.haveSpellRES([Harm.file], true);
    expect(memorizedChecks(triggers, [], [Heal.file])).toEqual([]);
  });

  it("keeps a positive HaveSpell, and a spell no database knows", () => {
    const triggers = [
      ...triggerFactory.haveSpell([Harm]),
      ...triggerFactory.haveSpellRES(["UNKNOWN"], true),
    ];
    expect(memorizedChecks(triggers, [], [])).toEqual(triggers);
  });

  it("checks the items of the spell cast and of the memorized spells only", () => {
    const items = itemsOf(memorizedChecks([], [Harm.file], [Harm.file, SlayLiving.file]));
    expect(items).toEqual([...(Harm.createsItems ?? []), ...(SlayLiving.createsItems ?? [])]);
    expect(items).not.toContain(FlameBlade.createsItems?.[0]);
  });

  it("checks its own item even when it isn't memorized", () => {
    expect(itemsOf(memorizedChecks([], [Harm.file], []))).toEqual(Harm.createsItems);
  });

  it("adds no item check to a spell creating no weapon", () => {
    expect(memorizedChecks([], [Heal.file], [Harm.file])).toEqual([]);
  });

  it("puts the item checks before a final random check", () => {
    const random: Triggers.Trigger = { name: "RandomNumGT", params: [100, 50] };
    const result = memorizedChecks([random], [Harm.file], []);
    expect(result.at(-1)).toEqual(random);
    expect(result).toHaveLength(1 + (Harm.createsItems?.length ?? 0));
  });
});

describe("sharedRoll", () => {
  it("is the same for weapon spells, another one for summons, none for the rest", () => {
    expect(sharedRoll(Harm.file)).toBe(sharedRoll(FlameBlade.file));
    expect(sharedRoll(SPELLS.Priest.AnimateDead.file)).toBeDefined();
    expect(sharedRoll(SPELLS.Priest.AnimateDead.file)).not.toBe(sharedRoll(Harm.file));
    expect(sharedRoll(Heal.file)).toBeUndefined();
    expect(sharedRoll(undefined)).toBeUndefined();
  });
});

describe("sharedRollOutOfOrder", () => {
  const roll = (range: number, threshold: number): Triggers.Trigger[] => [
    { name: "RandomNumGT", params: [range, threshold] },
  ];

  it("accepts chances falling down the script", () => {
    expect(sharedRollOutOfOrder([roll(700, 100), roll(700, 300), roll(701, 50)])).toBeUndefined();
  });

  it("finds a later spell with a better chance, in the same family only", () => {
    expect(sharedRollOutOfOrder([roll(700, 300), roll(700, 100)])).toBe("RandomNumGT(700,100)");
    expect(sharedRollOutOfOrder([roll(700, 300), roll(701, 100)])).toBeUndefined();
    expect(sharedRollOutOfOrder([roll(850, 300), roll(851, 100)])).toBeUndefined();
  });
});

describe("recastRisks", () => {
  const { Aid, ArmorOfFaith } = SPELLS.Priest;

  it("finds a lasting buff memorized twice with nothing to check", () => {
    expect(recastRisks([{ file: Aid.file, memorizedCount: 2 }]).map((r) => r.file)).toEqual([
      Aid.file,
    ]);
  });

  it("ignores a single copy, and an at-will one", () => {
    expect(recastRisks([{ file: Aid.file }])).toEqual([]);
    expect(recastRisks([{ file: Aid.file, memorizedCount: AT_WILL }])).toEqual([]);
  });

  it("ignores a buff with a check, and a spell with no duration", () => {
    expect(recastRisks([{ file: ArmorOfFaith.file, memorizedCount: 2 }])).toEqual([]);
    expect(recastRisks([{ file: Heal.file, memorizedCount: 2 }])).toEqual([]);
  });

  it("finds a lingering damage spell, which has no duration", () => {
    const { StaticCharge } = SPELLS.Priest;
    expect(
      recastRisks([{ file: StaticCharge.file, memorizedCount: 2 }]).map((r) => r.file),
    ).toEqual([StaticCharge.file]);
  });

  it("lists a spell once", () => {
    const memorized = [
      { file: Aid.file, memorizedCount: 2 },
      { file: Aid.file, memorizedCount: 3 },
    ];
    expect(recastRisks(memorized).map((r) => r.file)).toEqual([Aid.file]);
  });
});

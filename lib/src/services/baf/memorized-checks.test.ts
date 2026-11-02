import { describe, expect, it } from "vitest";
import { SPELLS } from "../../../config/spells/spell-database";
import triggerFactory from "../../factories/trigger.factory";
import { Triggers } from "../../model/script/triggers";
import { AT_WILL } from "../../../config/common";
import { SpellTypeEnum } from "../../model/spell-item/effect.enums";
import { SpellProfile } from "../spell-profile.service";
import {
  categoryRoll,
  isSingleTargetHostile,
  memorizedChecks,
  recastRisks,
  sharedRoll,
  sharedRollOutOfOrder,
} from "./memorized-checks";

const { Harm, SlayLiving, FlameBlade, Heal } = SPELLS.Priest;

/** Flame Arrow, a single-target damage spell, with what `p` changes */
function profile(p: Partial<SpellProfile>): SpellProfile {
  return {
    file: SPELLS.Wizard.FlameArrow.file,
    level: 3,
    type: SpellTypeEnum.Wizard,
    role: "damage",
    secondaryRoles: [],
    castingTime: 3,
    keywords: [],
    tier: "decent",
    hitsAllies: false,
    spellCount: 1,
    ...p,
  };
}

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

  it("checks a category roll the same way", () => {
    expect(sharedRollOutOfOrder([roll(702, 600), roll(702, 300)])).toBe("RandomNumGT(702,300)");
    expect(sharedRollOutOfOrder([roll(702, 300), roll(702, 600)])).toBeUndefined();
  });
});

describe("categoryRoll", () => {
  const single = profile({});

  it("puts kill and damage spells of the same delivery together", () => {
    expect(categoryRoll(profile({ role: "kill" }))).toBe(categoryRoll(single));
  });

  it("separates deliveries and roles", () => {
    const rolls = [
      single,
      profile({ keywords: ["area"] }),
      profile({ keywords: ["castOnSelf"] }),
      profile({ role: "disable" }),
    ].map(categoryRoll);
    expect(new Set(rolls).size).toBe(4);
  });

  it("leaves reactive, summon and useless spells, and weapons, out", () => {
    for (const role of ["reactive", "summon", "useless"] as const) {
      expect(categoryRoll(profile({ role }))).toBeUndefined();
    }
    expect(categoryRoll(profile({ file: SPELLS.Priest.SpiritualHammer.file }))).toBeUndefined();
  });

  it("stays between the summon roll and the per-ability ones", () => {
    const roles = ["protection", "buff", "disable", "damage", "kill", "shapeshift"] as const;
    const keywords = [[], ["area"], ["castOnSelf"]] as const;
    for (const role of roles) {
      for (const k of keywords) {
        const range = categoryRoll(profile({ role, keywords: [...k] }));
        expect(range).toBeGreaterThanOrEqual(702);
        expect(range).toBeLessThan(800);
      }
    }
  });
});

describe("isSingleTargetHostile", () => {
  it("is a hostile spell aimed at one target", () => {
    expect(isSingleTargetHostile(profile({}))).toBe(true);
  });

  it("isn't an area spell, a spell on the caster, a friendly spell, a buff or a sequencer", () => {
    expect(isSingleTargetHostile(profile({ keywords: ["area"] }))).toBe(false);
    expect(isSingleTargetHostile(profile({ keywords: ["castOnSelf"] }))).toBe(false);
    expect(isSingleTargetHostile(profile({ keywords: ["friendly"] }))).toBe(false);
    expect(isSingleTargetHostile(profile({ role: "buff" }))).toBe(false);
    expect(isSingleTargetHostile(profile({ combo: "spellSequencer" }))).toBe(false);
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

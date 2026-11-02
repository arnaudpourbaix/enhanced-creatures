import { beforeEach, describe, expect, it } from "vitest";
import { ABILITY_PRESETS } from "../../../config/ability-presets";
import { SPELLS } from "../../../config/spells/spell-database";
import { Creature } from "../../model/creature/creature";
import { SpellTypeEnum } from "../../model/spell-item/effect.enums";
import spellComboService from "../spell-combo.service";
import spellProfileService, { SpellProfile } from "../spell-profile.service";
import castOrderService from "./cast-order.service";

const noCreature = { spells: [] } as unknown as Creature;

function wizard(key: keyof typeof SPELLS.Wizard): SpellProfile {
  const profile = spellProfileService.profileOf(SPELLS.Wizard[key].file, noCreature);
  if (!profile) throw new Error(`no profile for ${key}`);
  return profile;
}

/** A level 5 wizard spell, the caster's best: scores around 10 plus what `p` adds */
function profile(file: string, p: Partial<SpellProfile>): SpellProfile {
  return {
    file,
    level: 5,
    type: SpellTypeEnum.Wizard,
    role: "damage",
    secondaryRoles: [],
    castingTime: 5,
    keywords: [],
    tier: "decent",
    hitsAllies: false,
    spellCount: 1,
    ...p,
  };
}

/** The regular pass's files: the Mirror Image passes have their own tests */
const files = (profiles: SpellProfile[]) =>
  castOrderService
    .plan(profiles)
    .filter((c) => c.pass === "regular")
    .map((c) => c.file);

describe("plan - Mirror Image passes and category rolls", () => {
  beforeEach(() => {
    spellComboService.usePresets(ABILITY_PRESETS);
  });

  const arrow = () => wizard("FlameArrow");
  const missiles = () => wizard("MagicMissiles");
  const fireball = () => wizard("Fireball");
  const passes = (profiles: SpellProfile[]) =>
    castOrderService.plan(profiles).map((c) => `${c.file}:${c.pass}`);

  it("clears images first, in the counters' order, and keeps a last resort for the rest", () => {
    const planned = passes([profile("HIT", {}), arrow(), missiles(), fireball()]);
    const { FlameArrow, MagicMissiles, Fireball } = SPELLS.Wizard;
    expect(planned.slice(0, 2)).toEqual([
      `${MagicMissiles.file}:counter`,
      `${FlameArrow.file}:counter`,
    ]);
    expect(planned).toContain(`${Fireball.file}:regular`);
    // a remover's counter already aims at mirrored targets
    expect(planned.filter((p) => p.endsWith(":lastResort"))).toEqual(["HIT:lastResort"]);
    expect(planned.at(-1)).toBe("HIT:lastResort");
  });

  it("skips mirrored targets with single-target spells, removers included", () => {
    const plan = castOrderService.plan([profile("HIT", {}), arrow(), missiles(), fireball()]);
    const regular = (file: string) => plan.find((c) => c.file === file && c.pass === "regular");
    expect(regular(SPELLS.Wizard.Fireball.file)?.mirrorTarget).toBeUndefined();
    expect(regular(SPELLS.Wizard.MagicMissiles.file)?.mirrorTarget).toBe("avoid");
    expect(regular(SPELLS.Wizard.FlameArrow.file)?.mirrorTarget).toBe("avoid");
    expect(regular("HIT")?.mirrorTarget).toBe("avoid");
    expect(plan.find((c) => c.pass === "lastResort")?.mirrorTarget).toBe("require");
  });

  it("shares a roll between single-target damage spells, not with area ones", () => {
    const plan = castOrderService.plan([arrow(), missiles(), fireball()]);
    const range = (file: string) => plan.find((c) => c.file === file)?.rollRange;
    expect(range(SPELLS.Wizard.FlameArrow.file)).toBeDefined();
    expect(range(SPELLS.Wizard.FlameArrow.file)).toBe(range(SPELLS.Wizard.MagicMissiles.file));
    expect(range(SPELLS.Wizard.Fireball.file)).not.toBe(range(SPELLS.Wizard.FlameArrow.file));
  });

  it("gives a counter the best chance of its category", () => {
    const plan = castOrderService.plan([arrow(), missiles(), fireball()]);
    const counter = plan.find((c) => c.pass === "counter");
    const best = Math.max(
      ...plan.filter((c) => c.rollRange === counter?.rollRange).map((c) => c.probability),
    );
    expect(counter?.probability).toBe(best);
  });

  it("never raises a chance down the script within a category", () => {
    const plan = castOrderService.plan([
      profile("STRONG", { level: 8, castingTime: 9 }),
      profile("WEAK", { level: 2, castingTime: 1 }),
      arrow(),
      fireball(),
    ]);
    const lowest = new Map<number, number>();
    for (const cast of plan) {
      if (cast.rollRange === undefined) continue;
      expect(cast.probability).toBeLessThanOrEqual(lowest.get(cast.rollRange) ?? 100);
      lowest.set(cast.rollRange, cast.probability);
    }
  });

  it("leaves reactive, opening and summon casts out of category rolls", () => {
    const plan = castOrderService.plan([
      profile("HEAL", { role: "reactive" }),
      profile("GLOBE", { role: "protection", tier: "great" }),
      profile("CALL", { role: "summon" }),
    ]);
    expect(plan.map((c) => c.rollRange)).toEqual([undefined, undefined, undefined]);
  });

  it("adds no pass without a single-target spell or a remover", () => {
    const plan = castOrderService.plan([fireball(), profile("GLOBE", { role: "protection" })]);
    expect(plan.every((c) => c.pass === "regular" && c.mirrorTarget === undefined)).toBe(true);
  });
});

describe("plan", () => {
  beforeEach(() => {
    spellComboService.usePresets(ABILITY_PRESETS);
  });

  it("casts reactive spells first, always", () => {
    const planned = castOrderService.plan([
      profile("DAMAGE", { castingTime: 1 }),
      profile("HEAL", { role: "reactive", castingTime: 9 }),
    ]);
    expect(planned[0]).toMatchObject({ file: "HEAL", probability: 100 });
  });

  it("opens with great and good protections, even before a better attack", () => {
    const order = files([
      profile("BIGHIT", { role: "kill", castingTime: 1, keywords: ["area"] }),
      profile("GLOBE", { role: "protection", tier: "great" }),
    ]);
    expect(order).toEqual(["GLOBE", "BIGHIT"]);
  });

  it("keeps the opening short: at most 2 protections, the others go to the alternation", () => {
    const order = files([
      profile("GLOBE1", { role: "protection", tier: "great" }),
      profile("GLOBE2", { role: "protection", tier: "great" }),
      profile("GLOBE3", { role: "protection", tier: "great" }),
      profile("HIT", {}),
    ]);
    expect(order).toEqual(["GLOBE1", "GLOBE2", "HIT", "GLOBE3"]);
  });

  it("lets an attack open the fight now and then: opening protections at most 60%", () => {
    const planned = castOrderService.plan([
      profile("GLOBE", { role: "protection", tier: "great", castingTime: 1 }),
      profile("HIT", {}),
    ]);
    expect(planned[0]).toMatchObject({ file: "GLOBE", probability: 60 });
  });

  it("opens with a good high-level protection before Mirror Image, Mirror Image before attacks", () => {
    const order = files([
      wizard("FingerOfDeath"),
      wizard("MirrorImages"),
      wizard("ProtectionFromTheElements"),
    ]);
    expect(order).toEqual([
      SPELLS.Wizard.ProtectionFromTheElements.file,
      SPELLS.Wizard.MirrorImages.file,
      SPELLS.Wizard.FingerOfDeath.file,
    ]);
  });

  it("opens with a defensive spell sequencer (Stoneskin, Minor Globe, Mirror Image) first", () => {
    const sequencer = {
      ...wizard("Stoneskin"),
      file: "DEFSEQ",
      combo: "spellSequencer" as const,
      spellCount: 3,
    };
    const order = files([
      wizard("ProtectionFromMagicalWeapons"),
      wizard("Stoneskin"),
      wizard("AbiDalzimHorridWilting"),
      sequencer,
    ]);
    expect(order[0]).toBe("DEFSEQ");
  });

  it("never opens with a decent protection: a better attack goes first", () => {
    const hit = profile("HIT", { role: "kill", castingTime: 1, keywords: ["area"] });
    expect(files([profile("SHIELD", { role: "protection" }), hit])).toEqual(["HIT", "SHIELD"]);
    // the same protection, great, would open
    const great = profile("SHIELD", { role: "protection", tier: "great" });
    expect(files([great, hit])).toEqual(["SHIELD", "HIT"]);
  });

  it("alternates buffs and attacks, even when the buffs score higher", () => {
    const order = files([
      profile("BUFF1", { role: "buff", castingTime: 1, tier: "great" }),
      profile("BUFF2", { role: "buff", castingTime: 1, tier: "great" }),
      profile("HIT1", {}),
      profile("HIT2", {}),
    ]);
    expect(order).toEqual(["BUFF1", "HIT1", "BUFF2", "HIT2"]);
  });

  it("attacks right after the opening protections, before a better buff", () => {
    const order = files([
      profile("GLOBE", { role: "protection", tier: "great" }),
      profile("HASTE", { role: "buff", castingTime: 1, tier: "great" }),
      profile("HIT", {}),
    ]);
    expect(order).toEqual(["GLOBE", "HIT", "HASTE"]);
  });

  it("puts the best party buff right after the first summon, then attacks", () => {
    const order = files([
      profile("SUMMON", { role: "summon" }),
      profile("HASTE", { role: "buff", keywords: ["friendly", "area"], castingTime: 9 }),
      profile("HIT", {}),
    ]);
    expect(order).toEqual(["SUMMON", "HASTE", "HIT"]);
  });

  it("leaves party buffs to the alternation without a summon", () => {
    const order = files([
      profile("HASTE", { role: "buff", keywords: ["friendly", "area"], castingTime: 9 }),
      profile("HIT", {}),
    ]);
    expect(order).toEqual(["HIT", "HASTE"]);
  });

  it("orders a slow summon, an area disable, an area attack, a single disable, a single attack", () => {
    const negated = [{ types: [] }];
    const order = files([
      profile("AREA", { keywords: ["area"] }),
      profile("HOLD", { role: "disable", saves: negated }),
      profile("MASSHOLD", { role: "disable", keywords: ["area"], saves: negated }),
      profile("SUMMON", { role: "summon", castingTime: 9 }),
      profile("SINGLE", { castingTime: 7 }),
    ]);
    expect(order).toEqual(["SUMMON", "MASSHOLD", "AREA", "HOLD", "SINGLE"]);
  });

  it("orders equal scores by file code units, whatever the machine's locale", () => {
    expect(files([profile("B_X", {}), profile("B#X", {}), profile("BAX", {})])).toEqual([
      "B#X",
      "BAX",
      "B_X",
    ]);
  });

  it("lists defensive spells by score when there's nothing else", () => {
    const order = files([
      profile("BUFF1", { role: "buff" }),
      profile("BUFF2", { role: "buff", castingTime: 1 }),
    ]);
    expect(order).toEqual(["BUFF2", "BUFF1"]);
  });

  it("shapeshifts last, whatever its score", () => {
    const order = files([
      profile("WOLF", { role: "shapeshift", castingTime: 1, tier: "great" }),
      profile("HIT", {}),
    ]);
    expect(order).toEqual(["HIT", "WOLF"]);
  });

  it("leaves useless spells out", () => {
    expect(files([profile("LIGHTS", { role: "useless" }), profile("HIT", {})])).toEqual(["HIT"]);
  });

  it("orders equal scores by file, the same every time", () => {
    const profiles = [profile("HITB", {}), profile("HITA", {})];
    expect(files(profiles)).toEqual(["HITA", "HITB"]);
    expect(files(profiles)).toEqual(files([...profiles].reverse()));
  });
});

describe("coveredPlan", () => {
  const covered = (profiles: SpellProfile[]) =>
    castOrderService.coveredPlan(profiles).map((c) => c.file);

  it("keeps protections and buffs, not attacks nor long ones (precast)", () => {
    expect(
      covered([
        profile("SHIELD", { role: "protection", duration: "short" }),
        profile("HASTE", { role: "buff", duration: "short" }),
        profile("HIT", {}),
        profile("STONESKIN", { role: "protection", duration: "long" }),
      ]),
    ).toEqual(["SHIELD", "HASTE"]);
  });

  it("leaves the cover spell itself out: casting it again while covered is pointless", () => {
    const invisibility = { ...wizard("Invisibility"), duration: "mid" as const };
    expect(covered([invisibility, profile("SHIELD", { role: "protection" })])).toEqual(["SHIELD"]);
  });

  it("keeps reactive spells first under cover: a wounded caster heals before buffing", () => {
    const planned = castOrderService.coveredPlan([
      profile("BUFF", { role: "buff", tier: "great", duration: "short" }),
      profile("HEAL", { role: "reactive" }),
    ]);
    expect(planned.map((c) => c.file)).toEqual(["HEAL", "BUFF"]);
    expect(planned[0].probability).toBe(100);
  });

  it("casts the most valuable first, and at an equal value mid before short", () => {
    expect(
      covered([
        profile("SHORTBUFF", { role: "buff", duration: "short" }),
        profile("MIDBUFF", { role: "buff", duration: "mid" }),
        profile("GREAT", { role: "protection", tier: "great", duration: "short" }),
      ]),
    ).toEqual(["GREAT", "MIDBUFF", "SHORTBUFF"]);
  });
});

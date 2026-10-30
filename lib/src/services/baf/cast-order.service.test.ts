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

const files = (profiles: SpellProfile[]) => castOrderService.plan(profiles).map((c) => c.file);

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

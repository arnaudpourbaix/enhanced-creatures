// Short expected-output/fixture strings recur because the same underlying formatting logic
// (getStatisticText, translation fixtures, etc.) is deliberately re-exercised from multiple
// entry points (direct calls and via getEffectDescription/getEffectsDescription wrappers) -
// not copy-paste. Named constants wouldn't add clarity over the literal itself.
/* eslint-disable sonarjs/no-duplicate-string */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CR } from "../../model/constants";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import {
  ArmorClassBonusEffect,
  CastingTimeModifierEffect,
  CharmCreatureEffect,
  CurrentHPbonusEffect,
  DamageEffect,
  DiseaseEffect,
  Effect,
  IdsEffect,
  InvisibilityEffect,
  LevelDrainEffect,
  PoisonEffect,
  RegenerationEffect,
  SleepEffect,
  StatisticModifierEffect,
} from "../../model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  CharmTypeEnum,
  DiseaseTypeEnum,
  EffectBonusToEnum,
  EffectDamageTypeEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  InvisibilityTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PoisonTypeEnum,
  RegenerationTypeEnum,
  SaveTypeEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Item, Spell, SpellHeader, Weapon } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import logService from "../log.service";
import translationService from "../translation.service";
import descriptionService from "./description.service";

// Effect params are Partial<...>: these tests call private renderers directly with
// minimal fixtures (only the fields that function reads), not a fully-populated Effect.
//
// LooseEffect is used for the two dispatcher-style methods whose it.each tests drive a loop
// variable (opcode) typed as the full EffectTypeEnum across rows that each belong to a different,
// narrower Effect union member - Partial<Effect> distributes per member and rejects that broadened
// opcode against any single member's narrower opcode subset, so these two intentionally opt out of
// the union entirely rather than fight it.
type LooseEffect = { opcode?: EffectTypeEnum } & Record<string, unknown>;

interface DescriptionServicePrivate {
  getSaveText(effect: { saveTypes?: SaveTypeEnum[]; saveBonus?: number }): string;
  getProbability(effect: Partial<Effect>): string;
  getTarget(target: ItemAbilityTargetEnum): string;
  getDuration(duration?: number, prefix?: string): string;
  getStatisticText(effect: Partial<Effect>): string | undefined;
  getDiceValue(payload: { diceThrown?: number; diceSize?: number; value?: number }): string;
  getSignedNumber(value: number | null | undefined): string;
  getDamage(effect: Partial<DamageEffect>): string[];
  getPoison(effect: Partial<PoisonEffect>): string[];
  getDisease(effect: Partial<DiseaseEffect>): string[];
  getArmorClassBonus(effect: Partial<ArmorClassBonusEffect>): string[];
  getInvisibility(effect: Partial<InvisibilityEffect>): string[];
  getRegeneration(effect: Partial<RegenerationEffect>): string[];
  getParalyze(effect: Partial<IdsEffect>, target: ItemAbilityTargetEnum): string[];
  toPascalCase(value: string): string;
  getCharm(effect: Partial<CharmCreatureEffect>, target: ItemAbilityTargetEnum): string[];
  getLevelDrain(effect: Partial<LevelDrainEffect>): string[];
  getCastingTimeModifier(effect: Partial<CastingTimeModifierEffect>): string[];
  getStatisticModifier(effect: Partial<StatisticModifierEffect>): string[];
  getCurrentHPbonus(effect: Partial<CurrentHPbonusEffect>): string[];
  getSleep(effect: Partial<SleepEffect>): string[];
  getSlow(effect: Partial<Effect>, target: ItemAbilityTargetEnum): string[];
  getHaste(effect: Partial<Effect>, target: ItemAbilityTargetEnum): string[];
  getTeleport(): string[];
  getModifierType(effect: LooseEffect): string[];
  getEffectDescription(effect: LooseEffect, target: ItemAbilityTargetEnum): string[];
  getItemSpellDescription(effect: Partial<Effect>): string[];
  getEffectsDescription(effects: Partial<Effect>[], target: ItemAbilityTargetEnum): string[];
  getImmunitiesDescription(immunities: ImmunityName[], onlyName?: boolean): string[];
}

const service = descriptionService as unknown as DescriptionServicePrivate;

function decode(ref: number): string[] {
  return translationService.from(ref).split(CR);
}

function fakeImmunity(p: Partial<ImmunityConfig> = {}): ImmunityConfig {
  return {
    name: p.name ?? "fire",
    type: "immunity",
    doc: true,
    immunities: [],
    preventEffects: [],
    preventIcons: [],
    displayIcons: [],
    strings: [],
    animations: [],
    spellGroups: [],
    displaySpellIneffective: false,
    effects: [],
    overrides: [],
    ...p,
  } as unknown as ImmunityConfig;
}

function fakeWeapon(p: Partial<Weapon> = {}): Weapon {
  return {
    file: "wpn01",
    doc: true,
    immunities: [],
    effects: [],
    equippedSlot: [],
    projectiles: [],
    trait: false,
    ...p,
    header: {
      type: ItemAbilityTypeEnum.Melee,
      target: ItemAbilityTargetEnum.LivingActor,
      effects: [],
      ...(p.header ?? {}),
    },
  };
}

function fakeItem(p: Partial<Item> = {}): Item {
  return {
    file: "itm01",
    doc: true,
    immunities: [],
    effects: [],
    equippedSlot: [],
    projectiles: [],
    trait: false,
    ...p,
  };
}

function fakeSpell(p: Partial<Spell> = {}): Spell {
  return {
    file: "spl01",
    type: 1,
    level: 1,
    name: translationService.addCustomTranslation(["Test Spell"]),
    doc: "both",
    groups: [],
    effects: [],
    headers: [],
    effectFiles: [],
    projectiles: [],
    ...p,
  } as unknown as Spell;
}

function fakeHeader(p: Partial<SpellHeader> = {}): SpellHeader {
  return {
    type: ItemAbilityTypeEnum.Magical,
    target: ItemAbilityTargetEnum.LivingActor,
    effects: [],
    ...p,
  };
}

beforeEach(() => {
  State.immunities = [];
  State.spells = [];
  vi.spyOn(logService, "warn").mockImplementation(() => undefined);
});

describe("getDiceValue (private)", () => {
  it("returns empty string when neither dice nor value is set", () => {
    expect(service.getDiceValue({})).toBe("");
  });

  it("renders dice notation without a bonus when only dice is set", () => {
    expect(service.getDiceValue({ diceThrown: 2, diceSize: 6 })).toBe("2D6");
  });

  it("appends a signed bonus after the dice notation", () => {
    expect(service.getDiceValue({ diceThrown: 2, diceSize: 6, value: 3 })).toBe("2D6+3");
    expect(service.getDiceValue({ diceThrown: 2, diceSize: 6, value: -3 })).toBe("2D6-3");
  });

  it("strips the leading + from a positive diceless value", () => {
    expect(service.getDiceValue({ value: 5 })).toBe("5");
  });

  it("keeps the leading - from a negative diceless value", () => {
    expect(service.getDiceValue({ value: -5 })).toBe("-5");
  });
});

describe("getSignedNumber (private)", () => {
  it("returns empty string for null or undefined", () => {
    expect(service.getSignedNumber(null)).toBe("");
    expect(service.getSignedNumber(undefined)).toBe("");
  });

  it("returns zero and negative numbers unsigned", () => {
    expect(service.getSignedNumber(0)).toBe("0");
    expect(service.getSignedNumber(-5)).toBe("-5");
  });

  it("prefixes positive numbers with +", () => {
    expect(service.getSignedNumber(5)).toBe("+5");
  });
});

describe("getTarget", () => {
  it("maps known targets to their text", () => {
    expect(service.getTarget(ItemAbilityTargetEnum.Caster)).toBe("caster");
    expect(service.getTarget(ItemAbilityTargetEnum.LivingActor)).toBe("target");
    expect(service.getTarget(ItemAbilityTargetEnum.AnyPointWithinRange)).toBe(
      "anyone within range",
    );
  });

  it("falls back to empty string for unmapped targets", () => {
    expect(service.getTarget(ItemAbilityTargetEnum.None)).toBe("");
    expect(service.getTarget(ItemAbilityTargetEnum.Inventory)).toBe("");
    expect(service.getTarget(ItemAbilityTargetEnum.DeadActor)).toBe("");
  });
});

describe("getDuration", () => {
  it("returns empty string when duration is undefined or zero", () => {
    expect(service.getDuration(undefined)).toBe("");
    expect(service.getDuration(0)).toBe("");
  });

  it("picks the largest exact unit: day, hour, turn, round, second", () => {
    expect(service.getDuration(7200)).toBe("a day");
    expect(service.getDuration(14400)).toBe("2 days");
    expect(service.getDuration(300)).toBe("an hour");
    expect(service.getDuration(600)).toBe("2 hours");
    expect(service.getDuration(60)).toBe("a turn");
    expect(service.getDuration(120)).toBe("2 turns");
    expect(service.getDuration(6)).toBe("a round");
    expect(service.getDuration(12)).toBe("2 rounds");
    expect(service.getDuration(1)).toBe("a second");
    expect(service.getDuration(100)).toBe("100 seconds");
  });

  it("applies the given prefix to the resolved unit text", () => {
    expect(service.getDuration(60, " for ")).toBe(" for a turn");
  });

  it("warns and falls back to raw seconds for a non-integer duration", () => {
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    expect(service.getDuration(0.5)).toBe("0.5s");
    expect(warnSpy).toHaveBeenCalledWith("unknown duration 0.5s");
  });
});

describe("getSaveText", () => {
  it("returns empty string when no save type is set", () => {
    expect(service.getSaveText({})).toBe("");
    expect(service.getSaveText({ saveTypes: [] })).toBe("");
  });

  it("returns empty string for an unmapped save type", () => {
    expect(service.getSaveText({ saveTypes: [99 as SaveTypeEnum] })).toBe("");
  });

  it.each([
    [SaveTypeEnum.ParalyzePoisonDeath, "poison/death"],
    [SaveTypeEnum.Breath, "breath"],
    [SaveTypeEnum.PetrifyPolymorph, "petrify/polymorph"],
    [SaveTypeEnum.RodStaffWand, "wand"],
    [SaveTypeEnum.Spell, "spell"],
  ])("formats save type %s as %s", (type, text) => {
    expect(service.getSaveText({ saveTypes: [type] })).toBe(` (saves vs ${text})`);
  });

  it("appends a signed save bonus when present", () => {
    expect(service.getSaveText({ saveTypes: [SaveTypeEnum.Breath], saveBonus: -2 })).toBe(
      " (saves vs breath at -2)",
    );
    expect(service.getSaveText({ saveTypes: [SaveTypeEnum.Spell], saveBonus: 3 })).toBe(
      " (saves vs spell at +3)",
    );
  });
});

describe("getProbability", () => {
  it("returns empty string when probability1 is undefined, zero or 100", () => {
    expect(service.getProbability({})).toBe("");
    expect(service.getProbability({ probability1: 0 })).toBe("");
    expect(service.getProbability({ probability1: 100 })).toBe("");
  });

  it("renders the percentage when below 100", () => {
    expect(service.getProbability({ probability1: 50 })).toBe(" (50%)");
  });

  it("renders the difference between probability2 and probability1 when probability2 is set", () => {
    expect(service.getProbability({ probability1: 20, probability2: 60 })).toBe(" (40%)");
  });

  it("throws when probability2 is not greater than probability1", () => {
    expect(() => service.getProbability({ probability1: 60, probability2: 60 })).toThrow();
    expect(() => service.getProbability({ probability1: 60, probability2: 20 })).toThrow();
    expect(() => service.getProbability({ probability2: 60 })).toThrow();
  });
});

describe("getStatisticText", () => {
  it("returns undefined for an opcode not in the statistic list", () => {
    expect(service.getStatisticText({ opcode: EffectTypeEnum.Damage })).toBeUndefined();
  });

  it("formats a plain stat bonus with a signed value", () => {
    expect(
      service.getStatisticText({
        opcode: EffectTypeEnum.DexterityBonus,
        value: 2,
      }),
    ).toBe("Dexterity: +2");
  });

  it("formats a resistance opcode as a percentage", () => {
    expect(
      service.getStatisticText({
        opcode: EffectTypeEnum.FireResistanceModifier,
        value: 25,
      }),
    ).toBe("Fire Resistance: 25%");
  });

  it("appends duration and save text when present", () => {
    expect(
      service.getStatisticText({
        opcode: EffectTypeEnum.DexterityBonus,
        value: 2,
        duration: 60,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toBe("Dexterity: +2 for a turn (saves vs spell)");
  });
});

describe("getDamage (private)", () => {
  it("returns empty array when dice fields are missing", () => {
    expect(service.getDamage({ type: EffectDamageTypeEnum.Fire })).toEqual([]);
  });

  it("formats dice damage with a positive bonus", () => {
    expect(
      service.getDamage({
        diceThrown: 2,
        diceSize: 6,
        amount: 3,
        type: EffectDamageTypeEnum.Fire,
      }),
    ).toEqual(["Fire damage: 2D6+3"]);
  });

  it("omits the bonus when amount is zero", () => {
    expect(
      service.getDamage({
        diceThrown: 2,
        diceSize: 6,
        amount: 0,
        type: EffectDamageTypeEnum.Fire,
      }),
    ).toEqual(["Fire damage: 2D6"]);
  });

  it("formats a negative bonus", () => {
    expect(
      service.getDamage({
        diceThrown: 2,
        diceSize: 6,
        amount: -2,
        type: EffectDamageTypeEnum.Fire,
      }),
    ).toEqual(["Fire damage: 2D6-2"]);
  });
});

describe("getPoison (private)", () => {
  it("formats a fixed amount per second", () => {
    expect(
      service.getPoison({
        type: PoisonTypeEnum.AmountDamagePerSecond,
        amount: 5,
        duration: 60,
      }),
    ).toEqual(["Poison: deals 5 per second for a turn."]);
  });

  it("formats the 'one damage per duration' text for other poison types", () => {
    expect(
      service.getPoison({
        type: PoisonTypeEnum.OneDamagePerSecond,
        amount: 6,
        duration: 6,
      }),
    ).toEqual(["Poison: deals one damage per a round for a round."]);
  });

  it("prefixes a level range when dice fields are set", () => {
    expect(
      service.getPoison({
        type: PoisonTypeEnum.AmountDamagePerSecond,
        amount: 5,
        duration: 60,
        diceSize: 3,
        diceThrown: 5,
      }),
    ).toEqual(["Level 3-5: Poison: deals 5 per second for a turn."]);
  });

  it("appends save text when present", () => {
    expect(
      service.getPoison({
        type: PoisonTypeEnum.AmountDamagePerSecond,
        amount: 5,
        duration: 60,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toEqual(["Poison: deals 5 per second for a turn (saves vs spell)."]);
  });
});

describe("getDisease (private)", () => {
  it.each([
    [DiseaseTypeEnum.OneDamagePerSecond, undefined, "one damage per second"],
    [DiseaseTypeEnum.OneDamagePerAmountSeconds, 60, "one damage every a turn"],
    [DiseaseTypeEnum.AmoundDamagePerRound, 5, "5 damage per round"],
    [DiseaseTypeEnum.AmountDamagePerSecond, 5, "5 damage per second"],
    [DiseaseTypeEnum.ReduceCharismaByAmount, 2, "-2 charisma"],
    [DiseaseTypeEnum.ReduceConstitutionByAmount, 2, "-2 constitution"],
    [DiseaseTypeEnum.ReduceDexterityByAmount, 2, "-2 dexterity"],
    [DiseaseTypeEnum.ReduceIntelligenceByAmount, 2, "-2 intelligence"],
    [DiseaseTypeEnum.ReduceStrengthByAmount, 2, "-2 strength"],
    [DiseaseTypeEnum.ReduceWisdomByAmount, 2, "-2 wisdom"],
    [DiseaseTypeEnum.SlowEffect, 2, "slow"],
  ])("formats disease type %s", (type, amount, text) => {
    expect(service.getDisease({ type, amount, duration: 6 })).toEqual([
      `Disease: ${text} for a round.`,
    ]);
  });

  it.each([
    DiseaseTypeEnum.Contagion,
    DiseaseTypeEnum.MoldTouchDecrement,
    DiseaseTypeEnum.MoldTouchSingle,
  ])("renders an empty description for no-op disease type %s", (type) => {
    expect(service.getDisease({ type, amount: 0, duration: 6 })).toEqual([
      "Disease:  for a round.",
    ]);
  });

  it("appends save text when present", () => {
    expect(
      service.getDisease({
        type: DiseaseTypeEnum.AmountDamagePerSecond,
        amount: 5,
        duration: 6,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toEqual(["Disease: 5 damage per second for a round (saves vs spell)."]);
  });
});

describe("getArmorClassBonus (private)", () => {
  it("returns a flat base AC line for SetBaseArmorClassToValue, ignoring duration/save", () => {
    expect(
      service.getArmorClassBonus({
        bonusTo: EffectBonusToEnum.SetBaseArmorClassToValue,
        value: -2,
        duration: 60,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toEqual(["-2 base AC"]);
  });

  it.each([
    [EffectBonusToEnum.CrushingWeapons, "crushing"],
    [EffectBonusToEnum.SlashingWeapons, "slashing"],
    [EffectBonusToEnum.PiercingWeapons, "piercing"],
    [EffectBonusToEnum.MissileWeapons, "missile"],
  ])("adds a weapon-type suffix for bonusTo %s", (bonusTo, suffix) => {
    expect(service.getArmorClassBonus({ bonusTo, value: 1 })).toEqual([
      `+1 AC vs. ${suffix} attacks`,
    ]);
  });

  it("omits the suffix for AllWeapons", () => {
    expect(
      service.getArmorClassBonus({
        bonusTo: EffectBonusToEnum.AllWeapons,
        value: 1,
      }),
    ).toEqual(["+1 AC"]);
  });

  it("appends duration and save text", () => {
    expect(
      service.getArmorClassBonus({
        bonusTo: EffectBonusToEnum.CrushingWeapons,
        value: 1,
        duration: 6,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toEqual(["+1 AC vs. crushing attacks for a round (saves vs spell)"]);
  });
});

describe("getInvisibility (private)", () => {
  it("labels Improved invisibility distinctly", () => {
    expect(service.getInvisibility({ type: InvisibilityTypeEnum.Improved })).toEqual([
      "Improved invisibility",
    ]);
  });

  it("falls back to plain Invisibility for Normal and Weak", () => {
    expect(service.getInvisibility({ type: InvisibilityTypeEnum.Normal })).toEqual([
      "Invisibility",
    ]);
    expect(service.getInvisibility({ type: InvisibilityTypeEnum.Weak })).toEqual(["Invisibility"]);
  });
});

describe("getRegeneration (private)", () => {
  it.each([RegenerationTypeEnum.AmountHPperSecond, RegenerationTypeEnum.AmountHPperSecondBis])(
    "formats hp/second for type %s",
    (type) => {
      expect(service.getRegeneration({ type, amount: 2 })).toEqual(["Regeneration: 2 hp/second"]);
    },
  );

  it("formats a percentage per second", () => {
    expect(
      service.getRegeneration({
        type: RegenerationTypeEnum.AmountHPpercentagePerSecond,
        amount: 5,
      }),
    ).toEqual(["Regeneration: 5% hp/second"]);
  });

  it("special-cases an amount of exactly 6 seconds as 1 hp/round", () => {
    expect(
      service.getRegeneration({
        type: RegenerationTypeEnum.OneHPperAmountSeconds,
        amount: 6,
      }),
    ).toEqual(["Regeneration: 1 hp/round"]);
  });

  it("expresses a multiple of 6 seconds as N rounds", () => {
    expect(
      service.getRegeneration({
        type: RegenerationTypeEnum.OneHPperAmountSeconds,
        amount: 12,
      }),
    ).toEqual(["Regeneration: 1 hp/2 rounds"]);
  });

  it("falls back to raw seconds when not a multiple of 6", () => {
    expect(
      service.getRegeneration({
        type: RegenerationTypeEnum.OneHPperAmountSeconds,
        amount: 7,
      }),
    ).toEqual(["Regeneration: 1 hp/7 seconds"]);
  });
});

describe("getParalyze (private)", () => {
  it("formats target, duration and save text", () => {
    expect(
      service.getParalyze(
        { duration: 60, saveTypes: [SaveTypeEnum.ParalyzePoisonDeath] },
        ItemAbilityTargetEnum.LivingActor,
      ),
    ).toEqual(["Paralyze target for a turn (saves vs poison/death)."]);
  });

  it("omits the restriction when idsFile/idsEntry target anyone (EA/ANYONE)", () => {
    expect(
      service.getParalyze(
        {
          duration: 60,
          saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
          idsFile: EffectIDSFileEnum.EA,
          idsEntry: "ANYONE",
        },
        ItemAbilityTargetEnum.LivingActor,
      ),
    ).toEqual(["Paralyze target for a turn (saves vs poison/death)."]);
  });

  it("mentions the pascal-cased ids entry when restricted to a race", () => {
    expect(
      service.getParalyze(
        {
          duration: 60,
          saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
          idsFile: EffectIDSFileEnum.RACE,
          idsEntry: "HALF_ELF",
        },
        ItemAbilityTargetEnum.LivingActor,
      ),
    ).toEqual(["Paralyze target for a turn (only affects Half Elf) (saves vs poison/death)."]);
  });

  it("mentions the pascal-cased ids entry when restricted by general type", () => {
    expect(
      service.getParalyze(
        {
          duration: 60,
          saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
          idsFile: EffectIDSFileEnum.GENERAL,
          idsEntry: "UNDEAD",
        },
        ItemAbilityTargetEnum.LivingActor,
      ),
    ).toEqual(["Paralyze target for a turn (only affects Undead) (saves vs poison/death)."]);
  });
});

describe("toPascalCase (private)", () => {
  it("capitalizes a single all-caps word", () => {
    expect(service.toPascalCase("HUMAN")).toBe("Human");
  });

  it("joins underscore-separated words with a space", () => {
    expect(service.toPascalCase("HALF_ELF")).toBe("Half Elf");
    expect(service.toPascalCase("GENERAL_ITEM")).toBe("General Item");
  });

  it("joins hyphen-separated words with a space", () => {
    expect(service.toPascalCase("WILL-O-WISP")).toBe("Will O Wisp");
  });
});

describe("getCharm (private)", () => {
  it.each([
    [CharmTypeEnum.NeutralCharm, "Charm"],
    [CharmTypeEnum.ThrullCharmNoFeedback, "Charm"],
    [CharmTypeEnum.NeutralDireCharm, "Dire Charm"],
    [CharmTypeEnum.HostileDomination, "Dire Charm"],
    [CharmTypeEnum.Controlled, "Turn"],
  ])("labels charmType %s as %s", (charmType, label) => {
    expect(service.getCharm({ charmType, duration: 60 }, ItemAbilityTargetEnum.Caster)).toEqual([
      `${label} caster for a turn.`,
    ]);
  });

  it("leaves an empty label for an unhandled charmType (e.g. HostileCharm)", () => {
    expect(
      service.getCharm(
        { charmType: CharmTypeEnum.HostileCharm, duration: 60 },
        ItemAbilityTargetEnum.Caster,
      ),
    ).toEqual([" caster for a turn."]);
  });

  it("appends save text", () => {
    expect(
      service.getCharm(
        {
          charmType: CharmTypeEnum.NeutralCharm,
          duration: 60,
          saveTypes: [SaveTypeEnum.Spell],
        },
        ItemAbilityTargetEnum.LivingActor,
      ),
    ).toEqual(["Charm target for a turn (saves vs spell)."]);
  });
});

describe("getLevelDrain (private)", () => {
  it("formats the drained amount", () => {
    expect(service.getLevelDrain({ amount: 2 })).toEqual(["Drain 2 level from target."]);
  });

  it("appends save text", () => {
    expect(service.getLevelDrain({ amount: 1, saveTypes: [SaveTypeEnum.Spell] })).toEqual([
      "Drain 1 level from target (saves vs spell).",
    ]);
  });
});

describe("getCastingTimeModifier (private)", () => {
  it("formats the value and raw type", () => {
    expect(service.getCastingTimeModifier({ value: 2, type: 1 })).toEqual(["Casting time: 2 (1)"]);
  });
});

describe("getStatisticModifier (private)", () => {
  it("delegates to getStatisticText", () => {
    expect(
      service.getStatisticModifier({
        opcode: EffectTypeEnum.DexterityBonus,
        value: 2,
      }),
    ).toEqual(["Dexterity: +2"]);
  });
});

describe("getCurrentHPbonus (private)", () => {
  it("formats a diceless heal amount", () => {
    expect(service.getCurrentHPbonus({ value: 10 })).toEqual(["Heal: 10"]);
  });

  it("formats a dice heal amount with a bonus", () => {
    expect(service.getCurrentHPbonus({ diceThrown: 2, diceSize: 8, value: 3 })).toEqual([
      "Heal: 2D8+3",
    ]);
  });
});

describe("getSleep (private)", () => {
  it("formats duration without the wake-on-damage note", () => {
    expect(service.getSleep({ duration: 6, wakeOnDamage: false })).toEqual(["Sleep for a round"]);
  });

  it("appends the wake-on-damage note", () => {
    expect(service.getSleep({ duration: 6, wakeOnDamage: true })).toEqual([
      "Sleep for a round (wake on damage)",
    ]);
  });

  it("appends save text after the wake-on-damage note", () => {
    expect(
      service.getSleep({
        duration: 6,
        wakeOnDamage: true,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toEqual(["Sleep for a round (wake on damage) (saves vs spell)"]);
  });
});

describe("getSlow (private)", () => {
  it("formats target, duration and save text", () => {
    expect(
      service.getSlow(
        { duration: 60, saveTypes: [SaveTypeEnum.Spell] },
        ItemAbilityTargetEnum.LivingActor,
      ),
    ).toEqual(["Slow target for a turn (saves vs spell)"]);
  });
});

describe("getHaste (private)", () => {
  it("formats target, duration and save text", () => {
    expect(
      service.getHaste(
        { duration: 60, saveTypes: [SaveTypeEnum.Spell] },
        ItemAbilityTargetEnum.LivingActor,
      ),
    ).toEqual(["Haste target for a turn (saves vs spell)"]);
  });
});

describe("getTeleport (private)", () => {
  it("always returns a constant text", () => {
    expect(service.getTeleport()).toEqual(["Teleport to target"]);
  });
});

describe("getModifierType (private)", () => {
  it.each([
    [EffectTypeEnum.AttackDamageBonus, "Damage"],
    [EffectTypeEnum.MovementRateBonus, "Movement rate"],
    [EffectTypeEnum.MovementRateBonus2, "Movement rate"],
    [EffectTypeEnum.Thac0Bonus, "Thac0"],
    [EffectTypeEnum.OffhandThac0Bonus, "Offhand Thac0"],
  ])("labels opcode %s as %s", (opcode, label) => {
    expect(
      service.getModifierType({
        opcode,
        type: EffectModifierTypeEnum.Increment,
        value: 5,
      }),
    ).toEqual([`${label}:+5`]);
  });

  it("returns an empty array for an opcode outside the modifier group", () => {
    expect(
      service.getModifierType({
        opcode: EffectTypeEnum.Damage,
        type: EffectModifierTypeEnum.Increment,
        value: 5,
      }),
    ).toEqual([]);
  });

  it.each([EffectModifierTypeEnum.MultiplyPercent, EffectModifierTypeEnum.SetPercentOf])(
    "renders the value as a percentage for modifier type %s",
    (type) => {
      expect(
        service.getModifierType({
          type,
          opcode: EffectTypeEnum.MovementRateBonus,
          value: 150,
        }),
      ).toEqual(["Movement rate:150%"]);
    },
  );

  it("renders a signed value for Increment/Set modifier types", () => {
    expect(
      service.getModifierType({
        opcode: EffectTypeEnum.Thac0Bonus,
        type: EffectModifierTypeEnum.Set,
        value: -2,
      }),
    ).toEqual(["Thac0:-2"]);
  });

  it("appends duration (with its own ' for ' prefix) and save text", () => {
    expect(
      service.getModifierType({
        opcode: EffectTypeEnum.AttackDamageBonus,
        type: EffectModifierTypeEnum.Increment,
        value: 5,
        duration: 6,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toEqual(["Damage:+5 for a round (saves vs spell)"]);
  });
});

describe("getEffectDescription (private, dispatcher)", () => {
  const target = ItemAbilityTargetEnum.LivingActor;

  it("routes Damage to getDamage", () => {
    expect(
      service.getEffectDescription(
        {
          opcode: EffectTypeEnum.Damage,
          diceThrown: 2,
          diceSize: 6,
          type: EffectDamageTypeEnum.Fire,
        },
        target,
      ),
    ).toEqual(["Fire damage: 2D6"]);
  });

  it("routes Poison to getPoison", () => {
    expect(
      service.getEffectDescription(
        {
          opcode: EffectTypeEnum.Poison,
          type: PoisonTypeEnum.AmountDamagePerSecond,
          amount: 5,
          duration: 60,
        },
        target,
      ),
    ).toEqual(["Poison: deals 5 per second for a turn."]);
  });

  it("routes Disease to getDisease", () => {
    expect(
      service.getEffectDescription(
        {
          opcode: EffectTypeEnum.Disease,
          type: DiseaseTypeEnum.SlowEffect,
          amount: 0,
          duration: 6,
        },
        target,
      ),
    ).toEqual(["Disease: slow for a round."]);
  });

  it("routes ArmorClassBonus to getArmorClassBonus", () => {
    expect(
      service.getEffectDescription(
        {
          opcode: EffectTypeEnum.ArmorClassBonus,
          bonusTo: EffectBonusToEnum.AllWeapons,
          value: 1,
        },
        target,
      ),
    ).toEqual(["+1 AC"]);
  });

  it("routes Paralyze to getParalyze", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.Paralyze, duration: 60 }, target),
    ).toEqual(["Paralyze target for a turn."]);
  });

  it("routes Hold to getParalyze (identical in-game effect, same description)", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.Hold, duration: 60 }, target),
    ).toEqual(["Paralyze target for a turn."]);
  });

  it("returns a constant line for InvisibilityDetection", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.InvisibilityDetection }, target),
    ).toEqual(["Can see invisible creatures."]);
  });

  it("returns a constant line for Blur", () => {
    expect(service.getEffectDescription({ opcode: EffectTypeEnum.Blur }, target)).toEqual([
      "Blur (visual effect only)",
    ]);
  });

  it("routes CurrentHPbonus to getCurrentHPbonus", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.CurrentHPbonus, value: 10 }, target),
    ).toEqual(["Heal: 10"]);
  });

  it("routes LevelDrain to getLevelDrain", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.LevelDrain, amount: 2 }, target),
    ).toEqual(["Drain 2 level from target."]);
  });

  it("routes Sleep to getSleep", () => {
    expect(
      service.getEffectDescription(
        { opcode: EffectTypeEnum.Sleep, duration: 6, wakeOnDamage: false },
        target,
      ),
    ).toEqual(["Sleep for a round"]);
  });

  it("routes Slow to getSlow", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.Slow, duration: 60 }, target),
    ).toEqual(["Slow target for a turn"]);
  });

  it("routes Haste to getHaste", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.Haste, duration: 60 }, target),
    ).toEqual(["Haste target for a turn"]);
  });

  it("routes Teleport to a constant text", () => {
    expect(service.getEffectDescription({ opcode: EffectTypeEnum.Teleport }, target)).toEqual([
      "Teleport to target",
    ]);
  });

  it.each([EffectTypeEnum.CharmCreature, EffectTypeEnum.CharmControlCreature])(
    "routes charm opcode %s to getCharm",
    (opcode) => {
      expect(
        service.getEffectDescription(
          { opcode, charmType: CharmTypeEnum.NeutralCharm, duration: 60 },
          target,
        ),
      ).toEqual(["Charm target for a turn."]);
    },
  );

  it.each([
    EffectTypeEnum.AttackDamageBonus,
    EffectTypeEnum.MovementRateBonus,
    EffectTypeEnum.MovementRateBonus2,
    EffectTypeEnum.Thac0Bonus,
    EffectTypeEnum.OffhandThac0Bonus,
  ])("routes modifier-type opcode %s to getModifierType", (opcode) => {
    expect(
      service.getEffectDescription(
        { opcode, type: EffectModifierTypeEnum.Increment, value: 5 },
        target,
      ),
    ).not.toEqual([]);
  });

  it("formats MirrorImageEffect inline with its amount", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.MirrorImageEffect, amount: 3 }, target),
    ).toEqual(["Mirror image (3)"]);
  });

  it("returns a constant line for Infravision", () => {
    expect(service.getEffectDescription({ opcode: EffectTypeEnum.Infravision }, target)).toEqual([
      "Darkvision out to 60 feet",
    ]);
  });

  it("routes Invisibility to getInvisibility", () => {
    expect(
      service.getEffectDescription(
        { opcode: EffectTypeEnum.Invisibility, type: InvisibilityTypeEnum.Improved },
        target,
      ),
    ).toEqual(["Improved invisibility"]);
  });

  it("routes Regeneration to getRegeneration", () => {
    expect(
      service.getEffectDescription(
        {
          opcode: EffectTypeEnum.Regeneration,
          type: RegenerationTypeEnum.AmountHPperSecond,
          amount: 2,
        },
        target,
      ),
    ).toEqual(["Regeneration: 2 hp/second"]);
  });

  it("routes CastingTimeModifier to getCastingTimeModifier", () => {
    expect(
      service.getEffectDescription(
        { opcode: EffectTypeEnum.CastingTimeModifier, value: 2, type: 1 },
        target,
      ),
    ).toEqual(["Casting time: 2 (1)"]);
  });

  it("routes a recognized statistic opcode to getStatisticModifier", () => {
    expect(
      service.getEffectDescription({ opcode: EffectTypeEnum.DexterityBonus, value: 2 }, target),
    ).toEqual(["Dexterity: +2"]);
  });

  it("returns an empty array for an opcode with no matching branch", () => {
    expect(service.getEffectDescription({ opcode: EffectTypeEnum.Blindness }, target)).toEqual([]);
  });
});

describe("getItemSpellDescription (private)", () => {
  it("uses the spell's resource as its name when the spell isn't found", () => {
    expect(
      service.getItemSpellDescription({
        opcode: EffectTypeEnum.CastSpell,
        resource: "unknownfile",
      }),
    ).toEqual(["", "Cast spell unknownfile"]);
  });

  it("uses the spell's translated name and appends its description when doc is falsy", () => {
    const nameRef = translationService.addCustomTranslation(["Fireball"]);
    const descRef = translationService.addCustomTranslation(["Deals fire damage in an area."]);
    State.spells = [
      fakeSpell({ file: "fireball", name: nameRef, description: descRef, doc: false }),
    ];
    expect(
      service.getItemSpellDescription({
        opcode: EffectTypeEnum.CastSpell,
        resource: "fireball",
        probability1: 50,
      }),
    ).toEqual(["", "Cast spell Fireball (50%):", "Deals fire damage in an area."]);
  });

  it("omits the description block when the spell's doc is truthy", () => {
    const nameRef = translationService.addCustomTranslation(["Fireball"]);
    const descRef = translationService.addCustomTranslation(["Deals fire damage in an area."]);
    State.spells = [
      fakeSpell({ file: "fireball", name: nameRef, description: descRef, doc: "both" }),
    ];
    expect(
      service.getItemSpellDescription({
        opcode: EffectTypeEnum.CastSpell,
        resource: "fireball",
      }),
    ).toEqual(["", "Cast spell Fireball"]);
  });

  it("prefers save text over probability when both are present", () => {
    const nameRef = translationService.addCustomTranslation(["Fireball"]);
    State.spells = [fakeSpell({ file: "fireball", name: nameRef })];
    expect(
      service.getItemSpellDescription({
        opcode: EffectTypeEnum.CastSpell,
        resource: "fireball",
        probability1: 50,
        saveTypes: [SaveTypeEnum.Spell],
      }),
    ).toEqual(["", "Cast spell Fireball (saves vs spell)"]);
  });
});

describe("getEffectsDescription (private)", () => {
  it("returns an empty array for no effects", () => {
    expect(service.getEffectsDescription([], ItemAbilityTargetEnum.LivingActor)).toEqual([]);
  });

  it("routes CastSpell effects through getItemSpellDescription and others through getEffectDescription", () => {
    const nameRef = translationService.addCustomTranslation(["Fireball"]);
    State.spells = [fakeSpell({ file: "fireball", name: nameRef })];
    const results = service.getEffectsDescription(
      [
        { opcode: EffectTypeEnum.CastSpell, resource: "fireball" },
        {
          opcode: EffectTypeEnum.Damage,
          diceThrown: 2,
          diceSize: 6,
          type: EffectDamageTypeEnum.Fire,
        },
      ],
      ItemAbilityTargetEnum.LivingActor,
    );
    expect(results).toEqual(["", "Cast spell Fireball", "Fire damage: 2D6"]);
  });
});

describe("getImmunitiesDescription (private)", () => {
  it("skips immunity names that aren't registered in State.immunities", () => {
    State.immunities = [];
    expect(service.getImmunitiesDescription(["fire"])).toEqual([]);
  });

  it("uses the existing description when present", () => {
    const descRef = translationService.addCustomTranslation(["Immune to fire."]);
    State.immunities = [fakeImmunity({ name: "fire", description: descRef })];
    expect(service.getImmunitiesDescription(["fire"])).toEqual(["Immune to fire."]);
  });

  it("falls back to the translated stringRef when onlyName is true", () => {
    State.immunities = [fakeImmunity({ name: "poison", stringRef: "common.immunity.poison" })];
    expect(service.getImmunitiesDescription(["poison"], true)).toEqual(["Immune to poison"]);
  });

  it("also falls back to stringRef when onlyName is false but there is no description", () => {
    State.immunities = [fakeImmunity({ name: "poison", stringRef: "common.immunity.poison" })];
    expect(service.getImmunitiesDescription(["poison"])).toEqual(["Immune to poison"]);
  });

  it("generates the immunity's description on the fly when neither stringRef nor description is set", () => {
    State.immunities = [
      fakeImmunity({
        name: "fire",
        effects: [
          {
            opcode: EffectTypeEnum.ArmorClassBonus,
            bonusTo: EffectBonusToEnum.SetBaseArmorClassToValue,
            value: -2,
          },
        ],
      }),
    ];
    expect(service.getImmunitiesDescription(["fire"])).toEqual(["-2 base AC"]);
    expect(State.immunities[0].description).toBeDefined();
  });

  it("pushes nothing for an immunity that has a description but no stringRef when onlyName is true", () => {
    const descRef = translationService.addCustomTranslation(["Immune to fire."]);
    State.immunities = [fakeImmunity({ name: "fire", description: descRef })];
    expect(service.getImmunitiesDescription(["fire"], true)).toEqual([]);
  });
});

describe("generateImmunity (public)", () => {
  it("does not override an existing description", () => {
    const original = translationService.addCustomTranslation(["Already set."]);
    const addSpy = vi.spyOn(translationService, "addCustomTranslation");
    const immunity = fakeImmunity({ name: "fire", description: original });
    descriptionService.generateImmunity(immunity);
    expect(immunity.description).toBe(original);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("builds a description from nested immunities and its own effects", () => {
    State.immunities = [fakeImmunity({ name: "cold", stringRef: "common.immunity.cold" })];
    const immunity = fakeImmunity({
      name: "elemental",
      immunities: ["cold"],
      effects: [
        {
          opcode: EffectTypeEnum.ArmorClassBonus,
          bonusTo: EffectBonusToEnum.SetBaseArmorClassToValue,
          value: -2,
        },
      ],
    });
    descriptionService.generateImmunity(immunity);
    expect(immunity.description).toBeDefined();
    expect(decode(immunity.description as number)).toEqual(["Immune to cold", "-2 base AC"]);
  });

  it("leaves the description unset when nothing resolves to any text", () => {
    const immunity = fakeImmunity({ name: "fire", immunities: [], effects: [] });
    descriptionService.generateImmunity(immunity);
    expect(immunity.description).toBeUndefined();
  });

  it("defaults effects to an empty array when unset (the field is required by the type but the code defends against it anyway)", () => {
    State.immunities = [fakeImmunity({ name: "cold", stringRef: "common.immunity.cold" })];
    const immunity = fakeImmunity({
      name: "elemental",
      immunities: ["cold"],
      effects: undefined,
    });
    descriptionService.generateImmunity(immunity);
    expect(decode(immunity.description as number)).toEqual(["Immune to cold"]);
  });
});

describe("generateCreatureSpells (public)", () => {
  it("generates a description for a spell with exactly one header and no existing description", () => {
    const spell = fakeSpell({
      headers: [
        fakeHeader({
          effects: [
            {
              opcode: EffectTypeEnum.Regeneration,
              type: RegenerationTypeEnum.AmountHPperSecond,
              amount: 2,
            },
          ],
        }),
      ],
    });
    descriptionService.generateCreatureSpells([spell]);
    expect(spell.description).toBeDefined();
    expect(decode(spell.description as number)).toEqual(["Regeneration: 2 hp/second"]);
  });

  it("skips a spell that already has a description", () => {
    const original = translationService.addCustomTranslation(["Existing."]);
    const spell = fakeSpell({
      description: original,
      headers: [fakeHeader()],
    });
    descriptionService.generateCreatureSpells([spell]);
    expect(spell.description).toBe(original);
  });

  it("skips a spell with zero headers", () => {
    const spell = fakeSpell({ headers: [] });
    descriptionService.generateCreatureSpells([spell]);
    expect(spell.description).toBeUndefined();
  });

  it("skips a spell with more than one header", () => {
    const spell = fakeSpell({ headers: [fakeHeader(), fakeHeader()] });
    descriptionService.generateCreatureSpells([spell]);
    expect(spell.description).toBeUndefined();
  });
});

describe("generateCreatureItems (public)", () => {
  it("skips an item that already has a description", () => {
    const original = translationService.addCustomTranslation(["Existing."]);
    const item = fakeWeapon({ description: original });
    descriptionService.generateCreatureItems([item]);
    expect(item.description).toBe(original);
  });

  it("leaves the description unset for an item with neither a header nor a trait", () => {
    const item = fakeItem();
    descriptionService.generateCreatureItems([item]);
    expect(item.description).toBeUndefined();
  });

  it("generates a weapon description from THAC0, damage, speed, enchantment, range, immunities and effects", () => {
    const fireDesc = translationService.addCustomTranslation(["Immune to fire."]);
    State.immunities = [fakeImmunity({ name: "fire", description: fireDesc })];
    const flavor = translationService.addCustomTranslation(["A blade wreathed in flame."]);
    const weapon = fakeWeapon({
      stringRef: flavor,
      enchantment: 2,
      immunities: ["fire"],
      effects: [
        {
          opcode: EffectTypeEnum.ArmorClassBonus,
          bonusTo: EffectBonusToEnum.SetBaseArmorClassToValue,
          value: -1,
        },
      ],
      header: {
        type: ItemAbilityTypeEnum.Melee,
        target: ItemAbilityTargetEnum.LivingActor,
        bonusToHit: 2,
        diceThrown: 2,
        diceSize: 6,
        damageBonus: 3,
        damageType: AbilityDamageTypeEnum.Slashing,
        speed: 4,
        range: 30,
        effects: [],
      },
    });
    descriptionService.generateCreatureItems([weapon]);
    expect(decode(weapon.description as number)).toEqual([
      "A blade wreathed in flame.",
      "",
      "THAC0: +2",
      "Melee damage: 2D6+3 (Slashing)",
      "Speed Factor: 4",
      "Enchantment: 2",
      "Range: 30 feet",
      "Immune to fire.",
      "-1 base AC",
    ]);
  });

  it("omits the flavor-text header when there is nothing else to describe", () => {
    const flavor = translationService.addCustomTranslation(["Flavor text."]);
    const weapon = fakeWeapon({ stringRef: flavor });
    descriptionService.generateCreatureItems([weapon]);
    expect(decode(weapon.description as number)).toEqual([""]);
  });

  it("labels damage as 'Ranged' for a non-melee weapon type", () => {
    const weapon = fakeWeapon({
      header: {
        type: ItemAbilityTypeEnum.Ranged,
        target: ItemAbilityTargetEnum.LivingActor,
        diceThrown: 1,
        diceSize: 6,
        damageType: AbilityDamageTypeEnum.Piercing,
        effects: [],
      },
    });
    descriptionService.generateCreatureItems([weapon]);
    expect(decode(weapon.description as number)).toContain("Ranged damage: 1D6 (Piercing)");
  });

  it("omits Speed Factor when there is no damage and no damage effects", () => {
    const weapon = fakeWeapon({
      header: {
        type: ItemAbilityTypeEnum.Melee,
        target: ItemAbilityTargetEnum.LivingActor,
        speed: 4,
        effects: [],
      },
    });
    descriptionService.generateCreatureItems([weapon]);
    expect(decode(weapon.description as number)).toEqual([""]);
  });

  it("generates a trait description from immunity names only and its own effects, targeting the caster", () => {
    State.immunities = [fakeImmunity({ name: "poison", stringRef: "common.immunity.poison" })];
    const item = fakeItem({
      trait: true,
      immunities: ["poison"],
      effects: [
        {
          opcode: EffectTypeEnum.Regeneration,
          type: RegenerationTypeEnum.AmountHPperSecond,
          amount: 1,
        },
      ],
    });
    descriptionService.generateCreatureItems([item]);
    expect(decode(item.description as number)).toEqual([
      "Immune to poison",
      "Regeneration: 1 hp/second",
    ]);
  });
});

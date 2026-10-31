import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ABILITY_PRESETS } from "../../config/ability-presets";
import { SEQUENCERS } from "../../config/spells/spell-combos";
import { SPELLS } from "../../config/spells/spell-database";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import {
  CastSpellOnConditionTargetEnum,
  EffectTargetEnum,
  ItemAbilityTargetEnum,
} from "../model/spell-item/effect.enums";
import {
  contingency,
  minorSequencer,
  SpellCombo,
  spellSequencer,
} from "../model/spell-item/spell-combo";
import { Spell } from "../model/spell-item/spell-item";
import logService from "./log.service";
import spellComboService from "./spell-combo.service";
// builds the combo SPLs (see SpellComboService.useSpellBuilder)
import "./spell.service";

const w = SPELLS.Wizard;

/** The generated SPL named `file`. */
const splOf = (file: string): Spell => {
  const spell = spellComboService.allSpells().find((s) => s.file === file);
  if (!spell) throw new Error(`no generated SPL ${file}`);
  return spell;
};

const effectsOf = (spell: Spell, opcode: EffectTypeEnum) =>
  spell.headers.flatMap((h) => h.effects).filter((e) => e.opcode === opcode);

const castResources = (spell: Spell) =>
  effectsOf(spell, EffectTypeEnum.CastSpell).map((e) => e.resource);

beforeEach(() => {
  spellComboService.reset();
  spellComboService.usePresets(ABILITY_PRESETS);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("comboFile", () => {
  it("names a registry combo in the common scope, shared by mods with the same content", () => {
    const file = spellComboService.comboFile(SEQUENCERS.MagicMissiles, "Vanilla");
    expect(file).toMatch(/^jasc01[0-9a-z]{2}$/);
    expect(spellComboService.comboFile(SEQUENCERS.MagicMissiles, "AllSpellMods")).toBe(file);
  });

  it("gives one SPL per distinct resolved content", () => {
    const missile = {
      ...w.MagicMissiles,
      variants: [{ mod: "AllSpellMods" as const, file: "SPWX112" }],
    };
    const combo: SpellCombo = {
      key: "TestVariant",
      kind: "minorSequencer",
      spells: [missile, missile],
    };
    const vanilla = spellComboService.comboFile(combo, "Vanilla");
    const allMods = spellComboService.comboFile(combo, "AllSpellMods");
    expect(vanilla).not.toBe(allMods);
    expect(castResources(splOf(vanilla))).toEqual(["SPWI112", "SPWI112"]);
    expect(castResources(splOf(allMods))).toEqual(["SPWX112", "SPWX112"]);
  });

  it("reserves a second name for every contingency's wrapper", () => {
    const combo: SpellCombo = {
      key: "TestEnemy",
      kind: "contingency",
      condition: "hp50",
      spells: [w.MagicMissiles],
    };
    const first = spellComboService.comboFile(combo, "Vanilla");
    const next: SpellCombo = {
      key: "TestNext",
      kind: "minorSequencer",
      spells: [w.MagicMissiles, w.Sleep],
    };
    const second = spellComboService.comboFile(next, "Vanilla");
    expect(parseInt(second.slice(-2), 36) - parseInt(first.slice(-2), 36)).toBe(2);
  });
});

describe("filesOf", () => {
  it("lists each distinct SPL across mods once, in mod order, with its spells", () => {
    const missile = {
      ...w.MagicMissiles,
      variants: [{ mod: "AllSpellMods" as const, file: "SPWX112" }],
    };
    const combo: SpellCombo = {
      key: "TestFilesOf",
      kind: "minorSequencer",
      spells: [missile, missile],
    };
    const files = spellComboService.filesOf(combo);
    expect(files).toEqual([
      spellComboService.comboFile(combo, "Vanilla"),
      spellComboService.comboFile(combo, "AllSpellMods"),
    ]);
    expect(spellComboService.spellsOfFile(files[1])?.map((s) => s.file)).toEqual([
      "SPWX112",
      "SPWX112",
    ]);
    expect(spellComboService.filesOf(SEQUENCERS.MagicMissiles)).toHaveLength(1);
  });

  it("skips mods where a contained spell isn't available", () => {
    const missile = { ...w.MagicMissiles, requiresMod: "AllSpellMods" as const };
    const combo: SpellCombo = {
      key: "TestFilesOfMod",
      kind: "minorSequencer",
      spells: [missile, missile],
    };
    expect(spellComboService.filesOf(combo)).toEqual([
      spellComboService.comboFile(combo, "AllSpellMods"),
    ]);
  });
});

describe("generated SPLs", () => {
  it("casts a sequencer's spells instantly, in order, at its smallest range", () => {
    const file = spellComboService.comboFile(SEQUENCERS.MagicMissiles, "Vanilla");
    const spell = splOf(file);
    expect(spell.name).toBe("ability.MinorSequencer");
    expect(spell.level).toBe(1);
    expect(spell.headers).toHaveLength(1);
    expect(castResources(spell)).toEqual(["SPWI112", "SPWI112"]);
    expect(spell.headers[0].target).toBe(ItemAbilityTargetEnum.LivingActor);
    expect(spell.headers[0].range).toBe(30);
    // silent: the spell's name shows when it is cast
    expect(effectsOf(spell, EffectTypeEnum.DisplayString)).toHaveLength(0);
  });

  it("uses the smallest range among the contained spells", () => {
    const combo: SpellCombo = {
      key: "TestRange",
      kind: "minorSequencer",
      spells: [
        { ...w.MagicMissiles, range: 40 },
        { ...w.Sleep, range: 25 },
      ],
    };
    expect(splOf(spellComboService.comboFile(combo, "Vanilla")).headers[0].range).toBe(25);
  });

  it("targets the caster when the combo is self-targeted", () => {
    vi.spyOn(spellComboService, "isSelf").mockReturnValue(true);
    const file = spellComboService.comboFile(SEQUENCERS.MagicMissiles, "Vanilla");
    expect(splOf(file).headers[0].target).toBe(ItemAbilityTargetEnum.Caster);
  });

  it("sets up a self contingency that casts a wrapper SPL on its condition", () => {
    vi.spyOn(spellComboService, "isSelf").mockReturnValue(true);
    const combo: SpellCombo = {
      key: "TestSelf",
      kind: "contingency",
      condition: "hp25",
      spells: [w.Stoneskin],
    };
    const setUp = splOf(spellComboService.comboFile(combo, "Vanilla"));
    expect(setUp.name).toBe("ability.Contingency");
    expect(setUp.headers[0].target).toBe(ItemAbilityTargetEnum.Caster);
    const conditions = effectsOf(setUp, EffectTypeEnum.CastSpellOnCondition);
    expect(conditions).toHaveLength(1);
    // a recast replaces a still pending contingency: its first effect removes the previous ones
    const first = setUp.headers[0].effects[0];
    expect(first.opcode).toBe(EffectTypeEnum.RemoveEffectsByResource);
    expect(first.resource).toBe(setUp.file);
    expect(setUp.headers[0].effects[1]).toBe(conditions[0]);
    expect(conditions[0].parameter2).toBe("3");
    expect(effectsOf(setUp, EffectTypeEnum.CastSpell)).toHaveLength(0);
    const wrapper = splOf(conditions[0].resource ?? "");
    expect(wrapper.file).not.toBe(setUp.file);
    expect(castResources(wrapper)).toEqual(["SPWI408"]);
    // the engine keeps the trigger after it fires: the release removes it, so it fires once
    const [release] = wrapper.headers[0].effects;
    expect(release.opcode).toBe(EffectTypeEnum.RemoveEffectsByResource);
    expect(release.resource).toBe(setUp.file);
    expect(release.target).toBe(EffectTargetEnum.Self);
    // silent: its spells' names show when it fires
    expect(effectsOf(setUp, EffectTypeEnum.DisplayString)).toHaveLength(0);
    expect(effectsOf(wrapper, EffectTypeEnum.DisplayString)).toHaveLength(0);
  });

  it("sets up an enemy contingency the same way, aimed at its target", () => {
    const combo: SpellCombo = {
      key: "TestChain",
      kind: "chainContingency",
      condition: "seeEnemy",
      target: "nearestEnemy",
      spells: [w.MagicMissiles, w.MagicMissiles],
    };
    const setUp = splOf(spellComboService.comboFile(combo, "Vanilla"));
    expect(setUp.name).toBe("ability.ChainContingency");
    expect(setUp.headers[0].target).toBe(ItemAbilityTargetEnum.Caster);
    expect(castResources(setUp)).toEqual([]);
    const [condition] = effectsOf(setUp, EffectTypeEnum.CastSpellOnCondition);
    expect(condition.parameter1).toBe(String(CastSpellOnConditionTargetEnum.NearestEnemy));
    const wrapper = splOf(condition.resource ?? "");
    expect(wrapper.headers[0].target).toBe(ItemAbilityTargetEnum.LivingActor);
    expect(effectsOf(wrapper, EffectTypeEnum.RemoveEffectsByResource)[0].resource).toBe(setUp.file);
    expect(castResources(wrapper)).toEqual(["SPWI112", "SPWI112"]);
  });
});

describe("spell protections", () => {
  it.each([
    ["a sequencer", SEQUENCERS.MagicMissiles, false],
    [
      "a self contingency",
      {
        key: "TestPower",
        kind: "contingency",
        condition: "hit",
        spells: [w.Stoneskin],
      } as SpellCombo,
      true,
    ],
  ])("makes %s an innate level 1 SPL of power 0", (_, combo, self) => {
    vi.spyOn(spellComboService, "isSelf").mockReturnValue(self);
    spellComboService.comboFile(combo, "Vanilla");
    for (const spell of spellComboService.allSpells()) {
      expect(spell.level).toBe(1);
      expect(spell.power).toBe(0);
      for (const effect of spell.headers.flatMap((h) => h.effects)) {
        expect(effect.power ?? 0).toBe(0);
      }
    }
  });
});

describe("allSpells", () => {
  it("contains each generated SPL once, built once", () => {
    const combo: SpellCombo = {
      key: "TestAll",
      kind: "contingency",
      condition: "hit",
      spells: [w.Stoneskin],
    };
    const registry = spellComboService.allSpells().length;
    spellComboService.comboFile(combo, "Vanilla");
    spellComboService.comboFile(combo, "AllSpellMods");
    spellComboService.comboFile(SEQUENCERS.MagicMissiles, "Vanilla");
    const files = spellComboService.allSpells().map((s) => s.file);
    expect(new Set(files).size).toBe(files.length);
    // the registry's + the set-up and wrapper of the test contingency
    expect(files).toHaveLength(registry + 2);
    expect(spellComboService.allSpells()[0]).toBe(spellComboService.allSpells()[0]);
  });
});

describe("labelOf", () => {
  it("names a combo SPL by its kind and key", () => {
    const file = spellComboService.comboFile(SEQUENCERS.MagicMissiles, "Vanilla");
    expect(spellComboService.labelOf(file.toUpperCase())).toBe("Minor Sequencer (Magic Missiles)");
    expect(spellComboService.labelOf("SPWI112")).toBeUndefined();
  });

  it("names a self contingency's wrapper too", () => {
    vi.spyOn(spellComboService, "isSelf").mockReturnValue(true);
    const combo: SpellCombo = {
      key: "TestStoneskinOnHit",
      kind: "chainContingency",
      condition: "hit",
      spells: [w.Stoneskin],
    };
    const setUp = splOf(spellComboService.comboFile(combo, "Vanilla"));
    const wrapper = effectsOf(setUp, EffectTypeEnum.CastSpellOnCondition)[0].resource ?? "";
    expect(spellComboService.labelOf(setUp.file)).toBe("Chain Contingency (Test Stoneskin On Hit)");
    expect(spellComboService.labelOf(wrapper)).toBe("Chain Contingency (Test Stoneskin On Hit)");
  });
});

describe("comboOfFile", () => {
  it("finds the combo a memorized SPL belongs to", () => {
    const file = spellComboService.comboFile(SEQUENCERS.MagicMissiles, "Vanilla");
    expect(spellComboService.comboOfFile(file.toUpperCase())).toBe(SEQUENCERS.MagicMissiles);
    expect(spellComboService.comboOfFile("SPWI112")).toBeUndefined();
  });

  it("names the registry first", () => {
    const file = spellComboService.comboFile(SEQUENCERS.MagicMissiles, "Vanilla");
    spellComboService.reset();
    expect(spellComboService.comboOfFile(file)).toBe(SEQUENCERS.MagicMissiles);
  });
});

const comboOf = (spells: SpellCombo["spells"]): SpellCombo => ({
  key: "TestTargets",
  kind: "spellSequencer",
  spells,
});

describe("isSelf", () => {
  it.each([
    ["targets only the caster and its allies", w.ImprovedInvisibility],
    ["has no targets", w.Stoneskin],
  ])("is true when the spell %s", (_, spell) => {
    expect(spellComboService.isSelf(comboOf([spell]))).toBe(true);
  });

  it.each([w.MagicMissiles, w.Horror])("is false for an enemy spell", (spell) => {
    expect(spellComboService.isSelf(comboOf([spell]))).toBe(false);
  });

  it("throws for a spell without preset", () => {
    expect(() => spellComboService.isSelf(comboOf([{ file: "SPWX001" }]))).toThrow(
      "Spell combo TestTargets: no preset for spell SPWX001",
    );
  });
});

describe("checkTargets", () => {
  it("lets a contingency aim an anySide spell at its caster", () => {
    const combo = { key: "TestAnySide", ...contingency("helpless", [w.OtilukesResilientSphere]) };
    expect(() => spellComboService.checkTargets(combo)).not.toThrow();
  });

  it("still refuses an enemy spell in a contingency aimed at its caster", () => {
    const combo = { key: "TestEnemy", ...contingency("helpless", [w.Horror]) };
    expect(() => spellComboService.checkTargets(combo)).toThrow(
      "Spell combo TestEnemy: its target self doesn't suit its enemy spells",
    );
  });

  it("throws when a combo mixes self and enemy spells", () => {
    const combo = { key: "TestMixed", ...minorSequencer([w.Shield, w.Horror]) };
    expect(() => spellComboService.checkTargets(combo)).toThrow(
      "Spell combo TestMixed mixes self and enemy spells",
    );
  });

  it("warns when enemy spells have different target lists", () => {
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    const combo = { key: "TestLists", ...spellSequencer([w.Slow, w.Contagion, w.Horror]) };
    spellComboService.checkTargets(combo);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("TestLists");
  });

  it("stays silent for a repeated spell", () => {
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    spellComboService.checkTargets(SEQUENCERS.MagicMissiles);
    expect(warn).not.toHaveBeenCalled();
  });

  it("accepts an enemy contingency on helpless: the engine fires it", () => {
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    spellComboService.checkTargets({
      key: "TestHelpless",
      kind: "chainContingency",
      condition: "helpless",
      target: "nearestEnemy",
      spells: [w.Horror],
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("throws for enemy spells in a contingency aimed at the caster", () => {
    expect(() =>
      spellComboService.checkTargets({
        key: "TestEnemyAtSelf",
        kind: "contingency",
        condition: "hit",
        spells: [w.Horror],
      }),
    ).toThrow(/TestEnemyAtSelf.*self.*enemy/);
  });

  it("throws for a plain contingency aimed at an enemy: only a chain can be", () => {
    expect(() =>
      spellComboService.checkTargets({
        key: "TestPlainAtEnemy",
        kind: "contingency",
        condition: "hit",
        target: "nearestEnemy",
        spells: [w.Horror],
      }),
    ).toThrow(/TestPlainAtEnemy.*only target the caster/);
  });

  it("throws for self spells in a chain contingency aimed at an enemy", () => {
    expect(() =>
      spellComboService.checkTargets({
        key: "TestSelfAtEnemy",
        kind: "chainContingency",
        condition: "hit",
        target: "nearestEnemy",
        spells: [w.Stoneskin],
      }),
    ).toThrow(/TestSelfAtEnemy.*nearestEnemy.*self/);
  });

  it("warns for a last hitter on another condition than hit: nobody may have hit it", () => {
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    const combo: SpellCombo = {
      key: "TestLastHitter",
      kind: "chainContingency",
      condition: "hp50",
      target: "lastHitter",
      spells: [w.Horror],
    };
    spellComboService.checkTargets(combo);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockClear();
    spellComboService.checkTargets({ ...combo, condition: "hit" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent for a self contingency on helpless: the engine fires it", () => {
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    spellComboService.checkTargets({
      key: "TestSelfHelpless",
      kind: "contingency",
      condition: "helpless",
      spells: [w.Stoneskin],
    });
    expect(warn).not.toHaveBeenCalled();
  });
});

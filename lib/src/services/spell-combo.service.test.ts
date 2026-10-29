import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEQUENCERS } from "../../config/spells/spell-combos";
import { SPELLS } from "../../config/spells/spell-database";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import { ItemAbilityTargetEnum } from "../model/spell-item/effect.enums";
import { SpellCombo } from "../model/spell-item/spell-combo";
import { Spell } from "../model/spell-item/spell-item";
import spellComboService from "./spell-combo.service";

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
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("comboFile", () => {
  it("names a registry combo in the common scope, shared by mods with the same content", () => {
    const file = spellComboService.comboFile(SEQUENCERS.DoubleMagicMissiles, "Vanilla");
    expect(file).toMatch(/^jasc01[0-9a-z]{2}$/);
    expect(spellComboService.comboFile(SEQUENCERS.DoubleMagicMissiles, "AllSpellMods")).toBe(file);
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

describe("generated SPLs", () => {
  it("casts a sequencer's spells instantly, in order, at its smallest range", () => {
    const file = spellComboService.comboFile(SEQUENCERS.DoubleMagicMissiles, "Vanilla");
    const spell = splOf(file);
    expect(spell.name).toBe("ability.MinorSequencer");
    expect(spell.level).toBe(1);
    expect(spell.headers).toHaveLength(1);
    expect(castResources(spell)).toEqual(["SPWI112", "SPWI112"]);
    expect(spell.headers[0].target).toBe(ItemAbilityTargetEnum.LivingActor);
    expect(spell.headers[0].range).toBe(30);
  });

  it("uses the smallest range among the contained spells", () => {
    const combo: SpellCombo = {
      key: "TestRange",
      kind: "minorSequencer",
      spells: [
        { ...w.MagicMissiles, range: 40 },
        { ...w.MagicMissiles, file: "SPWX001", range: 25 },
      ],
    };
    expect(splOf(spellComboService.comboFile(combo, "Vanilla")).headers[0].range).toBe(25);
  });

  it("targets the caster when the combo is self-targeted", () => {
    vi.spyOn(spellComboService, "isSelf").mockReturnValue(true);
    const file = spellComboService.comboFile(SEQUENCERS.DoubleMagicMissiles, "Vanilla");
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
    expect(conditions[0].parameter2).toBe("3");
    expect(effectsOf(setUp, EffectTypeEnum.CastSpell)).toHaveLength(0);
    const wrapper = splOf(conditions[0].resource ?? "");
    expect(wrapper.file).not.toBe(setUp.file);
    expect(castResources(wrapper)).toEqual(["SPWI408"]);
  });

  it("makes an enemy contingency a single casting SPL", () => {
    const combo: SpellCombo = {
      key: "TestChain",
      kind: "chainContingency",
      condition: "seeEnemy",
      spells: [w.MagicMissiles, w.MagicMissiles],
    };
    const file = spellComboService.comboFile(combo, "Vanilla");
    const spell = splOf(file);
    expect(spell.name).toBe("ability.ChainContingency");
    expect(castResources(spell)).toEqual(["SPWI112", "SPWI112"]);
    expect(effectsOf(spell, EffectTypeEnum.CastSpellOnCondition)).toHaveLength(0);
    expect(spellComboService.allSpells().filter((s) => s.file !== file)).toHaveLength(1);
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
    vi.spyOn(spellComboService, "isSelf").mockReturnValue(true);
    spellComboService.comboFile(combo, "Vanilla");
    spellComboService.comboFile(combo, "AllSpellMods");
    spellComboService.comboFile(SEQUENCERS.DoubleMagicMissiles, "Vanilla");
    const files = spellComboService.allSpells().map((s) => s.file);
    expect(new Set(files).size).toBe(files.length);
    // the registry's sequencer + the set-up and wrapper of the test contingency
    expect(files).toHaveLength(3);
    expect(spellComboService.allSpells()[0]).toBe(spellComboService.allSpells()[0]);
  });
});

describe("comboOfFile", () => {
  it("finds the combo a memorized SPL belongs to", () => {
    const file = spellComboService.comboFile(SEQUENCERS.DoubleMagicMissiles, "Vanilla");
    expect(spellComboService.comboOfFile(file.toUpperCase())).toBe(SEQUENCERS.DoubleMagicMissiles);
    expect(spellComboService.comboOfFile("SPWI112")).toBeUndefined();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ABILITY_PRESETS } from "../../config/ability-presets";
import { MOD_LAYER_ORDER } from "../../config/mods";
import { SPELLS } from "../../config/spells/spell-database";
import { ScriptTarget } from "../model/constants";
import { SpellCombo } from "../model/spell-item/spell-combo";
import { mergeSaves, SpellReference } from "../model/spell-item/spell-reference";
import spellComboService from "../services/spell-combo.service";
import presetFactory from "./preset.factory";
import logService from "../services/log.service";
import { RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";
import { Triggers } from "../model/script/triggers";

const DEFAULT_ABILITY_NAME = "ability.unknown";

describe("createSpell", () => {
  it("copies the spell's range onto the resulting ability", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.BurningHands, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.range).toBe(SPELLS.Wizard.BurningHands.range);
  });

  it("leaves range unset when the spell has none", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.Domination, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.range).toBeUndefined();
  });

  it("keeps the override's own range instead of the spell's", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.BurningHands, {
      name: DEFAULT_ABILITY_NAME,
      range: 30,
    });
    expect(result.ability.range).toBe(30);
  });

  it("copies the spell's own state checks onto the resulting ability's spell", () => {
    const spell: SpellReference = {
      file: "SPWI999",
      includeStateChecks: ["STATE_BLESS"],
      excludeStateChecks: ["STATE_INVISIBLE"],
      excludeSpellStates: ["STONESKIN"],
    };
    const [result] = presetFactory.createSpell(spell, { name: DEFAULT_ABILITY_NAME });
    expect(result.ability.spell?.includeStateChecks).toEqual(["STATE_BLESS"]);
    expect(result.ability.spell?.excludeStateChecks).toEqual(["STATE_INVISIBLE"]);
    expect(result.ability.spell?.excludeSpellStates).toEqual(["STONESKIN"]);
  });

  it("accumulates the override's own exclusion checks alongside the spell's, rather than replacing them", () => {
    const spell: SpellReference = { file: "SPWI999", excludeStateChecks: ["STATE_INVISIBLE"] };
    const [result] = presetFactory.createSpell(spell, {
      name: DEFAULT_ABILITY_NAME,
      spell: { excludeStateChecks: ["STATE_SLEEPING"] },
    });
    expect(result.ability.spell?.excludeStateChecks).toEqual(["STATE_INVISIBLE", "STATE_SLEEPING"]);
  });

  it("leaves the spell's state-check fields unset when the spell has none", () => {
    const [result] = presetFactory.createSpell(SPELLS.Wizard.BurningHands, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.spell?.includeStateChecks).toBeUndefined();
    expect(result.ability.spell?.excludeStateChecks).toBeUndefined();
    expect(result.ability.spell?.excludeSpellStates).toBeUndefined();
  });

  it("emits one preset per mod variant file, sharing the same ability", () => {
    const results = presetFactory.createSpell(SPELLS.Priest.PhysicalMirror, {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(results.map((r) => r.preset)).toEqual(["SPPR613", "SPPR531"]);
    expect(results[1].ability).toEqual(results[0].ability);
  });
});

describe("createSpells", () => {
  it("copies each spell's own range onto its resulting ability", () => {
    const spells: SpellReference[] = [SPELLS.Wizard.BurningHands, SPELLS.Wizard.Domination];
    const [withRange, withoutRange] = presetFactory.createSpells(spells, {});
    expect(withRange.ability.range).toBe(SPELLS.Wizard.BurningHands.range);
    expect(withoutRange.ability.range).toBeUndefined();
  });
});

describe("createCombos", () => {
  const w = SPELLS.Wizard;

  beforeEach(() => {
    spellComboService.usePresets(ABILITY_PRESETS);
  });

  const comboPreset = (combo: SpellCombo) => {
    const presets = presetFactory.createCombos([combo], ABILITY_PRESETS);
    const preset = presets.find((p) => p.preset === spellComboService.comboFile(combo, "Vanilla"));
    if (!preset) throw new Error(`no preset for ${combo.key}`);
    return preset.ability;
  };

  it("casts an enemy combo at its first spell's targets, with every spell's checks", () => {
    const ability = comboPreset({
      key: "TestSlowHorror",
      kind: "spellSequencer",
      spells: [w.Slow, w.Horror],
    });
    const slow = ABILITY_PRESETS.find((p) => p.preset === w.Slow.file)?.ability;
    expect(ability.targets).toEqual(slow?.targets);
    expect(ability.level).toBe(3);
    expect(ability.keywords).toEqual(
      expect.arrayContaining([...(w.Slow.keywords ?? []), ...(w.Horror.keywords ?? [])]),
    );
    expect(ability.saves).toEqual(mergeSaves([...(w.Slow.saves ?? []), ...(w.Horror.saves ?? [])]));
    expect(ability.spell).toMatchObject({ type: "force", remove: true });
    expect(ability.spell?.castOnSelf).toBeUndefined();
    expect(ability.spellcasting).toBe(true);
    expect(ability.requireVocal).toBe(false);
  });

  it("gives an enemy combo its SPL's range: its spells' smallest one, 30 when none sets one", () => {
    const ranged = comboPreset({
      key: "TestBurningSpray",
      kind: "minorSequencer",
      spells: [w.BurningHands, w.ColorSpray],
    });
    expect(ranged.range).toBe(10);
    const unranged = comboPreset({
      key: "TestHorrorHorror",
      kind: "minorSequencer",
      spells: [w.Horror, w.Horror],
    });
    expect(unranged.range).toBe(30);
  });

  it("casts a self sequencer at the caster", () => {
    const ability = comboPreset({
      key: "TestSelfSequencer",
      kind: "minorSequencer",
      spells: [w.Shield, w.Blur],
    });
    expect(ability.targets).toBeUndefined();
    expect(ability.spell).toMatchObject({ castOnSelf: true, type: "force", remove: true });
  });

  describe("contained spells' checks", () => {
    const enemyTargets = [{ name: "NearestEnemyOf" }];
    const fake = (file: string): SpellReference => ({ file, level: 1, name: "ability.unknown" });
    const a = fake("TESTCK1");
    const b = fake("TESTCK2");
    const presetsWith = (
      abilityA: Partial<RawCreatureAbility>,
      abilityB: Partial<RawCreatureAbility>,
    ): AbilityPreset[] => [
      ...ABILITY_PRESETS,
      { preset: a.file, ability: { targets: enemyTargets, triggers: [], ...abilityA } },
      { preset: b.file, ability: { targets: enemyTargets, triggers: [], ...abilityB } },
    ];
    const build = (key: string, presets: AbilityPreset[], self = false) => {
      spellComboService.usePresets(presets);
      const combo: SpellCombo = { key, kind: "minorSequencer", spells: [a, b] };
      if (self) vi.spyOn(spellComboService, "isSelf").mockReturnValue(true);
      const [preset] = presetFactory.createCombos([combo], presets);
      vi.restoreAllMocks();
      return preset.ability;
    };

    it.each([false, true])("unions their spell checks (self: %s)", (self) => {
      const ability = build(
        `TestChecks${String(self)}`,
        presetsWith(
          {
            spell: {
              includeStateChecks: ["STATE_BLESS"],
              excludeStateChecks: ["STATE_BLIND", "STATE_SLOWED"],
              excludeSpellStates: ["DEAF"],
            },
          },
          {
            spell: {
              excludeStateChecks: ["STATE_SLOWED", "STATE_SILENCED"],
              excludeStatsChecks: ["STONESKINS"],
            },
          },
        ),
        self,
      );
      expect(ability.spell).toMatchObject({
        includeStateChecks: ["STATE_BLESS"],
        excludeStateChecks: ["STATE_BLIND", "STATE_SLOWED", "STATE_SILENCED"],
        excludeSpellStates: ["DEAF"],
        excludeStatsChecks: ["STONESKINS"],
      });
    });

    it("appends their preset triggers once, without memorization ones", () => {
      const hp = { name: "HPPercentLT", params: [ScriptTarget.myself, 75] } as Triggers.Trigger;
      const silenced: Triggers.Trigger = {
        name: "StateCheck",
        params: [ScriptTarget.myself, "STATE_SILENCED"],
        negation: true,
      };
      const memorization = build(
        "TestTriggersMemorization",
        presetsWith(
          { triggers: [hp, { name: "HaveSpellRES", params: ["SPWI112"], negation: true }] },
          {},
        ),
      );
      expect(memorization.triggers).toEqual([hp]);
      const sequencer = build(
        "TestTriggersSequencer",
        presetsWith({ triggers: [hp] }, { triggers: [hp, silenced] }),
      );
      expect(sequencer.triggers).toEqual([hp, silenced]);
    });

    it.each([
      ["a False trigger", [{ name: "False" }], []],
      [
        "a trigger and its negation",
        [{ name: "StateCheck", params: [ScriptTarget.myself, "STATE_SILENCED"] }],
        [{ name: "StateCheck", params: [ScriptTarget.myself, "STATE_SILENCED"], negation: true }],
      ],
    ])("leaves the preset triggers out, with a warning, when they hold %s", (_, ta, tb) => {
      const warn = vi.spyOn(logService, "warn").mockImplementation(() => {});
      const presets = presetsWith(
        { triggers: ta as Triggers.Trigger[] },
        { triggers: tb as Triggers.Trigger[] },
      );
      spellComboService.usePresets(presets);
      const combo: SpellCombo = { key: "TestNeverHold", kind: "minorSequencer", spells: [a, b] };
      const [preset] = presetFactory.createCombos([combo], presets);
      expect(preset.ability.triggers).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("TestNeverHold"));
      warn.mockRestore();
    });
  });

  it("gives no preset to an enemy contingency: the engine fires it", () => {
    const combo: SpellCombo = {
      key: "TestEnemyContingency",
      kind: "chainContingency",
      condition: "hp25",
      target: "nearestEnemy",
      spells: [w.Horror],
    };
    expect(presetFactory.createCombos([combo], ABILITY_PRESETS)).toEqual([]);
  });

  it("gives no preset to a self contingency", () => {
    const combo: SpellCombo = {
      key: "TestSelfContingency",
      kind: "contingency",
      condition: "hit",
      spells: [w.Stoneskin],
    };
    expect(presetFactory.createCombos([combo], ABILITY_PRESETS)).toEqual([]);
  });

  it("gives one preset per generated file across mods", () => {
    const missile = {
      ...w.MagicMissiles,
      variants: [{ mod: "AllSpellMods" as const, file: "SPWX112" }],
    };
    const presets = [
      ...ABILITY_PRESETS,
      {
        preset: "SPWX112",
        ability: structuredClone(ABILITY_PRESETS.find((p) => p.preset === "SPWI112")!.ability),
      },
    ];
    const combo: SpellCombo = {
      key: "TestCombosVariant",
      kind: "minorSequencer",
      spells: [missile, missile],
    };
    const files = presetFactory.createCombos([combo], presets).map((p) => p.preset);
    const expected = new Set(MOD_LAYER_ORDER.map((mod) => spellComboService.comboFile(combo, mod)));
    expect(files).toEqual([...expected]);
    expect(files).toHaveLength(2);
  });
});

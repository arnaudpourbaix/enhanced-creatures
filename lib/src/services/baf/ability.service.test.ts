import { afterEach, describe, expect, it, vi } from "vitest";
import { ABILITY_PRESETS } from "../../../config/ability-presets";
import { PRESET_NAMES } from "../../../config/common";
import { GLOBAL_CONFIG } from "../../../config/generate";
import { SPELL_CHECK_TRIGGERS } from "../../../config/spells/spell-check";
import { SPELLS } from "../../../config/spells/spell-database";
import { RawCreatureAbility } from "../../model/creature/ability";
import { SpellIdentifier } from "../../model/ids/spell";
import { Triggers } from "../../model/script/triggers";
import abilityService from "./ability.service";

interface AbilityServicePrivate {
  applyPreset(ability: RawCreatureAbility, presetName: string): RawCreatureAbility;
}

const service = abilityService as unknown as AbilityServicePrivate;

const SPWI001 = "SPWI001" as SpellIdentifier;
const SPWI002 = "SPWI002" as SpellIdentifier;
// The real default name abilityService falls back to when none is given - reused across many
// independent test cases below that don't set an explicit name.
const DEFAULT_ABILITY_NAME = "ability.unknown";

describe("getAbilities", () => {
  it("returns an empty array when abilities is undefined", () => {
    expect(abilityService.getAbilities(undefined)).toEqual([]);
  });

  it("fills in default flags and pulls actionsBefore/actionsAfter into actions", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        actionsBefore: [{ name: "SetGlobal", params: ["A", "LOCALS", 1] }],
        actionsAfter: [{ name: "SetGlobal", params: ["B", "LOCALS", 1] }],
      },
    ]);
    expect(ability.infiniteUse).toBe(false);
    expect(ability.requireVocal).toBe(false);
    expect(ability.disableInterrupt).toBe(false);
    expect(ability.canUseWhenPolymorphed).toBe(false);
    expect(ability.isSpell).toBe(false);
    expect(ability.targets).toEqual([]);
    expect(ability.triggers).toEqual([]);
    expect(ability.actions).toEqual([
      { name: "SetGlobal", params: ["A", "LOCALS", 1] },
      { name: "SetGlobal", params: ["B", "LOCALS", 1] },
    ]);
  });

  it("defaults name to 'ability.unknown' when omitted", () => {
    const [ability] = abilityService.getAbilities([{ actionsBefore: [], actionsAfter: [] }]);
    expect(ability.name).toBe(DEFAULT_ABILITY_NAME);
  });

  it("wraps a single non-array target into a one-element target list", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        targets: { name: "Players" } as unknown as RawCreatureAbility["targets"],
      },
    ]);
    expect(ability.targets).toEqual([{ name: "Players" }]);
  });

  it("preserves explicit overrides instead of the defaults", () => {
    const [ability] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, requireVocal: true, disableInterrupt: true },
    ]);
    expect(ability.requireVocal).toBe(true);
    expect(ability.disableInterrupt).toBe(true);
  });

  it("adds a RandomNumGT trigger when probability is below 100", () => {
    const [ability] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, probability: 50 },
    ]);
    expect(ability.triggers).toHaveLength(1);
    expect(ability.triggers[0].name).toBe("RandomNumGT");
  });

  it("does not add a probability trigger when probability is 100 or unset", () => {
    const [withHundred] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, probability: 100 },
    ]);
    const [withNone] = abilityService.getAbilities([{ name: DEFAULT_ABILITY_NAME }]);
    expect(withHundred.triggers).toEqual([]);
    expect(withNone.triggers).toEqual([]);
  });

  it("assigns increasing RandomNumGT global ids across multiple probabilistic abilities", () => {
    const abilities = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, probability: 50 },
      { name: DEFAULT_ABILITY_NAME, probability: 30 },
    ]);
    const [firstNum] = (abilities[0].triggers[0] as Triggers.RandomNumGT).params;
    const [secondNum] = (abilities[1].triggers[0] as Triggers.RandomNumGT).params;
    expect(secondNum).toBeGreaterThan(firstNum);
  });
});

describe("getAbilities - single spell", () => {
  it("builds a Spell action targeting LastSeenBy by default (selfTarget not set)", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: { id: SPWI001, memorizedSpellCheck: false },
      },
    ]);
    expect(ability.isSpell).toBe(true);
    expect(ability.actions).toEqual([{ name: "Spell", params: ["LastSeenBy", "SPWI001"] }]);
  });

  it("targets Myself when the spell has castOnSelf set", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: {
          id: SPWI001,
          memorizedSpellCheck: false,
          castOnSelf: true,
        },
      },
    ]);
    expect(ability.actions).toEqual([{ name: "Spell", params: ["Myself", "SPWI001"] }]);
  });

  it("targets LastSeenBy when the ability has targets and requires a memorized-spell check", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        targets: [{ name: "Players" }],
        spell: { id: SPWI001 },
      },
    ]);
    expect(ability.triggers[0]).toEqual({
      name: "HaveSpell",
      params: ["SPWI001"],
    });
    expect(ability.actions).toEqual([{ name: "Spell", params: ["LastSeenBy", "SPWI001"] }]);
  });

  it("throws when a spell has neither an id nor a resource", () => {
    expect(() => abilityService.getAbilities([{ name: DEFAULT_ABILITY_NAME, spell: {} }])).toThrow(
      /No spell specified for ability ability.unknown/,
    );
  });

  it("marks infiniteUse true for non-normal spell types that aren't removed", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: { id: SPWI001, type: "force" },
      },
    ]);
    expect(ability.infiniteUse).toBe(true);
  });

  it("marks infiniteUse false when spell.type is left unset (defaults to 'normal')", () => {
    // Regression test: infiniteUse must be computed against the *defaulted* type, not the raw
    // (possibly-undefined) input - checking before the `spell.type ??= "normal"` default made
    // every type-less spell (the common case) register as infiniteUse: true.
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: { id: SPWI001 },
      },
    ]);
    expect(ability.infiniteUse).toBe(false);
  });

  it("casts at the spell's explicit targetName instead of the default LastSeenBy/Myself target", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: { id: SPWI001, type: "force", targetName: "RR#TRAT" },
      },
    ]);
    expect(ability.actions).toContainEqual({
      name: "ForceSpell",
      params: ["RR#TRAT", "SPWI001"],
    });
  });

  it("casts a reallyForce-type spell by id via ReallyForceSpell", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: { id: SPWI001, type: "reallyForce" },
      },
    ]);
    expect(ability.actions).toContainEqual({
      name: "ReallyForceSpell",
      params: ["LastSeenBy", "SPWI001"],
    });
  });

  it("emits a RemoveSpell action when a non-normal spell is marked remove", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: { id: SPWI001, type: "force", remove: true },
      },
    ]);
    expect(ability.actions).toEqual([
      { name: "ForceSpell", params: ["LastSeenBy", "SPWI001"] },
      { name: "RemoveSpell", params: ["SPWI001"] },
    ]);
  });

  it("targets Myself when ability.keywords includes castOnSelf, without an explicit spell.castOnSelf", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        keywords: ["castOnSelf"],
        spell: { id: SPWI001, memorizedSpellCheck: false },
      },
    ]);
    expect(ability.actions).toEqual([{ name: "Spell", params: ["Myself", "SPWI001"] }]);
  });

  it("keeps an explicit spell.castOnSelf: false instead of the castOnSelf keyword", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        keywords: ["castOnSelf"],
        spell: { id: SPWI001, memorizedSpellCheck: false, castOnSelf: false },
      },
    ]);
    expect(ability.actions).toEqual([{ name: "Spell", params: ["LastSeenBy", "SPWI001"] }]);
  });

  it("adds negated exclude-state/stat/spellstate checks as triggers", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: {
          id: SPWI001,
          memorizedSpellCheck: false,
          excludeStateChecks: ["STATE_SILENCED"],
          excludeStatsChecks: ["STR"],
          excludeSpellStates: ["some_spellstate"],
        },
      },
    ]);
    expect(ability.triggers).toEqual([
      { name: "StateCheck", params: ["Myself", "STATE_SILENCED"], negation: true },
      { name: "CheckStatGT", params: ["Myself", 0, "STR"], negation: true },
      { name: "CheckSpellState", params: ["Myself", "some_spellstate"], negation: true },
    ]);
  });
});

describe("getAbilities - multi-spell (spells array)", () => {
  it("marks isSpell true and emits one Spell action per spell", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spells: [
          { id: SPWI001, type: "normal" },
          { id: SPWI002, type: "normal" },
        ],
      } as unknown as RawCreatureAbility,
    ]);
    expect(ability.isSpell).toBe(true);
    expect(ability.infiniteUse).toBe(false);
    expect(ability.actions).toEqual([
      { name: "Spell", params: ["LastSeenBy", "SPWI001"] },
      { name: "Spell", params: ["LastSeenBy", "SPWI002"] },
    ]);
  });

  it("throws when spells mix castOnSelf true and false", () => {
    expect(() =>
      abilityService.getAbilities([
        {
          name: DEFAULT_ABILITY_NAME,
          spells: [
            { id: SPWI001, castOnSelf: true },
            { id: SPWI002, castOnSelf: false },
          ],
        } as unknown as RawCreatureAbility,
      ]),
    ).toThrow(/Every spells must have the same target in ability ability.unknown/);
  });

  it("targets Myself for every spell when ability.keywords includes castOnSelf", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        keywords: ["castOnSelf"],
        spells: [
          { id: SPWI001, type: "normal" },
          { id: SPWI002, type: "normal" },
        ],
      } as unknown as RawCreatureAbility,
    ]);
    expect(ability.actions).toEqual([
      { name: "Spell", params: ["Myself", "SPWI001"] },
      { name: "Spell", params: ["Myself", "SPWI002"] },
    ]);
  });

  it("casts an individual spell at its explicit targetName instead of the default target", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spells: [{ id: SPWI001, type: "normal", targetName: "RR#TRAT" }],
      } as unknown as RawCreatureAbility,
    ]);
    expect(ability.actions).toContainEqual({
      name: "Spell",
      params: ["RR#TRAT", "SPWI001"],
    });
  });

  it("throws for an unrecognized spell.id/type combination (unlike the single-spell path, the spells array never defaults a missing type to 'normal')", () => {
    expect(() =>
      abilityService.getAbilities([
        {
          name: DEFAULT_ABILITY_NAME,
          spells: [{ id: SPWI001 }],
        } as unknown as RawCreatureAbility,
      ]),
    ).toThrow(/getSpellAction: unexpected combination/);
  });
});

describe("getAbilities - preset id/resource conflict resolution (applyPreset)", () => {
  it("drops the preset's spell.id when the override supplies spell.resource, so the have-spell trigger matches the resource actually cast", () => {
    const [ability] = abilityService.getAbilities([
      {
        preset: PRESET_NAMES.DimensionDoorOffscreen,
        spell: { resource: "MISC7F" },
      },
    ]);
    // Before the fix, the merged spell kept BOTH the preset's id and the
    // override's resource: getSpellAction() always casts via the resource
    // (it checks `spell.resource` before `spell.id`), but the "have spell"
    // trigger checked spell.id first and would have emitted HaveSpell(id)
    // instead of HaveSpellRES(resource) - an incoherent, mismatched pair.
    expect(ability.resource).toBe("MISC7F");
    expect(ability.actions).toContainEqual({
      name: "SpellRES",
      params: ["MISC7F", "RR#TRAT"],
    });
    expect(ability.triggers).toContainEqual({
      name: "HaveSpellRES",
      params: ["MISC7F"],
    });
    expect(ability.triggers.some((t) => t.name === "HaveSpell")).toBe(false);
  });

  it("leaves the preset's own spell.resource untouched when the override sets neither id nor resource", () => {
    const [ability] = abilityService.getAbilities([
      {
        preset: PRESET_NAMES.DimensionDoorOffscreen,
        spell: { memorizedSpellCheck: false },
      },
    ]);
    expect(ability.actions).toContainEqual({
      name: "SpellRES",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest's asymmetric matchers are typed `any`
      params: expect.arrayContaining(["RR#TRAT"]),
    });
  });

  it("drops the preset's spell.resource when the override supplies spell.id (mirror of the resource-drops-id case; no real preset currently sets spell.resource)", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_RESOURCE_PRESET",
      ability: { name: DEFAULT_ABILITY_NAME, spell: { resource: "MISC7F" } },
    });
    try {
      const [ability] = abilityService.getAbilities([
        {
          preset: "JA#TEST_RESOURCE_PRESET",
          spell: { id: SPWI001 },
        },
      ]);
      expect(ability.actions).toContainEqual({
        name: "Spell",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest's asymmetric matchers are typed `any`
        params: expect.arrayContaining(["SPWI001"]),
      });
      expect(
        ability.actions.some((a) => "params" in a && (a.params as unknown[]).includes("MISC7F")),
      ).toBe(false);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("applyPreset - auto-resolves keywords from SPELLS", () => {
  // SPELLS.Wizard.Domination is a real, plain-literal preset (not built via PresetFactory.create)
  // that deliberately sets no `keywords` field of its own, so it only gets them through
  // applyPreset's own SPELLS lookup fallback - a clean real-world case for that fallback.
  it("resolves keywords from the preset name when neither the preset nor the override set them", () => {
    const result = service.applyPreset({}, SPELLS.Wizard.Domination.file);
    expect(result.keywords).toEqual(SPELLS.Wizard.Domination.keywords);
  });

  it("keeps the override's own keywords instead of resolving from the preset name", () => {
    const result = service.applyPreset({ keywords: ["poison"] }, SPELLS.Wizard.Domination.file);
    expect(result.keywords).toEqual(["poison"]);
  });

  it("leaves keywords unset when the preset name matches no SPELLS entry", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_UNREGISTERED_PRESET",
      ability: { name: DEFAULT_ABILITY_NAME },
    });
    try {
      const result = service.applyPreset({}, "JA#TEST_UNREGISTERED_PRESET");
      expect(result.keywords).toBeUndefined();
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("applyPreset - auto-resolves level from SPELLS", () => {
  it("resolves level from the preset name when neither the preset nor the override set it", () => {
    const result = service.applyPreset({}, SPELLS.Wizard.Domination.file);
    expect(result.level).toBe(SPELLS.Wizard.Domination.level);
  });

  it("keeps the override's own level instead of resolving from the preset name", () => {
    const result = service.applyPreset({ level: 1 }, SPELLS.Wizard.Domination.file);
    expect(result.level).toBe(1);
  });

  it("leaves level unset when the preset name matches no SPELLS entry", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_UNREGISTERED_PRESET_LEVEL",
      ability: { name: DEFAULT_ABILITY_NAME },
    });
    try {
      const result = service.applyPreset({}, "JA#TEST_UNREGISTERED_PRESET_LEVEL");
      expect(result.level).toBeUndefined();
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("applyPreset - auto-resolves range from SPELLS", () => {
  // SPELLS.Wizard.BurningHands is a real preset (via createSpells, see damage-aoe-presets.ts)
  // that carries a `range` of its own, a clean real-world case for this fallback.
  it("resolves range from the preset name when neither the preset nor the override set it", () => {
    const result = service.applyPreset({}, SPELLS.Wizard.BurningHands.file);
    expect(result.range).toBe(SPELLS.Wizard.BurningHands.range);
  });

  it("keeps the override's own range instead of resolving from the preset name", () => {
    const result = service.applyPreset({ range: 1 }, SPELLS.Wizard.BurningHands.file);
    expect(result.range).toBe(1);
  });

  it("leaves range unset when the preset name matches no SPELLS entry", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_UNREGISTERED_PRESET_RANGE",
      ability: { name: DEFAULT_ABILITY_NAME },
    });
    try {
      const result = service.applyPreset({}, "JA#TEST_UNREGISTERED_PRESET_RANGE");
      expect(result.range).toBeUndefined();
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("applyPreset - auto-resolves excludeStateChecks from SPELLS", () => {
  // SPELLS.Wizard.Haste is a real, hand-written preset (see buff-presets.ts) that deliberately
  // sets no excludeStateChecks of its own, so it only gets them through applyPreset's own SPELLS
  // lookup fallback - a clean real-world case for that fallback.
  it("resolves excludeStateChecks from the preset name when neither the preset nor the override set them", () => {
    const result = service.applyPreset({}, SPELLS.Wizard.Haste.file);
    expect(result.spell?.excludeStateChecks).toEqual(SPELLS.Wizard.Haste.excludeStateChecks);
  });

  it("keeps the override's own excludeStateChecks instead of resolving from the preset name", () => {
    const result = service.applyPreset(
      { spell: { excludeStateChecks: ["STATE_SLOWED"] } },
      SPELLS.Wizard.Haste.file,
    );
    expect(result.spell?.excludeStateChecks).toEqual(["STATE_SLOWED"]);
  });

  it("leaves excludeStateChecks unset when the preset name matches no SPELLS entry", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_UNREGISTERED_PRESET_STATE",
      ability: { name: DEFAULT_ABILITY_NAME, spell: {} },
    });
    try {
      const result = service.applyPreset({}, "JA#TEST_UNREGISTERED_PRESET_STATE");
      expect(result.spell?.excludeStateChecks).toBeUndefined();
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("getAbilities - auto spellChecks via ability.keywords", () => {
  afterEach(() => {
    GLOBAL_CONFIG.spellChecks.stats = true;
  });

  it("appends the keyword's SPELL_CHECK_TRIGGERS to every target list", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_KEYWORDS_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        keywords: ["acid"],
        targets: [{ name: "Players" }, { name: "PCs", triggers: [{ name: "See", params: [] }] }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([{ preset: "JA#TEST_KEYWORDS_PRESET" }]);
      expect(ability.targets).toEqual([
        { name: "Players", triggers: [...SPELL_CHECK_TRIGGERS.acid] },
        {
          name: "PCs",
          triggers: [{ name: "See", params: [] }, ...SPELL_CHECK_TRIGGERS.acid],
        },
      ]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });

  it("leaves targets untouched when the ability has no keywords", () => {
    const [ability] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, targets: [{ name: "Players" }] },
    ]);
    expect(ability.targets).toEqual([{ name: "Players" }]);
  });

  it("respects GLOBAL_CONFIG.spellChecks - a disabled category drops the auto-appended trigger", () => {
    GLOBAL_CONFIG.spellChecks.stats = false;
    ABILITY_PRESETS.push({
      preset: "JA#TEST_KEYWORDS_DISABLED_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        keywords: ["acid"],
        targets: [{ name: "Players" }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([
        { preset: "JA#TEST_KEYWORDS_DISABLED_PRESET" },
      ]);
      expect(ability.targets).toEqual([{ name: "Players" }]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("getAbilities - auto spellChecks via TargetList.keywords", () => {
  afterEach(() => {
    GLOBAL_CONFIG.spellChecks.races = true;
  });

  it("appends a target list's own keyword checks in addition to the ability's shared ones", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_TARGET_KEYWORDS_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        keywords: ["acid"],
        targets: [{ name: "Players", keywords: ["elf"] }, { name: "PCs" }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([{ preset: "JA#TEST_TARGET_KEYWORDS_PRESET" }]);
      expect(ability.targets).toEqual([
        { name: "Players", triggers: [...SPELL_CHECK_TRIGGERS.acid, ...SPELL_CHECK_TRIGGERS.elf] },
        { name: "PCs", triggers: [...SPELL_CHECK_TRIGGERS.acid] },
      ]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });

  it("drops TargetList.keywords from the result - it's build-time input only", () => {
    const [ability] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, targets: [{ name: "Players", keywords: ["elf"] }] },
    ]);
    expect(ability.targets).toEqual([{ name: "Players", triggers: [...SPELL_CHECK_TRIGGERS.elf] }]);
  });

  it("respects GLOBAL_CONFIG.spellChecks.races - disabling it drops a target list's own race-driven check", () => {
    GLOBAL_CONFIG.spellChecks.races = false;
    const [ability] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, targets: [{ name: "Players", keywords: ["elf"] }] },
    ]);
    expect(ability.targets).toEqual([{ name: "Players" }]);
  });

  it("dedupes target lists that become identical once a tier-only check is disabled", () => {
    GLOBAL_CONFIG.spellChecks.races = false;
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        targets: [
          { name: "PCsFighters", keywords: ["elf", "halfElf"] },
          { name: "PCs", keywords: ["elf", "halfElf"] },
          { name: "PCsFighters", keywords: ["elf"] },
          { name: "PCs" },
        ],
      },
    ]);
    expect(ability.targets).toEqual([{ name: "PCsFighters" }, { name: "PCs" }]);
  });

  it("keeps tiers distinct when re-enabling GLOBAL_CONFIG.spellChecks.races makes them differ again", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        targets: [
          { name: "PCsFighters", keywords: ["elf", "halfElf"] },
          { name: "PCs", keywords: ["elf", "halfElf"] },
          { name: "PCsFighters", keywords: ["elf"] },
          { name: "PCs" },
        ],
      },
    ]);
    expect(ability.targets).toEqual([
      {
        name: "PCsFighters",
        triggers: [...SPELL_CHECK_TRIGGERS.elf, ...SPELL_CHECK_TRIGGERS.halfElf],
      },
      { name: "PCs", triggers: [...SPELL_CHECK_TRIGGERS.elf, ...SPELL_CHECK_TRIGGERS.halfElf] },
      { name: "PCsFighters", triggers: [...SPELL_CHECK_TRIGGERS.elf] },
      { name: "PCs" },
    ]);
  });
});

describe("getAbilities - auto ImmuneToSpellLevel via ability.level", () => {
  afterEach(() => {
    GLOBAL_CONFIG.spellChecks.spellProtections = true;
  });

  it("appends ImmuneToSpellLevel to every target list when the ability has a level", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_LEVEL_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        level: 3,
        targets: [{ name: "Players" }, { name: "PCs", triggers: [{ name: "See", params: [] }] }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([{ preset: "JA#TEST_LEVEL_PRESET" }]);
      expect(ability.targets).toEqual([
        {
          name: "Players",
          triggers: [{ name: "ImmuneToSpellLevel", params: ["{Target}", 3], negation: true }],
        },
        {
          name: "PCs",
          triggers: [
            { name: "See", params: [] },
            { name: "ImmuneToSpellLevel", params: ["{Target}", 3], negation: true },
          ],
        },
      ]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });

  it("leaves targets untouched when the ability has no level", () => {
    const [ability] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, targets: [{ name: "Players" }] },
    ]);
    expect(ability.targets).toEqual([{ name: "Players" }]);
  });

  it("respects GLOBAL_CONFIG.spellChecks.spellProtections - disabling it drops the check", () => {
    GLOBAL_CONFIG.spellChecks.spellProtections = false;
    ABILITY_PRESETS.push({
      preset: "JA#TEST_LEVEL_DISABLED_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        level: 3,
        targets: [{ name: "Players" }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([{ preset: "JA#TEST_LEVEL_DISABLED_PRESET" }]);
      expect(ability.targets).toEqual([{ name: "Players" }]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });

  it("combines with keyword-driven checks on the same target list", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_LEVEL_AND_KEYWORDS_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        level: 3,
        keywords: ["acid"],
        targets: [{ name: "Players" }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([
        { preset: "JA#TEST_LEVEL_AND_KEYWORDS_PRESET" },
      ]);
      expect(ability.targets).toEqual([
        {
          name: "Players",
          triggers: [
            ...SPELL_CHECK_TRIGGERS.acid,
            { name: "ImmuneToSpellLevel", params: ["{Target}", 3], negation: true },
          ],
        },
      ]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("getMinorSequencer / getSequencer", () => {
  it("builds a 2-spell sequencer with the MinorSequencer name and the standard probability/triggers", () => {
    const ability = abilityService.getMinorSequencer([
      "SPWI219", // Vocalize
      "SPWI206", // Invisibility
    ] as [string, string]);
    expect(ability.name).toBe("ability.MinorSequencer");
    expect(ability.requireVocal).toBe(false);
    expect(ability.probability).toBe(70);
    expect(ability.spells).toHaveLength(2);
  });

  it("throws for an unknown preset name", () => {
    expect(() =>
      abilityService.getMinorSequencer(["not_a_real_preset", "x"] as [string, string]),
    ).toThrow(/Unknown preset not_a_real_preset/);
  });

  it("throws when a preset resolves without a spell (documented guard; no real preset currently triggers this)", () => {
    const spy = vi.spyOn(service, "applyPreset").mockReturnValueOnce({});
    try {
      expect(() => abilityService.getMinorSequencer(["x", "y"] as [string, string])).toThrow(
        /Sequencer only supports spells/,
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("appends the keyword's SPELL_CHECK_TRIGGERS to a sequenced preset's target list too", () => {
    const presetName = "JA#TEST_SEQUENCER_KEYWORDS_PRESET";
    ABILITY_PRESETS.push({
      preset: presetName,
      ability: {
        name: DEFAULT_ABILITY_NAME,
        keywords: ["acid"],
        targets: [{ name: "Players" }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const ability = abilityService.getMinorSequencer([presetName, presetName] as [
        string,
        string,
      ]);
      expect(ability.targets).toEqual([
        { name: "Players", triggers: [...SPELL_CHECK_TRIGGERS.acid] },
        { name: "Players", triggers: [...SPELL_CHECK_TRIGGERS.acid] },
      ]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });

  it("throws when a preset's spell is an array (presets don't support spell arrays)", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_ARRAY_SPELL_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        spell: [] as unknown as RawCreatureAbility["spell"],
      },
    });
    try {
      expect(() => abilityService.getAbilities([{ preset: "JA#TEST_ARRAY_SPELL_PRESET" }])).toThrow(
        /Preset don't support spell arrays/,
      );
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});

describe("getCustomCodes", () => {
  it("returns an empty array when customCodes is undefined", () => {
    expect(abilityService.getCustomCodes(undefined)).toEqual([]);
  });

  it("defaults statements to an empty array and resolves nested abilities", () => {
    const [customCode] = abilityService.getCustomCodes([
      {
        location: "attack",
        type: "insertBefore",
        abilities: [{ name: DEFAULT_ABILITY_NAME }],
      },
    ]);
    expect(customCode.statements).toEqual([]);
    expect(customCode.abilities).toHaveLength(1);
    expect(customCode.abilities[0].name).toBe(DEFAULT_ABILITY_NAME);
  });
});

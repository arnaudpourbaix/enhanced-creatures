import { describe, expect, it, vi } from "vitest";
import { ABILITY_PRESETS } from "../../../config/ability-presets";
import { PRESET_NAMES } from "../../../config/common";
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

  it("targets Myself when the spell has selfTarget set", () => {
    const [ability] = abilityService.getAbilities([
      {
        name: DEFAULT_ABILITY_NAME,
        spell: {
          id: SPWI001,
          memorizedSpellCheck: false,
          selfTarget: true,
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

  it("throws when spells mix selfTarget true and false", () => {
    expect(() =>
      abilityService.getAbilities([
        {
          name: DEFAULT_ABILITY_NAME,
          spells: [
            { id: SPWI001, selfTarget: true },
            { id: SPWI002, selfTarget: false },
          ],
        } as unknown as RawCreatureAbility,
      ]),
    ).toThrow(/Every spells must have the same target in ability ability.unknown/);
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

  it("leaves the preset's own spell.id untouched when the override sets neither id nor resource", () => {
    const [ability] = abilityService.getAbilities([
      {
        preset: PRESET_NAMES.DimensionDoorOffscreen,
        spell: { memorizedSpellCheck: false },
      },
    ]);
    expect(ability.actions).toContainEqual({
      name: "Spell",
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

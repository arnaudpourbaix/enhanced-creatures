import { afterAll, describe, expect, it, vi } from "vitest";
import { SpellGroupName } from "../../config/spells/spell-group-name";
import {
  EffectTargetEnum,
  ItemAbilityTypeEnum,
  SpellTypeEnum,
} from "../model/spell-item/effect.enums";
import { Effect } from "../model/spell-item/effect";
import { PartialSpellHeader, Spell } from "../model/spell-item/spell-item";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import { State } from "../state";
import spellService from "./spell.service";
import translationService from "./translation.service";

// a stand-in stringRef: translationService.from() throws for a numeric ref that isn't
// registered (addProjectile() reads spell.name for its logService.log call), but registering a real one
// via addCustomTranslation() would permanently shift translationService's shared, never-reset
// availableStringRef counter for every other test file in the same run (breaking
// pipeline.golden.test.ts's exact-stringRef-number fixtures) - mock the lookup instead.
const SPELL_NAME = 12345;
const fromOptionalSpy = vi.spyOn(translationService, "fromOptional").mockReturnValue("Test Spell");
afterAll(() => {
  fromOptionalSpy.mockRestore();
});

describe("getSpell", () => {
  it("defaults doc/level/type when omitted", () => {
    const result = spellService.getSpell({ name: SPELL_NAME }, "spl01");
    expect(result.doc).toBe("both");
    expect(result.level).toBe(1);
    expect(result.type).toBe(SpellTypeEnum.Innate);
  });

  it("forces type back to Innate when explicitly undefined and there's no copyFrom", () => {
    const result = spellService.getSpell({ name: SPELL_NAME, type: undefined }, "spl02");
    expect(result.type).toBe(SpellTypeEnum.Innate);
  });

  it("leaves type undefined when explicitly undefined but copyFrom is set", () => {
    const result = spellService.getSpell(
      { name: SPELL_NAME, type: undefined, copyFrom: "SPWI100" },
      "spl03",
    );
    expect(result.type).toBeUndefined();
  });

  it("forces level back to 1 when explicitly undefined and there's no copyFrom", () => {
    const result = spellService.getSpell({ name: SPELL_NAME, level: undefined }, "spl04");
    expect(result.level).toBe(1);
  });

  it("leaves level undefined when explicitly undefined but copyFrom is set", () => {
    const result = spellService.getSpell(
      { name: SPELL_NAME, level: undefined, copyFrom: "SPWI100" },
      "spl05",
    );
    expect(result.level).toBeUndefined();
  });

  it("appends C to a 3-digit icon", () => {
    const result = spellService.getSpell({ name: SPELL_NAME, icon: "SPL123" }, "spl06");
    expect(result.icon).toBe("SPL123C");
  });

  it("leaves an icon not ending in 3 digits untouched", () => {
    const result = spellService.getSpell({ name: SPELL_NAME, icon: "SPL12A" }, "spl07");
    expect(result.icon).toBe("SPL12A");
  });

  it("throws when a header has no type", () => {
    expect(() =>
      spellService.getSpell(
        { name: SPELL_NAME, headers: [{} as unknown as PartialSpellHeader] },
        "spl08",
      ),
    ).toThrow(/Header type is required!/);
  });

  it("defaults header range/speed/minLevel/location/target when omitted", () => {
    const result = spellService.getSpell(
      {
        name: SPELL_NAME,
        headers: [{ type: ItemAbilityTypeEnum.Magical }],
      },
      "spl09",
    );
    expect(result.headers[0]).toMatchObject({
      range: 0,
      speed: 0,
      minLevel: 0,
    });
  });

  it("adds racial resistances when a header has a Charm/Sleep effect and addRacialResistances isn't disabled", () => {
    const result = spellService.getSpell(
      {
        name: SPELL_NAME,
        headers: [
          {
            type: ItemAbilityTypeEnum.Magical,
            effects: [
              {
                opcode: EffectTypeEnum.CharmCreature,
                target: EffectTargetEnum.PresetTarget,
              } as unknown as Effect,
            ],
          },
        ],
      },
      "spl10",
    );
    expect(result.headers[0].effects.some((e) => e.opcode === EffectTypeEnum.UseEFFFile)).toBe(
      true,
    );
  });

  it("does not add racial resistances when addRacialResistances is explicitly false", () => {
    const result = spellService.getSpell(
      {
        name: SPELL_NAME,
        options: { addRacialResistances: false },
        headers: [
          {
            type: ItemAbilityTypeEnum.Magical,
            effects: [
              {
                opcode: EffectTypeEnum.CharmCreature,
                target: EffectTargetEnum.PresetTarget,
              } as unknown as Effect,
            ],
          },
        ],
      },
      "spl11",
    );
    expect(result.headers[0].effects.some((e) => e.opcode === EffectTypeEnum.UseEFFFile)).toBe(
      false,
    );
  });
});

describe("getGroupRessources", () => {
  it("throws when the group is not defined", () => {
    expect(() => spellService.getGroupRessources("not-a-real-group" as SpellGroupName)).toThrow(
      /Group not-a-real-group is not defined/,
    );
  });

  it("returns the group's spell resrefs when the group is defined", () => {
    expect(spellService.getGroupRessources("acidSpells")).toBeInstanceOf(Array);
  });
});

describe("addProjectile (private, via header.projectile object)", () => {
  it("adds a projectile and sets header.projectile to the spell file", () => {
    const result = spellService.getSpell(
      {
        name: SPELL_NAME,
        headers: [
          {
            type: ItemAbilityTypeEnum.Magical,
            projectile: { name: "Test Projectile" },
          },
        ],
      },
      "spl13",
    );
    expect(result.projectiles).toHaveLength(1);
    expect(result.headers[0].projectile).toBe("spl13");
  });

  it("does not add a duplicate projectile when two headers both reference an object projectile", () => {
    const proj = { name: "Test Projectile" };
    const result = spellService.getSpell(
      {
        name: SPELL_NAME,
        headers: [
          { type: ItemAbilityTypeEnum.Magical, projectile: proj },
          { type: ItemAbilityTypeEnum.Ranged, projectile: proj },
        ],
      },
      "spl14",
    );
    expect(result.projectiles).toHaveLength(1);
  });
});

describe("useEffectFile (racial resistance skip-add dedup)", () => {
  it("does not push a duplicate effect file when two headers both trigger racial resistances", () => {
    const charmEffect = {
      opcode: EffectTypeEnum.CharmCreature,
      target: EffectTargetEnum.PresetTarget,
    } as unknown as Effect;
    const result = spellService.getSpell(
      {
        name: SPELL_NAME,
        headers: [
          { type: ItemAbilityTypeEnum.Magical, effects: [charmEffect] },
          { type: ItemAbilityTypeEnum.Magical, effects: [charmEffect] },
        ],
      },
      "spl12",
    );
    const fileCount = result.effectFiles.filter((e) => e.file === "spl12").length;
    expect(fileCount).toBe(1);
  });
});

describe("getAllSpellNames", () => {
  it("includes a named spell from the base spell-names list", () => {
    const result = spellService.getAllSpellNames();
    expect(result).toContainEqual({ file: "SPWI118", name: "spell.ChromaticOrb.name" });
  });

  it("includes a named spell from the Faiths & Powers spell list", () => {
    const result = spellService.getAllSpellNames();
    expect(result).toContainEqual({ file: "d5p1301", name: "spell.AnimateDead.name" });
  });
});

describe("getSpellName", () => {
  const CHROMATIC_ORB = "Chromatic Orb";

  it("resolves the name from a spell already processed into State.spells", () => {
    State.spells.push({ file: "getspellname-in-state", name: "spell.ChromaticOrb.name" } as Spell);
    expect(spellService.getSpellName("getspellname-in-state")).toBe(CHROMATIC_ORB);
  });

  it("falls back to the static config list when the file isn't in State.spells", () => {
    expect(spellService.getSpellName("SPWI118")).toBe(CHROMATIC_ORB);
  });

  it("falls back to the static config list when the State.spells entry has no name", () => {
    State.spells.push({ file: "SPWI118", name: undefined } as unknown as Spell);
    expect(spellService.getSpellName("SPWI118")).toBe(CHROMATIC_ORB);
  });

  it("returns null when the file is unknown to both State.spells and the static config", () => {
    expect(spellService.getSpellName("no-such-spell-file")).toBeNull();
  });
});

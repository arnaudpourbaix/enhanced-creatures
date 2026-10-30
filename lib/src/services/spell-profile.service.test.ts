import { beforeEach, describe, expect, it } from "vitest";
import { ABILITY_PRESETS } from "../../config/ability-presets";
import { FNP_SPELLS } from "../../config/spells/fnp-spell-database";
import { SPELLS } from "../../config/spells/spell-database";
import { NEW_SPELLS } from "../../config/spells/spells";
import { Creature } from "../model/creature/creature";
import { SpellTypeEnum } from "../model/spell-item/effect.enums";
import { SpellCombo } from "../model/spell-item/spell-combo";
import spellComboService from "./spell-combo.service";
import spellProfileService from "./spell-profile.service";

function creatureWith(spells: object[] = []): Creature {
  return { spells } as unknown as Creature;
}

describe("profileOf", () => {
  beforeEach(() => {
    spellComboService.usePresets(ABILITY_PRESETS);
  });

  it("reads a database spell's profile, its type from its category", () => {
    expect(
      spellProfileService.profileOf(SPELLS.Wizard.Fireball.file, creatureWith()),
    ).toMatchObject({
      file: SPELLS.Wizard.Fireball.file,
      level: 3,
      type: SpellTypeEnum.Wizard,
      role: "damage",
      castingTime: SPELLS.Wizard.Fireball.castingTime,
      tier: "decent",
      spellCount: 1,
    });
  });

  it("reads a duration when there is one", () => {
    expect(
      spellProfileService.profileOf(SPELLS.Wizard.Stoneskin.file, creatureWith())?.duration,
    ).toBe("long");
  });

  it("reads a tier when there is one", () => {
    expect(spellProfileService.profileOf(SPELLS.Wizard.Stoneskin.file, creatureWith())?.tier).toBe(
      "great",
    );
  });

  it("reads a Faiths and Powers spell as a priest one", () => {
    const spell = FNP_SPELLS.Priest.AnimateDead;
    expect(spellProfileService.profileOf(spell.file, creatureWith())).toMatchObject({
      level: spell.level,
      type: SpellTypeEnum.Priest,
      role: spell.role,
    });
  });

  it("reads a spell this mod creates from NEW_SPELL_PROFILES", () => {
    expect(
      spellProfileService.profileOf(NEW_SPELLS.WizardSymbolOfPain, creatureWith()),
    ).toMatchObject({ level: 8, type: SpellTypeEnum.Wizard, role: "disable", castingTime: 3 });
  });

  it("reads a creature's own spell: its level, type, role and first header's speed", () => {
    const domination = {
      file: "CUSTOM1",
      level: 5,
      type: SpellTypeEnum.Innate,
      role: "disable",
      headers: [{ speed: 1 }],
    };
    expect(spellProfileService.profileOf("CUSTOM1", creatureWith([domination]))).toMatchObject({
      level: 5,
      type: SpellTypeEnum.Innate,
      role: "disable",
      castingTime: 1,
    });
  });

  it("has no profile for a creature's own spell without a role", () => {
    const spell = {
      file: "CUSTOM2",
      level: 3,
      type: SpellTypeEnum.Innate,
      headers: [{ speed: 1 }],
    };
    expect(spellProfileService.profileOf("CUSTOM2", creatureWith([spell]))).toBeUndefined();
  });

  it("profiles a sequencer from its spells, counting them", () => {
    const combo: SpellCombo = {
      key: "TestProfileMissiles",
      kind: "minorSequencer",
      spells: [SPELLS.Wizard.MagicMissiles, SPELLS.Wizard.MagicMissiles],
    };
    const file = spellComboService.comboFile(combo, "Vanilla");
    expect(spellProfileService.profileOf(file, creatureWith())).toMatchObject({
      role: "damage",
      level: 1,
      type: SpellTypeEnum.Wizard,
      spellCount: 2,
      combo: "minorSequencer",
    });
  });

  it("leaves a sequencer's useless spells out of its count", () => {
    const combo: SpellCombo = {
      key: "TestProfileUseless",
      kind: "minorSequencer",
      spells: [SPELLS.Wizard.MagicMissiles, SPELLS.Wizard.DancingLights],
    };
    const file = spellComboService.comboFile(combo, "Vanilla");
    expect(spellProfileService.profileOf(file, creatureWith())?.spellCount).toBe(1);
  });

  it("has no profile for an unknown file", () => {
    expect(spellProfileService.profileOf("NOSUCH01", creatureWith())).toBeUndefined();
  });
});

describe("isCatalogued", () => {
  beforeEach(() => {
    spellComboService.usePresets(ABILITY_PRESETS);
  });

  it("knows database, Faiths and Powers and mod-created spells", () => {
    expect(spellProfileService.isCatalogued(SPELLS.Wizard.Fireball.file)).toBe(true);
    expect(spellProfileService.isCatalogued(FNP_SPELLS.Priest.AnimateDead.file)).toBe(true);
    expect(spellProfileService.isCatalogued(NEW_SPELLS.WizardSymbolOfPain)).toBe(true);
  });

  it("doesn't know a creature's own power", () => {
    expect(spellProfileService.isCatalogued("jase0701")).toBe(false);
  });
});

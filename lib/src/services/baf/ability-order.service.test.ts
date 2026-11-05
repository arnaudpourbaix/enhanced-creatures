import { AT_WILL } from "../../../config/common";
import { describe, expect, it, vi } from "vitest";
import { Creature } from "../../model/creature/creature";
import { MainCreatureData } from "../../model/creature/data";
import { AbilityEntry, CreatureAbility, RawCreatureAbility } from "../../model/creature/ability";
import abilityOrderService from "./ability-order.service";
import logService from "../log.service";
import { ABILITY_PRESETS } from "../../../config/ability-presets";
import { SPELLS } from "../../../config/spells/spell-database";
import { SpellCombo } from "../../model/spell-item/spell-combo";
import { Spell } from "../../model/spell-item/spell-item";
import { SpellTypeEnum } from "../../model/spell-item/effect.enums";
import spellComboService from "../spell-combo.service";
import { COMBOS } from "../../../config/spells/spell-combos";
import { MIRRORED_ENEMY_TARGETS } from "../../../config/spells/mirror-counters";
import { KEEP_PLAYERS_DISABLED } from "../../../config/target/common";

const FIREBALL = SPELLS.Wizard.Fireball.file;
const MAGIC_MISSILES = SPELLS.Wizard.MagicMissiles.file;
const NOT_PROFILED = "not-profiled";
const CUSTOM_ABILITY_PRESET = "custom-ability-preset";

function fakeCreature(
  p: {
    memorized?: { file: string }[];
    entries?: AbilityEntry[];
    customSpells?: { id: number; file: string; ability: RawCreatureAbility; spell?: object }[];
    behaviorAbilities?: CreatureAbility[];
    customCodeAbilities?: CreatureAbility[][];
  } = {},
): Creature {
  const creature = new Creature(1);
  creature.name = "common.potion.use";
  creature.data = { spells: { memorized: p.memorized ?? [] } } as unknown as MainCreatureData;
  creature.adjustments = [];
  creature.pendingAbilityEntries = p.entries;
  creature.spells = (p.customSpells ?? []).map((s) => ({
    id: s.id,
    file: s.file,
    ability: s.ability,
    ...s.spell,
  })) as unknown as Creature["spells"];
  creature.behavior = {
    abilities: p.behaviorAbilities ?? [],
    customCodes: (p.customCodeAbilities ?? []).map((abilities) => ({ abilities })),
  } as unknown as Creature["behavior"];
  return creature;
}

/** The presets, in order: abilities also carry their planned probability */
const presetsOf = (abilities: RawCreatureAbility[]) => abilities.map((a) => a.preset);

/** Without the Mirror Image counters and last resorts, which have their own tests */
const regularOf = (abilities: RawCreatureAbility[]) =>
  abilities.filter((a) => a.mirrorTarget !== "require" && a.targets !== MIRRORED_ENEMY_TARGETS);

function fakeAbility(resource: string): CreatureAbility {
  return { resource, actions: [], triggers: [], targets: [] } as unknown as CreatureAbility;
}

describe("resolve - Mirror Image passes", () => {
  const FLAME_ARROW = SPELLS.Wizard.FlameArrow.file;
  const HOLD = SPELLS.Wizard.HoldPerson.file;

  it("gives a remover a counter at mirrored enemies, then its regular pass", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const resolved = abilityOrderService.resolve(
      fakeCreature({ memorized: [{ file: FLAME_ARROW }] }),
    );
    expect(resolved).toHaveLength(2);
    const [counter, regular] = resolved;
    // its own target lists, with their checks: only mirrored targets in the first one
    const preset = ABILITY_PRESETS.find((p) => p.preset === FLAME_ARROW);
    expect(counter.targets).toEqual(preset?.ability.targets);
    expect(counter.mirrorTarget).toBe("require");
    expect(counter.preset).toBeUndefined();
    expect(counter.spell?.resource).toBe(FLAME_ARROW);
    expect(regular).toMatchObject({ preset: FLAME_ARROW, mirrorTarget: "avoid" });
    expect(counter.rollRange).toBe(regular.rollRange);
  });

  it("aims a remover without targets (True Seeing) at able mirrored enemies", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const seeing = SPELLS.Wizard.TrueSeeing.file;
    // reactive: its own block comes first, then the counter
    const [regular, counter] = abilityOrderService.resolve(
      fakeCreature({ memorized: [{ file: seeing }] }),
    );
    expect(regular.preset).toBe(seeing);
    expect(counter.targets).toEqual(MIRRORED_ENEMY_TARGETS);
    expect(counter.mirrorPass).toBe("counter");
    expect(regular.mirrorPass).toBeUndefined();
    expect(MIRRORED_ENEMY_TARGETS[0].includeStatus).toEqual(["Able"]);
  });

  it("keeps a single-target spell for mirrored enemies as a last resort", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const resolved = abilityOrderService.resolve(
      fakeCreature({ memorized: [{ file: HOLD }, { file: FIREBALL }] }),
    );
    const passes = resolved.map((a) => [a.preset, a.mirrorTarget]);
    expect(passes).toHaveLength(3);
    expect(passes).toContainEqual([HOLD, "avoid"]);
    expect(passes).toContainEqual([FIREBALL, undefined]);
    // its own first target list only (see mirrorTarget), so its checks stay: scripts stay small
    expect(resolved.at(-1)).toMatchObject({
      preset: HOLD,
      mirrorTarget: "require",
      mirrorPass: "lastResort",
    });
    expect(resolved.at(-1)?.targets).toBeUndefined();
  });

  it("keeps a counter's own triggers instead of its preset's", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const dispel = SPELLS.Wizard.DispelMagic.file;
    const resolved = abilityOrderService.resolve(fakeCreature({ memorized: [{ file: dispel }] }));
    const counter = resolved.find((a) => a.mirrorTarget === "require");
    expect(counter?.triggers).toEqual(KEEP_PLAYERS_DISABLED);
    expect(resolved.find((a) => a.preset === dispel)?.targets).toBeUndefined();
  });

  it("anchors an entry on the regular pass, not the counter", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature({
      memorized: [{ file: FLAME_ARROW }, { file: FIREBALL }],
      entries: [{ spell: { file: NOT_PROFILED } as never, insertAfter: FLAME_ARROW }],
    });
    const resolved = abilityOrderService.resolve(creature);
    const regular = resolved.findIndex((a) => a.preset === FLAME_ARROW);
    expect(resolved[regular + 1].preset).toBe(NOT_PROFILED);
  });
});

describe("resolve", () => {
  it("leaves an enemy contingency out too: the engine fires it", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const combo: SpellCombo = {
      key: "TestHorrorAtHp25",
      kind: "chainContingency",
      condition: "hp25",
      target: "nearestEnemy",
      spells: [SPELLS.Wizard.Horror],
    };
    const file = spellComboService.comboFile(combo, "Vanilla");
    const creature = fakeCreature({ memorized: [{ file: FIREBALL }, { file }] });
    const resolved = abilityOrderService.resolve(creature);
    expect(presetsOf(resolved)).toEqual([FIREBALL]);
  });

  it("leaves a self contingency out: it is precast, not cast as an ability", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const combo: SpellCombo = {
      key: "TestStoneskinAtHit",
      kind: "contingency",
      condition: "hit",
      spells: [SPELLS.Wizard.Stoneskin],
    };
    const file = spellComboService.comboFile(combo, "Vanilla");
    const creature = fakeCreature({ memorized: [{ file }] });
    expect(abilityOrderService.resolve(creature)).toEqual([]);
  });

  it("gives an ability to a sequencer declared on the creature's data, without a spellbook", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature();
    creature.data.spells.combos = [COMBOS.MinorSequencers.MagicMissiles];
    expect(presetsOf(abilityOrderService.resolve(creature))).toEqual(
      spellComboService.filesOf(COMBOS.MinorSequencers.MagicMissiles),
    );
  });

  it("orders memorized spells by the cast order plan, each with its planned probability", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature({
      memorized: [
        { file: FIREBALL },
        { file: SPELLS.Wizard.MinorGlobeOfInvulnerability.file },
        { file: SPELLS.Priest.CureLightWounds.file },
        { file: SPELLS.Priest.FindTraps.file },
      ],
    });
    const resolved = abilityOrderService.resolve(creature);
    // healing allies is reactive, Minor Globe a great protection opening the fight, healing itself
    // after the stronger Fireball, Find Traps useless
    expect(presetsOf(resolved)).toEqual([
      SPELLS.Priest.CureLightWounds.file,
      SPELLS.Wizard.MinorGlobeOfInvulnerability.file,
      FIREBALL,
      SPELLS.Priest.CureLightWounds.file,
    ]);
    expect(resolved[0].probability).toBe(100);
    expect(resolved[2].probability).toBeGreaterThan(30);
  });

  it("heals the allies at once, and itself only on its own later cast", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const heal = SPELLS.Priest.CureLightWounds.file;
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }, { file: heal }],
      entries: [{ spell: SPELLS.Priest.CureLightWounds, ability: { spell: { type: "force" } } }],
    });
    const [allies, , self] = abilityOrderService.resolve(creature);
    const preset = ABILITY_PRESETS.find((p) => p.preset === heal);
    const triggers = preset?.ability.targets?.[0].triggers;
    expect(allies).toMatchObject({ preset: heal, spell: { type: "force" } });
    expect(allies.targets).toEqual([{ name: "NearestAllies", triggers, randomOrder: true }]);
    expect(self).toMatchObject({ preset: heal, spell: { type: "force" }, probability: 100 });
    expect(self.targets).toEqual([{ name: "Myself", triggers }]);
  });

  it("inserts an at-will power without a position by its score", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }, { file: MAGIC_MISSILES }],
      customSpells: [
        {
          id: 3,
          file: "domination",
          ability: { preset: CUSTOM_ABILITY_PRESET },
          spell: { level: 3, type: SpellTypeEnum.Innate, role: "disable", headers: [{ speed: 1 }] },
        },
      ],
      entries: [{ abilityId: 3 }],
    });
    const resolved = abilityOrderService.resolve(creature);
    expect(presetsOf(regularOf(resolved))).toEqual([
      CUSTOM_ABILITY_PRESET,
      FIREBALL,
      MAGIC_MISSILES,
    ]);
    expect(regularOf(resolved)[0].probability).toBeGreaterThan(30);
  });

  it("places a spell entry without a position by its score, with its own configuration", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const timer = { name: "FIREBALL_WAIT", value: 18 };
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }, { file: MAGIC_MISSILES }],
      entries: [{ spell: SPELLS.Wizard.Fireball, ability: { timer } }],
    });
    const regular = regularOf(abilityOrderService.resolve(creature));
    expect(presetsOf(regular)).toEqual([FIREBALL, MAGIC_MISSILES]);
    expect(regular[0].timer).toEqual(timer);
  });

  it("casts a spell entry through another preset when it says so (Vortex Web by Slow's)", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }],
      entries: [{ spell: FIREBALL, ability: { preset: MAGIC_MISSILES } }],
    });
    expect(presetsOf(regularOf(abilityOrderService.resolve(creature)))).toEqual([MAGIC_MISSILES]);
  });

  it("takes a spell entry's file name too (a spell of no database entry)", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }, { file: MAGIC_MISSILES }],
      entries: [{ spell: FIREBALL }],
    });
    expect(presetsOf(regularOf(abilityOrderService.resolve(creature)))).toEqual([
      FIREBALL,
      MAGIC_MISSILES,
    ]);
  });

  it("makes summons wait for each other, only with several casts to space out", () => {
    const wait = { name: "SUMMON_WAIT", value: 12 };
    const timers = (memorized: { file: string; memorizedCount?: number }[]) =>
      abilityOrderService.resolve(fakeCreature({ memorized })).map((a) => a.timer);
    expect(timers([{ file: "SPWI423" }])).toEqual([undefined]);
    expect(timers([{ file: "SPWI423", memorizedCount: 2 }])).toEqual([wait]);
    expect(timers([{ file: "SPWI423" }, { file: "SPWI504" }])).toEqual([wait, wait]);
  });

  it("gives an at-will summon its own cooldown, not the wait", () => {
    const memorized = [{ file: "SPWI423", memorizedCount: AT_WILL }, { file: "SPWI504" }];
    const resolved = abilityOrderService.resolve(fakeCreature({ memorized }));
    expect(resolved.every((a) => a.timer === undefined)).toBe(true);
  });

  it("returns an empty array when nothing is memorized", () => {
    const creature = fakeCreature();
    expect(abilityOrderService.resolve(creature)).toEqual([]);
  });

  it("excludes a spell-exception's file from the auto block and inserts it via its own directive", () => {
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }, { file: MAGIC_MISSILES }],
      entries: [{ spell: { file: MAGIC_MISSILES }, insertFirst: true }],
    });
    expect(presetsOf(abilityOrderService.resolve(creature))).toEqual([MAGIC_MISSILES, FIREBALL]);
  });

  it("appends a custom abilityId entry at the end with insertLast", () => {
    const creature = fakeCreature({
      memorized: [],
      customSpells: [
        { id: 7, file: "custom-spell-file", ability: { preset: CUSTOM_ABILITY_PRESET } },
      ],
      entries: [{ abilityId: 7, insertLast: true }],
    });
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: CUSTOM_ABILITY_PRESET }]);
  });

  it("excludes a custom abilityId entry's own memorized file from the auto block (memorizedCount auto-push case)", () => {
    // Creature.addSpell pushes to data.spells.memorized whenever memorizedCount is set,
    // even for custom addSpell-created abilities - so a custom ability's own generated
    // file can legitimately appear in memorizedSpellFiles(). It must not be double-processed
    // (once via its entries position, once via auto-derivation, which would also spuriously
    // error since custom files have no spell profile).
    const creature = fakeCreature({
      memorized: [{ file: "custom-spell-file-x" }],
      customSpells: [
        { id: 5, file: "custom-spell-file-x", ability: { preset: CUSTOM_ABILITY_PRESET } },
      ],
      entries: [{ abilityId: 5, insertFirst: true }],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: CUSTOM_ABILITY_PRESET }]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("inserts a custom abilityId entry before a memorized spell via insertBefore", () => {
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }],
      customSpells: [
        { id: 9, file: "custom-spell-file-2", ability: { preset: CUSTOM_ABILITY_PRESET } },
      ],
      entries: [{ abilityId: 9, insertBefore: FIREBALL }],
    });
    expect(presetsOf(abilityOrderService.resolve(creature))).toEqual([
      CUSTOM_ABILITY_PRESET,
      FIREBALL,
    ]);
  });

  it("resolves an insertAfter anchor pointing at a custom abilityId entry by its own spell file, not its ability's preset field", () => {
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }],
      customSpells: [
        // this custom ability's own generated file differs from what it actually casts
        // (preset borrows another spell's config) - the GreaterMummyFearAura pattern.
        { id: 13, file: "custom-spell-file-a", ability: { preset: "unrelated-borrowed-preset" } },
        { id: 14, file: "custom-spell-file-b", ability: { preset: "second-custom-preset" } },
      ],
      entries: [
        { abilityId: 13, insertFirst: true },
        { abilityId: 14, insertAfter: 13 },
      ],
    });
    expect(presetsOf(abilityOrderService.resolve(creature))).toEqual([
      "unrelated-borrowed-preset",
      "second-custom-preset",
      FIREBALL,
    ]);
  });

  it("resolves an anchor value of 0 correctly instead of treating it as unset", () => {
    const creature = fakeCreature({
      customSpells: [
        { id: 0, file: "custom-spell-file-zero", ability: { preset: "zero-preset" } },
        { id: 1, file: "custom-spell-file-one", ability: { preset: "one-preset" } },
      ],
      entries: [
        { abilityId: 0, insertFirst: true },
        { abilityId: 1, insertBefore: 0 },
      ],
    });
    expect(abilityOrderService.resolve(creature)).toEqual([
      { preset: "one-preset" },
      { preset: "zero-preset" },
    ]);
  });

  it("throws for a memorized spell no profile covers", () => {
    const creature = fakeCreature({ memorized: [{ file: NOT_PROFILED }, { file: FIREBALL }] });
    expect(() => abilityOrderService.resolve(creature)).toThrow(
      `Memorized spell '${NOT_PROFILED}' has no spell profile`,
    );
  });

  it("errors and appends at the end when an insertBefore anchor doesn't resolve", () => {
    const creature = fakeCreature({
      memorized: [],
      customSpells: [{ id: 20, file: "custom-file", ability: { preset: "custom-preset" } }],
      entries: [{ abilityId: 20, insertBefore: "does-not-exist" }],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: "custom-preset" }]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("does-not-exist"));
    errorSpy.mockRestore();
  });

  it("places a power shared on the creature's family by its score, cast by its own ability", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const domination = {
      file: "shared-domination",
      level: 3,
      type: SpellTypeEnum.Innate,
      role: "disable",
      headers: [{ speed: 1 }],
      ability: { name: "domination-ability" },
    } as unknown as Spell;
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }, { file: MAGIC_MISSILES }],
      entries: [{ power: domination }],
    });
    const resolved = abilityOrderService.resolve(creature);
    expect(regularOf(resolved).map((a) => a.preset ?? a.name)).toEqual([
      "domination-ability",
      FIREBALL,
      MAGIC_MISSILES,
    ]);
  });

  it("throws when an entry sets both a power and a spell", () => {
    const creature = fakeCreature({
      entries: [{ spell: { file: "x" }, power: { file: "y" } as unknown as Spell }],
    });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/exactly one/);
  });

  it("throws when an entry sets neither spell nor abilityId", () => {
    const creature = fakeCreature({ entries: [{ insertFirst: true }] });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/exactly one/);
  });

  it("throws when an entry sets both spell and abilityId", () => {
    const creature = fakeCreature({
      entries: [{ spell: { file: "x" }, abilityId: 1, insertFirst: true }],
    });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/exactly one/);
  });

  it("throws when an entry sets more than one position directive", () => {
    const creature = fakeCreature({
      entries: [{ spell: { file: "x" }, insertFirst: true, insertLast: true }],
    });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/at most one/);
  });

  it("excludes a memorized spell already covered by an existing plain-array ability, with no entries at all", () => {
    // A creature that only ever used the legacy plain-array form (no `entries`, so
    // pendingAbilityEntries stays undefined) must still get its already-covered memorized
    // spells excluded from auto-derivation - resolve() now runs unconditionally.
    const creature = fakeCreature({
      memorized: [{ file: "test-priority-covered" }],
      behaviorAbilities: [fakeAbility("test-priority-covered")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("excludes a memorized spell whose ability lives in customCodes[].abilities", () => {
    const creature = fakeCreature({
      memorized: [{ file: "test-priority-customcode" }],
      customCodeAbilities: [[fakeAbility("test-priority-customcode")]],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("auto-derives only the leftover memorized spell when another is already covered by a plain-array ability", () => {
    const creature = fakeCreature({
      memorized: [{ file: FIREBALL }, { file: "test-priority-covered-2" }],
      behaviorAbilities: [fakeAbility("test-priority-covered-2")],
    });
    expect(presetsOf(abilityOrderService.resolve(creature))).toEqual([FIREBALL]);
  });
});

describe("resolveCovered", () => {
  const SANCTUARY = SPELLS.Priest.Sanctuary.file;
  const BLESS = SPELLS.Priest.Bless.file;
  const HOLY_MIGHT = SPELLS.Priest.DrawUponHolyMight.file;

  it("gives a creature with a cover spell its protections and buffs, without the cover itself", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature({
      memorized: [{ file: SANCTUARY }, { file: BLESS }, { file: HOLY_MIGHT }, { file: FIREBALL }],
    });
    const covered = abilityOrderService.resolveCovered(creature);
    expect(presetsOf(covered).sort()).toEqual([BLESS, HOLY_MIGHT].sort());
    expect(covered.every((a) => a.probability !== undefined)).toBe(true);
  });

  it("leaves out a spell the creature casts through its own ability, as the normal order does", () => {
    spellComboService.usePresets(ABILITY_PRESETS);
    const creature = fakeCreature({
      memorized: [{ file: SANCTUARY }, { file: BLESS }, { file: HOLY_MIGHT }],
      behaviorAbilities: [fakeAbility(BLESS)],
    });
    expect(presetsOf(abilityOrderService.resolveCovered(creature))).toEqual([HOLY_MIGHT]);
  });

  it("covers a creature's own buff cast through its entry, with its own ability (an ogre mage's Fly)", () => {
    const INVISIBILITY = SPELLS.Wizard.Invisibility.file;
    const fly = { name: "fly", spell: { resource: "JASM0W01" } };
    const creature = fakeCreature({
      memorized: [{ file: INVISIBILITY }, { file: "JASM0W01" }],
      customSpells: [
        {
          id: 4,
          file: "JASM0W01",
          ability: fly,
          spell: { level: 3, type: SpellTypeEnum.Innate, role: "buff", headers: [{ speed: 1 }] },
        },
      ],
      entries: [{ abilityId: 4 }],
    });
    const covered = abilityOrderService.resolveCovered(creature);
    expect(covered).toHaveLength(1);
    expect(covered[0]).toMatchObject({ ...fly, probability: expect.any(Number) });
  });

  it("gives nothing without a cover spell", () => {
    const creature = fakeCreature({ memorized: [{ file: BLESS }, { file: HOLY_MIGHT }] });
    expect(abilityOrderService.resolveCovered(creature)).toEqual([]);
  });

  it("gives nothing with a cover spell but nothing protective", () => {
    const creature = fakeCreature({ memorized: [{ file: SANCTUARY }, { file: FIREBALL }] });
    expect(abilityOrderService.resolveCovered(creature)).toEqual([]);
  });
});

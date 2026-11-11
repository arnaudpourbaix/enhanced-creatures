import { describe, expect, it } from "vitest";
import {
  GARGANTUAN_CREATURES,
  HUGE_CREATURES,
  LARGE_CREATURES,
  TRIP_IMMUNE_CREATURES,
} from "../../../config/creatures";
import { MonsterEnum } from "../../../creatures/monster";
import { Creature } from "../../model/creature/creature";
import { CreatureTripConfig, TRIP_DEFAULT_CONFIG } from "../../model/creature/trip";
import {
  CastSpellEffect,
  Effect,
  ProtectionFromResourceEffect,
} from "../../model/spell-item/effect";
import { SaveTypeEnum } from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Spell, Weapon } from "../../model/spell-item/spell-item";
import tripService from "./trip.service";

function attach(trip: CreatureTripConfig = {}, size: "Small" | "Medium" | "Huge" = "Medium") {
  const creature = {
    id: MonsterEnum.WildDog,
    spells: [],
    data: { size: { value: size, tall: false, long: true } },
  } as unknown as Creature;
  const weapon = { file: "w1", header: { effects: [] } } as unknown as Weapon;
  tripService.attachTripToWeapon(creature, weapon, trip);
  const spell: Spell = creature.spells[0];
  return { weapon, spell, effects: spell.headers[0].effects };
}

const protections = (effects: Effect[]) =>
  effects.filter(
    (e): e is ProtectionFromResourceEffect => e.opcode === EffectTypeEnum.ProtectionFromResource,
  );
const immuneEntries = (effects: Effect[]) => protections(effects).map((e) => e.value);

describe("TripService", () => {
  it("marks the weapon and casts the trip on hit", () => {
    const { weapon, spell } = attach();
    expect(weapon.trip).toBe(true);
    const cast = weapon.header.effects.find(
      (e): e is CastSpellEffect => e.opcode === EffectTypeEnum.CastSpell,
    );
    expect(cast?.resource).toBe(spell.file);
    expect(cast?.saveTypes ?? []).toEqual([]);
  });

  it("knocks the victim prone: spell state, no movement, -4 AC, all on one save", () => {
    const { effects } = attach({ saveBonus: -2 });
    const saved = effects.filter((e) => e.opcode !== EffectTypeEnum.ProtectionFromResource);
    expect(saved.map((e) => e.opcode)).toEqual(
      expect.arrayContaining([
        EffectTypeEnum.SetExtendedSpellState,
        EffectTypeEnum.MovementRateBonus2,
        EffectTypeEnum.ArmorClassBonus,
        EffectTypeEnum.Sleep,
        EffectTypeEnum.DisplayPortraitIcon,
        EffectTypeEnum.DisplayString,
      ]),
    );
    // identical saves roll once: the victim falls or stays standing
    for (const e of saved) {
      expect(e.saveTypes).toEqual([SaveTypeEnum.ParalyzePoisonDeath]);
      expect(e.saveBonus).toBe(-2);
    }
    const state = saved.find((e) => e.opcode === EffectTypeEnum.SetExtendedSpellState);
    expect(state).toMatchObject({
      state: TRIP_DEFAULT_CONFIG.proneState,
      duration: TRIP_DEFAULT_CONFIG.duration,
    });
  });

  it("has no save with noSave", () => {
    const { effects } = attach({ noSave: true });
    for (const e of effects) expect(e.saveTypes ?? []).toEqual([]);
  });

  it("never gives the elves' sleep resistance to the whole trip", () => {
    const { effects } = attach();
    expect(effects.some((e) => e.opcode === EffectTypeEnum.UseEFFFile)).toBe(false);
  });

  it("keeps the sleeper targetable: its Sleep has an icon", () => {
    const { effects } = attach();
    const sleep = effects.find((e) => e.opcode === EffectTypeEnum.Sleep);
    expect(sleep?.special).toBe(TRIP_DEFAULT_CONFIG.portraitIcon);
  });

  it("removes the previous trip first, so a tripped victim doesn't stack it", () => {
    const { effects } = attach();
    const saved = effects.filter((e) => e.opcode !== EffectTypeEnum.ProtectionFromResource);
    expect(saved[0].opcode).toBe(EffectTypeEnum.RemoveEffectsByResource);
  });

  it("protections carry no save and come before the effects", () => {
    const { effects } = attach();
    const list = protections(effects);
    expect(list.length).toBeGreaterThan(0);
    expect(effects.slice(0, list.length)).toEqual(list);
    for (const e of list) expect(e.saveTypes ?? []).toEqual([]);
  });

  it("never trips the trip-immune creatures, whatever the attacker's size", () => {
    const entries = immuneEntries(attach({}, "Huge").effects);
    for (const [, entry] of TRIP_IMMUNE_CREATURES) expect(entries).toContain(entry);
  });

  it("can't trip a creature bigger than the attacker", () => {
    const small = immuneEntries(attach({}, "Small").effects);
    for (const [, entry] of [...LARGE_CREATURES, ...HUGE_CREATURES, ...GARGANTUAN_CREATURES]) {
      expect(small).toContain(entry);
    }
    const huge = immuneEntries(attach({}, "Huge").effects);
    for (const [, entry] of [...LARGE_CREATURES, ...HUGE_CREATURES]) {
      expect(huge).not.toContain(entry);
    }
  });
});

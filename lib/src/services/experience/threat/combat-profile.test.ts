import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../../../model/creature/creature";
import { CreatureData } from "../../../model/creature/data";
import { ImmunityConfig, ImmunityName } from "../../../model/final/immunity";
import {
  ItemAbilityTypeEnum,
  PoisonTypeEnum,
  RegenerationTypeEnum,
  SaveTypeEnum,
  SpellTypeEnum,
} from "../../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../../model/spell-item/effect.type";
import { Item, ItemHeader, Spell } from "../../../model/spell-item/spell-item";
import { State } from "../../../state";
import monsterFilesService from "../../monster-files.service";
import { combatProfile } from "./combat-profile";
import { threat } from "./duel";

const FILE = "TESTCRE";
const WEAPON = "TESTW1";
const SPELL = "TESTS1";

afterEach(() => {
  State.immunities = [];
  vi.restoreAllMocks();
});

function fakeCreature(p: {
  data?: Partial<CreatureData>;
  items?: Partial<Item>[];
  spells?: Partial<Spell>[];
  abilities?: object[];
}): Creature {
  const data = {
    level1: { pnpValue: 5, type: "none", value: 5 },
    movement: { pnpValue: 12 },
    strength: 10,
    dexterity: 10,
    constitution: 12,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hp: 40,
    ac: 5,
    thac0: 15,
    apr: 1,
    doubleApr: false,
    xpv: 500,
    alignment: "NEUTRAL",
    morale: 10,
    size: "Large",
    script: { remove: [] },
    proficiencies: [],
    immunities: [],
    items: { equipped: [], remove: [] },
    spells: { memorized: [] },
    effects: { list: [] },
    ...p.data,
  } as unknown as CreatureData;
  return {
    data,
    id: 1,
    files: [],
    attack: { dualWielding: false, melee: true, ranged: false },
    behavior: { abilities: (p.abilities ?? []).map((a) => ({ actions: [], ...a })) },
    autoImmunities: [],
    items: (p.items ?? []).map((i) => ({
      immunities: [],
      effects: [],
      equippedSlot: [],
      trait: false,
      ...i,
    })),
    spells: (p.spells ?? []).map((s) => ({ effects: [], headers: [], keywords: [], ...s })),
    adjustments: [],
  } as unknown as Creature;
}

function naturalWeapon(header: Partial<ItemHeader> = {}, item: Partial<Item> = {}): Partial<Item> {
  return {
    file: WEAPON,
    header: {
      type: ItemAbilityTypeEnum.Melee,
      diceThrown: 1,
      diceSize: 4,
      effects: [],
      ...header,
    },
    ...item,
  };
}

function effect(opcode: EffectTypeEnum, extra: object = {}) {
  return { opcode, ...extra } as never;
}

function level(value: number) {
  return { pnpValue: value, type: "none", value } as CreatureData["level1"];
}

const paralyze = effect(EffectTypeEnum.Paralyze, {
  saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
  duration: 12,
});

function ghoul(): Creature {
  return fakeCreature({
    data: { level1: level(2), hp: 24, ac: 6, thac0: 19, apr: 3 },
    items: [
      naturalWeapon({ diceSize: 3, effects: [paralyze] }, { file: "CLAW1" }),
      naturalWeapon({ diceSize: 3, effects: [paralyze] }, { file: "CLAW2" }),
      naturalWeapon({ diceSize: 6, effects: [paralyze] }, { file: "BITE" }),
    ],
  });
}

describe("combatProfile", () => {
  it("a ghoul: its stats and the XP round with a paralysis on each attack", () => {
    const profile = combatProfile({ creature: ghoul() });
    expect(profile).toMatchObject({ level: 2, hp: 24, ac: 6, thac0: 19, apr: 3 });
    // roundAttacks order: strongest first
    expect(profile.attacks.map((a) => a.average)).toEqual([3.5, 2, 2]);
    for (const attack of profile.attacks) {
      expect(attack.ranged).toBe(false);
      expect(attack.effects).toEqual([
        {
          kind: "ending",
          chance: 1,
          saves: [SaveTypeEnum.ParalyzePoisonDeath],
          saveBonus: 0,
          amount: 0,
          duration: 12,
        },
      ]);
    }
  });

  it("a plain creature has no powers, resistance or immunity", () => {
    expect(combatProfile({ creature: fakeCreature({}) })).toMatchObject({
      powers: [],
      invisibleAtWill: false,
      flies: false,
      resist: { slashing: 0, piercing: 0, missile: 0, magic: 0 },
      weaponEnchantment: 0,
      regeneration: 0,
      undead: false,
      construct: false,
      magicImmune: false,
      spellImmunity: false,
      declared: 0,
    });
  });

  it("a weapon casting a 10% 3d6 hug adds a tenth of its damage", () => {
    const creature = fakeCreature({
      items: [
        naturalWeapon({
          effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL, probability1: 10 })],
        }),
      ],
      spells: [
        { file: SPELL, effects: [effect(EffectTypeEnum.Damage, { diceThrown: 3, diceSize: 6 })] },
      ],
    });
    // 1d4 = 2.5, + 10.5 x 0.1
    expect(combatProfile({ creature }).attacks[0].average).toBeCloseTo(3.55);
  });

  it("strength damage adds to a melee hit", () => {
    const creature = fakeCreature({ data: { strength: 18 }, items: [naturalWeapon()] });
    // 1d4 = 2.5, + 2 for strength 18
    expect(combatProfile({ creature }).attacks[0].average).toBe(4.5);
  });

  it("the effects of a cast spell carry the cast's chance", () => {
    const creature = fakeCreature({
      items: [
        naturalWeapon({
          effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL, probability1: 25 })],
        }),
      ],
      spells: [
        {
          file: SPELL,
          effects: [
            effect(EffectTypeEnum.Poison, {
              type: PoisonTypeEnum.AmountDamagePerSecond,
              amount: 2,
              duration: 6,
              saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
              saveBonus: -2,
            }),
          ],
        },
      ],
    });
    expect(combatProfile({ creature }).attacks[0].effects).toEqual([
      {
        kind: "poison",
        chance: 0.25,
        saves: [SaveTypeEnum.ParalyzePoisonDeath],
        saveBonus: -2,
        amount: 2,
        duration: 6,
      },
    ]);
  });

  it("level drain, strength drain, fear, confusion and half effects", () => {
    const creature = fakeCreature({
      items: [
        naturalWeapon({
          effects: [
            effect(EffectTypeEnum.LevelDrain, { amount: 2 }),
            effect(EffectTypeEnum.StrengthBonus, { type: 0, value: -1, probability1: 50 }),
            effect(EffectTypeEnum.Panic),
            effect(EffectTypeEnum.Confusion),
            effect(EffectTypeEnum.Slow),
          ],
        }),
      ],
    });
    const effects = combatProfile({ creature }).attacks[0].effects;
    expect(effects.map((e) => [e.kind, e.amount, e.chance])).toEqual([
      ["drain", 2, 1],
      ["strengthDrain", 1, 0.5],
      ["fear", 0, 1],
      ["confusion", 0, 1],
      ["half", 0, 1],
    ]);
  });

  it("a game missile weapon adds two ranged attacks of 3.5", () => {
    vi.spyOn(monsterFilesService, "getCreatureRows").mockReturnValue([
      {
        file: FILE,
        level: undefined,
        xpv: undefined,
        items: [{ slot: "weapon1", file: "BOW01" }],
        scripts: [],
        validatedLevel: false,
        validatedItems: false,
        validatedScript: false,
      },
    ]);
    const creature = fakeCreature({ items: [naturalWeapon()] });
    const attacks = combatProfile({ creature, file: FILE }).attacks;
    expect(attacks.map((a) => [a.average, a.ranged])).toEqual([
      [2.5, false],
      [3.5, true],
      [3.5, true],
    ]);
  });

  it("the base creature shoots when most of its unadjusted files hold a launcher", () => {
    vi.spyOn(monsterFilesService, "getCreatureRows").mockImplementation((file) => [
      {
        file,
        level: undefined,
        xpv: undefined,
        items: file === "OTHER" ? [] : [{ slot: "weapon1", file: "BOW01" }],
        scripts: [],
        validatedLevel: false,
        validatedItems: false,
        validatedScript: false,
      },
    ]);
    const creature = fakeCreature({ items: [naturalWeapon()] });
    const files = (names: string[]) => names.map((name) => ({ name })) as Creature["files"];
    creature.files = files([FILE, "SECOND", "OTHER"]);
    expect(combatProfile({ creature }).attacks.filter((a) => a.ranged)).toHaveLength(2);
    creature.files = files([FILE, "OTHER"]);
    expect(combatProfile({ creature }).attacks.filter((a) => a.ranged)).toHaveLength(0);
  });

  it("a nonMagicalWeapons immunity needs a +1 weapon", () => {
    const creature = fakeCreature({ data: { immunities: ["nonMagicalWeapons"] } });
    expect(combatProfile({ creature }).weaponEnchantment).toBe(1);
  });

  it("the highest weapon immunity wins, through nested immunities", () => {
    State.immunities.push({
      name: "plusTwoWeapons",
      immunities: ["plusOneWeapons"],
    } as unknown as ImmunityConfig);
    const creature = fakeCreature({ data: { immunities: ["plusTwoWeapons"] } });
    expect(combatProfile({ creature }).weaponEnchantment).toBe(3);
  });

  it("the undead and construct traits, flying and magic immunity", () => {
    const names: ImmunityName[] = ["undead", "construct", "hover", "magic", "fireSpells"];
    const creature = fakeCreature({ items: [{ trait: true, immunities: names }] });
    expect(combatProfile({ creature })).toMatchObject({
      undead: true,
      construct: true,
      flies: true,
      magicImmune: true,
      spellImmunity: true,
      resist: { magic: 1 },
    });
  });

  it("resistances as shares: folded values, effects and damage resistance immunities", () => {
    const creature = fakeCreature({
      data: {
        resistSlashing: 25,
        resistMagic: 30,
        immunities: ["piercingDamageResistance", "missileWeapons"],
        effects: {
          list: [effect(EffectTypeEnum.SlashingResistanceModifier, { value: 10 })],
        },
      } as never,
    });
    expect(combatProfile({ creature }).resist).toEqual({
      slashing: 0.25,
      piercing: 0.5,
      missile: 1,
      magic: 0.3,
    });
  });

  it("regeneration in hp a round, stacked effects adding up", () => {
    const creature = fakeCreature({
      data: {
        effects: {
          list: [
            effect(EffectTypeEnum.Regeneration, {
              type: RegenerationTypeEnum.AmountHPperSecond,
              amount: 1,
            }),
            effect(EffectTypeEnum.Regeneration, {
              type: RegenerationTypeEnum.OneHPperAmountSeconds,
              amount: 3,
            }),
          ],
        },
      } as never,
    });
    expect(combatProfile({ creature }).regeneration).toBe(8);
  });

  it("an own power at will has unlimited uses, its damage averaged", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: SPELL, memorizedCount: 90 }] } } as never,
      spells: [
        {
          file: SPELL,
          type: SpellTypeEnum.Innate,
          keywords: ["area"],
          headers: [
            {
              range: 30,
              effects: [
                effect(EffectTypeEnum.Damage, { diceThrown: 2, diceSize: 6, amount: 1 }),
                effect(EffectTypeEnum.Sleep, { saveTypes: [SaveTypeEnum.Spell], duration: 30 }),
              ],
            },
          ] as never,
        },
      ],
    });
    const [power] = combatProfile({ creature }).powers;
    expect(power).toMatchObject({ name: SPELL, uses: Infinity, ranged: true, area: true });
    expect(power.average).toBe(8);
    expect(power.effects.map((e) => e.kind)).toEqual(["ending"]);
  });

  it("no weapon: no attacks, the threat still scores, from its powers or the 30-round cap", () => {
    const bare = combatProfile({ creature: fakeCreature({}) });
    expect(bare.attacks).toEqual([]);
    const unarmed = threat(bare);
    expect(unarmed.melee.monsterRounds).toBe(30);
    expect(unarmed.ranged.monsterRounds).toBe(30);
    expect(Number.isFinite(unarmed.threat) && unarmed.threat > 0).toBe(true);
    const caster = fakeCreature({
      data: { spells: { memorized: [{ file: SPELL, memorizedCount: 90 }] } } as never,
      spells: [
        {
          file: SPELL,
          type: SpellTypeEnum.Innate,
          headers: [
            {
              range: 30,
              effects: [effect(EffectTypeEnum.Damage, { diceThrown: 2, diceSize: 6, amount: 1 })],
            },
          ] as never,
        },
      ],
    });
    const profile = combatProfile({ creature: caster });
    expect(profile.attacks).toEqual([]);
    const powered = threat(profile);
    expect(powered.melee.monsterRounds).toBeLessThan(30);
    expect(powered.ranged.monsterRounds).toBeLessThan(30);
    expect(powered.threat).toBeGreaterThan(unarmed.threat);
    const notes = [...powered.melee.notes, ...powered.ranged.notes].join();
    expect(notes).not.toContain("NaN");
  });

  it("a power an ability casts on a timer counts its casts over a 30-round duel", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, type: SpellTypeEnum.Innate }],
      abilities: [{ resource: SPELL, timer: { name: "leap", value: 24 } }],
    });
    // 30 rounds x 6 s / 24 s = 7.5, rounded up
    expect(combatProfile({ creature }).powers[0].uses).toBe(8);
    // 24 s = 4 rounds between casts
    expect(combatProfile({ creature }).powers[0].cooldown).toBe(4);
  });

  it("a power an ability casts with no timer is at will", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, type: SpellTypeEnum.Innate }],
      abilities: [{ resource: SPELL }],
    });
    expect(combatProfile({ creature }).powers[0].uses).toBe(Infinity);
  });

  it("a memorized own power counts its uses", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: SPELL, memorizedCount: 2 }] } } as never,
      spells: [{ file: SPELL, type: SpellTypeEnum.Innate }],
    });
    expect(combatProfile({ creature }).powers[0].uses).toBe(2);
  });

  it("a memorized game spell is a power with its profile's level and role, no damage yet", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: "SPWI304", memorizedCount: 1 }] } } as never,
    });
    expect(combatProfile({ creature }).powers).toEqual([
      expect.objectContaining({
        uses: 1,
        level: 3,
        role: "damage",
        average: 0,
        effects: [],
        area: true,
      }),
    ]);
  });

  it("declared abilities are counted", () => {
    const creature = fakeCreature({ data: { xpAbilities: ["swallowsWhole", "flies"] } });
    expect(combatProfile({ creature }).declared).toBe(2);
  });
});

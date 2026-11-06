import { afterEach, describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import { Game } from "../../model/creature/game";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Item } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import { detectHitDice, detectStatAbilities, matchingAdjustments } from "./experience-detection";

const FILE = "TESTCRE";

afterEach(() => {
  State.immunities = [];
});

function registerImmunity(name: ImmunityName, immunities: ImmunityName[]): void {
  State.immunities.push({ name, immunities } as unknown as ImmunityConfig);
}

function fakeCreature(p: {
  data?: Partial<CreatureData>;
  adjustments?: { files: string[]; game?: Game; data: Partial<CreatureData> }[];
  items?: Partial<Item>[];
  autoImmunities?: ImmunityName[];
}): Creature {
  const data: CreatureData = {
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
    attack: { dualWielding: false },
    autoImmunities: p.autoImmunities ?? [],
    items: (p.items ?? []).map((i) => ({ immunities: [], effects: [], trait: false, ...i })),
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: a.files,
      noWeapon: false,
      game: a.game,
      summon: false,
      scriptName: false,
      data: {
        script: { remove: [] },
        proficiencies: [],
        immunities: [],
        items: { equipped: [], remove: [] },
        spells: { memorized: [] },
        effects: { list: [] },
        ...a.data,
      },
    })),
  } as unknown as Creature;
}

function level(value: number) {
  return { pnpValue: value, type: "none", value } as CreatureData["level1"];
}

describe("matchingAdjustments", () => {
  it("returns the adjustments covering the file for the game, untagged ones included", () => {
    const creature = fakeCreature({
      adjustments: [
        { files: [FILE], data: {} },
        { files: [FILE], game: "bg1", data: {} },
        { files: [FILE], game: "bg2", data: {} },
        { files: ["OTHER"], data: {} },
      ],
    });
    const result = matchingAdjustments({ creature, file: FILE, game: "bg2" });
    expect(result).toEqual([creature.adjustments[0], creature.adjustments[2]]);
  });

  it("returns nothing for the base scope", () => {
    const creature = fakeCreature({ adjustments: [{ files: [FILE], data: {} }] });
    expect(matchingAdjustments({ creature })).toEqual([]);
  });
});

describe("detectHitDice", () => {
  it("takes the adjusted Hit Dice and the base bonus hp", () => {
    const creature = fakeCreature({
      data: { bonusHp: 1 },
      adjustments: [{ files: [FILE], data: { level1: level(9) } }],
    });
    expect(detectHitDice({ creature, file: FILE })).toEqual({ whole: 9, plus: true });
  });

  it("has no plus without bonus hp", () => {
    expect(detectHitDice({ creature: fakeCreature({}) })).toEqual({ whole: 5, plus: false });
  });

  it("an adjustment clearing the bonus hp drops the plus", () => {
    const creature = fakeCreature({
      data: { bonusHp: 2 },
      adjustments: [{ files: [FILE], data: { bonusHp: 0 } }],
    });
    expect(detectHitDice({ creature, file: FILE })).toEqual({ whole: 5, plus: false });
  });

  it("the base scope ignores adjustments", () => {
    const creature = fakeCreature({
      adjustments: [{ files: [FILE], data: { level1: level(9), bonusHp: 3 } }],
    });
    expect(detectHitDice({ creature })).toEqual({ whole: 5, plus: false });
  });
});

describe("detectStatAbilities", () => {
  it("detects nothing on a plain creature", () => {
    expect(detectStatAbilities({ creature: fakeCreature({}) })).toEqual([]);
  });

  it("acZeroOrLower from the effective AC", () => {
    const creature = fakeCreature({ adjustments: [{ files: [FILE], data: { ac: -2 } }] });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "acZeroOrLower", source: "AC -2" },
    ]);
  });

  it("fourAttacks from the effective attacks per round", () => {
    const creature = fakeCreature({ data: { apr: 2, doubleApr: true } });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "fourAttacks", source: "4 attacks" },
    ]);
  });

  it("highIntelligence from the effective Intelligence", () => {
    const creature = fakeCreature({ adjustments: [{ files: [FILE], data: { intelligence: 13 } }] });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "highIntelligence", source: "Intelligence 13" },
    ]);
  });

  it("extraHitPoints from bonus hp per Hit Die", () => {
    const creature = fakeCreature({ data: { bonusHpPerHitDie: 2 } });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "extraHitPoints", source: "+2 hp per Hit Die" },
    ]);
  });

  it("extraHitPoints from special bonus hp", () => {
    const creature = fakeCreature({
      adjustments: [{ files: [FILE], data: { specialBonusHp: 10 } }],
    });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "extraHitPoints", source: "+10 special hp" },
    ]);
  });

  it("magicResistance from the folded resistMagic", () => {
    const creature = fakeCreature({ adjustments: [{ files: [FILE], data: { resistMagic: 25 } }] });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "magicResistance", source: "25% magic resistance" },
    ]);
  });

  it("magicResistance from a magic resistance immunity", () => {
    const creature = fakeCreature({
      items: [{ trait: true, immunities: ["magicResistance"] }],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "magicResistance", source: "magicResistance" },
    ]);
  });

  it("regeneration from a base effect", () => {
    const creature = fakeCreature({
      data: { effects: { list: [{ opcode: EffectTypeEnum.Regeneration }] } as never },
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "regeneration", source: "regeneration effect" },
    ]);
  });

  it("regeneration from an adjustment effect, for that file only", () => {
    const creature = fakeCreature({
      adjustments: [
        {
          files: [FILE],
          data: { effects: { list: [{ opcode: EffectTypeEnum.Regeneration }] } as never },
        },
      ],
    });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "regeneration", source: "regeneration effect" },
    ]);
    expect(detectStatAbilities({ creature })).toEqual([]);
  });

  it("regeneration from a trait item effect", () => {
    const creature = fakeCreature({
      items: [{ trait: true, effects: [{ opcode: EffectTypeEnum.Regeneration }] as never }],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "regeneration", source: "regeneration effect" },
    ]);
  });

  it("ignores a regeneration effect on a non-trait item", () => {
    const creature = fakeCreature({
      items: [{ trait: false, effects: [{ opcode: EffectTypeEnum.Regeneration }] as never }],
    });
    expect(detectStatAbilities({ creature })).toEqual([]);
  });

  it("spellImmunity from effective and automatic immunities", () => {
    const creature = fakeCreature({
      autoImmunities: ["hold"],
      adjustments: [{ files: [FILE], data: { immunities: ["charm", "poison"] } }],
    });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "spellImmunity", source: "charm, hold" },
    ]);
  });

  it("a skeleton's type traits give spell and weapon immunity through nested immunities", () => {
    registerImmunity("undead", ["sleep", "hold", "mindSpells", "poison"]);
    registerImmunity("mindSpells", ["charm", "fear", "hold"]);
    registerImmunity("skeletal", [
      "cold",
      "coldSpells",
      "slashingDamageResistance",
      "missileDamageResistance",
      "piercingDamageResistance",
    ]);
    const creature = fakeCreature({
      data: { immunities: ["undead"] },
      items: [{ trait: true, immunities: ["skeletal"] }],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "spellImmunity", source: "charm, coldSpells, hold, mindSpells, sleep" },
      {
        ability: "weaponImmunity",
        source: "missileDamageResistance, piercingDamageResistance, slashingDamageResistance",
      },
    ]);
  });

  it("nested immunities that loop are walked once", () => {
    registerImmunity("undead", ["mindSpells"]);
    registerImmunity("mindSpells", ["undead", "charm"]);
    const creature = fakeCreature({ data: { immunities: ["undead"] } });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "spellImmunity", source: "charm, mindSpells" },
    ]);
  });

  it("weaponImmunity from a damage type immunity", () => {
    const creature = fakeCreature({ data: { immunities: ["slashingDamage"] } });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "weaponImmunity", source: "slashingDamage" },
    ]);
  });

  it("weaponImmunity from a damage resistance of 50 or more", () => {
    const creature = fakeCreature({
      adjustments: [{ files: [FILE], data: { resistCrushing: 50, resistPiercing: 25 } }],
    });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "weaponImmunity", source: "50% crushing resistance" },
    ]);
  });

  it("no weaponImmunity under 50% resistance", () => {
    const creature = fakeCreature({ data: { resistSlashing: 49, resistMissile: 30 } });
    expect(detectStatAbilities({ creature })).toEqual([]);
  });

  it("magicalWeaponsOnly from a non-magical weapons immunity", () => {
    const creature = fakeCreature({
      items: [{ trait: true, immunities: ["nonMagicalWeapons"] }],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "magicalWeaponsOnly", source: "nonMagicalWeapons" },
    ]);
  });

  it("magicalWeaponsOnly from a +2 weapons immunity", () => {
    const creature = fakeCreature({ data: { immunities: ["plusTwoWeapons"] } });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "magicalWeaponsOnly", source: "plusTwoWeapons" },
    ]);
  });

  it("declared abilities, each sourced as declared", () => {
    const creature = fakeCreature({ data: { xpAbilities: ["swallowsWhole", "flies"] } });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "swallowsWhole", source: "declared" },
      { ability: "flies", source: "declared" },
    ]);
  });

  it("an adjustment's declared list replaces the base list", () => {
    const creature = fakeCreature({
      data: { xpAbilities: ["swallowsWhole"] },
      adjustments: [{ files: [FILE], data: { xpAbilities: ["flies"] } }],
    });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "flies", source: "declared" },
    ]);
  });

  it("the base scope ignores adjustments", () => {
    const creature = fakeCreature({
      data: { xpAbilities: ["swallowsWhole"] },
      adjustments: [{ files: [FILE], data: { ac: -2, intelligence: 18, xpAbilities: ["flies"] } }],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "swallowsWhole", source: "declared" },
    ]);
  });

  it("ignores adjustments tagged for another game", () => {
    const creature = fakeCreature({
      adjustments: [{ files: [FILE], game: "bg1", data: { ac: -2 } }],
    });
    expect(detectStatAbilities({ creature, file: FILE, game: "bg2" })).toEqual([]);
  });
});

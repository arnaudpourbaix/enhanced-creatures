import { afterEach, describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import { Game } from "../../model/creature/game";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { CreatureAbility } from "../../model/creature/ability";
import {
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
} from "../../model/spell-item/effect.enums";
import { Item, ItemHeader, Spell } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import translationService from "../translation.service";
import {
  detectAbilities,
  detectAttackAbilities,
  detectHitDice,
  detectStatAbilities,
  matchingAdjustments,
} from "./experience-detection";

const FILE = "TESTCRE";

afterEach(() => {
  State.immunities = [];
});

function registerImmunity(name: ImmunityName, immunities: ImmunityName[]): void {
  State.immunities.push({ name, immunities } as unknown as ImmunityConfig);
}

function fakeCreature(p: {
  data?: Partial<CreatureData>;
  adjustments?: {
    files: string[];
    game?: Game;
    noWeapon?: boolean;
    data: Partial<CreatureData>;
  }[];
  items?: Partial<Item>[];
  spells?: Partial<Spell>[];
  abilities?: Partial<CreatureAbility>[];
  ranged?: boolean;
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
    attack: { dualWielding: false, melee: true, ranged: p.ranged ?? false },
    behavior: {
      abilities: (p.abilities ?? []).map((a) => ({ actions: [], ...a })),
    },
    autoImmunities: p.autoImmunities ?? [],
    items: (p.items ?? []).map((i) => ({
      immunities: [],
      effects: [],
      equippedSlot: [],
      trait: false,
      ...i,
    })),
    spells: (p.spells ?? []).map((s) => ({ effects: [], headers: [], ...s })),
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: a.files,
      noWeapon: a.noWeapon ?? false,
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

  it("a skeleton's type traits give spell immunity and a special defense through nested immunities", () => {
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
        ability: "specialDefense",
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

  it("specialDefense from any damage resistance above 0", () => {
    const creature = fakeCreature({
      adjustments: [{ files: [FILE], data: { resistCrushing: 50, resistPiercing: 25, resistMissile: 0 } }],
    });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "specialDefense", source: "50% crushing resistance, 25% piercing resistance" },
    ]);
  });

  it("no specialDefense without a damage resistance", () => {
    const creature = fakeCreature({ data: { resistSlashing: 0 } });
    expect(detectStatAbilities({ creature })).toEqual([]);
  });

  it("a full weapon immunity and a damage resistance are two separate abilities", () => {
    const creature = fakeCreature({
      data: { immunities: ["missileWeapons", "slashingDamageResistance"], resistPiercing: 60 },
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "weaponImmunity", source: "missileWeapons" },
      { ability: "specialDefense", source: "slashingDamageResistance, 60% piercing resistance" },
    ]);
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

const WEAPON = "TESTW1";
const SPELL = "TESTS1";

/** A natural weapon in no slot (picked by weapon switching), 1d4 unless the header says otherwise. */
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

function equipped(file: string, slot: string): Partial<CreatureData> {
  return { items: { equipped: [{ file, slot }], remove: [] } } as unknown as Partial<CreatureData>;
}

function effect(opcode: EffectTypeEnum, extra: object = {}) {
  return { opcode, ...extra } as never;
}

describe("detectAttackAbilities", () => {
  it("detects nothing on a plain creature", () => {
    expect(detectAttackAbilities({ creature: fakeCreature({}) })).toEqual([]);
  });

  it("poison from a natural weapon's on-hit effect, the weapon as source", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.Poison)] })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([{ ability: "poison", source: WEAPON }]);
  });

  it("the source names the weapon when its name is known", () => {
    const stringRef = translationService.addCustomTranslation(["Venom Claw"]);
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.Poison)] }, { stringRef })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "poison", source: `${WEAPON} (Venom Claw)` },
    ]);
  });

  it("poison from the poison option: a cast spell with the Poison secondary type", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [{ file: SPELL, secondaryType: "Poison" }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([{ ability: "poison", source: WEAPON }]);
  });

  it("follows cast spells to their effects", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [
        {
          file: SPELL,
          headers: [
            {
              type: ItemAbilityTypeEnum.Melee,
              effects: [effect(EffectTypeEnum.CastSpellOnCondition, { resource: "TESTS2" })],
            },
          ],
        },
        { file: "TESTS2", effects: [effect(EffectTypeEnum.LevelDrain)] },
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "energyDrain", source: WEAPON },
    ]);
  });

  it.each([
    [EffectTypeEnum.Poison, "poison"],
    [EffectTypeEnum.Paralyze, "paralysis"],
    [EffectTypeEnum.Hold, "paralysis"],
    [EffectTypeEnum.HoldCreatureSpell, "paralysis"],
    [EffectTypeEnum.Petrification, "petrification"],
    [EffectTypeEnum.LevelDrain, "energyDrain"],
    [EffectTypeEnum.Disease, "causesDisease"],
    [EffectTypeEnum.Panic, "weaknessOrFear"],
  ])("maps opcode %s to %s", (opcode, ability) => {
    const creature = fakeCreature({ items: [naturalWeapon({ effects: [effect(opcode)] })] });
    expect(detectAttackAbilities({ creature })).toEqual([{ ability, source: WEAPON }]);
  });

  it.each([
    ["Disease", "causesDisease"],
    ["Fear", "weaknessOrFear"],
  ] as const)("maps the %s secondary type to %s", (secondaryType, ability) => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [{ file: SPELL, secondaryType }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([{ ability, source: WEAPON }]);
  });

  it("weaknessOrFear from a negative Strength modifier", () => {
    const drain = effect(EffectTypeEnum.StrengthBonus, {
      type: EffectStatisticModifierEnum.Increment,
      value: -1,
    });
    const creature = fakeCreature({ items: [naturalWeapon({ effects: [drain] })] });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "weaknessOrFear", source: WEAPON },
    ]);
  });

  it("no weaknessOrFear from a Strength bonus", () => {
    const bonus = effect(EffectTypeEnum.StrengthBonus, {
      type: EffectStatisticModifierEnum.Increment,
      value: 2,
    });
    const creature = fakeCreature({ items: [naturalWeapon({ effects: [bonus] })] });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("invisibleAtWill from an ability's spell turning the caster invisible", () => {
    const creature = fakeCreature({
      spells: [
        {
          file: SPELL,
          headers: [
            {
              type: ItemAbilityTypeEnum.Magical,
              target: ItemAbilityTargetEnum.Caster,
              effects: [effect(EffectTypeEnum.Invisibility)],
            },
          ],
        },
      ],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "invisibleAtWill", source: SPELL },
    ]);
  });

  it("invisibleAtWill from a self-targeted Invisibility effect", () => {
    const creature = fakeCreature({
      spells: [
        {
          file: SPELL,
          effects: [effect(EffectTypeEnum.Invisibility, { target: EffectTargetEnum.Self })],
        },
      ],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "invisibleAtWill", source: SPELL },
    ]);
  });

  it("no invisibleAtWill when Invisibility lands on someone else", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.Invisibility)] })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("behaviour abilities count through their spells' effects, the spell as source", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, effects: [effect(EffectTypeEnum.Hold)] }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([{ ability: "paralysis", source: SPELL }]);
  });

  it("an equipped own item's on-hit effects count", () => {
    const creature = fakeCreature({
      data: equipped(WEAPON, "WEAPON1"),
      items: [
        {
          file: WEAPON,
          equippedSlot: ["WEAPON1"],
          header: { type: ItemAbilityTypeEnum.Melee, effects: [effect(EffectTypeEnum.Disease)] },
        },
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "causesDisease", source: WEAPON },
    ]);
  });

  it("an item an adjustment equips counts for its file only", () => {
    const creature = fakeCreature({
      items: [
        {
          file: WEAPON,
          header: { type: ItemAbilityTypeEnum.Melee, effects: [effect(EffectTypeEnum.Disease)] },
        },
      ],
      adjustments: [{ files: [FILE], data: equipped(WEAPON, "WEAPON1") }],
    });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([
      { ability: "causesDisease", source: WEAPON },
    ]);
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("an adjustment with noWeapon drops the weapons' on-hit abilities", () => {
    const creature = fakeCreature({
      data: equipped("TESTW2", "WEAPON2"),
      items: [
        naturalWeapon({ effects: [effect(EffectTypeEnum.Poison)] }),
        {
          file: "TESTW2",
          equippedSlot: ["WEAPON2"],
          header: { type: ItemAbilityTypeEnum.Melee, effects: [effect(EffectTypeEnum.Disease)] },
        },
      ],
      adjustments: [{ files: [FILE], noWeapon: true, data: {} }],
    });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([]);
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual([
      "poison",
      "causesDisease",
    ]);
  });

  it("a natural weapon whose slot an adjustment fills with another item is not wielded", () => {
    const creature = fakeCreature({
      data: equipped(WEAPON, "WEAPON1"),
      items: [
        naturalWeapon({ effects: [effect(EffectTypeEnum.Poison)] }, { equippedSlot: ["WEAPON1"] }),
      ],
      adjustments: [{ files: [FILE], data: equipped("SW1H01", "WEAPON1") }],
    });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([]);
  });

  it("ignores the trait item's effects", () => {
    const creature = fakeCreature({
      items: [{ trait: true, effects: [effect(EffectTypeEnum.Poison)] }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("one entry per ability, joining its sources", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.Poison)] })],
      spells: [{ file: SPELL, effects: [effect(EffectTypeEnum.Poison)] }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "poison", source: `${WEAPON}, ${SPELL}` },
    ]);
  });

  it("memorized level 2 and level 4 spells give only highSpells", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [
            { file: "SPWI203", memorizedCount: 1, level: 2 },
            { file: "SPWI404", memorizedCount: 1, level: 4 },
          ],
        },
      } as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "highSpells", source: "SPWI404" },
    ]);
  });

  it("lowSpells from a memorized level 1 spell resolved through SPELLS", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: "SPWI112", memorizedCount: 1 }] } } as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "lowSpells", source: "SPWI112" },
    ]);
  });

  it("a spell an adjustment memorizes counts for its file", () => {
    const creature = fakeCreature({
      adjustments: [
        { files: [FILE], data: { spells: { memorized: [{ file: "SPWI304" }] } } as never },
      ],
    });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([
      { ability: "highSpells", source: "SPWI304" },
    ]);
  });

  it("a spell whose memorized count drops to zero is gone", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: "SPWI304", memorizedCount: 1 }] } } as never,
      adjustments: [
        {
          files: [FILE],
          data: { spells: { memorized: [{ file: "SPWI304", memorizedCount: 0 }] } } as never,
        },
      ],
    });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([]);
  });

  it("takes the highest level across spellbook variants", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [{ file: "SPWI112", memorizedCount: 1 }],
          spellbooks: [
            { mod: "SpellRevisions", memorized: [{ file: "SPWI112", memorizedCount: 1 }] },
            { mod: "FaithsAndPowers", memorized: [{ file: "SPWI304", memorizedCount: 1 }] },
          ],
        },
      } as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "highSpells", source: "SPWI304" },
    ]);
  });

  it("behaviour abilities with a numeric level count as spells, null ones do not", () => {
    const creature = fakeCreature({
      abilities: [
        { resource: "TESTS9", level: null },
        { resource: SPELL, level: 2 },
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([{ ability: "lowSpells", source: SPELL }]);
  });

  it("class and kit abilities (SPCL files) are not spellcasting", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: "SPCL423", memorizedCount: 1 }] } } as never,
      abilities: [
        { resource: "SPCL423", level: 1 },
        { resource: "SPCL999", level: 4 },
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("missileWeapons from a ranged attack", () => {
    const creature = fakeCreature({ ranged: true });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "missileWeapons", source: "ranged attack" },
    ]);
  });

  it("missileWeapons from an item in a quiver slot", () => {
    const creature = fakeCreature({ data: equipped("AROW01", "QUIVER1") });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "missileWeapons", source: "AROW01" },
    ]);
  });

  it("a 2d10+2 natural weapon at 2 attacks gives singleAttack20 and multipleAttacks30", () => {
    const creature = fakeCreature({
      data: { apr: 2 },
      items: [naturalWeapon({ diceThrown: 2, diceSize: 10, damageBonus: 2 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "singleAttack20", source: `${WEAPON}: 2d10+2 = 22` },
      { ability: "multipleAttacks30", source: `${WEAPON}: 22 x 2 attacks = 44` },
    ]);
  });

  it("a single 1d20 attack gives only singleAttack20", () => {
    const creature = fakeCreature({ items: [naturalWeapon({ diceThrown: 1, diceSize: 20 })] });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "singleAttack20", source: `${WEAPON}: 1d20 = 20` },
    ]);
  });

  it("3d6 at 2 attacks gives only multipleAttacks30", () => {
    const creature = fakeCreature({
      data: { apr: 2 },
      items: [naturalWeapon({ diceThrown: 3, diceSize: 6 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "multipleAttacks30", source: `${WEAPON}: 18 x 2 attacks = 36` },
    ]);
  });

  it("no damage abilities under the thresholds", () => {
    const creature = fakeCreature({
      data: { apr: 3 },
      items: [naturalWeapon({ diceThrown: 1, diceSize: 8, damageBonus: 1 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });
});

describe("detectAbilities", () => {
  it("returns the stat abilities followed by the attack abilities", () => {
    const creature = fakeCreature({
      data: { ac: -1, xpAbilities: ["flies"] },
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.Poison)] })],
    });
    expect(detectAbilities({ creature })).toEqual([
      { ability: "acZeroOrLower", source: "AC -1" },
      { ability: "flies", source: "declared" },
      { ability: "poison", source: WEAPON },
    ]);
  });
});

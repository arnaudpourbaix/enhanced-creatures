import { afterEach, describe, expect, it, vi } from "vitest";
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
  SpellTypeEnum,
} from "../../model/spell-item/effect.enums";
import { Item, ItemHeader, Spell } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import translationService from "../translation.service";
import monsterFilesService from "../monster-files.service";
import {
  detectAbilities,
  detectAttackAbilities,
  detectHitDice,
  detectStatAbilities,
  matchingAdjustments,
  missingPowerLevels,
  setSharedResources,
} from "./experience-detection";

const FILE = "TESTCRE";

afterEach(() => {
  State.immunities = [];
  vi.restoreAllMocks();
});

/** Mocks creatures.csv: each file's weapon1..n game items. */
function csvWeapons(byFile: Record<string, string[]>): void {
  vi.spyOn(monsterFilesService, "getCreatureRows").mockImplementation((file) => {
    const weapons = byFile[file.toUpperCase()];
    if (!weapons) return [];
    return [
      {
        file,
        level: undefined,
        xpv: undefined,
        items: weapons.map((w, i) => ({ slot: `weapon${i + 1}`, file: w })),
        scripts: [],
        validatedLevel: false,
        validatedItems: false,
        validatedScript: false,
      },
    ];
  });
}

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
  files?: string[];
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
    files: (p.files ?? []).map((name) => ({ name })),
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

  it("lowMagicResistance from a folded resistMagic of 20-49%", () => {
    const creature = fakeCreature({ adjustments: [{ files: [FILE], data: { resistMagic: 25 } }] });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "lowMagicResistance", source: "25% magic resistance" },
    ]);
  });

  it("magicResistance from a folded resistMagic of 50% or more", () => {
    const creature = fakeCreature({ adjustments: [{ files: [FILE], data: { resistMagic: 50 } }] });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "magicResistance", source: "50% magic resistance" },
    ]);
  });

  it("no magic resistance ability under 20%", () => {
    const creature = fakeCreature({ adjustments: [{ files: [FILE], data: { resistMagic: 15 } }] });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([]);
  });

  it("magicResistance from a magic resistance immunity", () => {
    const creature = fakeCreature({
      items: [{ trait: true, immunities: ["magicResistance"] }],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "magicResistance", source: "magicResistance" },
    ]);
  });

  it("lowMagicResistance from a positive magic resistance effect on a trait item", () => {
    const creature = fakeCreature({
      items: [
        {
          trait: true,
          effects: [{ opcode: EffectTypeEnum.MagicResistanceModifier, value: 20 }] as never,
        },
      ],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "lowMagicResistance", source: "20% magic resistance" },
    ]);
  });

  it("the highest of resistMagic and a magic resistance effect sets the tier", () => {
    const creature = fakeCreature({
      data: {
        resistMagic: 30,
        effects: { list: [{ opcode: EffectTypeEnum.MagicResistanceModifier, value: 75 }] },
      } as never,
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "magicResistance", source: "75% magic resistance" },
    ]);
  });

  it("no magicResistance from a magic resistance effect lowering it", () => {
    const creature = fakeCreature({
      data: {
        effects: { list: [{ opcode: EffectTypeEnum.MagicResistanceModifier, value: -10 }] },
      } as never,
    });
    expect(detectStatAbilities({ creature })).toEqual([]);
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

  it("the hover trait marks a flier", () => {
    const creature = fakeCreature({ items: [{ trait: true, immunities: ["hover"] }] });
    expect(detectStatAbilities({ creature })).toEqual([{ ability: "flies", source: "hover" }]);
  });

  it("a flier's ground spell immunities are its flying, not spell immunity", () => {
    registerImmunity("hover", ["entangle", "web"]);
    const creature = fakeCreature({ items: [{ trait: true, immunities: ["hover"] }] });
    expect(detectStatAbilities({ creature })).toEqual([{ ability: "flies", source: "hover" }]);
  });

  it("an equipped trait owned by a fellow member counts (greater wyvern keeps the hover)", () => {
    const creature = fakeCreature({ data: equipped("TRAIT", "AMULET") });
    setSharedResources(creature, {
      items: [{ file: "TRAIT", trait: true, immunities: ["hover"], effects: [] }] as never,
    });
    expect(detectStatAbilities({ creature })).toEqual([{ ability: "flies", source: "hover" }]);
  });

  it("movement 9 or less is slow, 15 or more fast, a player's 12 neither", () => {
    const at = (pnpValue: number) =>
      detectStatAbilities({
        creature: fakeCreature({ data: { movement: { pnpValue } } as never }),
      });
    expect(at(6)).toEqual([{ ability: "slowMovement", source: "movement 6" }]);
    expect(at(9)).toEqual([{ ability: "slowMovement", source: "movement 9" }]);
    expect(at(12)).toEqual([]);
    expect(at(15)).toEqual([{ ability: "fastMovement", source: "movement 15" }]);
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

  it("weaponImmunity from any damage resistance above 0", () => {
    const creature = fakeCreature({
      adjustments: [
        { files: [FILE], data: { resistCrushing: 50, resistPiercing: 25, resistMissile: 0 } },
      ],
    });
    expect(detectStatAbilities({ creature, file: FILE })).toEqual([
      { ability: "weaponImmunity", source: "50% crushing resistance, 25% piercing resistance" },
    ]);
  });

  it("weaponImmunity from a positive resistance effect on a trait item", () => {
    const creature = fakeCreature({
      items: [
        {
          trait: true,
          effects: [
            { opcode: EffectTypeEnum.SlashingResistanceModifier, value: 25 },
            { opcode: EffectTypeEnum.MissilesResistanceModifier, value: 25 },
            { opcode: EffectTypeEnum.CrushingResistanceModifier, value: 0 },
            { opcode: EffectTypeEnum.PiercingResistanceModifier, value: -10 },
          ] as never,
        },
      ],
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "weaponImmunity", source: "25% slashing resistance, 25% missile resistance" },
    ]);
  });

  it("weaponImmunity from a resistance effect in the creature data", () => {
    const creature = fakeCreature({
      data: {
        effects: { list: [{ opcode: EffectTypeEnum.CrushingResistanceModifier, value: 10 }] },
      } as never,
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "weaponImmunity", source: "10% crushing resistance" },
    ]);
  });

  it("no weaponImmunity without a damage resistance", () => {
    const creature = fakeCreature({ data: { resistSlashing: 0 } });
    expect(detectStatAbilities({ creature })).toEqual([]);
  });

  it("a full weapon immunity and a damage resistance count once as weaponImmunity", () => {
    const creature = fakeCreature({
      data: { immunities: ["missileWeapons", "slashingDamageResistance"], resistPiercing: 60 },
    });
    expect(detectStatAbilities({ creature })).toEqual([
      {
        ability: "weaponImmunity",
        source: "missileWeapons, slashingDamageResistance, 60% piercing resistance",
      },
    ]);
  });

  it("a damage resistance and magical-weapons-only are two separate abilities", () => {
    const creature = fakeCreature({
      data: { immunities: ["nonMagicalWeapons"], resistSlashing: 25 },
    });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "weaponImmunity", source: "25% slashing resistance" },
      { ability: "magicalWeaponsOnly", source: "nonMagicalWeapons" },
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

/** A second spell, so a creature's other spell counts as a caster tier, not a single power */
const MAGIC_MISSILE = {
  spells: { memorized: [{ file: "SPWI112", memorizedCount: 1 }] },
} as unknown as Partial<CreatureData>;

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
      { ability: "poison", source: "Venom Claw" },
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

  it("a memorized own spell counts through its header effects (basilisk gaze)", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: SPELL, memorizedCount: 1 }] } } as never,
      spells: [
        {
          file: SPELL,
          headers: [{ effects: [effect(EffectTypeEnum.Petrification)] }] as never,
        },
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "petrification", source: SPELL },
    ]);
  });

  it("an own innate power dealing damage is a special non-magical attack (ankheg stream)", () => {
    const creature = fakeCreature({
      spells: [
        {
          file: SPELL,
          type: SpellTypeEnum.Innate,
          headers: [{ effects: [effect(EffectTypeEnum.Damage)] }] as never,
        },
      ],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialAttack", source: SPELL },
    ]);
  });

  it("an own wizard power is a spell: its level counts, not an attack form (cone of cold)", () => {
    const creature = fakeCreature({
      data: MAGIC_MISSILE,
      spells: [
        {
          file: SPELL,
          type: SpellTypeEnum.Wizard,
          level: 5,
          effects: [effect(EffectTypeEnum.Damage)],
        },
      ],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "greaterSpells", source: SPELL },
    ]);
  });

  it("a single spell is a special attack, not a caster tier (stone golem's slow)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, type: 1, level: 4 }] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialAttack", source: SPELL },
    ]);
  });

  it("a single spell of level 5 or more is a special magical attack (banshee's wail)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, type: 1, level: 9 }] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialMagicalAttack", source: SPELL },
    ]);
  });

  it("a single spell with several uses is still a single spell", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: "SPWI304", memorizedCount: 3 }] } } as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialAttack", source: "Fireball" },
    ]);
  });

  it("spell tiers: 1-2, 3-4, 5-6 and 7-9", () => {
    const tier = (level: number) =>
      detectAttackAbilities({
        creature: fakeCreature({
          data: MAGIC_MISSILE,
          spells: [{ file: SPELL, type: 1, level }] as never,
          abilities: [{ resource: SPELL }],
        }),
      }).map((a) => a.ability);
    expect(tier(2)).toEqual(["lowSpells"]);
    expect(tier(4)).toEqual(["highSpells"]);
    expect(tier(6)).toEqual(["greaterSpells"]);
    expect(tier(9)).toEqual(["supremeSpells"]);
  });

  it("an innate power counts at its power level (dryad charm: Dire Charm preset, worth 5)", () => {
    const creature = fakeCreature({
      data: MAGIC_MISSILE,
      spells: [
        {
          file: SPELL,
          type: 4,
          level: 1,
          worthLevel: 5,
          role: "disable",
          ability: { preset: "SPWI316" },
        },
      ] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["greaterSpells"]);
  });

  it("a preset alone doesn't make an innate power a spell", () => {
    const creature = fakeCreature({
      spells: [
        {
          file: SPELL,
          type: 4,
          level: 1,
          ability: { preset: "SPWI316" },
          effects: [effect(EffectTypeEnum.CharmCreature)],
        },
      ] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["specialAttack"]);
  });

  it("a power level on a power already giving a listed ability counts only that (fear aura)", () => {
    const creature = fakeCreature({
      spells: [
        {
          file: SPELL,
          type: 4,
          level: 1,
          worthLevel: 4,
          effects: [effect(EffectTypeEnum.Panic)],
        },
      ] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["weaknessOrFear"]);
  });

  it("a spell-like charm counts as a spell, not also as a special attack", () => {
    const creature = fakeCreature({
      data: MAGIC_MISSILE,
      spells: [
        {
          file: SPELL,
          type: 4,
          level: 1,
          worthLevel: 3,
          effects: [effect(EffectTypeEnum.CharmCreature)],
        },
      ] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["highSpells"]);
  });

  it("an innate power of power level 0 counts nothing (speak with plants)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, type: 4, level: 1, worthLevel: 0 }] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("a memorized own innate power is no spell (vampire wolf form)", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: SPELL, memorizedCount: 1 }] } } as never,
      spells: [{ file: SPELL, type: 4, level: 1 }] as never,
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).not.toContain("lowSpells");
  });

  it("a spell counts at its hand-rated worth (control undead: level 7, worth 3)", () => {
    const creature = fakeCreature({
      data: MAGIC_MISSILE,
      spells: [{ file: SPELL, type: 1, level: 7, worthLevel: 3 }] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["highSpells"]);
  });

  it("an own spell tagged to count nothing never raises the spell bonus (innate dimension door)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, type: 1, level: 4, xpAbility: null }] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("an invisibility spell memorized at will is invisible at will", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [
            { file: "SPWI206", memorizedCount: 90 },
            { file: "SPWI112", memorizedCount: 1 },
          ],
        },
      } as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "invisibleAtWill", source: "Invisibility" },
      { ability: "lowSpells", source: "Invisibility" },
    ]);
  });

  it("Dimension Door never raises the spell bonus: the other spell stays a single power", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [
            { file: "SPWI402", memorizedCount: 1 },
            { file: "SPWI112", memorizedCount: 1 },
          ],
        },
      } as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialAttack", source: "Magic Missiles" },
    ]);
  });

  it("an invisibility spell memorized once is no invisibility at will", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: "SPWI206", memorizedCount: 1 }] } } as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialAttack", source: "Invisibility" },
    ]);
  });

  it("an own buff or grab is a special non-magical attack (haste, burst of speed, grab)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, role: "buff" }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialAttack", source: SPELL },
    ]);
  });

  it("an own killing or summoning power is a special magical attack", () => {
    for (const role of ["kill", "summon"] as const) {
      const creature = fakeCreature({
        spells: [{ file: SPELL, role }],
        abilities: [{ resource: SPELL }],
      });
      expect(detectAttackAbilities({ creature })).toEqual([
        { ability: "specialMagicalAttack", source: SPELL },
      ]);
    }
  });

  it("a killing power that is already a listed ability is not counted twice (petrifying gaze)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, role: "kill", effects: [effect(EffectTypeEnum.Petrification)] }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "petrification", source: SPELL },
    ]);
  });

  it("an own protection power is a special defense (blink)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, role: "protection" }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialDefense", source: SPELL },
    ]);
  });

  it("an own reactive power counts nothing unless tagged", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, role: "reactive" }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("an explicit xpAbility tag wins, null counts nothing", () => {
    const tagged = fakeCreature({
      spells: [{ file: SPELL, role: "reactive", xpAbility: "specialDefense" }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature: tagged })).toEqual([
      { ability: "specialDefense", source: SPELL },
    ]);
    const none = fakeCreature({
      spells: [{ file: SPELL, xpAbility: null, effects: [effect(EffectTypeEnum.Damage)] }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature: none })).toEqual([]);
  });

  it("a tagged breath cast by a weapon counts as a breath weapon", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [{ file: SPELL, xpAbility: "breathWeapon" }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["breathWeapon"]);
  });

  it("a damaging power cast by a hit is extra damage, no special attack (bear hug)", () => {
    const creature = fakeCreature({
      data: { apr: 2 },
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [
        { file: SPELL, effects: [effect(EffectTypeEnum.Damage, { diceThrown: 2, diceSize: 8 })] },
      ],
    });
    // 1d4 + the hug's 2d8 = 11.5, twice: the damage counts, the hug is no special attack
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["roundDamage15"]);
  });

  it("a poison cast by a weapon is only poison", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [{ file: SPELL, secondaryType: "Poison" }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["poison"]);
  });

  it("a weapon's extra damage on a hit adds to its damage, it is no special attack", () => {
    const creature = fakeCreature({
      data: { apr: 2 },
      items: [
        naturalWeapon({
          diceThrown: 2,
          diceSize: 6,
          effects: [effect(EffectTypeEnum.Damage, { diceThrown: 1, diceSize: 6, amount: 2 })],
        }),
      ],
    });
    // 2d6 = 7, + 1d6+2 fire on hit = 12.5, twice
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: `${WEAPON} 12.5 + ${WEAPON} 12.5 = 25 a round` },
    ]);
  });

  it("a doubled apr is real: 4 x 2 = 8 attacks give four or more attacks (carrion crawler)", () => {
    const creature = fakeCreature({ data: { apr: 4, doubleApr: true } });
    expect(detectStatAbilities({ creature })).toEqual([
      { ability: "fourAttacks", source: "8 attacks" },
    ]);
  });

  it("the game's half-attack code is decoded: 8 is 2.5 attacks, the round counts 3", () => {
    const creature = fakeCreature({
      data: { apr: 8 },
      items: [naturalWeapon({ diceThrown: 2, diceSize: 6 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: `${WEAPON} 7 + ${WEAPON} 7 + ${WEAPON} 7 = 21 a round` },
    ]);
    expect(detectStatAbilities({ creature }).map((a) => a.ability)).not.toContain("fourAttacks");
  });

  it("a diceless weapon dealing no damage is no attack (mist form)", () => {
    const creature = fakeCreature({
      data: { apr: 3, strength: 24 },
      items: [
        naturalWeapon({ diceThrown: 1, diceSize: 6 }, { file: "CLAWS" }),
        naturalWeapon({ diceThrown: 0, diceSize: 0 }, { file: "MIST" }),
      ],
    });
    // claws 1d6+12 = 15.5, three times = 46.5 (the mist adds no attack)
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage45", source: "CLAWS 15.5 + CLAWS 15.5 + CLAWS 15.5 = 46.5 a round" },
    ]);
  });

  it("a diceless weapon dealing damage on a hit is an attack (magic golem blast)", () => {
    const creature = fakeCreature({
      items: [
        naturalWeapon({
          diceThrown: 0,
          diceSize: 0,
          effects: [effect(EffectTypeEnum.Damage, { amount: 30 })],
        }),
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage30", source: `${WEAPON} 30 = 30 a round` },
    ]);
  });

  it("a tagged power is only its tag: its own effects don't count again (foul breath's slay)", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [{ file: SPELL, xpAbility: "breathWeapon", effects: [effect(EffectTypeEnum.Slay)] }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["breathWeapon"]);
  });

  it("a harmful effect next to a listed one adds no special attack (web tangle that holds)", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, effects: [effect(EffectTypeEnum.Web), effect(EffectTypeEnum.Hold)] }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([{ ability: "paralysis", source: SPELL }]);
  });

  it("a power cast by a hit adds its damage to the attack (ankheg digestive enzymes)", () => {
    const acid = effect(EffectTypeEnum.Damage, { diceThrown: 1, diceSize: 4 });
    const creature = fakeCreature({
      items: [
        naturalWeapon({
          diceThrown: 3,
          diceSize: 6,
          effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })],
        }),
      ],
      spells: [{ file: SPELL, headers: [{ effects: [acid, acid, acid, acid] }] as never }],
    });
    // 3d6 = 10.5 + 4 x 1d4 = 10
    expect(detectAttackAbilities({ creature })).toContainEqual({
      ability: "roundDamage15",
      source: `${WEAPON} 20.5 = 20.5 a round`,
    });
  });

  it("a harmful effect on a hit with no row of its own is a special attack (stun)", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.Stun)] })],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["specialAttack"]);
  });

  it("finds a power shared by the creature's entry (basilisk gaze)", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: SPELL, memorizedCount: 1 }] } } as never,
    });
    setSharedResources(creature, {
      spells: [
        { file: SPELL, effects: [effect(EffectTypeEnum.Petrification)], headers: [] } as never,
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "petrification", source: SPELL },
    ]);
  });

  it("an ability waiting for a memorized spell counts only where it is memorized", () => {
    const ability = {
      resource: SPELL,
      triggers: [{ name: "HaveSpellRES", params: [SPELL] }],
    } as never;
    const spells = [{ file: SPELL, effects: [effect(EffectTypeEnum.Damage)] }];
    const creature = fakeCreature({
      spells,
      abilities: [ability],
      adjustments: [
        { files: [FILE], data: { spells: { memorized: [{ file: SPELL, memorizedCount: 1 }] } } },
      ] as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([]);
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([
      { ability: "specialAttack", source: SPELL },
    ]);
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
      { ability: "highSpells", source: "Ice Storm" },
    ]);
  });

  it("lowSpells from a memorized level 1 spell resolved through SPELLS", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: "SPWI112", memorizedCount: 1 }] } } as never,
      spells: [{ file: SPELL, type: 1, level: 1 }] as never,
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "lowSpells", source: "Magic Missiles" },
    ]);
  });

  it("a spell an adjustment memorizes counts for its file", () => {
    const creature = fakeCreature({
      data: MAGIC_MISSILE,
      adjustments: [
        { files: [FILE], data: { spells: { memorized: [{ file: "SPWI304" }] } } as never },
      ],
    });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([
      { ability: "highSpells", source: "Fireball" },
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
      { ability: "highSpells", source: "Fireball" },
    ]);
  });

  it("behaviour abilities with a numeric level count as spells, null ones do not", () => {
    const creature = fakeCreature({
      data: MAGIC_MISSILE,
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

  it("a ranged attack setting alone is not a missile weapon", () => {
    const creature = fakeCreature({ ranged: true });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([]);
  });

  it("missileWeapons from a ranged game weapon in the file's creatures.csv row", () => {
    csvWeapons({ [FILE]: ["BOW01", "HALB01"] });
    const creature = fakeCreature({});
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([
      { ability: "missileWeapons", source: "BOW01" },
    ]);
  });

  it("a melee game weapon is not a missile weapon", () => {
    csvWeapons({ [FILE]: ["SW2H02"] });
    expect(detectAttackAbilities({ creature: fakeCreature({}), file: FILE })).toEqual([]);
  });

  it("a removed ranged game weapon is not a missile weapon", () => {
    csvWeapons({ [FILE]: ["BOW01"] });
    const creature = fakeCreature({
      adjustments: [{ files: [FILE], data: { items: { equipped: [], remove: ["BOW01"] } } }],
    });
    expect(detectAttackAbilities({ creature, file: FILE })).toEqual([]);
  });

  it("the base creature uses missile weapons when most of its unadjusted files do", () => {
    csvWeapons({ A: ["BOW01"], B: ["XBOW01"], C: ["SW1H01"] });
    const creature = fakeCreature({ files: ["A", "B", "C"] });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "missileWeapons", source: "BOW01, XBOW01" },
    ]);
  });

  it("the base creature is melee when most of its unadjusted files are", () => {
    csvWeapons({ A: ["BOW01"], B: ["SW1H01"], C: ["B1-6"] });
    const creature = fakeCreature({ files: ["A", "B", "C"] });
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("missileWeapons from an item in a quiver slot", () => {
    const creature = fakeCreature({ data: equipped("AROW01", "QUIVER1") });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "missileWeapons", source: "AROW01" },
    ]);
  });

  it("round damage tiers: 15, 30, 45 and 60 a round", () => {
    const tier = (average: number) =>
      detectAttackAbilities({
        creature: fakeCreature({
          items: [naturalWeapon({ diceThrown: 1, diceSize: 1, damageBonus: average - 1 })],
        }),
      }).map((a) => a.ability);
    expect(tier(14)).toEqual([]);
    expect(tier(15)).toEqual(["roundDamage15"]);
    expect(tier(30)).toEqual(["roundDamage30"]);
    expect(tier(45)).toEqual(["roundDamage45"]);
    expect(tier(60)).toEqual(["roundDamage60"]);
  });

  it("the round's average damage counts, not its maximum (2d10+2 twice: 26, max 44)", () => {
    const creature = fakeCreature({
      data: { apr: 2 },
      items: [naturalWeapon({ diceThrown: 2, diceSize: 10, damageBonus: 2 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: `${WEAPON} 13 + ${WEAPON} 13 = 26 a round` },
    ]);
  });

  it("one attack a round counts on its own (3d10)", () => {
    const creature = fakeCreature({ items: [naturalWeapon({ diceThrown: 3, diceSize: 10 })] });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: `${WEAPON} 16.5 = 16.5 a round` },
    ]);
  });

  it("a chance-based extra on a hit counts at its chance (a 10% hug)", () => {
    const creature = fakeCreature({
      items: [
        naturalWeapon({
          diceThrown: 1,
          diceSize: 1,
          damageBonus: 13,
          effects: [effect(EffectTypeEnum.Damage, { amount: 20, probability1: 10 })],
        }),
      ],
    });
    // 14 + 10% of 20 = 16, where the whole 20 would make 34
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: `${WEAPON} 16 = 16 a round` },
    ]);
  });

  it("claw/claw/bite sums the bite once and repeats the weaker claws", () => {
    const creature = fakeCreature({
      data: { apr: 3 },
      items: [
        naturalWeapon({ diceThrown: 2, diceSize: 8 }, { file: "BITE" }),
        naturalWeapon({ diceThrown: 1, diceSize: 4 }, { file: "CLAWS" }),
      ],
    });
    // bite 9 + claws 2.5 + claws 2.5 = 14: under 15, where 9 x 3 = 27 was over
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("claw/claw/bite over a tier lists each attack", () => {
    const creature = fakeCreature({
      data: { apr: 3 },
      items: [
        naturalWeapon({ diceThrown: 2, diceSize: 10 }, { file: "BITE" }),
        naturalWeapon({ diceThrown: 1, diceSize: 8 }, { file: "CLAWS" }),
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: "BITE 11 + CLAWS 4.5 + CLAWS 4.5 = 20 a round" },
    ]);
  });

  it("more weapons than attacks counts only the strongest ones", () => {
    const creature = fakeCreature({
      data: { apr: 2 },
      items: [
        naturalWeapon({ diceThrown: 2, diceSize: 8 }, { file: "A" }),
        naturalWeapon({ diceThrown: 2, diceSize: 8 }, { file: "B" }),
        naturalWeapon({ diceThrown: 1, diceSize: 4 }, { file: "C" }),
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: "A 9 + B 9 = 18 a round" },
    ]);
  });

  it("a melee hit adds the strength damage bonus (juju zombie 3d4 at 20 strength)", () => {
    const creature = fakeCreature({
      data: { strength: 20 },
      items: [naturalWeapon({ diceThrown: 3, diceSize: 4 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: `${WEAPON} 15.5 = 15.5 a round` },
    ]);
  });

  it("18/00 strength adds +6", () => {
    const creature = fakeCreature({
      data: { strength: 18, exceptionalStrength: 100 },
      items: [naturalWeapon({ diceThrown: 2, diceSize: 8 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: `${WEAPON} 15 = 15 a round` },
    ]);
  });

  it("an equipped item owned by a fellow member counts (greater wyvern wields the wyvern's jaws)", () => {
    const creature = fakeCreature({ data: { ...equipped("JAWS", "WEAPON2"), apr: 2 } });
    setSharedResources(creature, {
      items: [
        naturalWeapon({ diceThrown: 2, diceSize: 10 }, { file: "JAWS", equippedSlot: ["WEAPON2"] }),
      ] as never,
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "roundDamage15", source: "JAWS 11 + JAWS 11 = 22 a round" },
    ]);
  });

  it("no damage abilities under the thresholds", () => {
    const creature = fakeCreature({
      data: { apr: 3 },
      items: [naturalWeapon({ diceThrown: 1, diceSize: 6, damageBonus: 1 })],
    });
    // 4.5 x 3 = 13.5
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

describe("missingPowerLevels", () => {
  const innate = (file: string, p: Partial<Spell> = {}) =>
    ({
      file,
      type: SpellTypeEnum.Innate,
      level: 1,
      effects: [],
      headers: [],
      effectFiles: [],
      ...p,
    }) as Spell;
  const files = (spells: Spell[]) => missingPowerLevels(spells).map((s) => s.file);

  it("refuses an innate power with neither a power level nor a tag (a leap)", () => {
    expect(files([innate("LEAP", { effects: [effect(EffectTypeEnum.Damage)] })])).toEqual(["LEAP"]);
  });

  it("accepts a power level, 0 included, or an explicit tag, null included", () => {
    const spells = [
      innate("CHARM", { worthLevel: 5 }),
      innate("PLANTS", { worthLevel: 0 }),
      innate("LEAP", { xpAbility: "specialAttack" }),
      innate("REVERT", { xpAbility: null }),
    ];
    expect(files(spells)).toEqual([]);
  });

  it("accepts a power its effects already count through a listed row (a paralyzing touch)", () => {
    expect(files([innate("TOUCH", { effects: [effect(EffectTypeEnum.Hold)] })])).toEqual([]);
  });

  it("a harmful effect with no row of its own isn't enough (a charm)", () => {
    const charm = innate("CHARM", { effects: [effect(EffectTypeEnum.CharmCreature)] });
    expect(files([charm])).toEqual(["CHARM"]);
  });

  it("finds a listed row through the spells a power casts (a fear aura's parts)", () => {
    const part = innate("PART", { effects: [effect(EffectTypeEnum.Panic)] });
    const aura = innate("AURA", {
      effects: [{ ...effect(EffectTypeEnum.CastSpell), resource: "PART" }],
    });
    expect(files([aura, part])).toEqual([]);
  });

  it("skips a sub-spell another created spell casts: its parent carries the level", () => {
    const part = innate("PART", { effects: [effect(EffectTypeEnum.CharmCreature)] });
    const song = innate("SONG", {
      worthLevel: 7,
      effects: [{ ...effect(EffectTypeEnum.CastSpell), resource: "PART" }],
    });
    expect(files([song, part])).toEqual([]);
  });

  it("skips damage a weapon's hit casts: it counts through the damage rows (a bear's hug)", () => {
    const hug = innate("HUG", { effects: [effect(EffectTypeEnum.Damage)] });
    const paws = {
      file: "PAWS",
      header: { effects: [{ ...effect(EffectTypeEnum.CastSpell), resource: "HUG" }] },
    } as unknown as Item;
    expect(missingPowerLevels([hug], [paws])).toEqual([]);
    expect(missingPowerLevels([hug], [])).toEqual([hug]);
  });

  it("skips wizard and priest spells and copies of game spells: their level is a real one", () => {
    const spells = [
      innate("CONE", { type: SpellTypeEnum.Wizard, level: 5 }),
      innate("CALL", { copyFrom: "SPPR410" }),
    ];
    expect(files(spells)).toEqual([]);
  });
});

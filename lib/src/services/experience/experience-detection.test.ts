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
  setSharedSpells,
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

  it("an own wizard power dealing damage is a special magical attack", () => {
    const creature = fakeCreature({
      spells: [{ file: SPELL, type: SpellTypeEnum.Wizard, effects: [effect(EffectTypeEnum.Damage)] }],
      abilities: [{ resource: SPELL }],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "specialMagicalAttack", source: SPELL },
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

  it("a damaging power cast by a weapon is a special attack (bear hug)", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [{ file: SPELL, effects: [effect(EffectTypeEnum.Damage)] }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["specialAttack"]);
  });

  it("a poison cast by a weapon is only poison", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.CastSpell, { resource: SPELL })] })],
      spells: [{ file: SPELL, secondaryType: "Poison" }],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["poison"]);
  });

  it("a weapon dealing extra damage on a hit is a special attack (rake, acid)", () => {
    const creature = fakeCreature({
      items: [naturalWeapon({ effects: [effect(EffectTypeEnum.Damage)] })],
    });
    expect(detectAttackAbilities({ creature }).map((a) => a.ability)).toEqual(["specialAttack"]);
  });

  it("finds a power shared by the creature's entry (basilisk gaze)", () => {
    const creature = fakeCreature({
      data: { spells: { memorized: [{ file: SPELL, memorizedCount: 1 }] } } as never,
    });
    setSharedSpells(creature, [
      { file: SPELL, effects: [effect(EffectTypeEnum.Petrification)], headers: [] } as never,
    ]);
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

  it("a 2d10+2 natural weapon at 2 attacks gives singleAttack20 and multipleAttacks30", () => {
    const creature = fakeCreature({
      data: { apr: 2 },
      items: [naturalWeapon({ diceThrown: 2, diceSize: 10, damageBonus: 2 })],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "singleAttack20", source: `${WEAPON}: 2d10+2 = 22` },
      { ability: "multipleAttacks30", source: `${WEAPON} 22 + ${WEAPON} 22 = 44` },
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
      { ability: "multipleAttacks30", source: `${WEAPON} 18 + ${WEAPON} 18 = 36` },
    ]);
  });

  it("claw/claw/bite sums the bite once and repeats the weaker claws", () => {
    const creature = fakeCreature({
      data: { apr: 3 },
      items: [
        naturalWeapon({ diceThrown: 2, diceSize: 8 }, { file: "BITE" }),
        naturalWeapon({ diceThrown: 1, diceSize: 6 }, { file: "CLAWS" }),
      ],
    });
    // bite 16 + claws 6 + claws 6 = 28: under 30, where 16 x 3 = 48 was over
    expect(detectAttackAbilities({ creature })).toEqual([]);
  });

  it("claw/claw/bite over 30 lists each attack", () => {
    const creature = fakeCreature({
      data: { apr: 3 },
      items: [
        naturalWeapon({ diceThrown: 2, diceSize: 10 }, { file: "BITE" }),
        naturalWeapon({ diceThrown: 1, diceSize: 8 }, { file: "CLAWS" }),
      ],
    });
    expect(detectAttackAbilities({ creature })).toEqual([
      { ability: "singleAttack20", source: "BITE: 2d10 = 20" },
      { ability: "multipleAttacks30", source: "BITE 20 + CLAWS 8 + CLAWS 8 = 36" },
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
      { ability: "multipleAttacks30", source: "A 16 + B 16 = 32" },
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

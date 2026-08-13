import { describe, expect, it, vi } from "vitest";
import { BaseCreature, Creature, CreatureAutoGenerate } from "../model/creature/creature";
import {
  CreatureData,
  CreatureDataItems,
  MemorizedSpell,
  SpellbookVariant,
} from "../model/creature/data";
import { Movement } from "../model/creature/movement";
import { ItemAbilityLocationEnum, ProficiencyTypeEnum } from "../model/spell-item/effect.enums";
import { Weapon } from "../model/spell-item/spell-item";
import { CreatureAbility } from "../model/creature/ability";
import creatureService from "./creature.service";
import logService from "./log.service";
import monsterFilesService from "./monster-files.service";

interface CreatureServicePrivate {
  transformAttackPerRound(data?: Partial<CreatureData>): void;
  autogenerateThac0(data: Partial<CreatureData>, parent?: CreatureData): void;
  autogenerateSavingThrows(p: {
    data: Partial<CreatureData>;
    parent?: CreatureData;
    options: CreatureAutoGenerate["savingThrows"];
  }): void;
  getSavingThrows(p: Exclude<CreatureAutoGenerate["savingThrows"], undefined>): {
    saveDeath: number;
    saveWand: number;
    savePolymorph: number;
    saveBreath: number;
    saveSpell: number;
  };
  getDexterityArmorClassBonus(data: Partial<CreatureData>): number;
  checkDexterityArmorClassBonus(data: Partial<CreatureData>): void;
  hasOffhandWeapon(creature: Creature): boolean;
  checkDualWielding(p: {
    creature: Creature;
    base: BaseCreature;
    isAdjustment: boolean;
    data: CreatureData;
  }): void;
  autogenerateHitPoints(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    parent?: CreatureData;
  }): void;
  checkMovement(p: { creature: Creature; base: BaseCreature; isAdjustment: boolean }): void;
}

function fakeCreature(p: {
  data: Partial<Omit<CreatureData, "items">> & { items?: Partial<CreatureDataItems> };
  items?: Weapon[];
  autoGenerate?: Partial<Creature["autoGenerate"]>;
  adjustments?: {
    files: string[];
    noWeapon?: boolean;
    data: Partial<Omit<CreatureData, "items">> & { items?: Partial<CreatureDataItems> };
  }[];
}): Creature {
  return {
    data: { immunities: [], items: { equipped: [] }, ...p.data },
    items: p.items ?? [],
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: a.files,
      noWeapon: a.noWeapon ?? false,
      data: { immunities: [], items: { equipped: [] }, ...a.data },
    })),
    autoGenerate: {
      thac0: true,
      hitPoints: true,
      enchantment: true,
      meleeRange: true,
      ...p.autoGenerate,
    },
  } as unknown as Creature;
}

function fakeBase(data: Partial<CreatureData>): BaseCreature {
  return { data } as unknown as BaseCreature;
}

describe("getAttacksPerRound", () => {
  it("resolves plain apr entries directly from AttackPerRoundTable", () => {
    expect(creatureService.getAttacksPerRound(2)).toEqual({
      apr: 2,
      value: 2,
      doubleApr: false,
    });
  });

  it("resolves half-attack apr values encoded in the table (1.5 -> engine value 7)", () => {
    expect(creatureService.getAttacksPerRound(1.5)).toEqual({
      apr: 1.5,
      value: 7,
      doubleApr: false,
    });
  });

  it("resolves high attack counts to their double-apr engine value (8 -> 4, doubleApr)", () => {
    expect(creatureService.getAttacksPerRound(8)).toEqual({
      apr: 8,
      value: 4,
      doubleApr: true,
    });
  });

  it("throws for an apr value not present in the table", () => {
    expect(() => creatureService.getAttacksPerRound(11)).toThrow(
      /attack per round not found in table: 11/,
    );
  });
});

describe("getFighterAttackBonus", () => {
  it("grants no bonus for a non-fighter class regardless of level or proficiency", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "MAGE",
        level: 13,
        proficiencyType: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
      }),
    ).toBe(0);
  });

  it("grants the specialization bonus for a FIGHTER proficient at rank 4 (only the rank-2 threshold met)", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER",
        level: 1,
        proficiencyType: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 4 }],
      }),
    ).toBe(0.5);
  });

  it("grants only the highest proficiency tier's own bonus for a FIGHTER at grand mastery (rank 5), not both thresholds stacked", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER",
        level: 1,
        proficiencyType: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
      }),
    ).toBe(1);
  });

  it("stacks both level thresholds for a FIGHTER at level 13", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER",
        level: 13,
        proficiencyType: undefined,
        proficiencies: [],
      }),
    ).toBe(1);
  });

  it("combines the highest proficiency tier and the cumulative level bonus for a FIGHTER at rank 5, level 13", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER",
        level: 13,
        proficiencyType: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
      }),
    ).toBe(2);
  });

  it("grants only the level bonus for a multiclass fighter, never the specialization bonus", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER_MAGE",
        level: 7,
        proficiencyType: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
      }),
    ).toBe(0.5);
  });

  it("grants no level bonus for a warrior-type class that doesn't contain FIGHTER (PALADIN)", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "PALADIN",
        level: 13,
        proficiencyType: undefined,
        proficiencies: [],
      }),
    ).toBe(0);
  });

  it("grants no proficiency bonus below the rank-2 threshold", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER",
        level: 1,
        proficiencyType: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 1 }],
      }),
    ).toBe(0);
  });

  // A creature whose weapon comes straight from its own .cre file (never an addWeapon() call, see
  // e.g. Tazok/half-ogre in lib/creatures/ogres.ts) has no equipped weapon known to the doc
  // pipeline, so there's no proficiency type to key a rank lookup off of. The best available
  // approximation is the creature's own highest proficiency rank - the weapon it's presumably
  // actually specialized in - rather than silently dropping the specialization bonus to 0.
  it("falls back to the creature's highest proficiency rank when no weapon is known", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER",
        level: 1,
        proficiencyType: undefined,
        proficiencies: [
          { type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 2 },
          { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5 },
        ],
      }),
    ).toBe(1);
  });

  it("grants no proficiency bonus when no weapon is known and the creature has no proficiencies at all", () => {
    expect(
      creatureService.getFighterAttackBonus({
        class: "FIGHTER",
        level: 1,
        proficiencyType: undefined,
        proficiencies: [],
      }),
    ).toBe(0);
  });
});

describe("transformAttackPerRound (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("does nothing when apr is not set", () => {
    const data: Partial<CreatureData> = {};
    service.transformAttackPerRound(data);
    expect(data.apr).toBeUndefined();
  });

  it("converts data.apr to the table's engine value", () => {
    const data: Partial<CreatureData> = { apr: 2 };
    service.transformAttackPerRound(data);
    expect(data.apr).toBe(2);
  });

  it("marks movement.hasImprovedHaste when the resolved apr is a double-apr entry", () => {
    const movement = new Movement(12);
    const data: Partial<CreatureData> = { apr: 8, movement };
    service.transformAttackPerRound(data);
    expect(data.apr).toBe(4);
    expect(movement.hasImprovedHaste).toBe(true);
  });

  it("clears hasImprovedHaste when the resolved apr is a single-apr entry", () => {
    const movement = new Movement(12);
    movement.hasImprovedHaste = true;
    const data: Partial<CreatureData> = { apr: 3, movement };
    service.transformAttackPerRound(data);
    expect(movement.hasImprovedHaste).toBe(false);
  });

  it("sets data.doubleApr when the resolved apr is a double-apr entry, so the CRE gets the attack-doubling effect", () => {
    const data: Partial<CreatureData> = { apr: 8 };
    service.transformAttackPerRound(data);
    expect(data.apr).toBe(4);
    expect(data.doubleApr).toBe(true);
  });

  it("leaves data.doubleApr unset when the resolved apr is a single-apr entry, so the CRE patch omits the field entirely", () => {
    const data: Partial<CreatureData> = { apr: 3 };
    service.transformAttackPerRound(data);
    expect(data.doubleApr).toBeUndefined();
  });
});

describe("checkData - attacks per round across adjustments", () => {
  // Regression test: checkData ran transformAttackPerRound(p.creature.data) unconditionally,
  // instead of transformAttackPerRound(data) (= p.base.data) like every other field it checks.
  // For a creature with no adjustments this is harmless, but for one with adjustments (e.g. the
  // Carrion Crawler's CRYPTCRA variant), checkData runs once more with isAdjustment: true and
  // re-fed the already-converted apr (8 -> 4) back through the table, which resolved to a
  // *different*, non-double entry and silently flipped doubleApr/hasImprovedHaste back to false -
  // dropping the creature from 8 attacks per round to 4 in the generated CRE.
  it("keeps the double-apr flag when checkData runs again for an adjustment", () => {
    const movement = new Movement(12);
    const creature = {
      data: {
        movement,
        apr: 8,
        saveBreath: 10,
        immunities: [],
        items: { equipped: [] },
      },
      items: [],
      attack: { dualWielding: false },
      autoGenerate: { thac0: false, hitPoints: false, enchantment: false, meleeRange: false },
    } as unknown as Creature;

    creatureService.checkData({ creature, base: creature, isAdjustment: false });
    creatureService.checkData({ creature, base: fakeBase({}), isAdjustment: true });

    expect(creature.data.apr).toBe(4);
    expect(creature.data.doubleApr).toBe(true);
    expect(movement.hasImprovedHaste).toBe(true);
  });
});

describe("autogenerateThac0 (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("throws when level1 is unknown and there is no parent", () => {
    expect(() => {
      service.autogenerateThac0({}, undefined);
    }).toThrow(/level1 is unknown/);
  });

  it("does nothing when level1 is unknown but a parent is provided", () => {
    const data: Partial<CreatureData> = {};
    service.autogenerateThac0(data, {} as CreatureData);
    expect(data.thac0).toBeUndefined();
  });

  it("sets thac0 from the Thac0Table for the creature's level", () => {
    const data: Partial<CreatureData> = {
      level1: { pnpValue: 5, value: 5, type: "none" },
    };
    service.autogenerateThac0(data, undefined);
    expect(data.thac0).toBe(15);
  });

  it("calculates thac0 as one level higher when bonusHp >= 3", () => {
    const data: Partial<CreatureData> = {
      level1: { pnpValue: 6, value: 6, type: "none" },
      bonusHp: 3,
    };
    service.autogenerateThac0(data, undefined);
    expect(data.thac0).toBe(13); // level bumped to 7 (Thac0Table[7]), not 15 (Thac0Table[6])
  });

  it("throws when the calculated level isn't in Thac0Table", () => {
    const data: Partial<CreatureData> = {
      level1: { pnpValue: 31, value: 31, type: "none" },
    };
    expect(() => {
      service.autogenerateThac0(data, undefined);
    }).toThrow(/thac0 not found in table for level 31/);
  });

  it("does not overwrite an already-set thac0", () => {
    const data: Partial<CreatureData> = {
      level1: { pnpValue: 5, value: 5, type: "none" },
      thac0: 2,
    };
    service.autogenerateThac0(data, undefined);
    expect(data.thac0).toBe(2);
  });
});

describe("autogenerateSavingThrows (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("throws when level1 is unknown and there is no parent", () => {
    expect(() => {
      service.autogenerateSavingThrows({ data: {}, options: undefined });
    }).toThrow(/level1 is unknown/);
  });

  it("does nothing when level1 is unknown but a parent is provided", () => {
    const data: Partial<CreatureData> = {};
    service.autogenerateSavingThrows({
      data,
      parent: {} as CreatureData,
      options: undefined,
    });
    expect(data.saveDeath).toBeUndefined();
  });

  it("sets the save fields from getSavingThrows for the creature's level/class", () => {
    const data: Partial<CreatureData> = {
      level1: { pnpValue: 5, value: 5, type: "none" },
      class: "CLERIC",
    };
    service.autogenerateSavingThrows({ data, options: undefined });
    expect(data.saveDeath).toBe(
      service.getSavingThrows({
        level: 5,
        classe: "CLERIC",
      }).saveDeath,
    );
  });
});

describe("getSavingThrows (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("returns fighter saves by default", () => {
    expect(service.getSavingThrows({ level: 5 })).toEqual({
      saveDeath: 11,
      saveWand: 13,
      savePolymorph: 12,
      saveBreath: 13,
      saveSpell: 14,
    });
  });

  it("returns priest saves for DRUID/CLERIC classes", () => {
    expect(service.getSavingThrows({ level: 5, classe: "CLERIC" })).toEqual({
      saveDeath: 9,
      saveWand: 13,
      savePolymorph: 12,
      saveBreath: 15,
      saveSpell: 14,
    });
  });

  it("returns wizard saves for MAGE class", () => {
    expect(service.getSavingThrows({ level: 5, classe: "MAGE" })).toEqual({
      saveDeath: 14,
      saveWand: 11,
      savePolymorph: 13,
      saveBreath: 15,
      saveSpell: 12,
    });
  });

  it("subtracts optional bonus overrides from the table values", () => {
    expect(
      service.getSavingThrows({
        level: 5,
        bonus: { saveDeath: 2, saveSpell: 1 },
      }),
    ).toEqual({
      saveDeath: 9, // 11 - 2
      saveWand: 13,
      savePolymorph: 12,
      saveBreath: 13,
      saveSpell: 13, // 14 - 1
    });
  });
});

describe("getStrengthBonus", () => {
  it("returns zero bonus when strength is undefined", () => {
    expect(creatureService.getStrengthBonus({})).toEqual({
      hit: 0,
      damage: 0,
    });
  });

  it("returns hit/damage bonus for a plain strength score", () => {
    expect(creatureService.getStrengthBonus({ strength: 19 })).toEqual({
      str: 19,
      hit: 3,
      damage: 7,
    });
  });

  it("resolves 18/xx exceptional strength bands correctly", () => {
    expect(
      creatureService.getStrengthBonus({
        strength: 18,
        exceptionalStrength: 75,
      }),
    ).toEqual({ str: 18, strEx: [51, 75], hit: 2, damage: 3 });
  });

  it("throws when strength is not found in the table", () => {
    expect(() => creatureService.getStrengthBonus({ strength: 99 })).toThrow(
      /strength not found in table: 99/,
    );
  });
});

describe("getDexterityArmorClassBonus (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("returns 0 when dexterity is undefined", () => {
    expect(service.getDexterityArmorClassBonus({})).toBe(0);
  });

  it("returns the AC bonus for a given dexterity", () => {
    expect(service.getDexterityArmorClassBonus({ dexterity: 18 })).toBe(-4);
  });

  it("throws when dexterity is not found in table", () => {
    expect(() => service.getDexterityArmorClassBonus({ dexterity: 99 })).toThrow(
      /dexterity not found in table: 99/,
    );
  });
});

describe("checkDexterityArmorClassBonus (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("does nothing when dexterity or ac is undefined", () => {
    const data: Partial<CreatureData> = { dexterity: 18 };
    service.checkDexterityArmorClassBonus(data);
    expect(data.ac).toBeUndefined();
  });

  it("subtracts the dexterity bonus from ac", () => {
    const data: Partial<CreatureData> = { ac: 10, dexterity: 18 };
    service.checkDexterityArmorClassBonus(data);
    expect(data.ac).toBe(14); // 10 - (-4)
  });

  it("leaves ac untouched when the dexterity bonus is zero", () => {
    const data: Partial<CreatureData> = { ac: 10, dexterity: 9 };
    service.checkDexterityArmorClassBonus(data);
    expect(data.ac).toBe(10);
  });
});

describe("getFinalArmorClass", () => {
  it("throws when ac or dexterity is missing", () => {
    expect(() => creatureService.getFinalArmorClass(fakeBase({}))).toThrow(/missing data/);
  });

  it("applies the dexterity AC bonus to the base AC", () => {
    const base = fakeBase({ ac: 10, dexterity: 18 });
    expect(creatureService.getFinalArmorClass(base)).toBe(6); // 10 + (-4)
  });
});

describe("hasOffhandWeapon (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("returns false when no SHIELD-slot item is equipped", () => {
    const creature = fakeCreature({ data: { items: { equipped: [] } } });
    expect(service.hasOffhandWeapon(creature)).toBe(false);
  });

  it("returns true when the equipped SHIELD item is a Weapon-location item (dual wielding off-hand)", () => {
    const creature = fakeCreature({
      data: {
        items: {
          equipped: [{ file: "offhand_weapon", slot: "SHIELD" }],
        },
      },
      items: [
        {
          file: "offhand_weapon",
          header: { location: ItemAbilityLocationEnum.Weapon },
        } as Weapon,
      ],
    });
    expect(service.hasOffhandWeapon(creature)).toBe(true);
  });

  it("returns false when the equipped SHIELD item is a normal shield (Item location)", () => {
    const creature = fakeCreature({
      data: {
        items: {
          equipped: [{ file: "shield01", slot: "SHIELD" }],
        },
      },
      items: [
        {
          file: "shield01",
          header: { location: ItemAbilityLocationEnum.Item },
        } as Weapon,
      ],
    });
    expect(service.hasOffhandWeapon(creature)).toBe(false);
  });
});

describe("checkDualWielding (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("detects dual wielding from an equipped offhand weapon and decrements apr by 1", () => {
    const creature = fakeCreature({
      data: {
        items: { equipped: [{ file: "offhand_weapon", slot: "SHIELD" }] },
      },
      items: [
        {
          file: "offhand_weapon",
          header: { location: ItemAbilityLocationEnum.Weapon },
        } as Weapon,
      ],
    });
    creature.attack = { dualWielding: false } as Creature["attack"];
    const data: Partial<CreatureData> = { apr: 2 };
    service.checkDualWielding({
      creature,
      base: fakeBase(data),
      isAdjustment: false,
      data: data as CreatureData,
    });
    expect(creature.attack.dualWielding).toBe(true);
    expect(data.apr).toBe(1);
  });

  it("throws when dual wielding is set but apr is missing", () => {
    const creature = fakeCreature({ data: { items: { equipped: [] } } });
    creature.attack = { dualWielding: true } as Creature["attack"];
    const data: Partial<CreatureData> = {};
    expect(() => {
      service.checkDualWielding({
        creature,
        base: fakeBase(data),
        isAdjustment: false,
        data: data as CreatureData,
      });
    }).toThrow(/Attacks per round need to be set for dual wielding flag/);
  });

  it("does not detect dual wielding or adjust apr for adjustments", () => {
    const creature = fakeCreature({
      data: {
        items: { equipped: [{ file: "offhand_weapon", slot: "SHIELD" }] },
      },
      items: [
        {
          file: "offhand_weapon",
          header: { location: ItemAbilityLocationEnum.Weapon },
        } as Weapon,
      ],
    });
    creature.attack = { dualWielding: false } as Creature["attack"];
    const data: Partial<CreatureData> = { apr: 2 };
    service.checkDualWielding({
      creature,
      base: fakeBase(data),
      isAdjustment: true,
      data: data as CreatureData,
    });
    expect(creature.attack.dualWielding).toBe(false);
    expect(data.apr).toBe(2);
  });
});

describe("checkWeapons", () => {
  it("delegates to weaponService for items whose header.location is Weapon", () => {
    const weapon = {
      file: "w1",
      header: { location: ItemAbilityLocationEnum.Weapon },
    } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 1, value: 1, type: "none" } },
      items: [weapon],
    });
    creatureService.checkWeapons(creature);
    expect(weapon.header.speed).toBe(3); // real weaponService.checkWeapon default-speed behavior
  });

  it("ignores items whose header.location is not Weapon", () => {
    const item = {
      file: "shield01",
      header: { location: ItemAbilityLocationEnum.Item },
    } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 1, value: 1, type: "none" } },
      items: [item],
    });
    creatureService.checkWeapons(creature);
    expect(item.header.speed).toBeUndefined();
  });

  it("computes enchantment from the adjustment's own level when only that adjustment equips the weapon", () => {
    // Reproduces the Treant bug: base wields wA (level 11), and each adjustment re-equips its
    // own dedicated, weaker branch weapon (wB) in the same slot instead of sharing wA. wB should
    // be enchanted for level 9, not inherit the base creature's level 11.
    const wA = { file: "wA", header: { location: ItemAbilityLocationEnum.Weapon } } as Weapon;
    const wB = { file: "wB", header: { location: ItemAbilityLocationEnum.Weapon } } as Weapon;
    const creature = fakeCreature({
      data: {
        level1: { pnpValue: 11, value: 11, type: "none" },
        items: { equipped: [{ file: "wA", slot: "WEAPON1" }] },
      },
      items: [wA, wB],
      adjustments: [
        {
          files: ["ADJ1"],
          data: {
            level1: { pnpValue: 9, value: 9, type: "none" },
            items: { equipped: [{ file: "wB", slot: "WEAPON1" }] },
          },
        },
      ],
    });
    creatureService.checkWeapons(creature);
    expect(wA.enchantment).toBe(4); // level 11 -> level:10/enchant:4
    expect(wB.enchantment).toBe(3); // level 9 -> level:8/enchant:3, not the base's level:10/enchant:4
  });

  it("does not let an adjustment that doesn't equip its own weapon inflate a genuinely shared weapon's enchantment", () => {
    // The weapon is genuinely shared: no adjustment re-equips the slot with its own item, so the
    // higher-level adjustment still ends up wielding the same physical item in-game - but that
    // item is only authored/leveled for the base creature, so its level must not count here.
    // Boosting it would over-enchant the (often weaker) base creature that actually owns it.
    const weapon = { file: "wShared", header: { location: ItemAbilityLocationEnum.Weapon } } as Weapon;
    const creature = fakeCreature({
      data: {
        level1: { pnpValue: 6, value: 6, type: "none" },
        items: { equipped: [{ file: "wShared", slot: "WEAPON1" }] },
      },
      items: [weapon],
      adjustments: [
        { files: ["ADJ1"], data: { level1: { pnpValue: 9, value: 9, type: "none" } } },
      ],
    });
    creatureService.checkWeapons(creature);
    expect(weapon.enchantment).toBe(1); // base level 6 only -> level:4/enchant:1
  });

  it("does not let a noWeapon adjustment count as an owner even if it explicitly lists the weapon", () => {
    const weapon = { file: "wShared", header: { location: ItemAbilityLocationEnum.Weapon } } as Weapon;
    const creature = fakeCreature({
      data: {
        level1: { pnpValue: 6, value: 6, type: "none" },
        items: { equipped: [{ file: "wShared", slot: "WEAPON1" }] },
      },
      items: [weapon],
      adjustments: [
        {
          files: ["ADJ1"],
          noWeapon: true,
          data: {
            level1: { pnpValue: 15, value: 15, type: "none" },
            items: { equipped: [{ file: "wShared", slot: "WEAPON1" }] },
          },
        },
      ],
    });
    creatureService.checkWeapons(creature);
    expect(weapon.enchantment).toBe(1); // base level 6 only -> level:4/enchant:1
  });
});

describe("autogenerateHitPoints (private, delegates to hitPointService)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("sets data.hp from the real hitPointService calculation", () => {
    const data: Partial<CreatureData> = {
      level1: { pnpValue: 5, value: 5, type: "none" },
    };
    service.autogenerateHitPoints({
      data,
      creature: fakeCreature({ data: {} }),
    });
    expect(data.hp).toBe(40); // 5 * 8 default HD
  });

  it("leaves data.hp unset when hitPointService returns 0 (adjustment without level override)", () => {
    const data: Partial<CreatureData> = {};
    service.autogenerateHitPoints({
      data,
      creature: fakeCreature({ data: {} }),
      parent: {} as CreatureData,
    });
    expect(data.hp).toBeUndefined();
  });
});

describe("checkMovement (private)", () => {
  const service = creatureService as unknown as CreatureServicePrivate;

  it("throws when movement isn't set on a base (non-adjustment) creature", () => {
    expect(() => {
      service.checkMovement({
        creature: fakeCreature({ data: {} }),
        base: fakeBase({}),
        isAdjustment: false,
      });
    }).toThrow(/movement not set/);
  });

  it("increases movement bonus by 2 for the BARBARIAN kit", () => {
    const movement = new Movement(12);
    const base = fakeBase({ movement, kit: "BARBARIAN" });
    service.checkMovement({
      base,
      creature: fakeCreature({ data: {} }),
      isAdjustment: false,
    });
    if (!base.data.movement) throw new Error("expected movement to be set");
    expect(base.data.movement.bonus).toBe(2);
    expect(base.data.movement).not.toBe(movement); // cloned, not mutated in place
  });

  it("leaves movement untouched for non-barbarian kits", () => {
    const movement = new Movement(12);
    const base = fakeBase({ movement, kit: "TRUECLASS" });
    service.checkMovement({
      base,
      creature: fakeCreature({ data: {} }),
      isAdjustment: false,
    });
    if (!base.data.movement) throw new Error("expected movement to be set");
    expect(base.data.movement).toBe(movement);
    expect(base.data.movement.bonus).toBe(0);
  });
});

describe("convertMovement", () => {
  it("converts the tabletop movement rate with the 0.8 engine coefficient", () => {
    expect(creatureService.convertMovement(12)).toBe(10);
  });

  it("rounds to the nearest engine tick", () => {
    expect(creatureService.convertMovement(9)).toBe(7); // round(7.2)
  });
});

function fakeAbility(resource: string | undefined): CreatureAbility {
  return { resource, actions: [] } as unknown as CreatureAbility;
}

function fakeIdCastAbility(id: string): CreatureAbility {
  return {
    resource: undefined,
    actions: [{ name: "Spell", params: ["Myself", id] }],
  } as unknown as CreatureAbility;
}

function fakeFullAbility(
  resource: string | undefined,
  triggers: unknown[] = [],
  targets: unknown[] = [],
): CreatureAbility {
  return { resource, triggers, targets, actions: [] } as unknown as CreatureAbility;
}

function fakeSpellCreature(p: {
  memorized?: MemorizedSpell[];
  spellbooks?: SpellbookVariant[];
  adjustmentsMemorized?: MemorizedSpell[][];
  abilities?: CreatureAbility[];
  customCodeAbilities?: CreatureAbility[][];
}): Creature {
  return {
    name: "test",
    data: {
      spells: {
        memorized: p.memorized ?? [],
        spellbooks: p.spellbooks,
      },
    },
    adjustments: (p.adjustmentsMemorized ?? []).map((memorized) => ({
      data: { spells: { memorized } },
    })),
    behavior: {
      abilities: p.abilities ?? [],
      customCodes: (p.customCodeAbilities ?? []).map((abilities) => ({ abilities })),
    },
  } as unknown as Creature;
}

describe("checkSpellAbilities", () => {
  it("does not log when every memorized spell has a matching ability", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [fakeAbility("sppr101")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("errors when a spell in the default memorized list has no matching ability", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr101"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("default"));
    errorSpy.mockRestore();
  });

  it("errors once per spellbook variant missing an ability, naming the variant's mod", () => {
    const creature = fakeSpellCreature({
      spellbooks: [
        { mod: "FaithsAndPowers", memorized: [{ file: "sppr201" }] },
        { mod: "Vanilla", memorized: [{ file: "sppr301" }] },
      ],
      abilities: [fakeAbility("sppr201")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr301"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Vanilla"));
    errorSpy.mockRestore();
  });

  it("errors when an adjustment's memorized spell has no matching ability, naming the adjustment", () => {
    const creature = fakeSpellCreature({
      adjustmentsMemorized: [[{ file: "sppr401" }]],
      abilities: [],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr401"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("adjustment #0"));
    errorSpy.mockRestore();
  });

  it("warns once when an ability references a spell that isn't memorized anywhere", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [fakeAbility("sppr101"), fakeAbility("sppr999")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("sppr999"));
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("does not warn about an ability with no resource (e.g. a non-spell ability)", () => {
    const creature = fakeSpellCreature({
      memorized: [],
      abilities: [fakeAbility(undefined)],
    });
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("includes the resolved spell name in the error when the missing-ability file is a known spell", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "SPWI118" }],
      abilities: [],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("SPWI118' (Chromatic Orb)"));
    errorSpy.mockRestore();
  });

  it("omits the parenthesized spell name in the error when the file isn't a known spell", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("spell 'sppr101' is memorized"));
    errorSpy.mockRestore();
  });

  it("includes the resolved spell name in the warning when the unmemorized-ability file is a known spell", () => {
    const creature = fakeSpellCreature({
      memorized: [],
      abilities: [fakeAbility("SPWI118")],
    });
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("SPWI118' (Chromatic Orb)"));
    warnSpy.mockRestore();
  });

  it("errors only once for a duplicate memorized spell file within the same group", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }, { file: "sppr101" }],
      abilities: [],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("warns only once when two abilities share the same unmatched resource", () => {
    const creature = fakeSpellCreature({
      memorized: [],
      abilities: [fakeAbility("sppr999"), fakeAbility("sppr999")],
    });
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("does not error when a memorized spell's only matching ability lives inside a customCodes block", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [],
      customCodeAbilities: [[fakeAbility("sppr101")]],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not warn about a customCodes ability whose resource is memorized in the default list", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [],
      customCodeAbilities: [[fakeAbility("sppr101")]],
    });
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("resolves an ability that casts by spell id (no resource/preset) to its spell file", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "SPWI416" }],
      abilities: [fakeIdCastAbility("WIZARD_POLYMORPH_SELF")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not resolve an unknown spell id, so an unmatched memorized spell still errors", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [fakeIdCastAbility("NOT_A_REAL_SPELL_ID")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr101"));
    errorSpy.mockRestore();
  });
});

describe("memorizedSpellFiles", () => {
  it("returns the deduped union of default memorized, spellbook variants, and adjustment spells", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }, { file: "sppr101" }],
      spellbooks: [{ mod: "FaithsAndPowers", memorized: [{ file: "sppr201" }] }],
      adjustmentsMemorized: [[{ file: "sppr301" }]],
    });
    expect(creatureService.memorizedSpellFiles(creature)).toEqual(["sppr101", "sppr201", "sppr301"]);
  });

  it("returns an empty array when nothing is memorized", () => {
    const creature = fakeSpellCreature({});
    expect(creatureService.memorizedSpellFiles(creature)).toEqual([]);
  });
});

describe("checkDuplicateAbilities", () => {
  it("errors when two abilities share the same resource and the same trigger/target signature", () => {
    const creature = fakeSpellCreature({
      abilities: [fakeFullAbility("sppr101", [{ name: "Global" }]), fakeFullAbility("sppr101", [{ name: "Global" }])],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr101"));
    errorSpy.mockRestore();
  });

  it("does not error when the same spell has a different trigger signature", () => {
    const creature = fakeSpellCreature({
      abilities: [
        fakeFullAbility("sppr101", [{ name: "Global" }]),
        fakeFullAbility("sppr101", [{ name: "SpellCastOnMe" }]),
      ],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not error when abilities are all distinct", () => {
    const creature = fakeSpellCreature({
      abilities: [fakeFullAbility("sppr101"), fakeFullAbility("sppr102")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("errors when two id-cast abilities resolve to the same spell file and share a trigger signature", () => {
    const first = { ...fakeIdCastAbility("WIZARD_POLYMORPH_SELF"), triggers: [{ name: "Global" }] } as CreatureAbility;
    const second = { ...fakeIdCastAbility("WIZARD_POLYMORPH_SELF"), triggers: [{ name: "Global" }] } as CreatureAbility;
    const creature = fakeSpellCreature({
      abilities: [first, second],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("does not error when two id-cast abilities resolve to different spell files despite sharing a trigger signature", () => {
    const first = { ...fakeIdCastAbility("WIZARD_POLYMORPH_SELF"), triggers: [{ name: "Global" }] } as CreatureAbility;
    const second = { ...fakeIdCastAbility("WIZARD_CHROMATIC_ORB"), triggers: [{ name: "Global" }] } as CreatureAbility;
    const creature = fakeSpellCreature({
      abilities: [first, second],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("errors on a duplicate even when the trigger/target objects have differently ordered keys", () => {
    const creature = fakeSpellCreature({
      abilities: [
        fakeFullAbility("sppr101", [{ name: "Global", params: [1] }]),
        fakeFullAbility("sppr101", [{ params: [1], name: "Global" }]),
      ],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});

function fakeDialogCreature(dialog: string[]): Creature {
  return {
    name: "test",
    id: 1,
    behavior: { dialog },
  } as unknown as Creature;
}

describe("checkDialog", () => {
  it("passes without consulting creatures.csv when behavior.dialog is empty", () => {
    const creature = fakeDialogCreature([]);
    const getRowsSpy = vi.spyOn(monsterFilesService, "getDialogRows");
    expect(creatureService.checkDialog(creature)).toBe(true);
    expect(getRowsSpy).not.toHaveBeenCalled();
    getRowsSpy.mockRestore();
  });

  it("passes when a matching row has dialog equal to deathvar", () => {
    const creature = fakeDialogCreature(["L#MIMMI"]);
    const getRowsSpy = vi
      .spyOn(monsterFilesService, "getDialogRows")
      .mockReturnValue([{ file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "L#MIMMI" }]);
    expect(creatureService.checkDialog(creature)).toBe(true);
    expect(getRowsSpy).toHaveBeenCalledWith(1);
    getRowsSpy.mockRestore();
  });

  it("discards rows with an empty deathvar and still passes on a remaining valid row", () => {
    const creature = fakeDialogCreature(["L#MIMMI"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "ANKHEG01", deathvar: "", dialog: "" },
      { file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "L#MIMMI" },
    ]);
    expect(creatureService.checkDialog(creature)).toBe(true);
    vi.restoreAllMocks();
  });

  it("errors and fails when every row has an empty deathvar (nothing to validate against)", () => {
    const creature = fakeDialogCreature(["L#MIMMI"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "ANKHEG01", deathvar: "", dialog: "" },
    ]);
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(creatureService.checkDialog(creature)).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("no entry with a deathVar"));
    vi.restoreAllMocks();
  });

  it("errors and fails when a declared dialog value has no matching deathvar row", () => {
    const creature = fakeDialogCreature(["MISSING"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "L#MIMMI" },
    ]);
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(creatureService.checkDialog(creature)).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("deathvar 'MISSING' not found"));
    vi.restoreAllMocks();
  });

  it("reports every declared dialog value that has no matching deathvar row", () => {
    const creature = fakeDialogCreature(["A", "B"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "F1", deathvar: "OTHER", dialog: "OTHER" },
    ]);
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(creatureService.checkDialog(creature)).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });
});

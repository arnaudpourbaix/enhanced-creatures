import { describe, expect, it } from "vitest";
import { SPELLS } from "../../config/spells/spell-database";
import { ItemAbilityPrimaryTypeEnum as School } from "../model/spell-item/effect.enums";
import { SpellCombo } from "../model/spell-item/spell-combo";
import { SpellReference } from "../model/spell-item/spell-reference";
import spellComboFactory, { ComboLists } from "./spell-combo.factory";

const spell = (file: string, school?: School): SpellReference =>
  ({ file, level: 1, school }) as SpellReference;

const necro = spell("NECRO", School.Necromancer);
const illusion = spell("ILLU", School.Illusionist);
const invoke = spell("INVO", School.Invoker);
const noSchool = spell("NONE");
const priestNecro = SPELLS.Priest.UnholyBlight;

const combo = <K extends SpellCombo["kind"]>(
  kind: K,
  key: string,
  spells: SpellReference[],
): SpellCombo<K> => ({ key, kind, spells });

const groups: ComboLists = {
  MinorSequencers: {
    Necro: combo("minorSequencer", "Necro", [necro, necro]),
    NecroIllusion: combo("minorSequencer", "NecroIllusion", [necro, illusion]),
    Invoke: combo("minorSequencer", "Invoke", [invoke, invoke]),
  },
  SpellSequencers: {
    NecroNoSchool: combo("spellSequencer", "NecroNoSchool", [necro, noSchool, noSchool]),
    NoSchool: combo("spellSequencer", "NoSchool", [noSchool, noSchool, noSchool]),
    Priest: combo("spellSequencer", "Priest", [priestNecro, priestNecro, priestNecro]),
  },
  Contingencies: {
    Illusion: combo("contingency", "Illusion", [illusion]),
  },
  ChainContingencies: {
    InvokeNecro: combo("chainContingency", "InvokeNecro", [invoke, necro, necro]),
  },
};

const keys = (combos: SpellCombo[]): string[] => combos.map((c) => c.key);

describe("bySchool", () => {
  it("keeps every combo holding at least one spell of a wanted school", () => {
    const result = spellComboFactory.bySchool([School.Necromancer], { groups });
    expect(keys(result.minorSequencers)).toEqual(["Necro", "NecroIllusion"]);
    expect(keys(result.spellSequencers)).toEqual(["NecroNoSchool"]);
    expect(keys(result.contingencies)).toEqual([]);
    expect(keys(result.chainContingencies)).toEqual(["InvokeNecro"]);
  });

  it("matches any of several schools", () => {
    const result = spellComboFactory.bySchool([School.Invoker, School.Illusionist], { groups });
    expect(keys(result.minorSequencers)).toEqual(["NecroIllusion", "Invoke"]);
    expect(keys(result.contingencies)).toEqual(["Illusion"]);
  });

  it("drops combos holding a spell of a school opposed to the specialization", () => {
    // Necromancers can't cast illusions
    const result = spellComboFactory.bySchool([School.Necromancer, School.Illusionist], {
      specialization: School.Necromancer,
      groups,
    });
    expect(keys(result.minorSequencers)).toEqual(["Necro"]);
    expect(keys(result.contingencies)).toEqual([]);
  });

  it("keeps combos holding priest spells for a cleric/mage only", () => {
    const mage = spellComboFactory.bySchool([School.Necromancer], { groups });
    const clericMage = spellComboFactory.bySchool([School.Necromancer], {
      clericMage: true,
      groups,
    });
    expect(keys(mage.spellSequencers)).toEqual(["NecroNoSchool"]);
    expect(keys(clericMage.spellSequencers)).toEqual(["NecroNoSchool", "Priest"]);
  });

  it("takes a kind's own schools when given, the others keeping the common ones", () => {
    const result = spellComboFactory.bySchool([School.Necromancer], {
      contingencies: [School.Illusionist],
      groups,
    });
    expect(keys(result.minorSequencers)).toEqual(["Necro", "NecroIllusion"]);
    expect(keys(result.contingencies)).toEqual(["Illusion"]);
  });
});

import { COMBOS, holdsPriestSpell } from "../../config/spells/spell-combos";
import { SPELL_SCHOOLS, SpecialistSchool } from "../../config/spells/spell-school";
import { SpellCombo } from "../model/spell-item/spell-combo";
import { ItemAbilityPrimaryTypeEnum } from "../model/spell-item/effect.enums";
import { SpellBook } from "../model/spell-item/spellbook";

/** A combo registry, one group per kind (the shape of COMBOS). */
export interface ComboLists {
  MinorSequencers: Record<string, SpellCombo<"minorSequencer">>;
  SpellSequencers: Record<string, SpellCombo<"spellSequencer">>;
  Contingencies: Record<string, SpellCombo<"contingency">>;
  ChainContingencies: Record<string, SpellCombo<"chainContingency">>;
}

/** The spellbook fields a thematic pick fills, spread into a SpellBook. */
export type SpellBookCombos = Required<
  Pick<SpellBook, "minorSequencers" | "spellSequencers" | "contingencies" | "chainContingencies">
>;

/** Per kind, the schools replacing bySchool's `schools` for that kind only. */
export type SchoolsByKind = Partial<Record<keyof SpellBookCombos, ItemAbilityPrimaryTypeEnum[]>>;

export interface BySchoolOptions extends SchoolsByKind {
  /** Leaves out combos holding a spell of one of its opposed schools (see SPELL_SCHOOLS). */
  specialization?: SpecialistSchool;
  /** A multi-class cleric/mage's book: combos holding priest spells are kept. */
  clericMage?: boolean;
  /** The registry to pick from, COMBOS by default. */
  groups?: ComboLists;
}

class SpellComboFactory {
  /**
   * Every combo holding at least one spell of `schools` (spells of no school neither match nor
   * exclude), or of a kind's own list when given (`contingencies: [Abjurer]`). Combos holding a
   * priest spell are left out unless the book is a cleric/mage's.
   */
  bySchool(schools: ItemAbilityPrimaryTypeEnum[], options: BySchoolOptions = {}): SpellBookCombos {
    const { specialization, clericMage = false, groups = COMBOS } = options;
    const opposed = new Set(specialization ? SPELL_SCHOOLS[specialization].opposed : []);
    const pick = <K extends SpellCombo>(group: Record<string, K>, kindSchools = schools): K[] => {
      const wanted = new Set(kindSchools);
      const fits = (combo: SpellCombo): boolean =>
        (clericMage || !holdsPriestSpell(combo)) &&
        combo.spells.some((spell) => spell.school !== undefined && wanted.has(spell.school)) &&
        !combo.spells.some((spell) => spell.school !== undefined && opposed.has(spell.school));
      return Object.values(group).filter(fits);
    };
    return {
      minorSequencers: pick(groups.MinorSequencers, options.minorSequencers),
      spellSequencers: pick(groups.SpellSequencers, options.spellSequencers),
      contingencies: pick(groups.Contingencies, options.contingencies),
      chainContingencies: pick(groups.ChainContingencies, options.chainContingencies),
    };
  }
}

const spellComboFactory = new SpellComboFactory();
export default spellComboFactory;

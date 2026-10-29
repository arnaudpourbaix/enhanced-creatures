import { getAllFnpSpells } from "../../config/spells/fnp-spell-database";
import { SpellKeyword } from "../../config/spells/keyword";
import { NEW_SPELL_PROFILES } from "../../config/spells/new-spell-profiles";
import { SPELLS } from "../../config/spells/spell-database";
import { SpellRole, SpellTier } from "../../config/spells/spell-role";
import { Creature } from "../model/creature/creature";
import { SpellTypeEnum } from "../model/spell-item/effect.enums";
import { spellFiles, SpellReference, SpellSaves } from "../model/spell-item/spell-reference";
import spellComboService from "./spell-combo.service";

/** What the cast order rules know of a castable file (see SpellScoringService). */
export interface SpellProfile {
  file: string;
  level: number;
  type: SpellTypeEnum;
  role: SpellRole;
  secondaryRoles: SpellRole[];
  castingTime: number;
  keywords: SpellKeyword[];
  saves?: SpellSaves;
  tier: SpellTier;
  /** An area spell hitting the caster's allies too: it needs them out of the way */
  hitsAllies: boolean;
  /** How many spells it casts at once: more than 1 for a sequencer */
  spellCount: number;
}

/** What a database entry, a NEW_SPELL_PROFILES entry or a creature's spell gives a profile */
interface ProfileSource {
  level?: number;
  role?: SpellRole;
  secondaryRoles?: SpellRole[];
  keywords?: SpellKeyword[];
  saves?: SpellSaves;
  tier?: SpellTier;
  castingTime?: number;
  hitsAllies?: boolean;
}

/** The type of a SPELLS category's spells */
const CATEGORY_TYPES: Record<string, SpellTypeEnum> = {
  Wizard: SpellTypeEnum.Wizard,
  Priest: SpellTypeEnum.Priest,
};

/** Stronger first, when picking the spell a sequencer is profiled after */
const ROLE_STRENGTH: SpellRole[] = [
  "kill",
  "damage",
  "disable",
  "summon",
  "protection",
  "buff",
  "reactive",
  "shapeshift",
  "useless",
];

class SpellProfileService {
  private database?: Map<string, SpellProfile>;

  /**
   * The profile of a file a creature casts: a database spell (SPELLS, Faiths and Powers), a spell
   * this mod creates (NEW_SPELL_PROFILES), a combo (from its spells) or the creature's own spell.
   * Undefined when nothing profiles it - a creature's own spell without a role included.
   */
  profileOf(file: string, creature: Creature): SpellProfile | undefined {
    const key = file.toUpperCase();
    return (
      this.databaseProfiles().get(key) ??
      this.comboProfile(file, creature) ??
      this.ownProfile(key, creature)
    );
  }

  private databaseProfiles(): Map<string, SpellProfile> {
    if (this.database) return this.database;
    const profiles = new Map<string, SpellProfile>();
    const add = (file: string, profile: SpellProfile, obsoleted: boolean) => {
      // entries for different mods may share a file: the one a mod doesn't obsolete wins
      if (!profiles.has(file.toUpperCase()) || !obsoleted)
        profiles.set(file.toUpperCase(), profile);
    };
    for (const [category, spells] of Object.entries(SPELLS)) {
      const type = CATEGORY_TYPES[category] ?? SpellTypeEnum.Innate;
      for (const spell of Object.values(spells) as SpellReference[]) {
        const profile = this.fromEntry(spell, type);
        if (!profile) continue;
        for (const file of spellFiles(spell)) add(file, { ...profile, file }, !!spell.obsoletedBy);
      }
    }
    for (const spell of getAllFnpSpells()) {
      const profile = this.fromEntry(spell, spell.type);
      if (profile) add(spell.file, profile, false);
    }
    for (const [file, spell] of Object.entries(NEW_SPELL_PROFILES)) {
      add(file, this.profile(file, spell, spell.type, spell.castingTime), false);
    }
    this.database = profiles;
    return profiles;
  }

  private fromEntry(
    spell: ProfileSource & { file: string },
    type: SpellTypeEnum,
  ): SpellProfile | undefined {
    if (spell.castingTime === undefined) return undefined;
    return this.profile(spell.file, spell, type, spell.castingTime);
  }

  private profile(
    file: string,
    spell: ProfileSource,
    type: SpellTypeEnum,
    castingTime: number,
  ): SpellProfile {
    if (spell.role === undefined) throw new Error(`Spell '${file}' has no role`);
    return {
      file,
      type,
      castingTime,
      level: spell.level ?? 1,
      role: spell.role,
      secondaryRoles: spell.secondaryRoles ?? [],
      keywords: spell.keywords ?? [],
      saves: spell.saves,
      tier: spell.tier ?? "decent",
      hitsAllies: spell.hitsAllies ?? false,
      spellCount: 1,
    };
  }

  /** A combo is profiled after its strongest spell; useless or unprofiled ones don't count. */
  private comboProfile(file: string, creature: Creature): SpellProfile | undefined {
    const spells = spellComboService.spellsOfFile(file);
    if (!spells) return undefined;
    const scorable = spells
      .map((spell) => this.profileOf(spell.file, creature))
      .filter((profile): profile is SpellProfile => !!profile && profile.role !== "useless");
    if (!scorable.length) return undefined;
    const best = [...scorable].sort(
      (a, b) => b.level - a.level || ROLE_STRENGTH.indexOf(a.role) - ROLE_STRENGTH.indexOf(b.role),
    )[0];
    return { ...best, file, spellCount: scorable.length };
  }

  private ownProfile(file: string, creature: Creature): SpellProfile | undefined {
    const spell = creature.spells.find((s) => s.file.toUpperCase() === file);
    if (spell?.role === undefined) return undefined;
    const castingTime = spell.castingTime ?? spell.headers[0]?.speed ?? 0;
    return this.profile(spell.file, spell, spell.type, castingTime);
  }
}

const spellProfileService = new SpellProfileService();
export default spellProfileService;

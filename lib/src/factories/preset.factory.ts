import { FNP_SPELLS } from "../../config/spells/fnp-spell-database";
import { SPELLS } from "../../config/spells/spell-database";
import { RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";
import { keywordsForFile, levelForFile } from "../model/spell-item/spell-reference";

class PresetFactory {
  /**
   * Builds one AbilityPreset per file variant sharing the same ability body (e.g. a spell's
   * vanilla file and its Faiths & Powers equivalent) - see AbilityPreset.
   *
   * `ability.keywords` is auto-resolved here (once, shared by every variant) when not already set:
   * the first name that matches a real SPELLS entry wins. Resolving once up front - rather than per
   * variant in AbilityService.applyPreset - matters because not every variant is itself a SPELLS
   * entry (e.g. FNP_SPELLS has no `keywords` field compatible with SpellCollection), so resolving
   * per variant would silently leave some of them unprotected even though they're the same spell.
   * This is safe for `keywords` because every variant of one spell shares the same effect type.
   *
   * `ability.level`, by contrast, is resolved PER NAME: unlike `keywords`, variants of the same
   * spell do not necessarily share a level (e.g. Wizard Hold Person is level 3 while Priest Hold
   * Person is level 2; a vanilla spell and its Faiths & Powers equivalent can also differ, e.g.
   * Cause Disease is level 3 in SPELLS but level 1 in FNP_SPELLS). Each name gets its own level:
   * first via levelForFile(SPELLS, n), then via levelForFile(FNP_SPELLS, n) for a name that isn't a
   * SPELLS entry but is a real FNP_SPELLS one (FNP_SPELLS entries are structurally compatible with
   * levelForFile's SpellCollection shape - they just aren't SpellCollection *members*, i.e. SPELLS
   * itself doesn't include them). A name that resolves in neither registry falls back to the first
   * level resolved from any other name, so it still gets something reasonable rather than nothing.
   *
   * An explicit `ability.keywords`/`ability.level` (for an ability with no SPELLS entry of its own)
   * always wins over auto-resolution.
   */
  create(names: string[], ability: RawCreatureAbility): AbilityPreset[] {
    const keywords = ability.keywords ?? names.map((n) => keywordsForFile(SPELLS, n)).find(Boolean);
    const resolvedLevels = names.map((n) => levelForFile(SPELLS, n) ?? levelForFile(FNP_SPELLS, n));
    const sharedFallbackLevel = resolvedLevels.find((l) => l !== undefined);
    const results: AbilityPreset[] = names.map((n, i) => {
      const merged: RawCreatureAbility = { ...ability };
      if (keywords) merged.keywords = keywords;
      const level = ability.level ?? resolvedLevels[i] ?? sharedFallbackLevel;
      if (level !== undefined) merged.level = level;
      return { preset: n, ability: structuredClone(merged) };
    });
    return results;
  }
}

const presetFactory = new PresetFactory();
export default presetFactory;

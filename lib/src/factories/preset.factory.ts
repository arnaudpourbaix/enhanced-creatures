import { SPELLS } from "../../config/spells/spell-database";
import { RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";
import { keywordsForFile, levelForFile } from "../model/spell-item/spell-reference";

class PresetFactory {
  /**
   * Builds one AbilityPreset per file variant sharing the same ability body (e.g. a spell's
   * vanilla file and its Faiths & Powers equivalent) - see AbilityPreset.
   *
   * `ability.keywords` and `ability.level` are auto-resolved here (once, shared by every variant)
   * when not already set: the first name that matches a real SPELLS entry wins. Resolving once up
   * front - rather than per variant in AbilityService.applyPreset - matters because not every
   * variant is itself a SPELLS entry (e.g. FNP_SPELLS has no `keywords`/`level` field compatible
   * with SpellCollection), so resolving per variant would silently leave some of them unprotected
   * even though they're the same spell. An explicit `ability.keywords`/`ability.level` (for an
   * ability with no SPELLS entry of its own) always wins over this.
   */
  create(names: string[], ability: RawCreatureAbility): AbilityPreset[] {
    const keywords = ability.keywords ?? names.map((n) => keywordsForFile(SPELLS, n)).find(Boolean);
    const level =
      ability.level ?? names.map((n) => levelForFile(SPELLS, n)).find((l) => l !== undefined);
    const merged: RawCreatureAbility = { ...ability };
    if (keywords) merged.keywords = keywords;
    if (level !== undefined) merged.level = level;
    const results: AbilityPreset[] = names.map((n) => ({
      preset: n,
      ability: structuredClone(merged),
    }));
    return results;
  }
}

const presetFactory = new PresetFactory();
export default presetFactory;

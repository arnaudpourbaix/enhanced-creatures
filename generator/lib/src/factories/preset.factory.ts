import { RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";

class PresetFactory {
  create(names: string[], ability: RawCreatureAbility): AbilityPreset[] {
    const results: AbilityPreset[] = names.map((n) => ({
      preset: n,
      ability: structuredClone(ability),
    }));
    return results;
  }
}

const presetFactory = new PresetFactory();
export default presetFactory;

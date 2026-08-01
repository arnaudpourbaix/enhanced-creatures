import { DEFAULT_SPELL_PROBABILITY } from "../../config/common";
import { RawCreatureAbility } from "../model/creature/ability";
import { Triggers } from "../model/script/triggers";

class AbilityFactory {
  polymorphSelf(payload: { triggers: Triggers.Trigger[] }): RawCreatureAbility[] {
    const results: RawCreatureAbility[] = [];
    results.push({
      name: "spell.PolymorphSelf.name",
      spell: {
        id: "WIZARD_POLYMORPH_SELF",
        selfTarget: true,
      },
      triggers: payload.triggers,
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    });
    // TODO: cover all these creatures
    // Set intelligent form depending on situation
    // Fast form to run away or track players
    // Strong melee form in melee
    // Strong range in ranged
    const resources = [
      "SPWI495", // Spider, attack: 1-4 poison, apr: 2, ac: 4, dex: 17, str: 15, movement: 160%
      "SPWI496", // Mustard Jelly, attack: 5-20 poison, ac: 4, dex: 17, str: 15, movement: 160%
      "DW-PSOM", // Ogre Mage, attack: 1-10, ac: 4, dex: 12, str: 18/100
      "DW-PSHG", // Hill Giant Barbarian, attack: 2-16, ac: 3, dex: 10, str: 19
      "DW-PSHH", // Hell Hound, attack: 1-10 + 1-6 fire, ac: 4, dex: 15, str: 18, 100% resist fire, -50% resist cold
      "SPWI493", // Flind
      "SPWI494", // Ogre
      "SPWI497", // Brown Bear
      "SPWI490", // Natural Form
    ];
    const max = 1000;
    for (const [index, resource] of resources.entries()) {
      const triggers: Triggers.Trigger[] = [];
      if (index < resources.length - 1) {
        triggers.push({
          name: "RandomNumLT",
          params: [max, Math.round(max / (resources.length - index))],
        });
      }
      const ability: RawCreatureAbility = {
        triggers,
        name: "spell.PolymorphSelf.name",
        spell: {
          resource,
          selfTarget: true,
        },
        noRoundTimer: true,
        canUseWhenPolymorphed: true,
        timer: {
          name: "polymorph",
          value: 12,
        },
      };
      results.push(ability);
    }
    return results;
  }
}

const abilityFactory = new AbilityFactory();
export default abilityFactory;

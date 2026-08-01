import { Leaves } from "../src/model/utility-types";
import commonEn from "./en/common";
import monsterEn from "./en/monster";
import spellEn from "./en/spell";
import itemEn from "./en/item";
import descriptionEn from "./en/description";
import abilityEn from "./en/ability";

export const LANGUAGES = [
  "english",
  "french",
  "german",
  "italian",
  "polish",
  "russian",
  "spanish",
] as const;
export type Language = (typeof LANGUAGES)[number];

export const getTranslationKeys = (language: Language) => {
  // This project ships English only; the other LANGUAGES entries and this default:/"english"
  // switch are a deliberate placeholder for anyone who wants to contribute a translation later,
  // not an oversight - see SONARJS_ROADMAP.md.
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (language) {
    // eslint-disable-next-line sonarjs/prefer-default-last
    default:
    case "english":
      return {
        common: commonEn,
        monster: monsterEn,
        spell: spellEn,
        description: descriptionEn,
        item: itemEn,
        ability: abilityEn,
      };
  }
};

const _t = getTranslationKeys("english"); // typings is based on reference language
export type TranslationKey = Leaves<typeof _t>;

export const LANG: Language = "english";

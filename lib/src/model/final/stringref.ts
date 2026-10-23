import { ExistingStringReference } from "../../../config/stringRef";
import { TranslationKey } from "../../../translations/i18n";

export type StringReference = TranslationKey | number;

/** An existing dialog.tlk string, whose strref depends on the game (EXISTING_STRING_REFERENCES). */
export interface ExistingString {
  existing: ExistingStringReference;
}

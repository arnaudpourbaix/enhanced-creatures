import {
  getTranslationKeys,
  LANG,
  Language,
  LANGUAGES,
  TranslationKey,
} from "../../translations/i18n";
import { CR, TAB } from "../model/constants";
import { AbstractCodeService } from "./abstract-code.service";
import { StringReference } from "../model/final/stringref";
import utils from "./utils/utils.service";

class TranslationService extends AbstractCodeService {
  private availableStringRef = 10000;
  private translations: { key: TranslationKey; stringRef: number }[] = [];
  private customTranslations: { text: string; stringRef: number }[] = [];

  t = getTranslationKeys(LANG);

  constructor() {
    super();
    this.generateStringRefs();
  }

  addCustomTranslation(text: string[]): number {
    const stringRef = this.availableStringRef;
    this.availableStringRef++;
    this.customTranslations.push({ text: text.join(CR), stringRef });
    return stringRef;
  }

  stringRef(key: TranslationKey): number {
    const t = this.translations.find((v) => v.key === key);
    if (!t) throw new Error(`key ${key} not registered`);
    return t.stringRef;
  }

  from(ref: StringReference, lang = LANG): string {
    return typeof ref === "string" ? this.fromKey(ref, lang) : this.fromStringRef(ref, lang);
  }

  fromOptional(ref: StringReference | undefined): string {
    if (!ref) return "";
    return this.from(ref);
  }

  interpolate(key: TranslationKey, vars: Record<string, string | number>): string {
    let text = this.fromKey(key);
    for (const key of utils.objectKeys(vars)) {
      // vars is typed Record<string, string | number> (never undefined), but callers can still
      // pass an undefined value at runtime (JS callers, or an `as any` cast) - see
      // translation.service.test.ts's "throws when a provided var is undefined".
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (vars[key] === undefined) {
        throw new Error(`Found undefined in key for var ${key}`);
      }
      text = text.replace(new RegExp(`{{${key}}}`, "g"), `${vars[key]}`);
    }
    return text;
  }

  private fromKey(path: TranslationKey, lang = LANG): string {
    let value: unknown = getTranslationKeys(lang);
    for (const segment of path.split(".")) {
      value = (value as Record<string, unknown>)[segment];
    }
    // path is a TranslationKey (Leaves<typeof _t> - every dot-path down to a string leaf), so the
    // walk above always lands on a string.
    return value as string;
  }

  // lang is accepted for signature symmetry with fromKey() (from() dispatches to either with the
  // same args), but customTranslations aren't stored per-language - see
  // translation.service.test.ts's "fromStringRef (private) defaults lang when called without one
  // directly".
  private fromStringRef(stringRef: number, _lang = LANG): string {
    const translation = this.customTranslations.find((t) => t.stringRef === stringRef);
    if (!translation) throw new Error(`stringRef not found: ${stringRef}`);
    return translation.text;
  }

  generateStringRefs() {
    const translations = getTranslationKeys(LANG);
    this.browseTranslations(translations, "");
  }

  browseTranslations(obj: Record<string, unknown>, key: string) {
    for (const [k, v] of Object.entries(obj)) {
      const newKey = [key, k].filter((k) => !!k).join(".");
      if (typeof v === "string" && !v.includes("{{")) {
        this.translations.push({
          key: newKey as TranslationKey,
          stringRef: this.availableStringRef,
        });
        this.availableStringRef++;
      } else if (typeof v === "object" && v !== null) {
        this.browseTranslations(v as Record<string, unknown>, newKey);
      }
    }
  }

  generateWeiduFiles() {
    for (const lang of LANGUAGES) {
      this.generateWeiduFile(lang);
    }
  }

  generateWeiduFile(lang: Language) {
    const lines = this.initLines();
    for (const t of this.translations) {
      const text = this.fromKey(t.key, lang);
      this.add(lines, `@${t.stringRef} = ~${text}~`);
    }
    for (const t of this.customTranslations) {
      this.add(lines, `@${t.stringRef} = ~${t.text}~`);
    }
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    utils.writeFile(`languages/${lang}/generated.tra`, content);
  }
}

const translationService = new TranslationService();
export default translationService;

import { describe, expect, it } from "vitest";
import { TranslationKey } from "../../translations/i18n";
import translationService from "./translation.service";

interface TranslationServicePrivate {
  fromStringRef(stringRef: number): string;
}
const service = translationService as unknown as TranslationServicePrivate;

// A real, registered translation key reused as test fixture data below.
const POTION_USE_KEY: TranslationKey = "common.potion.use";

describe("stringRef", () => {
  it("throws when the key was never registered", () => {
    expect(() => translationService.stringRef("not.a.real.key" as TranslationKey)).toThrow(
      /key not\.a\.real\.key not registered/,
    );
  });

  it("returns the registered stringRef for a known key", () => {
    expect(translationService.stringRef(POTION_USE_KEY)).toBeTypeOf("number");
  });

  it("does not number docs-only translations", () => {
    expect(() => translationService.stringRef("doc.entry.vampire")).toThrow(/not registered/);
    expect(translationService.from("doc.entry.vampire")).toBe("Vampire");
  });

  it("resolves a multi-line doc.types description whole, without numbering it", () => {
    expect(() => translationService.stringRef("doc.types.dragon.desc")).toThrow(/not registered/);
    const lines = translationService.from("doc.types.dragon.desc").split("\n");
    expect(lines).toEqual([
      "A dragon is a reptilelike creature, usually winged, with magical or unusual abilities.",
      "Immunity to magic sleep effects and paralysis effects.",
      "Darkvision out to 60 feet and low-light vision.",
    ]);
  });
});

describe("fromOptional", () => {
  it("returns an empty string for undefined", () => {
    expect(translationService.fromOptional(undefined)).toBe("");
  });

  it("resolves a real reference when provided", () => {
    expect(translationService.fromOptional(POTION_USE_KEY)).toBe("*quaffs a potion*");
  });
});

describe("from (numeric stringRef)", () => {
  it("throws when the custom stringRef was never registered", () => {
    expect(() => translationService.from(999999999)).toThrow(/stringRef not found: 999999999/);
  });

  it("resolves a custom translation added via addCustomTranslation", () => {
    const stringRef = translationService.addCustomTranslation(["hello"]);
    expect(translationService.from(stringRef)).toBe("hello");
  });

  it("fromStringRef (private) defaults lang when called without one directly", () => {
    const stringRef = translationService.addCustomTranslation(["hi"]);
    expect(service.fromStringRef(stringRef)).toBe("hi");
  });
});

describe("interpolate", () => {
  it("throws when a provided var is undefined", () => {
    expect(() =>
      translationService.interpolate(POTION_USE_KEY, {
        foo: undefined as unknown as string,
      }),
    ).toThrow(/Found undefined in key for var foo/);
  });
});

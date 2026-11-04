import {
  EXISTING_STRING_REFERENCES,
  ExistingStringReference,
  StringReferenceGroup,
} from "../../../config/stringRef";
import { ExistingString } from "../../model/final/stringref";

/** The lowercase identifier a WeiDU variable name is built from: "Two Levels Drained" -> "two_levels_drained". */
function slug(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Existing strings' strrefs depend on the game, so the generated code never holds them: it reads
 * the WeiDU variables lib/common/string-refs.tpa sets at install time (see stringRefVariables).
 */
export const StringRefUtils = {
  /** The immunity `strings` value hiding every string of these groups (opcode 267). */
  getStringIds(groups: StringReferenceGroup | StringReferenceGroup[]): string[] {
    groups = typeof groups === "string" ? [groups] : groups;
    return groups
      .filter((group) => EXISTING_STRING_REFERENCES.some((s) => s.group === group))
      .map((group) => `%${this.groupVariable(group)}%`);
  },

  /** The string an effect displays, resolved at install time. */
  getString(str: ExistingStringReference): ExistingString {
    if (!EXISTING_STRING_REFERENCES.some((s) => s.str === str)) {
      throw new Error(`Stringref ${str} not found !`);
    }
    return { existing: str };
  },

  /** The integer variable holding the displayed strref of `str`. */
  variable(str: ExistingStringReference): string {
    return `ja_strref_${slug(str)}`;
  },

  /** The string variable holding every strref of `group`, space-separated. */
  groupVariable(group: StringReferenceGroup): string {
    return `ja_strrefs_${slug(group)}`;
  },

  /** Every variable's value per game: `bg1` on BGEE, `bg2` on BG2EE and EET. */
  stringRefVariables(): { name: string; integer: boolean; bg1: string; bg2: string }[] {
    const strings = EXISTING_STRING_REFERENCES.map((s) => ({
      name: this.variable(s.str),
      integer: true,
      bg1: `${s.bg1[0]}`,
      bg2: `${s.bg2[0]}`,
    }));
    const groups = [...new Set(EXISTING_STRING_REFERENCES.map((s) => s.group))].map((group) => {
      const entries = EXISTING_STRING_REFERENCES.filter((s) => s.group === group);
      return {
        name: this.groupVariable(group),
        integer: false,
        bg1: entries.flatMap((s) => s.bg1).join(" "),
        bg2: entries.flatMap((s) => s.bg2).join(" "),
      };
    });
    return [...strings, ...groups];
  },
};

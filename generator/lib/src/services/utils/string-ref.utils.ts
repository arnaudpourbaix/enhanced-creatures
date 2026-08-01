import {
  EXISTING_STRING_REFERENCES,
  ExistingStringReference,
  StringReferenceGroup,
} from "../../../config/stringRef";

export const StringRefUtils = {
  getStringIds(groups: StringReferenceGroup | StringReferenceGroup[]): string[] {
    groups = typeof groups === "string" ? [groups] : groups;
    return EXISTING_STRING_REFERENCES.filter((s) => groups.includes(s.group))
      .map((s) => s.id.map((i) => `${i}`))
      .flat();
  },
  getStringId(str: ExistingStringReference): number {
    const result = EXISTING_STRING_REFERENCES.find((s) => s.str === str);
    if (!result) throw new Error(`Stringref ${str} not found !`);
    // every entry's `id` tuple is non-empty by construction today, but this guards a future
    // config entry authored with an empty id array - see string-ref.utils.test.ts's "throws
    // when the matched entry has no id configured", which mutates the config to exercise it.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!result.id[0]) throw new Error(`Stringref ${str} has been found but no id configured !`);
    return result.id[0];
  },
};

import { ObjectIdentifier } from "./ids/object";

export type ParamType = "id" | "res" | "number";

// `string & {}` (not just `string`) keeps editor autocomplete offering the known ObjectIdentifier
// literals while still accepting any string - a plain `| string` union collapses to `string` for
// autocomplete purposes and also trips no-redundant-type-constituents.
export type ParamObject = ObjectIdentifier | (string & {});

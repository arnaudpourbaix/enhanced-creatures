import { ScriptTarget } from "../../src/model/constants";
import { SplStateIdentifier } from "../../src/model/ids/splstate";
import { StatsIdentifier } from "../../src/model/ids/stats";
import { Triggers } from "../../src/model/script/triggers";
import { SpellKeyword } from "../spells/keyword";

/**
 * Conditions making an ally safe from an ability's area of effect (see
 * BaseCreatureAbility.alliesCheck). Each one is a single trigger on ScriptTarget.token, which
 * stands for the ally being checked: BAF has no AND inside OR, and these end up inside one.
 */
export const allySafe = {
  resist: (stat: StatsIdentifier, min = 100): Triggers.Trigger => ({
    name: "CheckStatGT",
    params: [ScriptTarget.token, min - 1, stat],
  }),
  magicResistance: (min = 75): Triggers.Trigger => allySafe.resist("RESISTMAGIC", min),
  spellLevel: (level: number): Triggers.Trigger => ({
    name: "ImmuneToSpellLevel",
    params: [ScriptTarget.token, level],
  }),
  spellState: (state: SplStateIdentifier): Triggers.Trigger => ({
    name: "CheckSpellState",
    params: [ScriptTarget.token, state],
  }),
};

/**
 * Damage keywords an ally is safe from once fully resistant to them (see defaultAllySafe).
 */
const KEYWORD_RESISTANCES: Partial<Record<SpellKeyword, StatsIdentifier>> = {
  fire: "RESISTFIRE",
  cold: "RESISTCOLD",
  electrical: "RESISTELECTRICITY",
  acid: "RESISTACID",
  magicDamage: "MAGICDAMAGERESISTANCE",
};

/**
 * alliesCheck.safeIf used when an ability doesn't set its own: 100% resistance to any of its
 * damage keywords, 75% magic resistance, or immunity to its spell level (when known).
 */
export function defaultAllySafe(
  keywords: SpellKeyword[] = [],
  level?: number | null,
): Triggers.Trigger[] {
  const resistances = keywords.flatMap((k) => {
    const stat = KEYWORD_RESISTANCES[k];
    return stat ? [allySafe.resist(stat)] : [];
  });
  return [
    ...resistances,
    allySafe.magicResistance(),
    ...(typeof level === "number" ? [allySafe.spellLevel(level)] : []),
  ];
}

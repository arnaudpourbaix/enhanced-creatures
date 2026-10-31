import { getAllFnpSpells } from "../../../config/spells/fnp-spell-database";
import { SPELLS } from "../../../config/spells/spell-database";
import { ScriptTarget } from "../../model/constants";
import { Triggers } from "../../model/script/triggers";
import { getAllSpells, SpellReference, spellFiles } from "../../model/spell-item/spell-reference";

const KNOWN_SPELLS: SpellReference[] = [...getAllSpells(SPELLS), ...getAllFnpSpells()];

const spellOfFile = (file: string) =>
  KNOWN_SPELLS.find((s) => spellFiles(s).some((f) => f.toUpperCase() === file.toUpperCase()));

/** The range of the RandomNumGT weapon spells share, then the one summons do: see sharedRoll. */
const WEAPON_ROLL = 700;
const SUMMON_ROLL = 701;

/**
 * The range of the RandomNumGT shared by the spells of `file`'s family, undefined for any other
 * spell. Scripting draws one random value per tick for a given range: with chances falling down the
 * script, a weaker spell only passes when the stronger ones above it did, so a failed roll can't
 * make a caster settle for a weak weapon or summon while it still has a strong one.
 */
export function sharedRoll(file: string | undefined): number | undefined {
  const spell = file === undefined ? undefined : spellOfFile(file);
  if (spell?.createsItems) return WEAPON_ROLL;
  return spell?.role === "summon" ? SUMMON_ROLL : undefined;
}

/** The first ability of `triggers` raising the chance of its shared roll, breaking sharedRoll. */
export function sharedRollOutOfOrder(triggers: Triggers.Trigger[][]): string | undefined {
  const highest = new Map<number, number>();
  const rolls = triggers
    .flat()
    .filter((t): t is Triggers.RandomNumGT => "name" in t && t.name === "RandomNumGT")
    .filter(({ params: [range] }) => range === WEAPON_ROLL || range === SUMMON_ROLL);
  for (const {
    params: [range, threshold],
  } of rolls) {
    const previous = highest.get(range);
    if (previous !== undefined && threshold < previous) {
      return `RandomNumGT(${range},${threshold})`;
    }
    highest.set(range, threshold);
  }
  return undefined;
}

/** The spell a HaveSpell or HaveSpellRES names, undefined for any other trigger or spell. */
function spellOfTrigger(trigger: Triggers.Trigger): SpellReference | undefined {
  if (!("name" in trigger)) return undefined;
  if (trigger.name === "HaveSpell") return KNOWN_SPELLS.find((s) => s.id === trigger.params[0]);
  if (trigger.name === "HaveSpellRES") return spellOfFile(trigger.params[0]);
  return undefined;
}

/**
 * Limits an ability's checks about other spells to what its creature memorizes, so a script doesn't
 * test spells it can't have:
 * - a `!HaveSpell` on a spell it doesn't memorize is always true, and is dropped
 * - a spell creating a weapon (SpellReference.createsItems) isn't cast while holding the weapon of
 *   itself or of any memorized spell
 *
 * A spell no database knows keeps its check. The item checks go before a final RandomNumGT.
 */
export function memorizedChecks(
  triggers: Triggers.Trigger[],
  castFiles: string[],
  memorizedFiles: string[],
): Triggers.Trigger[] {
  const memorized = memorizedFiles.flatMap((file) => spellOfFile(file) ?? []);
  const isMemorized = (spell: SpellReference) =>
    spellFiles(spell).some((f) => memorizedFiles.some((m) => m.toUpperCase() === f.toUpperCase()));
  const kept = triggers.filter((trigger) => {
    if (!("negation" in trigger) || !trigger.negation) return true;
    const spell = spellOfTrigger(trigger);
    return !spell || isMemorized(spell);
  });
  const cast = castFiles.flatMap((file) => spellOfFile(file) ?? []);
  if (!cast.some((spell) => spell.createsItems)) return kept;
  const items = [...new Set([...cast, ...memorized].flatMap((s) => s.createsItems ?? []))];
  const checks: Triggers.Trigger[] = items.map((item) => ({
    name: "HasItem",
    params: [item, ScriptTarget.myself],
    negation: true,
  }));
  const random = kept.findIndex((t) => "name" in t && t.name === "RandomNumGT");
  const at = random < 0 ? kept.length : random;
  return [...kept.slice(0, at), ...checks, ...kept.slice(at)];
}

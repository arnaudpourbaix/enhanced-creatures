import { Creature } from "../../src/model/creature/creature";
import { Level } from "../../src/model/creature/data";
import creatureService from "../../src/services/creature.service";
import creatureTypeService from "../../src/services/creature-type.service";

/** Named rows of the PHB turning table (Table 61), from easiest to hardest to turn. */
export type TurnUndeadType =
  | "skeleton"
  | "zombie"
  | "ghoul"
  | "shadow"
  | "wight"
  | "ghast"
  | "wraith"
  | "mummy"
  | "spectre"
  | "vampire"
  | "ghost"
  | "lich"
  | "special";

/**
 * Each row as the Hit Dice it shares in the table ("Ghoul or 2 HD", "Wraith or 6 HD"...). The
 * engine compares the turner's level with the creature's level, and a plain undead's level is its
 * Hit Dice, so a row's Hit Dice is the in-game level to be turned as. Zombie and ghast rows have
 * no Hit Dice of their own (they sit between two Hit Dice rows): they take the higher one, as
 * being a bit harder to turn than in PnP is preferred over a bit easier.
 */
const TURN_ROW_HIT_DICE: Record<TurnUndeadType, number> = {
  skeleton: 1,
  zombie: 2,
  ghoul: 2,
  shadow: 4,
  wight: 5,
  ghast: 6,
  wraith: 6,
  mummy: 7,
  spectre: 8,
  vampire: 9,
  ghost: 10,
  lich: 11,
  special: 12,
};

/**
 * Sets the in-game level undead are turned at, for an undead creature and every adjustment that
 * changes its Hit Dice, or, for a creature that is not undead, for each adjustment making it
 * undead (zombie ankhegs). The table rows read "type *or* Hit Dice", so the harder one wins: the
 * `turnAs` row, or the Hit Dice ("+3" or more rounding up, as a 4+3 HD wight is in the 5 HD row).
 * Spellcasters keep their caster level, and creatures immune to turning are left alone.
 */
export function applyTurnLevel(creature: Creature): void {
  if (isImmuneToTurning(creature)) return;
  const base = creature.data;
  const own = creatureTypeService.getCreatureTypes(creature);
  const undead = own.includes("undead");
  if (undead) base.level1 = getTurnLevel(creature.turnAs, base.level1, base.bonusHp);
  const turned = creature.adjustments.filter(
    (a) => undead || creatureTypeService.getAdjustmentTypes(creature, a, own).includes("undead"),
  );
  for (const adjustment of turned) {
    const data = adjustment.data;
    // Same as the base's level when neither level1 nor bonusHp changes: left unset then.
    const level1 = getTurnLevel(
      creature.turnAs,
      data.level1 ?? base.level1,
      data.bonusHp ?? base.bonusHp,
    );
    if (data.level1 !== undefined || level1.value !== base.level1.value) data.level1 = level1;
  }
}

function getTurnLevel(turnAs: TurnUndeadType | undefined, level1: Level, bonusHp?: number): Level {
  if (level1.type === "caster") return level1;
  const value = Math.max(
    turnAs ? TURN_ROW_HIT_DICE[turnAs] : 0,
    creatureService.getEffectiveHitDice(level1.pnpValue, bonusHp),
  );
  return { value, pnpValue: level1.pnpValue, type: value === level1.pnpValue ? "none" : "turn" };
}

function isImmuneToTurning(creature: Creature): boolean {
  return [...creature.data.immunities, ...creature.items.flatMap((i) => i.immunities)].includes(
    "turnUndead",
  );
}

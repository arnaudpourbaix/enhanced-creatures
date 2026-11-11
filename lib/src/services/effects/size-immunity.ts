import { GARGANTUAN_CREATURES, HUGE_CREATURES, LARGE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureSize, CreatureSizeTable } from "../../model/game-data/sizes";
import { Effect } from "../../model/spell-item/effect";
import { EffectIDSFileEnum } from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../model/spell-item/spell-protection";
import logService from "../log.service";

type CreatureEntry = [EffectIDSFileEnum, string];

/** The creatures known to be bigger than Medium, by size (anything else counts as Medium or less). */
const SIZED_CREATURES: [CreatureSize, CreatureEntry[]][] = [
  ["Large", LARGE_CREATURES],
  ["Huge", HUGE_CREATURES],
  ["Gargantuan", GARGANTUAN_CREATURES],
];

const sizeIndex = (size: CreatureSize) => CreatureSizeTable.findIndex((s) => s.size === size);

/**
 * The creatures too big for an attack on the body (a grab, a trip): bigger than the attacker, or
 * than one size more with `reach` 1 (a grab on a limb).
 */
export function getTooBigCreatures(creature: Creature, reach: 0 | 1 = 0): CreatureEntry[] {
  // size is required by MainCreatureData, but defended anyway: an unsized creature gets no limit
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!creature.data.size) {
    logService.warn(`Creature size is needed to add size immunities!`);
    return [];
  }
  const max = sizeIndex(creature.data.size.value) + reach;
  return SIZED_CREATURES.filter(([size]) => sizeIndex(size) > max).flatMap(([, list]) => list);
}

/** Protections from the spell itself (op 318, before its effects apply), by race or class. */
export function getProtectionEffects(list: CreatureEntry[]): Effect[] {
  return list.map(([file, entry]) => ({
    opcode: EffectTypeEnum.ProtectionFromResource,
    type: {
      stat: file === EffectIDSFileEnum.CLASS ? SpellProtectionStat.Class : SpellProtectionStat.Race,
      relation: SpellProtectionRelation.Equal,
    },
    value: entry,
    duration: 1,
  }));
}

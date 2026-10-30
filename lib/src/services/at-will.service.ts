import { AT_WILL } from "../../config/common";
import { SPELL_SCORING } from "../../config/spell-scoring";
import { Creature } from "../model/creature/creature";
import { CreatureData, MemorizedSpell } from "../model/creature/data";
import spellProfileService from "./spell-profile.service";
import { State } from "../state";

/** Set by the script while the creature memorizes a spell of its spellbook */
export const SPELLBOOK_GLOBAL = "JA_SPELLBOOK";

/** Seconds per round, as timers count */
const ROUND = 6;

class AtWillService {
  /**
   * Gives every ability casting an at-will power a cooldown when using it costs the creature
   * something better: the round's spell when it has a spellbook (built from a SpellBook, not other
   * memorized spells), or its attacks when the power takes longer to cast than its fighting affords (Wall of Ice for a Death Knight, not Domination
   * for a vampire). An ability declaring its own timer keeps it.
   */
  applyCooldowns(creature: Creature): void {
    const memorized = this.memorized(creature);
    const atWill = new Set(
      memorized.filter((m) => (m.memorizedCount ?? 1) >= AT_WILL).map((m) => m.file.toUpperCase()),
    );
    if (!atWill.size) return;
    // a spellbook in the base data is in every file the script runs for; one only some files
    // have (an adjustment's, Tanova among patriarchs) is checked in game
    const everyFile = this.spellbookFiles(creature.data, atWill).length > 0;
    const adjusted = [
      ...new Set(creature.adjustments.flatMap((a) => this.spellbookFiles(a.data, atWill))),
    ];
    if (!everyFile && adjusted.length) creature.behavior.spellbookFiles = adjusted;
    const abilities = [
      ...creature.behavior.abilities,
      ...creature.behavior.coveredAbilities,
      ...creature.behavior.customCodes.flatMap((c) => c.abilities),
    ];
    for (const ability of abilities) {
      const file = ability.resource?.toUpperCase();
      if (!file || !atWill.has(file) || ability.timer) continue;
      const power = this.power(file, creature);
      const timer = { name: `ATWILL_${file}`, value: this.cooldown(power.level) * ROUND };
      if (everyFile || power.castingTime > this.afforded(creature)) ability.timer = timer;
      else if (adjusted.length) ability.timer = { ...timer, unlessGlobalUnset: SPELLBOOK_GLOBAL };
    }
  }

  /** The casting time the creature's fighting affords: none when it doesn't fight. */
  private afforded(creature: Creature): number {
    const afforded = SPELL_SCORING.atWillCooldown.affordedCastingTime;
    if (creature.attack.melee) return afforded.melee;
    return creature.attack.ranged ? afforded.ranged : Infinity;
  }

  private cooldown(level: number): number {
    const { base, perLevel } = SPELL_SCORING.atWillCooldown;
    return base + Math.ceil(level * perLevel);
  }

  /** A power's level and casting time: the database's, or the created spell's. */
  private power(file: string, creature: Creature): { level: number; castingTime: number } {
    const profile = spellProfileService.profileOf(file, creature);
    if (profile) return profile;
    // its own spell, or one shared on its family (a vampire's Domination): every created spell
    const spell = [...creature.spells, ...State.spells].find((s) => s.file.toUpperCase() === file);
    if (!spell) return { level: 1, castingTime: 0 };
    return (
      spellProfileService.profileOfSpell(spell) ?? {
        level: spell.level,
        castingTime: spell.castingTime ?? spell.headers[0]?.speed ?? 0,
      }
    );
  }

  /** The spells of `data`'s spellbooks (built from a SpellBook), its at-will powers aside. */
  private spellbookFiles({ spells }: CreatureData, atWill: Set<string>): string[] {
    return (spells.spellbooks ?? [])
      .filter((book) => book.spellbook)
      .flatMap((book) => book.memorized.map((m) => m.file))
      .filter((file) => !atWill.has(file.toUpperCase()));
  }

  /** Every memorized spell with its count: base data's and adjustments', spellbook variants too. */
  private memorized(creature: Creature): MemorizedSpell[] {
    return [creature.data, ...creature.adjustments.map((a) => a.data)].flatMap(({ spells }) => [
      ...spells.memorized,
      ...(spells.spellbooks ?? []).flatMap((book) => book.memorized),
    ]);
  }
}

const atWillService = new AtWillService();
export default atWillService;

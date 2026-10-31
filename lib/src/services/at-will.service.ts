import { AT_WILL } from "../../config/common";
import { SPELL_SCORING } from "../../config/spell-scoring";
import { Creature } from "../model/creature/creature";
import { CreatureData, MemorizedSpell } from "../model/creature/data";
import spellProfileService from "./spell-profile.service";
import { gamesOverlap } from "../model/creature/game";
import { State } from "../state";
import translationService from "./translation.service";

/** Set by the script while the creature memorizes a spell of its spellbook */
export const SPELLBOOK_GLOBAL = "JA_SPELLBOOK";

/** Seconds per round, as timers count */
export const ROUND = 6;

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

  /**
   * Refuses an at-will spell added more than once to a creature file: the base data and the
   * adjustments patching that file stack their counts (unless one replaces them, see
   * `cumulative`), so its count would exceed AT_WILL. Spellbook variants are alternatives: one
   * of them is used.
   */
  checkDuplicates(creature: Creature): void {
    const errors: string[] = [];
    for (const file of creature.files) {
      const counts = new Map<string, number>();
      const patches = creature.adjustments.filter(
        (a) => a.files.includes(file.name) && gamesOverlap(a.game, file.game),
      );
      for (const data of [creature.data, ...patches.map((a) => a.data)]) {
        if (data.spells.cumulative === false) counts.clear();
        for (const [spell, declared] of this.atWillDeclarations(data)) {
          counts.set(spell, (counts.get(spell) ?? 0) + declared);
        }
      }
      for (const [spell, count] of counts) {
        if (count > 1) errors.push(`${spell} added ${count} times to ${file.name}`);
      }
    }
    if (errors.length) {
      throw new Error(
        `${translationService.from(creature.name)}: at-will spells added several times: ${errors.join(", ")}`,
      );
    }
  }

  /** How many times `data` adds each at-will spell: its most in one list (variants exclude each other). */
  private atWillDeclarations({ spells }: CreatureData): Map<string, number> {
    const declarations = new Map<string, number>();
    for (const list of [spells.memorized, ...(spells.spellbooks ?? []).map((b) => b.memorized)]) {
      const inList = new Map<string, number>();
      for (const m of list) {
        if ((m.memorizedCount ?? 1) < AT_WILL) continue;
        const file = m.file.toUpperCase();
        inList.set(file, (inList.get(file) ?? 0) + 1);
      }
      for (const [file, count] of inList) {
        declarations.set(file, Math.max(declarations.get(file) ?? 0, count));
      }
    }
    return declarations;
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
  memorized(creature: Creature): MemorizedSpell[] {
    return [creature.data, ...creature.adjustments.map((a) => a.data)].flatMap(({ spells }) => [
      ...spells.memorized,
      ...(spells.spellbooks ?? []).flatMap((book) => book.memorized),
    ]);
  }
}

const atWillService = new AtWillService();
export default atWillService;

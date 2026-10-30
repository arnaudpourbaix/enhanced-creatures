import { AT_WILL } from "../../config/common";
import { SPELL_SCORING } from "../../config/spell-scoring";
import { Creature } from "../model/creature/creature";
import { MemorizedSpell } from "../model/creature/data";
import creatureService from "./creature.service";
import spellProfileService from "./spell-profile.service";
import { State } from "../state";

/** Seconds per round, as timers count */
const ROUND = 6;

class AtWillService {
  /**
   * Gives every ability casting an at-will power a cooldown when using it costs the creature
   * something better: the round's spell when it has a spellbook (mage abilities, not its own
   * few-use powers), or its attacks when the power
   * takes longer to cast than its fighting affords (Wall of Ice for a Death Knight, not Domination
   * for a vampire). An ability declaring its own timer keeps it.
   */
  applyCooldowns(creature: Creature): void {
    const memorized = this.memorized(creature);
    const atWill = new Set(
      memorized.filter((m) => (m.memorizedCount ?? 1) >= AT_WILL).map((m) => m.file.toUpperCase()),
    );
    if (!atWill.size) return;
    // mage abilities: memorized spells of the databases, not its own few-use powers (Bat Swarm)
    const spellbook = creatureService
      .memorizedSpellFiles(creature)
      .some((file) => !atWill.has(file.toUpperCase()) && spellProfileService.isCatalogued(file));
    const abilities = [
      ...creature.behavior.abilities,
      ...creature.behavior.coveredAbilities,
      ...creature.behavior.customCodes.flatMap((c) => c.abilities),
    ];
    for (const ability of abilities) {
      const file = ability.resource?.toUpperCase();
      if (!file || !atWill.has(file) || ability.timer) continue;
      const power = this.power(file, creature);
      if (spellbook || power.castingTime > this.afforded(creature)) {
        ability.timer = { name: `ATWILL_${file}`, value: this.cooldown(power.level) * ROUND };
      }
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
    return { level: spell?.level ?? 1, castingTime: spell?.headers[0]?.speed ?? 0 };
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

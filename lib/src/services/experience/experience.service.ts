import { CreatureAdjustment, PartialCreatureAdjustment } from "../../model/creature/adjustment";
import type { Creature } from "../../model/creature/creature";
import { CreatureFile, Game } from "../../model/creature/game";
import creatureFactory from "../../factories/creature.factory";
import adjustmentService from "../doc/adjustment.service";
import monsterFilesService, { CreatureCsvRow, pickCreatureRow } from "../monster-files.service";
import {
  detectAbilities,
  detectHitDice,
  ExperienceScope,
  matchingAdjustments,
} from "./experience-detection";
import { ExperienceScore, scoreExperience } from "./experience-table";

/**
 * How a file scope's XP is decided: `zero` (summon, xpv 0 or worth 0 in game), `book` (no
 * adjustment, the creature's own XP), `asBase` (its adjustments change nothing the formula
 * reads: the base creature's XP), `formula` (the 2e DMG score) or `drop` (the score is below the in-game XP, kept).
 */
export type ExperienceStatus = "zero" | "book" | "asBase" | "formula" | "drop";

export interface ExperienceRow {
  file: string;
  game?: Game;
  status: ExperienceStatus;
  reason: string;
  inGameXp?: number;
  newXp: number;
  score: ExperienceScore;
}

/** The base creature's book XP (its `xpv`) when it disagrees with its formula score. */
export interface ExperienceConflict {
  bookXp?: number;
  score: ExperienceScore;
}

/** One file as one game sees it, with that game's in-game XP. */
interface XpScope {
  file: string;
  game?: Game;
  /** The scope is one of several games of the file: its XP patch is tagged with that game. */
  split: boolean;
  inGameXp?: number;
}

const GAMES: Game[] = ["bg1", "bg2"];

const AS_BASE_REASON = "adjustment changes nothing the formula reads: base creature XP";

class ExperienceService {
  /** Entries `apply` appended, never read as the creature's own adjustments. */
  private readonly synthetic = new WeakSet<CreatureAdjustment>();
  private readonly applied = new WeakSet<Creature>();

  evaluate(creature: Creature): { rows: ExperienceRow[]; conflict?: ExperienceConflict } {
    const base = this.score({ creature });
    const rows = creature.files.flatMap((file) =>
      this.scopesOf(creature, file).map((scope) => this.rowOf(creature, scope, base)),
    );
    const conflict =
      creature.data.xpv === base.xp ? undefined : { bookXp: creature.data.xpv, score: base };
    return { rows, conflict };
  }

  /**
   * Stores the rows and the conflict on the creature, then appends one XP patch per `formula`,
   * `drop` and "0 in game" row, after every other adjustment so its xpv wins. Runs once.
   */
  apply(creature: Creature): void {
    if (this.applied.has(creature)) return;
    this.applied.add(creature);
    const { rows, conflict } = this.evaluate(creature);
    creature.experience = rows;
    creature.baseExperience = conflict;

    const patches: PartialCreatureAdjustment[] = rows
      .filter((row) => this.writes(row))
      .map((row) => ({ files: [row.file], game: row.game, data: { xpv: row.newXp } }));
    if (!patches.length) return;
    const before = creature.adjustments.length;
    creatureFactory.appendAdjustments(creature, patches);
    creature.adjustments.slice(before).forEach((a) => this.synthetic.add(a));
  }

  private writes(row: ExperienceRow): boolean {
    return (
      row.status === "formula" ||
      row.status === "drop" ||
      (row.status === "zero" && row.reason === "0 in game")
    );
  }

  /**
   * The file's game scopes: one per game its adjustments are tagged for plus every other game
   * the file is in (so no game silently keeps the book XP), else the file's own game, split per
   * game when the games' creatures.csv rows disagree on the in-game XP.
   */
  private scopesOf(creature: Creature, file: CreatureFile): XpScope[] {
    const rows = monsterFilesService.getCreatureRows(file.name, file.game);
    const fileGames = this.gamesOf(rows, file.game);
    const scope = (game: Game): XpScope => ({
      file: file.name,
      split: true,
      inGameXp: pickCreatureRow(rows, game)?.xpv,
      game,
    });
    const tagged = adjustmentService
      .getGameScopes(creature, file.name)
      .filter((g): g is Game => g !== undefined);
    if (tagged.length) {
      // A tagged game reads its own rows, even one the file has no creatures.csv row for.
      const own = tagged.map((game) => ({
        ...scope(game),
        inGameXp: this.inGameXp(file.name, game),
      }));
      // Its other games get a game-tagged patch too, so none keeps the book XP by accident.
      return [...own, ...fileGames.filter((g) => !tagged.includes(g)).map(scope)];
    }
    // Rows of one game never split the file on their own: duplicate rows of a game (from
    // different mods) resolve to its first creatures.csv row, as pickCreatureRow does.
    const values = new Set(fileGames.map((game) => pickCreatureRow(rows, game)?.xpv));
    if (file.game === undefined && values.size > 1) {
      // Every patch carries a game, so getGameScopes still yields every game for the docs.
      return fileGames.map(scope);
    }
    const inGameXp = this.inGameXp(file.name, file.game);
    return [{ file: file.name, game: file.game, split: false, inGameXp }];
  }

  /**
   * The games a file is in: its own game when tagged, else the games of its creatures.csv rows,
   * an untagged row standing for every game. A file with no row has no known game.
   */
  private gamesOf(rows: CreatureCsvRow[], game: Game | undefined): Game[] {
    if (game !== undefined) return rows.length ? [game] : [];
    if (rows.some((r) => r.game === undefined)) return GAMES;
    return GAMES.filter((g) => rows.some((r) => r.game === g));
  }

  private inGameXp(file: string, game: Game | undefined): number | undefined {
    const rows = monsterFilesService.getCreatureRows(file, game);
    return rows.length ? pickCreatureRow(rows, game)?.xpv : undefined;
  }

  private rowOf(creature: Creature, scope: XpScope, base: ExperienceScore): ExperienceRow {
    const score = this.score({ creature, file: scope.file, game: scope.game });
    const matching = matchingAdjustments({ creature, file: scope.file, game: scope.game }).filter(
      (a) => !this.synthetic.has(a),
    );
    const { inGameXp } = scope;
    const row = (status: ExperienceStatus, reason: string, newXp: number): ExperienceRow => ({
      file: scope.file,
      game: scope.split ? scope.game : undefined,
      status,
      reason,
      inGameXp,
      newXp,
      score,
    });
    const bookXp = creature.data.xpv ?? inGameXp ?? 0;

    if (matching.some((a) => a.summon)) return row("zero", "summon", 0);
    if (matching.some((a) => a.data.xpv === 0)) return row("zero", "xpv 0", 0);
    if (inGameXp === 0) return row("zero", "0 in game", 0);
    if (!matching.length) return row("book", "no adjustment", bookXp);
    // As base never lowers the in-game XP: below it, the row is a drop like any other.
    const lowersInGame = inGameXp !== undefined && bookXp < inGameXp;
    if (score.total === base.total && this.sameAbilities(score, base) && !lowersInGame) {
      return row("asBase", AS_BASE_REASON, bookXp);
    }
    if (inGameXp === undefined || score.xp >= inGameXp) {
      return row("formula", score.breakdown, score.xp);
    }
    return row("drop", score.breakdown, inGameXp);
  }

  private score(scope: ExperienceScope): ExperienceScore {
    return scoreExperience(detectHitDice(scope), detectAbilities(scope));
  }

  private sameAbilities(a: ExperienceScore, b: ExperienceScore): boolean {
    const names = (s: ExperienceScore) =>
      s.abilities
        .map((x) => x.ability)
        .sort((x, y) => x.localeCompare(y))
        .join(",");
    return names(a) === names(b);
  }
}

const experienceService = new ExperienceService();
export default experienceService;

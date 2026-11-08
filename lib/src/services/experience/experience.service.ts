import { CreatureAdjustment, PartialCreatureAdjustment } from "../../model/creature/adjustment";
import type { Creature } from "../../model/creature/creature";
import { CreatureFile, Game } from "../../model/creature/game";
import { PLAYER_CONFIG } from "../../../config/player-config";
import creatureFactory from "../../factories/creature.factory";
import adjustmentService from "../doc/adjustment.service";
import monsterFilesService, { CreatureCsvRow, pickCreatureRow } from "../monster-files.service";
import {
  detectAbilities,
  detectHitDice,
  ExperienceScope,
  matchingAdjustments,
} from "./experience-detection";
import { ExperienceScore, scoreExperience, toughHitterAbility } from "./experience-table";
import { combatProfile } from "./threat/combat-profile";
import { meleeDuel } from "./threat/duel";
import { referenceFighter } from "./threat/reference";

/**
 * How a file scope's XP is decided: `zero` (summon, xpv 0 or worth 0 in game), `book` (no
 * adjustment, the creature's own XP), `asBase` (its adjustments change nothing the formula
 * reads: the base creature's XP), `formula` (the 2e DMG formula's score) or `drop` (the score is below the in-game XP, kept).
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
  /** Some adjustment of the creature covers the file (false: the base creature itself) */
  adjusted?: boolean;
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

  evaluate(creature: Creature): {
    rows: ExperienceRow[];
    conflict?: ExperienceConflict;
    base: ExperienceScore;
  } {
    const base = this.score({ creature });
    const rows = creature.files.flatMap((file) =>
      this.scopesOf(creature, file).map((scope) => this.rowOf(creature, scope, base)),
    );
    // the book XP (xpv2e), whichever XP plays
    const bookXp = creature.data.xpv2e ?? creature.data.xpv;
    const conflict = bookXp === base.xp ? undefined : { bookXp, score: base };
    return { rows, conflict, base };
  }

  /**
   * Stores the rows and the conflict on the creature, then appends one XP patch per `formula`,
   * `drop` and "0 in game" row, after every other adjustment so its xpv wins. Runs once.
   */
  apply(creature: Creature): void {
    if (this.applied.has(creature)) return;
    this.applied.add(creature);
    const { rows, conflict, base } = this.evaluate(creature);
    creature.experience = rows;
    creature.baseExperience = conflict;
    creature.baseScore = base;
    // scored by the formula: the base creature's own XP (its CRE and doc) is the base score, each
    // file's row patch (formula or drop) then sets what that file plays
    if (!PLAYER_CONFIG.experience2e) creature.data.xpv = base.xp;

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
      adjusted: matching.length > 0,
      status,
      reason,
      inGameXp,
      newXp,
      score,
    });
    // the base creature's XP: its book value (experience2e), else its formula score
    const bookXp = PLAYER_CONFIG.experience2e ? (creature.data.xpv ?? inGameXp ?? 0) : base.xp;

    if (matching.some((a) => a.summon)) return row("zero", "summon", 0);
    if (matching.some((a) => a.data.xpv === 0)) return row("zero", "xpv 0", 0);
    if (inGameXp === 0) return row("zero", "0 in game", 0);
    if (!matching.length && PLAYER_CONFIG.experience2e) return row("book", "no adjustment", bookXp);
    // As base never lowers the in-game XP: below it, the row is a drop like any other.
    const lowersInGame = inGameXp !== undefined && bookXp < inGameXp;
    // a file with no adjustment is the base creature itself: scored, not "as base"
    const asBase = matching.length > 0 && this.sameScore(score, base);
    if (asBase && !lowersInGame) {
      return row("asBase", AS_BASE_REASON, bookXp);
    }
    if (inGameXp === undefined || score.xp >= inGameXp) {
      return row("formula", score.breakdown, score.xp);
    }
    return row("drop", score.breakdown, inGameXp);
  }

  private score(scope: ExperienceScope): ExperienceScore {
    const abilities = detectAbilities(scope);
    const profile = combatProfile(scope);
    const rounds = meleeDuel(profile, referenceFighter(profile.level)).fighterRounds;
    const tough = toughHitterAbility(rounds, profile.level, abilities);
    return scoreExperience(detectHitDice(scope), tough ? [...abilities, tough] : abilities);
  }

  /** As base: the DMG formula reads the same total and abilities. */
  private sameScore(score: ExperienceScore, base: ExperienceScore): boolean {
    return score.total === base.total && this.sameAbilities(score, base);
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

import type { StrengthEdition } from "../../config/player-config";
import type { CreatureData, Strength2e } from "../model/creature/data";

/** What a 2e "no strength bonus" plays: 2e's 8-15 all give +0/+0, and monsters fight like fighters */
export const NO_BONUS_STRENGTH = 15;

/**
 * Resolves the 2e strength (CreatureData.strength2e) into the strength, exceptional strength and
 * THAC0 that play, once per creature or adjustment (creatureService.checkData), so the CRE patch,
 * the doc, the XP formula and the AI all read the same values. See
 * docs/superpowers/specs/2026-11-07-strength-2e-design.md.
 */
class StrengthEditionService {
  /** Data already resolved: checkData running twice on it must not correct THAC0 twice */
  private readonly resolved = new WeakSet<object>();

  /**
   * `parent` is the creature's data when `data` is an adjustment's: an adjustment inherits the
   * creature's strength2e unless it sets its own strength (a game-file value) or strength2e.
   */
  apply(p: { data: Partial<CreatureData>; parent?: CreatureData; edition: StrengthEdition }): void {
    // a malformed record fails in both editions, not only once someone switches to 2e
    if (p.data.strength2e) this.validate(p.data.strength2e);
    if (p.edition !== "2e" || this.resolved.has(p.data)) return;
    this.resolved.add(p.data);
    const { data, parent } = p;
    const own = data.strength2e;
    const ownStrength = data.strength !== undefined || data.exceptionalStrength !== undefined;
    // an inherited score is already in the creature's own (resolved) data, written for every file
    if (own) {
      data.strength = own.strength ?? NO_BONUS_STRENGTH;
      data.exceptionalStrength = own.strength === undefined ? 0 : (own.exceptionalStrength ?? 0);
    }
    const hit = this.hitOf(own, ownStrength, parent);
    if (data.thac0 !== undefined) {
      data.thac0 -= hit;
      return;
    }
    if (!parent) {
      if (hit) {
        throw new Error(
          `2e strength to-hit correction ${hit} needs a THAC0 (set one or enable autoGenerate.thac0)`,
        );
      }
      return;
    }
    // no THAC0 of its own: the creature's plays, already corrected by the creature's to-hit
    const parentHit = parent.strength2e?.hit ?? 0;
    if (hit === parentHit) return;
    if (parent.thac0 === undefined) {
      throw new Error(`2e strength to-hit correction ${hit} needs a THAC0 on the creature`);
    }
    data.thac0 = parent.thac0 + parentHit - hit;
  }

  /** An exceptional strength is 18/01 to 18/00 (1-100), and only on an 18 */
  private validate(s2e: Strength2e): void {
    const ex = s2e.exceptionalStrength;
    if (ex === undefined) return;
    if (s2e.strength !== 18 || ex < 1 || ex > 100) {
      throw new Error(
        `strength2e exceptional strength ${ex} needs a strength of 18 and 1-100 (${s2e.source})`,
      );
    }
  }

  /**
   * The to-hit correction that plays: the data's own strength2e, else none for an adjustment
   * with its own strength (a game-file value: untouched), else the creature's.
   */
  private hitOf(own: Strength2e | undefined, ownStrength: boolean, parent?: CreatureData): number {
    if (own) return own.hit ?? 0;
    if (ownStrength || !parent) return 0;
    return parent.strength2e?.hit ?? 0;
  }
}

const strengthEditionService = new StrengthEditionService();
export default strengthEditionService;

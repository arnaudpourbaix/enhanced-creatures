import type { StrengthEdition } from "../../config/generate";
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
  /**
   * `parent` is the creature's data when `data` is an adjustment's: an adjustment inherits the
   * creature's strength2e unless it sets its own strength (a game-file value) or strength2e.
   */
  apply(p: { data: Partial<CreatureData>; parent?: CreatureData; edition: StrengthEdition }): void {
    if (p.edition !== "2e") return;
    const { data, parent } = p;
    const ownStrength = data.strength !== undefined || data.exceptionalStrength !== undefined;
    const own = data.strength2e;
    const inherited = own || ownStrength ? undefined : parent?.strength2e;
    const strength2e: Strength2e | undefined = own ?? inherited;
    if (!strength2e) return;
    // an inherited score is already in the creature's own (resolved) data, written for every file
    if (own) {
      data.strength = own.strength ?? NO_BONUS_STRENGTH;
      data.exceptionalStrength = own.strength === undefined ? 0 : (own.exceptionalStrength ?? 0);
    }
    const hit = strength2e.hit ?? 0;
    if (!hit) return;
    if (data.thac0 !== undefined) {
      data.thac0 -= hit;
    } else if (!parent) {
      throw new Error(
        `2e strength to-hit correction ${hit} needs a THAC0 (set one or enable autoGenerate.thac0)`,
      );
    }
    // an adjustment without its own THAC0 keeps the creature's, already corrected
  }
}

const strengthEditionService = new StrengthEditionService();
export default strengthEditionService;

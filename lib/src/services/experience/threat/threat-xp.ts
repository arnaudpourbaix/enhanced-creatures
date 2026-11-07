import { xpForHitDiceValue } from "../experience-table";
import { THREAT_FIT } from "./threat-fit";

export interface ThreatFit {
  s: number;
  k: number;
  samples: number;
}

export interface ThreatSample {
  hitDiceValue: number;
  threat: number;
  book: number;
}

const DEFAULT_K = 0.5;
const MIN_K = 0.25;
const MAX_K = 1;

/** XP = Table 31 (Hit Dice value) x s x threat^k, rounded to 10. */
export function threatXp(
  hitDiceValue: number,
  threat: number,
  fit: ThreatFit = THREAT_FIT,
): number {
  return Math.round((xpForHitDiceValue(hitDiceValue) * fit.s * threat ** fit.k) / 10) * 10;
}

/** Two decimals at most, trailing zeros dropped (30, 2.4, 1.06) */
function decimals(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** The breakdown's last step: "threat 2 → 120 × 2 × 2^0.5 = 340" */
export function threatXpText(
  hitDiceValue: number,
  threat: number,
  fit: ThreatFit = THREAT_FIT,
): string {
  const formula = `${xpForHitDiceValue(hitDiceValue)} × ${decimals(fit.s)} × ${decimals(threat)}^${decimals(fit.k)}`;
  return `threat ${decimals(threat)} → ${formula} = ${threatXp(hitDiceValue, threat, fit)}`;
}

/**
 * Fits k (least-squares slope of log(book / Table 31) on log T, clamped) and s (so the total XP
 * equals the book total). Samples with a non-positive threat or book are ignored (log undefined).
 * With fewer than 2 usable samples, or no variance in log T, the slope is undefined: k stays 0.5.
 */
export function fitThreat(samples: ThreatSample[]): ThreatFit {
  const usable = samples.filter((x) => x.threat > 0 && x.book > 0);
  let k = DEFAULT_K;
  if (usable.length >= 2) {
    const xs = usable.map((x) => Math.log(x.threat));
    const ys = usable.map((x) => Math.log(x.book / xpForHitDiceValue(x.hitDiceValue)));
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    if (sxx > 0) {
      const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
      k = Math.min(MAX_K, Math.max(MIN_K, sxy / sxx));
    }
  }
  const book = usable.reduce((a, x) => a + x.book, 0);
  const model = usable.reduce((a, x) => a + xpForHitDiceValue(x.hitDiceValue) * x.threat ** k, 0);
  return { k, s: model > 0 ? book / model : 1, samples: usable.length };
}

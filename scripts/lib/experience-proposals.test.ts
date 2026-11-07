import { describe, expect, it } from "vitest";
import type { Creature } from "../../lib/src/model/creature/creature";
import { ExperienceRow } from "../../lib/src/services/experience/experience.service";
import { ExperienceScore } from "../../lib/src/services/experience/experience-table";
import { DuelResult } from "../../lib/src/services/experience/threat/duel";
import { buildProposals, renderProposals, threatSamples } from "./experience-proposals";

function score(xp: number): ExperienceScore {
  return {
    hitDice: { whole: 4, plus: false },
    hitDiceValue: 4,
    abilities: [],
    total: 4,
    xp,
    breakdown: "",
  };
}

function row(file: string, inGameXp?: number): ExperienceRow {
  return { file, status: "formula", reason: "", newXp: 0, inGameXp, score: score(0) };
}

// MonsterEnum.Ankheg = 1, LesserBasilisk = 2: the ids resolve to names
function fake(id: number, xpv2e: number | undefined, experience: ExperienceRow[]): Creature {
  return { id, data: { xpv2e }, baseScore: score(270), experience } as unknown as Creature;
}

function duel(monsterRounds: number, fighterRounds: number, notes: string[] = []): DuelResult {
  return { monsterRounds, fighterRounds, ratio: fighterRounds / monsterRounds, notes };
}

const threatOf = (creature: Creature) =>
  creature.id === 1
    ? { threat: 2, melee: duel(4, 8, ["77% ending a round"]), ranged: duel(5, 10, ["kited"]) }
    : { threat: 1, melee: duel(3, 3), ranged: duel(3, 3) };

// Table 31 at Hit Dice value 4: 120 XP; × s 2 × 2^0.5 = 339 -> 340
const fit = { s: 2, k: 0.5, samples: 61 };

describe("experience proposals", () => {
  const creatures = [
    fake(1, 420, [row("A1.cre", 300), row("A2.cre", 500)]),
    fake(2, undefined, [row("B.cre", 100)]),
  ];

  it("computes every base creature's threat XP, the totals on the monsters with both XP", () => {
    const p = buildProposals(creatures, threatOf, fit);
    const ankheg = p.rows.find((r) => r.monster === "Ankheg")!;
    expect(ankheg.threat).toBe(2);
    expect(ankheg.threatXp).toBe(340);
    expect(ankheg.melee).toEqual({ monster: 4, fighter: 8 });
    expect(ankheg.ranged).toEqual({ monster: 5, fighter: 10 });
    expect(p.totals).toMatchObject({ rows: 1, inGame: 400, book: 420, threat: 340 });
  });

  it("renders the threat columns, the fit line and both reference tables", () => {
    const html = renderProposals(buildProposals(creatures, threatOf, fit));
    const ankheg = html.match(/<tr[^>]*data-monster="Ankheg".*?<\/tr>/)![0];
    expect(ankheg).toContain('data-threatxp="340"');
    expect(ankheg).toContain(">340<");
    expect(ankheg).toContain("77% ending a round");
    expect(html).toContain("s = 2, k = 0.5");
    expect(html).toContain("61 samples");
    expect(html).toContain("Reference fighter");
    expect(html).toContain("Reference archer");
    expect(html).not.toContain("√(B × F)");
  });

  it("samples the base creatures with a book and an in-game XP", () => {
    expect(threatSamples(creatures, threatOf)).toEqual([{ hitDiceValue: 4, threat: 2, book: 420 }]);
  });
});

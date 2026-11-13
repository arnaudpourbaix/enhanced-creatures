import { describe, expect, it, vi } from "vitest";
import type { Creature } from "../../lib/src/model/creature/creature";
import type { AttackStrengthRow } from "./attack-strength-report";
import { addsStrengthFlag, buildStrengthAudit, renderStrengthAuditCard } from "./strength-audit";

// 10 damage of dice, 2 attacks a round, whatever the creature
vi.mock("../../lib/src/services/experience/threat/combat-profile", () => ({
  diceRound: () => ({ damage: 10, apr: 2 }),
}));

/** An ITM with one melee ability, flagged for strength or not */
function itm(addsStrength: boolean): Buffer {
  const b = Buffer.alloc(0x72 + 56);
  b.writeUInt32LE(0x72, 0x64);
  b.writeUInt16LE(1, 0x68);
  b[0x72] = 1; // melee
  b.writeUInt32LE(addsStrength ? 1 : 0, 0x72 + 0x26);
  return b;
}

// MonsterEnum 1 is a real member, so the id resolves to a name
function creature(strength: number): Creature {
  return {
    id: 1,
    data: { strength },
    files: [{ name: "GAME01", game: "bg2" }],
    adjustments: [],
  } as unknown as Creature;
}

const attack = (monster: string, kind: AttackStrengthRow["kind"]) =>
  ({ monster, kind }) as AttackStrengthRow;

describe("strength audit", () => {
  it("reads the strength flag of an item's first melee ability", () => {
    expect(addsStrengthFlag(itm(true))).toBe(true);
    expect(addsStrengthFlag(itm(false))).toBe(false);
    expect(addsStrengthFlag(Buffer.alloc(4))).toBeUndefined();
  });

  it("compares a round's damage with the game's, in percent, for both editions", () => {
    const c = creature(19); // +7 a hit
    const monster = buildStrengthAudit([c], [], [])[0].monster;
    const csv = [{ file: "GAME01", game: "bg2", str: "18/100", weapon1: "CLAW" }]; // +6 a hit
    const [row] = buildStrengthAudit([c], [attack(monster, "natural")], csv, () => itm(true));
    expect(row).toMatchObject({ gameStrength: "18/00", gameBonus: 6, gameAdds: "yes" });
    // game: 10 + 2 x 6 = 22; 3e+: 10 + 2 x 7 = 24 (+9%); 3e+ weapons: 10 (-55%)
    expect(row.vs3e).toBe(9);
    expect(row.vsWeapons).toBe(-55);
  });

  it("counts no game strength when its weapons don't add it", () => {
    const c = creature(18); // +2 a hit
    const monster = buildStrengthAudit([c], [], [])[0].monster;
    const csv = [{ file: "GAME01", game: "bg2", str: "20", weapon1: "BITE" }];
    const [row] = buildStrengthAudit([c], [attack(monster, "natural")], csv, () => itm(false));
    // game: 10; 3e+: 10 + 2 x 2 = 14 (+40%)
    expect(row.gameAdds).toBe("no");
    expect(row.vs3e).toBe(40);
    expect(row.vsWeapons).toBe(0);
  });

  it("reads BG1 when the creature's base files are only there, from the BG1 install", () => {
    const c = creature(19);
    const monster = buildStrengthAudit([c], [], [])[0].monster;
    const csv = [{ file: "GAME01", game: "bg1", str: "16", weapon1: "CLAW" }];
    const games: string[] = [];
    const [row] = buildStrengthAudit([c], [attack(monster, "natural")], csv, (_, game) => {
      games.push(game);
      return itm(true);
    });
    expect(row).toMatchObject({ gameStrength: "16", gameBonus: 1, gameAdds: "yes" });
    expect(games).toEqual(["bg1"]);
  });

  it("leaves out base files covered by an adjustment of their own (a boss)", () => {
    const c = {
      ...creature(19),
      files: [
        { name: "BASE01", game: "bg2" },
        { name: "BOSS01", game: "bg2" },
      ],
      adjustments: [{ files: ["BOSS01"], data: {} }],
    } as unknown as Creature;
    const monster = buildStrengthAudit([c], [], [])[0].monster;
    const csv = [
      { file: "BASE01", game: "bg2", str: "17", weapon1: "CLAW" },
      { file: "BOSS01", game: "bg2", str: "20", weapon1: "CLAW" },
    ];
    const [row] = buildStrengthAudit([c], [attack(monster, "natural")], csv, () => itm(true));
    expect(row.gameStrength).toBe("17");
  });

  it("leaves out strength 15 or less, and has no comparison without the game", () => {
    expect(buildStrengthAudit([creature(15)], [], [])).toEqual([]);
    const [row] = buildStrengthAudit([creature(18)], [], []);
    expect(row.vs3e).toBeUndefined();
    expect(renderStrengthAuditCard([row], false)).toContain("No game install found");
  });
});

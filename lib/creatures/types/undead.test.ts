import { afterEach, describe, expect, it, vi } from "vitest";
import { CreatureAdjustment } from "../../src/model/creature/adjustment";
import { Creature } from "../../src/model/creature/creature";
import { CreatureData } from "../../src/model/creature/data";
import { ImmunityName } from "../../src/model/final/immunity";
import logService from "../../src/services/log.service";
import { applyTurnLevel } from "./turn-level";
import { applyUndeadGeneral, undeadType } from "./undead";

function fake(p: {
  general: CreatureData["general"];
  immunities?: ImmunityName[];
  traitImmunities?: ImmunityName[];
  adjustments?: Partial<CreatureData>[];
}): Creature {
  return {
    data: { general: p.general, immunities: p.immunities ?? [] },
    items: p.traitImmunities ? [{ trait: true, immunities: p.traitImmunities }] : [],
    adjustments: (p.adjustments ?? []).map(
      (data, i) => ({ files: [`ADJ${i}`], data }) as CreatureAdjustment,
    ),
  } as unknown as Creature;
}

// Tested in game: Turn Undead only affects creatures whose CRE General is UNDEAD.
describe("applyUndeadGeneral", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("makes an undead-typed creature UNDEAD (Wraith Spider: MONSTER)", () => {
    const spider = fake({ general: "MONSTER", immunities: ["undead"] });
    applyUndeadGeneral(spider);
    expect(spider.data.general).toBe("UNDEAD");
  });

  it("follows a trait item's type (Dread Wolf: ANIMAL, undead via its trait)", () => {
    const wolf = fake({ general: "ANIMAL", traitImmunities: ["undead"] });
    applyUndeadGeneral(wolf);
    expect(wolf.data.general).toBe("UNDEAD");
  });

  it("makes UNDEAD only the adjustments that add the type (zombie ankheg)", () => {
    const ankheg = fake({
      general: "MONSTER",
      immunities: ["magicalBeast"],
      adjustments: [{ level1: undefined }, { immunities: ["undead"] }],
    });
    applyUndeadGeneral(ankheg);
    expect(ankheg.data.general).toBe("MONSTER");
    expect(ankheg.adjustments.map((a) => a.data.general)).toEqual([undefined, "UNDEAD"]);
  });

  it("warns about an adjustment's own General on an undead creature instead of overwriting it", () => {
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const undead = fake({
      general: "UNDEAD",
      immunities: ["undead"],
      adjustments: [{ general: "MONSTER" }, { level1: undefined }, { general: "UNDEAD" }],
    });
    applyUndeadGeneral(undead);
    expect(undead.adjustments.map((a) => a.data.general)).toEqual(["MONSTER", undefined, "UNDEAD"]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("ADJ0");
  });

  it("warns about an adjustment making a creature undead that sets another General", () => {
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const ankheg = fake({
      general: "MONSTER",
      immunities: ["magicalBeast"],
      adjustments: [{ immunities: ["undead"], general: "MONSTER" }],
    });
    applyUndeadGeneral(ankheg);
    expect(ankheg.adjustments[0].data.general).toBe("MONSTER");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("leaves a creature that isn't undead alone", () => {
    const wolf = fake({ general: "ANIMAL", immunities: ["animal"] });
    applyUndeadGeneral(wolf);
    expect(wolf.data.general).toBe("ANIMAL");
  });
});

describe("undeadType", () => {
  it("sets the General and the turn level after the build", () => {
    expect(undeadType.afterBuild).not.toBe(applyTurnLevel);
    const zombie = {
      ...fake({ general: "MONSTER", immunities: ["undead"] }),
      data: {
        general: "MONSTER",
        immunities: ["undead"],
        level1: { pnpValue: 4, value: 4, type: "none" },
        bonusHp: 3,
      },
    } as unknown as Creature;
    undeadType.afterBuild?.(zombie);
    expect(zombie.data.general).toBe("UNDEAD");
    expect(zombie.data.level1.value).toBe(5);
  });
});

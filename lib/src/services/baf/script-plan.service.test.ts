import { describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { MainCreatureData } from "../../model/creature/data";
import { InputCreatureData } from "../../model/creature/data-input";
import creatureFactory from "../../factories/creature.factory";
import scriptPlanService from "./script-plan.service";

const FILES = ["PLAIN", "NECRO", "ELDER", "LICH", "SUMMON", "HIDDEN", "OTHER"];

function fakeCreature(): Creature {
  const creature = new Creature(1);
  creature.data = {
    ...creatureFactory.createEmptyData(),
    items: { remove: [], equipped: [] },
  } as unknown as MainCreatureData;
  creature.name = "common.potion.use";
  creature.files = FILES.map((name) => ({ name }));
  return creature;
}

/** Variant data bringing a spell of its own: the variant is scripted */
function casting(file: string): InputCreatureData {
  return { spells: { memorized: [{ file }] } };
}

function byName(creature: Creature) {
  return Object.fromEntries(scriptPlanService.plan(creature).map((s) => [s.name, s]));
}

describe("scriptPlanService.plan", () => {
  it("a creature without scripted variants has only the base script", () => {
    const creature = fakeCreature();
    creature.variant("tough", { data: { level1: 9 }, files: ["NECRO"] });
    const plan = scriptPlanService.plan(creature);
    expect(plan.map((s) => s.name)).toEqual(["jabm0100"]);
    expect(plan[0].variant).toBeUndefined();
    expect(plan[0].files).toEqual(FILES);
    expect(plan[0].view).toBe(creature);
  });

  it("scripted variants take 02, 03 depth first", () => {
    const creature = fakeCreature();
    const a = creature.variant("a", { data: casting("SPWI212"), files: ["NECRO"] });
    a.variant("b", { data: casting("SPWI312"), files: ["ELDER"] });
    creature.variant("c", { data: casting("SPWI412"), files: ["LICH"] });
    const plan = scriptPlanService.plan(creature);
    expect(plan.map((s) => [s.name, s.variant?.label])).toEqual([
      ["jabm0100", undefined],
      ["jabm0102", "a"],
      ["jabm0103", "b"],
      ["jabm0104", "c"],
    ]);
  });

  it("a scripted variant's summon script takes the next counter", () => {
    const creature = fakeCreature();
    creature.variant("a", {
      data: casting("SPWI212"),
      files: ["NECRO", "SUMMON"],
      adjust: [{ files: ["SUMMON"], summon: true }],
    });
    creature.variant("c", { data: casting("SPWI412"), files: ["LICH"] });
    const scripts = byName(creature);
    expect(scripts.jabm0102.files).toEqual(["NECRO"]);
    expect(scripts.jabm0102.summonName).toBe("jabm0103");
    expect(scripts.jabm0102.summonFiles).toEqual(["SUMMON"]);
    expect(scripts.jabm0104.variant?.label).toBe("c");
    expect(scripts.jabm0100.files).not.toContain("SUMMON");
    expect(scripts.jabm0100.summonName).toBeUndefined();
  });

  it("the base summon script is 01", () => {
    const creature = fakeCreature();
    creature.setAdjustments([{ files: ["SUMMON"], summon: true }]);
    const base = scriptPlanService.plan(creature)[0];
    expect(base.summonName).toBe("jabm0101");
    expect(base.summonFiles).toEqual(["SUMMON"]);
    expect(base.files).not.toContain("SUMMON");
  });

  it("a non-scripted sub-variant's files run its scripted parent's script", () => {
    const creature = fakeCreature();
    const a = creature.variant("a", { data: casting("SPWI212"), files: ["NECRO"] });
    a.variant("tougher", { data: { level1: 12 }, files: ["ELDER"] });
    const scripts = byName(creature);
    expect(scripts.jabm0102.files).toEqual(["NECRO", "ELDER"]);
    expect(scripts.jabm0100.files).not.toContain("ELDER");
  });

  it("a scripted sub-variant's files leave its parent's script", () => {
    const creature = fakeCreature();
    const a = creature.variant("a", { data: casting("SPWI212"), files: ["NECRO"] });
    a.variant("b", { data: casting("SPWI312"), files: ["ELDER"] });
    const scripts = byName(creature);
    expect(scripts.jabm0102.files).toEqual(["NECRO"]);
    expect(scripts.jabm0103.files).toEqual(["ELDER"]);
  });

  it("None files run no script", () => {
    const creature = fakeCreature();
    creature.variant("a", {
      data: casting("SPWI212"),
      files: ["NECRO", "HIDDEN"],
      adjust: [{ files: ["HIDDEN"], data: { script: { location: "None" } } }],
    });
    creature.setAdjustments([{ files: ["OTHER"], data: { script: { location: "None" } } }]);
    const plan = scriptPlanService.plan(creature);
    const all = plan.flatMap((s) => [...s.files, ...s.summonFiles]);
    expect(all).not.toContain("HIDDEN");
    expect(all).not.toContain("OTHER");
  });

  it("a file claimed by two unrelated scripted variants throws", () => {
    const creature = fakeCreature();
    creature.variant("A", { data: casting("SPWI212"), files: ["NECRO"] });
    creature.variant("C", { data: casting("SPWI412"), files: ["NECRO"] });
    expect(() => scriptPlanService.plan(creature)).toThrow(
      /'NECRO' is in scripted variants "A" and "C"/,
    );
  });
});

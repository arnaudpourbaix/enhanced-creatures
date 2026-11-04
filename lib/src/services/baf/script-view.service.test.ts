import { describe, expect, it } from "vitest";
import { AT_WILL } from "../../../config/common";
import { Creature } from "../../model/creature/creature";
import { BEHAVIOR_DEFAULT } from "../../model/creature/behavior";
import { MainCreatureData } from "../../model/creature/data";
import { CreatureAttack } from "../../model/creature/attack";
import { CreatureAbility, RawCreatureAbility } from "../../model/creature/ability";
import { SPELLS } from "../../../config/spells/spell-database";
import creatureFactory from "../../factories/creature.factory";
import abilityService from "./ability.service";
import creatureService from "../creature.service";
import scriptPlanService, { CreatureScript } from "./script-plan.service";
import scriptViewService from "./script-view.service";

const BASE_SPELL = "SPWI112";
const NEW_SPELL = "SPWI212";
const POWER = "JASE0705";

function cast(resource: string, extra: Partial<RawCreatureAbility> = {}): RawCreatureAbility {
  return { name: `cast ${resource}`, spell: { resource }, ...extra };
}

function fakeCreature(abilities: RawCreatureAbility[]): Creature {
  const creature = new Creature(1);
  creature.data = {
    ...creatureFactory.createEmptyData(),
    items: { remove: [], equipped: [] },
  } as unknown as MainCreatureData;
  creature.data.spells.memorized = [{ file: BASE_SPELL }];
  creature.name = "common.potion.use";
  creature.files = ["PLAIN", "NECRO"].map((name) => ({ name }));
  creature.attack = { melee: true } as unknown as CreatureAttack;
  creature.behavior = structuredClone(BEHAVIOR_DEFAULT);
  creature.behavior.abilities = abilityService.getAbilities(abilities);
  return creature;
}

/** Plans the creature's scripts and builds every view, as validation does. */
function views(creature: Creature): { base: Creature; necro: Creature } {
  const snapshot = scriptViewService.snapshot(creature);
  scriptViewService.addVariantBehaviors(creature);
  creatureFactory.resolveAbilities(creature);
  const [base, necro] = scriptPlanService
    .plan(creature)
    .map((script: CreatureScript) => scriptViewService.build(creature, script, snapshot));
  return { base, necro };
}

function necromancer(creature: Creature, extra: Record<string, unknown> = {}) {
  return creature.variant("necro", {
    data: { spells: { memorized: [{ file: NEW_SPELL }] } },
    files: ["NECRO"],
    ...extra,
  });
}

function resources(creature: Creature): (string | undefined)[] {
  return creature.behavior.abilities.map((a) => a.resource);
}

describe("scriptViewService.build", () => {
  it("the base view leaves out a scripted variant's spells", () => {
    const creature = fakeCreature([cast(BASE_SPELL), cast(NEW_SPELL)]);
    necromancer(creature);
    const { base, necro } = views(creature);
    expect(creatureService.memorizedSpellFiles(base)).toEqual([BASE_SPELL]);
    expect(creatureService.memorizedSpellFiles(necro)).toEqual([BASE_SPELL, NEW_SPELL]);
  });

  it("a plain adjustment on a variant member is in both views but brings no variant spell to the base", () => {
    const creature = fakeCreature([cast(BASE_SPELL), cast(NEW_SPELL)]);
    necromancer(creature);
    creature.setAdjustments([{ files: ["PLAIN", "NECRO"], data: { level1: 7 } }]);
    const plain = creature.adjustments.at(-1);
    const { base, necro } = views(creature);
    expect(base.adjustments).toContain(plain);
    expect(necro.adjustments).toContain(plain);
    expect(creatureService.memorizedSpellFiles(base)).not.toContain(NEW_SPELL);
  });

  it("a base ability for a spell only the variant memorizes is dropped from the base view", () => {
    const creature = fakeCreature([cast(BASE_SPELL), cast(NEW_SPELL)]);
    necromancer(creature);
    const { base, necro } = views(creature);
    expect(resources(base)).toEqual([BASE_SPELL]);
    expect(resources(necro)).toEqual([BASE_SPELL, NEW_SPELL]);
  });

  it("an ability with memorizedSpellCheck false is kept", () => {
    const creature = fakeCreature([
      cast(BASE_SPELL),
      cast(NEW_SPELL),
      { name: "cast SPIN999", spell: { resource: "SPIN999", memorizedSpellCheck: false } },
    ]);
    necromancer(creature);
    expect(resources(views(creature).base)).toEqual([BASE_SPELL, "SPIN999"]);
  });

  it("keeps an ability for a spell no file memorizes: granted in game (Polymorph Self forms)", () => {
    const creature = fakeCreature([cast(BASE_SPELL), cast(NEW_SPELL), cast("SPWI493")]);
    necromancer(creature);
    const { base, necro } = views(creature);
    expect(resources(base)).toEqual([BASE_SPELL, "SPWI493"]);
    expect(resources(necro)).toEqual([BASE_SPELL, NEW_SPELL, "SPWI493"]);
  });

  it("variant behavior abilities are added to the base ones in the variant view only", () => {
    const creature = fakeCreature([cast(BASE_SPELL)]);
    necromancer(creature, { behavior: { abilities: [cast(NEW_SPELL)] } });
    const { base, necro } = views(creature);
    expect(resources(base)).toEqual([BASE_SPELL]);
    expect(resources(necro)).toEqual([BASE_SPELL, NEW_SPELL]);
  });

  it("sibling variants may declare the same ability: the creature lists it once", () => {
    const creature = fakeCreature([cast(BASE_SPELL)]);
    creature.files.push({ name: "LICH" });
    necromancer(creature, { behavior: { abilities: [cast(NEW_SPELL)] } });
    creature.variant("lich", {
      data: { spells: { memorized: [{ file: NEW_SPELL }, { file: POWER }] } },
      files: ["LICH"],
      behavior: { abilities: [cast(NEW_SPELL), cast(POWER)] },
    });
    scriptViewService.addVariantBehaviors(creature);
    expect(resources(creature)).toEqual([BASE_SPELL, NEW_SPELL, POWER]);
  });

  it("views don't share abilities", () => {
    const creature = fakeCreature([cast(BASE_SPELL), cast(NEW_SPELL)]);
    necromancer(creature);
    const { base, necro } = views(creature);
    base.behavior.abilities[0].timer = { name: "T", value: 6 };
    expect(necro.behavior.abilities[0].timer).toBeUndefined();
    expect(creature.behavior.abilities[0].timer).toBeUndefined();
  });

  it("an at-will power cools down only in the script of the files with a spellbook", () => {
    const creature = fakeCreature([cast(POWER), cast(NEW_SPELL)]);
    creature.data.spells.memorized = [{ file: POWER, memorizedCount: AT_WILL }];
    creature.variant("necro", {
      data: {
        spells: {
          spellbooks: [
            {
              mod: "SpellRevisions",
              spellbook: "VampireNecromancerSpellbook",
              memorized: [{ file: NEW_SPELL }],
            },
          ],
        },
      },
      files: ["NECRO"],
    });
    const { base, necro } = views(creature);
    const powerTimer = (view: Creature) =>
      view.behavior.abilities.find((a) => a.resource === POWER)?.timer;
    expect(powerTimer(base)).toBeUndefined();
    expect(powerTimer(necro)).toEqual({ name: `ATWILL_${POWER}`, value: expect.any(Number) });
  });
});

describe("scriptViewService.describe", () => {
  const named = (...names: string[]) =>
    names.map((name) => ({ name, targets: [] }) as unknown as CreatureAbility);
  function described(p: { memorized: string[]; covered: string[]; order: string[] }) {
    const view = {
      data: { spells: { memorized: p.memorized.map((file) => ({ file })) } },
      adjustments: [],
      behavior: { abilities: named(...p.order), coveredAbilities: named(...p.covered) },
    } as unknown as Creature;
    return scriptViewService.describe(view);
  }

  it("tells what an invisible caster does, then its order otherwise", () => {
    expect(
      described({
        memorized: [SPELLS.Wizard.Invisibility.file],
        covered: ["spell.Haste.name"],
        order: ["spell.Invisibility.name", "spell.Haste.name", "spell.Sleep.name"],
      }),
    ).toEqual([
      "While invisible: Haste, then hold without attacking.",
      "Otherwise: Invisibility, Haste, Sleep.",
    ]);
  });

  it("names Sanctuary as the cover of a priest", () => {
    const [covered] = described({
      memorized: [SPELLS.Priest.Sanctuary.file],
      covered: ["spell.Haste.name"],
      order: ["spell.Sleep.name"],
    });
    expect(covered).toBe("While under Sanctuary: Haste, then hold without attacking.");
  });

  it("lists each spell once, its first place (Mirror Image passes come back later)", () => {
    expect(
      described({
        memorized: [],
        covered: [],
        order: ["spell.Sleep.name", "spell.Haste.name", "spell.Sleep.name"],
      }),
    ).toEqual(["Cast order: Sleep, Haste."]);
  });

  it("tells a heal on the allies from the one on itself", () => {
    const heal = (target: string) =>
      ({ name: "spell.CureLightWounds.name", targets: [{ name: target }] }) as CreatureAbility;
    const view = {
      data: { spells: { memorized: [] } },
      adjustments: [],
      behavior: {
        abilities: [heal("NearestAllies"), ...named("spell.Sleep.name"), heal("Myself")],
        coveredAbilities: [],
      },
    } as unknown as Creature;
    expect(scriptViewService.describe(view)).toEqual([
      "Cast order: Cure Light Wounds on allies, Sleep, Cure Light Wounds on self.",
    ]);
  });

  it("leaves the Mirror Image passes out of the order", () => {
    const pass = (name: string, mirrorPass?: "counter" | "lastResort") =>
      ({ name, targets: [], mirrorPass }) as unknown as CreatureAbility;
    const view = {
      data: { spells: { memorized: [] } },
      adjustments: [],
      behavior: {
        abilities: [
          pass("spell.MirrorImages.name"),
          pass("spell.MagicMissiles.name", "counter"),
          pass("spell.Sleep.name"),
          pass("spell.Combust.name"),
          pass("spell.MagicMissiles.name"),
          pass("spell.Combust.name", "lastResort"),
        ],
        coveredAbilities: [],
      },
    } as unknown as Creature;
    expect(scriptViewService.describe(view)).toEqual([
      "Cast order: Mirror Images, Sleep, Combust, Magic Missiles.",
    ]);
  });

  it("says nothing without abilities", () => {
    expect(described({ memorized: [], covered: [], order: [] })).toEqual([]);
  });
});

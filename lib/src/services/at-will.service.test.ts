import { describe, expect, it } from "vitest";
import { AT_WILL } from "../../config/common";
import { SPELLS } from "../../config/spells/spell-database";
import { CreatureAbility } from "../model/creature/ability";
import { Creature } from "../model/creature/creature";
import { MainCreatureData } from "../model/creature/data";
import { SpellTypeEnum } from "../model/spell-item/effect.enums";
import { State } from "../state";
import atWillService from "./at-will.service";

interface Power {
  file: string;
  level: number;
  speed: number;
  timer?: { name: string; value: number };
}

/** A creature with its at-will `powers` (each cast by an ability) and other memorized `spells` */
function fakeCreature(p: {
  powers: Power[];
  spells?: string[];
  /** Its own powers with a few uses, not at will (a vampire's Bat Swarm) */
  ownPowers?: string[];
  melee?: boolean;
  ranged?: boolean;
}): Creature {
  const creature = new Creature(1);
  creature.name = "common.potion.use";
  creature.data = {
    spells: {
      memorized: [
        ...p.powers.map((power) => ({ file: power.file, memorizedCount: AT_WILL })),
        ...[...(p.spells ?? []), ...(p.ownPowers ?? [])].map((file) => ({
          file,
          memorizedCount: 1,
        })),
      ],
    },
  } as unknown as MainCreatureData;
  creature.adjustments = [];
  creature.attack = { melee: p.melee ?? true, ranged: p.ranged ?? false } as Creature["attack"];
  creature.spells = [
    ...p.powers.map((power) => ({
      file: power.file,
      level: power.level,
      type: SpellTypeEnum.Innate,
      memorizedCount: AT_WILL,
      headers: [{ speed: power.speed }],
    })),
    ...(p.ownPowers ?? []).map((file) => ({ file, level: 3, headers: [{ speed: 1 }] })),
  ] as unknown as Creature["spells"];
  creature.behavior = {
    abilities: p.powers.map(
      (power) => ({ resource: power.file, timer: power.timer }) as unknown as CreatureAbility,
    ),
    coveredAbilities: [],
    customCodes: [],
  } as unknown as Creature["behavior"];
  return creature;
}

const timers = (creature: Creature) => creature.behavior.abilities.map((a) => a.timer);

describe("applyCooldowns", () => {
  it("cools a slow power down for a melee creature: it costs its attacks (Wall of Ice)", () => {
    const creature = fakeCreature({ powers: [{ file: "WALLICE", level: 2, speed: 4 }] });
    atWillService.applyCooldowns(creature);
    expect(timers(creature)).toEqual([{ name: "ATWILL_WALLICE", value: 12 }]);
  });

  it("lets a melee creature use a fast power freely: it still attacks (vampire Domination)", () => {
    const creature = fakeCreature({ powers: [{ file: "DOMINATE", level: 5, speed: 2 }] });
    atWillService.applyCooldowns(creature);
    expect(timers(creature)).toEqual([undefined]);
  });

  it("cools any power down next to a spellbook: it takes the round's spell", () => {
    const creature = fakeCreature({
      powers: [{ file: "DOMINATE", level: 5, speed: 1 }],
      spells: [SPELLS.Wizard.Fireball.file],
    });
    atWillService.applyCooldowns(creature);
    expect(timers(creature)).toEqual([{ name: "ATWILL_DOMINATE", value: 24 }]);
  });

  it("reads a power shared on the creature's family from the created spells (a vampire's)", () => {
    const creature = fakeCreature({
      powers: [{ file: "SHARED", level: 5, speed: 1 }],
      spells: [SPELLS.Wizard.Fireball.file],
    });
    State.spells.push(...creature.spells);
    creature.spells = [];
    try {
      atWillService.applyCooldowns(creature);
      expect(timers(creature)).toEqual([{ name: "ATWILL_SHARED", value: 24 }]);
    } finally {
      State.spells.splice(-1, 1);
    }
  });

  it("finds a spellbook in an adjustment's spellbook variants (a mage vampire's)", () => {
    const creature = fakeCreature({ powers: [{ file: "DOMINATE", level: 5, speed: 1 }] });
    creature.adjustments = [
      {
        data: {
          spells: {
            memorized: [],
            spellbooks: [{ mod: "Vanilla", memorized: [{ file: SPELLS.Wizard.Fireball.file }] }],
          },
        },
      },
    ] as unknown as Creature["adjustments"];
    atWillService.applyCooldowns(creature);
    expect(timers(creature)).toEqual([{ name: "ATWILL_DOMINATE", value: 24 }]);
  });

  it("doesn't take a creature's own few-use powers for a spellbook (vampire Bat Swarm)", () => {
    const creature = fakeCreature({
      powers: [{ file: "DOMINATE", level: 5, speed: 1 }],
      ownPowers: ["BATSWARM"],
    });
    atWillService.applyCooldowns(creature);
    expect(timers(creature)).toEqual([undefined]);
  });

  it("lets a ranged creature afford a longer cast", () => {
    const fighter = { melee: false, ranged: true };
    const four = fakeCreature({ ...fighter, powers: [{ file: "POWER4", level: 2, speed: 4 }] });
    const five = fakeCreature({ ...fighter, powers: [{ file: "POWER5", level: 2, speed: 5 }] });
    atWillService.applyCooldowns(four);
    atWillService.applyCooldowns(five);
    expect(timers(four)).toEqual([undefined]);
    expect(timers(five)).toEqual([{ name: "ATWILL_POWER5", value: 12 }]);
  });

  it("lets a creature that neither fights nor casts use its powers freely", () => {
    const creature = fakeCreature({
      melee: false,
      powers: [{ file: "AURA", level: 4, speed: 9 }],
    });
    atWillService.applyCooldowns(creature);
    expect(timers(creature)).toEqual([undefined]);
  });

  it("gives each power its own timer, and keeps one an ability declares", () => {
    const own = { name: "polymorph", value: 12 };
    const creature = fakeCreature({
      powers: [
        { file: "WALLICE", level: 2, speed: 4 },
        { file: "FIRESTORM", level: 6, speed: 6 },
        { file: "SHAPE", level: 3, speed: 5, timer: own },
      ],
    });
    atWillService.applyCooldowns(creature);
    expect(timers(creature)).toEqual([
      { name: "ATWILL_WALLICE", value: 12 },
      { name: "ATWILL_FIRESTORM", value: 24 },
      own,
    ]);
  });
});

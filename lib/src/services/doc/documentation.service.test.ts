// Template placeholder/fixture strings ("{{special}}", "{{traits}}", the test immunity's
// stringRef) recur because many independent test cases exercise the same template-replace
// contract on different inputs - not copy-paste.
/* eslint-disable sonarjs/no-duplicate-string */
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { CreatureAbility } from "../../model/creature/ability";
import { Creature } from "../../model/creature/creature";
import { Family } from "../../model/creature/family";
import { ImmunityConfig } from "../../model/final/immunity";
import { State } from "../../state";
import documentationService from "./documentation.service";
import translationService from "../translation.service";

interface DocumentationServicePrivate {
  monsters: string[];
  families: string[];
  replace(template: { text: string }, key: string, value: string | number | undefined): void;
}
const service = documentationService as unknown as DocumentationServicePrivate;

function fakeCreatureForAddCreature(doubleApr: boolean, dualWielding = false): Creature {
  return {
    id: 1,
    name: "common.potion.use",
    data: {
      doubleApr,
      strength: 18,
      exceptionalStrength: undefined,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      alignment: "CHAOTIC_EVIL",
      ac: 5,
      movement: { pnpValue: 12 },
      level1: { pnpValue: 5, type: "none", value: 5 },
      hp: 40,
      thac0: 15,
      apr: 2,
      size: "Large",
      morale: 12,
      xpv: 500,
      items: { equipped: [] },
      immunities: [],
      spells: { memorized: [] },
    },
    behavior: { abilities: [], customCodes: [] },
    attack: { dualWielding },
  } as unknown as Creature;
}

describe("addCreature (doubleApr)", () => {
  it("doubles apr when doubleApr is true", () => {
    documentationService.addCreature(fakeCreatureForAddCreature(true));
    const html = service.monsters.at(-1) ?? "";
    expect(html).toMatch(/<dt>\s*Attacks per Round\s*<\/dt>\s*<dd>\s*4\s*<\/dd>/);
  });

  it("does not double apr when doubleApr is false", () => {
    documentationService.addCreature(fakeCreatureForAddCreature(false));
    const html = service.monsters.at(-1) ?? "";
    expect(html).toMatch(/<dt>\s*Attacks per Round\s*<\/dt>\s*<dd>\s*2\s*<\/dd>/);
  });
});

describe("getEffectiveApr", () => {
  it("returns the stored apr as-is when not dual wielding and not doubled", () => {
    const creature = fakeCreatureForAddCreature(false, false);
    expect(documentationService.getEffectiveApr(creature)).toBe(2);
  });

  it("doubles the stored apr when doubleApr is set", () => {
    const creature = fakeCreatureForAddCreature(true, false);
    expect(documentationService.getEffectiveApr(creature)).toBe(4);
  });

  // A weapon equipped in the off-hand (SHIELD) slot makes creature.service.ts's
  // checkDualWielding() pre-subtract 1 from data.apr, since the engine grants that +1 attack
  // automatically. The docs must add it back to show the actual number of attacks a player sees
  // (e.g. a bear authored with `apr: 3` in lib/creatures/bears.ts, stored as 2 for this reason).
  it("adds back the 1 attack pre-subtracted for an off-hand (dual-wielding) weapon", () => {
    const creature = fakeCreatureForAddCreature(false, true);
    expect(documentationService.getEffectiveApr(creature)).toBe(3);
  });

  it("adds the dual-wielding attack after doubling, not before", () => {
    const creature = fakeCreatureForAddCreature(true, true);
    expect(documentationService.getEffectiveApr(creature)).toBe(5);
  });
});

function fakeCreatureForAttacks(equipped: { file: string; slot: string }[]): Creature {
  const creature = fakeCreatureForAddCreature(false, true);
  creature.data.apr = 2;
  creature.data.items.equipped = equipped as unknown as typeof creature.data.items.equipped;
  return creature;
}

describe("getCreatureAttacks", () => {
  const originalItems = State.items;

  afterEach(() => {
    State.items = originalItems;
  });

  // Regression test: a creature with 3+ total attacks plus an off-hand weapon used to render as
  // just a combined APR number and a list of weapon blocks in equipped-item order, leaving no way
  // to tell which weapon was the main hand or how many of the attacks it actually got.
  it("labels the off-hand weapon and gives the main hand's attack count, regardless of equipped order", () => {
    const mainDesc = translationService.addCustomTranslation(["Melee damage: 5"]);
    const offDesc = translationService.addCustomTranslation(["Melee damage: 3"]);
    State.items = [
      { file: "DAGGER01", doc: true, description: offDesc },
      { file: "SWORD01", doc: true, description: mainDesc },
    ] as unknown as typeof State.items;
    // Off-hand (SHIELD) listed first in equipped order, main hand second - the label must still
    // key off the slot, not position.
    const creature = fakeCreatureForAttacks([
      { file: "DAGGER01", slot: "SHIELD" },
      { file: "SWORD01", slot: "WEAPON1" },
    ]);
    const template = { text: "{{attacks}}" };

    documentationService.getCreatureAttacks(template, creature);

    // Off-hand attack count is always 1 (see checkDualWielding in creature.service.ts), so it's
    // not worth restating - only the slot name is shown.
    expect(template.text).toContain(">Offhand<");
    expect(template.text).not.toContain("Offhand ·");
    expect(template.text).toContain("Main hand · 2 attacks<");
  });

  it("shows no slot label when the creature isn't dual wielding", () => {
    const desc = translationService.addCustomTranslation(["Melee damage: 5"]);
    State.items = [{ file: "SWORD01", doc: true, description: desc }] as unknown as typeof State.items;
    const creature = fakeCreatureForAttacks([{ file: "SWORD01", slot: "WEAPON1" }]);
    creature.attack.dualWielding = false;
    const template = { text: "{{attacks}}" };

    documentationService.getCreatureAttacks(template, creature);

    expect(template.text).not.toContain("weapon-slot");
    expect(template.text).not.toContain("Main hand");
    expect(template.text).not.toContain("Offhand");
  });
});

function runAttackDisplay(description: string, idPrefix = "m1-w0") {
  const entries: { id: string; html: string }[] = [];
  const text = documentationService.getAttackDisplayText(description, entries, idPrefix);
  return { text, entries };
}

describe("getAttackDisplayText", () => {
  it("strips the weapon name, blank lines, THAC0/Speed Factor/Range/damage type, and folds enchantment into the damage line", () => {
    const description = [
      "Mandibles",
      "",
      "THAC0: +2",
      "Melee damage: 3D6 (Crushing)",
      "Speed Factor: 5",
      "Enchantment: 2",
      "Range: 2 feet",
    ].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("3D6 at +2");
  });

  it("strips the damage-type label and the type in parens, leaving the bare value, when there is no enchantment", () => {
    const description = ["Jaws", "", "Ranged damage: 1D6 (Piercing)"].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("1D6");
  });

  it("falls back to a standalone Enchantment line when there is no damage line", () => {
    const description = ["Ring", "", "Enchantment: 3"].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("Enchantment: +3");
  });

  // e.g. a slime's pseudopod, whose base header dice are 0-0 so the weapon has no "Melee damage:"
  // line of its own - all damage comes from a typed Damage effect instead (see slimes.ts).
  it("folds enchantment into a typed damage-effect line when there is no base weapon damage line", () => {
    const description = ["Pseudopod", "", "Acid damage: 1D10+2", "Enchantment: 1"].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("1D10+2 at +1");
  });

  it("does not mistake unrelated 'X damage: N ...' text (no dice) for the damage line", () => {
    const description = [
      "Ring",
      "",
      "Poison damage: 5 over 10 seconds.",
      "Enchantment: 1",
    ].join("\r\n");

    expect(runAttackDisplay(description).text).toBe(
      "Poison damage: 5 over 10 seconds.\r\nEnchantment: +1",
    );
  });

  it("passes through unchanged when there is neither damage, enchantment, nor a linkable spell block", () => {
    const description = ["Fists", "", "Cast spell Rend (10%)"].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("Cast spell Rend (10%)");
  });

  it("leaves a description with no name/blank-line header untouched, e.g. a trait item's description", () => {
    const description = ["Melee damage: 1D4 (Piercing)"].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("1D4");
  });

  it("returns the input unchanged for an empty description", () => {
    expect(runAttackDisplay("").text).toBe("");
  });

  it("collapses a single cast-spell block into a popover link, keeping the save condition inline", () => {
    const description = [
      "Jaws",
      "",
      "Melee damage: 1D10 (Piercing)",
      "",
      "Cast spell Type K poison (saves vs poison/death at +4):",
      "Poison damage: 5 over 10 seconds.",
    ].join("\r\n");

    const { text, entries } = runAttackDisplay(description);

    expect(text).toBe(
      '1D10\r\n<a href="#m1-w0-spell-0" class="trait-link">Type K poison</a> (saves vs poison/death at +4)',
    );
    expect(entries).toEqual([
      { id: "m1-w0-spell-0", html: "<p>Poison damage: 5 over 10 seconds.</p>" },
    ]);
  });

  it("keeps a probability condition inline the same way", () => {
    const description = ["Paws", "", "Cast spell Hug (10%):", "Crushing damage: 2D4"].join("\r\n");

    const { text, entries } = runAttackDisplay(description);

    expect(text).toBe('<a href="#m1-w0-spell-0" class="trait-link">Hug</a> (10%)');
    expect(entries).toEqual([{ id: "m1-w0-spell-0", html: "<p>Crushing damage: 2D4</p>" }]);
  });

  it("renders each description line as its own paragraph and groups '- ' lines into a <ul>", () => {
    const description = [
      "Jaws",
      "",
      "Cast spell Grab (saves vs poison/death at -9):",
      "Grab and hold your target for 3 rounds.",
      "Grabbed creature will suffer these effects:",
      "- can not move",
      "- -4 AC (opponents get +4 bonus on their attack rolls against grabbed target)",
      "- -4 THAC0",
    ].join("\r\n");

    const { entries } = runAttackDisplay(description);

    expect(entries).toEqual([
      {
        id: "m1-w0-spell-0",
        html:
          "<p>Grab and hold your target for 3 rounds.</p>" +
          "<p>Grabbed creature will suffer these effects:</p>" +
          "<ul><li>can not move</li>" +
          "<li>-4 AC (opponents get +4 bonus on their attack rolls against grabbed target)</li>" +
          "<li>-4 THAC0</li></ul>",
      },
    ]);
  });

  it("splits a description whose internal lines use a bare \\n instead of \\r\\n (e.g. spell.grab.description's hand-authored template literal)", () => {
    const description =
      "Jaws\r\n\r\nCast spell Grab (saves vs poison/death at -9):\r\n" +
      "Grab and hold your target for 3 rounds.\nGrabbed creature will suffer these effects:\n- can not move\n- -4 THAC0";

    const { entries } = runAttackDisplay(description);

    expect(entries).toEqual([
      {
        id: "m1-w0-spell-0",
        html:
          "<p>Grab and hold your target for 3 rounds.</p>" +
          "<p>Grabbed creature will suffer these effects:</p>" +
          "<ul><li>can not move</li><li>-4 THAC0</li></ul>",
      },
    ]);
  });

  it("supports a bullet list not preceded by any lead-in paragraph", () => {
    const description = [
      "Jaws",
      "",
      "Cast spell Curse:",
      "- weakened",
      "- blinded",
    ].join("\r\n");

    const { entries } = runAttackDisplay(description);

    expect(entries).toEqual([
      { id: "m1-w0-spell-0", html: "<ul><li>weakened</li><li>blinded</li></ul>" },
    ]);
  });

  it("supports a paragraph resuming after a bullet list", () => {
    const description = [
      "Jaws",
      "",
      "Cast spell Curse:",
      "- weakened",
      "Lasts 3 rounds.",
    ].join("\r\n");

    const { entries } = runAttackDisplay(description);

    expect(entries).toEqual([
      { id: "m1-w0-spell-0", html: "<ul><li>weakened</li></ul><p>Lasts 3 rounds.</p>" },
    ]);
  });

  it("assigns distinct ids and descriptions to consecutive cast-spell blocks", () => {
    const description = [
      "Jaws",
      "",
      "Melee damage: 1D6 (Piercing)",
      "",
      "Cast spell Poison:",
      "Deals poison damage.",
      "",
      "Cast spell Disease:",
      "Deals disease damage.",
    ].join("\r\n");

    const { text, entries } = runAttackDisplay(description);

    expect(text).toBe(
      [
        "1D6",
        '<a href="#m1-w0-spell-0" class="trait-link">Poison</a>',
        '<a href="#m1-w0-spell-1" class="trait-link">Disease</a>',
      ].join("\r\n"),
    );
    expect(entries).toEqual([
      { id: "m1-w0-spell-0", html: "<p>Deals poison damage.</p>" },
      { id: "m1-w0-spell-1", html: "<p>Deals disease damage.</p>" },
    ]);
  });

  it("leaves a cast-spell line with no trailing colon (documented elsewhere) as plain text", () => {
    const description = ["Fists", "", "Cast spell Bless (25%)"].join("\r\n");

    const { text, entries } = runAttackDisplay(description);

    expect(text).toBe("Cast spell Bless (25%)");
    expect(entries).toEqual([]);
  });

  // Some weapons (minotaur's Huge Axe, ogre's Naginata) carry a hand-authored, BG2-item-tooltip
  // style description instead of the auto-generated one (see description.service.ts's
  // generateWeaponDescription, which only fills item.description when unset). These cases cover
  // that "STATISTICS:" block format.
  it("drops line 0 (name or flavor text) and the STATISTICS block, folding damage the same way", () => {
    const description = [
      "Huge Axe",
      "STATISTICS:",
      "Damage: 1D12",
      "Damage type: slashing",
      "Weight: 15",
      "Speed Factor: 8",
      "Proficiency Type: Halberds",
    ].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("1D12");
  });

  it("drops flavor text on line 0 the same way as a name-repeat line", () => {
    const description = [
      "Similar to the glaive, the naginata is a pole weapon.",
      "STATISTICS:",
      "Damage: 1D12",
      "Damage type: slashing",
      "Weight: 15",
      "Speed Factor: 8",
      "Proficiency Type: Halberds",
    ].join("\r\n");

    expect(runAttackDisplay(description).text).toBe("1D12");
  });
});

describe("getFamilyMenu", () => {
  it("builds a collapsible family entry linking to every creature in the family", () => {
    const family = {
      id: MonsterFamilyEnum.Bear,
      creatures: [
        { id: 4, name: "monster.bear.name.black", valid: true },
        { id: 5, name: "monster.bear.name.brown", valid: true },
      ],
    } as unknown as Family;

    expect(documentationService.getFamilyMenu(family)).toBe(
      '<li class="family"><details><summary>Bear</summary><ul>' +
        '<li><a href="#m4">Black Bear</a></li>' +
        '<li><a href="#m5">Brown Bear</a></li>' +
        "</ul></details></li>",
    );
  });

  it("omits invalid creatures from the family menu", () => {
    const family = {
      id: MonsterFamilyEnum.Bear,
      creatures: [
        { id: 4, name: "monster.bear.name.black", valid: true },
        { id: 5, name: "monster.bear.name.brown", valid: false },
      ],
    } as unknown as Family;

    expect(documentationService.getFamilyMenu(family)).toBe(
      '<li class="family"><details><summary>Bear</summary><ul>' +
        '<li><a href="#m4">Black Bear</a></li>' +
        "</ul></details></li>",
    );
  });

  it("produces an empty creature list for a family with no creatures", () => {
    const family = {
      id: MonsterFamilyEnum.Bear,
      creatures: [],
    } as unknown as Family;

    expect(documentationService.getFamilyMenu(family)).toBe(
      '<li class="family"><details><summary>Bear</summary><ul></ul></details></li>',
    );
  });
});

describe("addFamily", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Reproduces the CreatureFamily.addCreature() failure mode where a builder throws after
  // create() already pushed the creature: the creature stays in family.creatures with
  // valid=false and never reached Creature.validate(), so creature.attack is still undefined.
  // Before this test's fix, addFamily() passed every creature (valid or not) to addCreature(),
  // which reads creature.attack.dualWielding via getEffectiveApr() and threw, aborting the whole
  // documentation pass. addFamily() must skip invalid creatures instead.
  it("does not pass an invalid creature to addCreature()", () => {
    const addCreatureSpy = vi
      .spyOn(documentationService, "addCreature")
      .mockImplementation(() => {});
    const validCreature = { id: 4, name: "monster.bear.name.black", valid: true } as Creature;
    const invalidCreature = { id: 5, name: "monster.bear.name.brown", valid: false } as Creature;
    const family = {
      id: MonsterFamilyEnum.Bear,
      creatures: [validCreature, invalidCreature],
    } as unknown as Family;

    documentationService.addFamily(family);

    expect(addCreatureSpy).toHaveBeenCalledTimes(1);
    expect(addCreatureSpy).toHaveBeenCalledWith(validCreature);
  });

  it("omits an invalid creature from the pushed family menu", () => {
    vi.spyOn(documentationService, "addCreature").mockImplementation(() => {});
    const family = {
      id: MonsterFamilyEnum.Bear,
      creatures: [
        { id: 4, name: "monster.bear.name.black", valid: true },
        { id: 5, name: "monster.bear.name.brown", valid: false },
      ],
    } as unknown as Family;

    documentationService.addFamily(family);

    const menu = service.families.at(-1) ?? "";
    expect(menu).toContain('<a href="#m4">Black Bear</a>');
    expect(menu).not.toContain("#m5");
  });
});

describe("addSpecial", () => {
  it("renders a caster special row as a stat-grid entry", () => {
    const creature = {
      data: { level1: { type: "caster", value: 9 } },
    } as unknown as Creature;
    const template = { text: "{{special}}" };

    documentationService.addSpecial(template, creature);

    expect(template.text).toBe(
      '<div class="stat stat-half"><dt>Special</dt><dd>Cast spells as a level 9 caster</dd></div>',
    );
  });

  it("renders a turn-undead special row as a stat-grid entry", () => {
    const creature = {
      data: { level1: { type: "turn", value: 3 } },
    } as unknown as Creature;
    const template = { text: "{{special}}" };

    documentationService.addSpecial(template, creature);

    expect(template.text).toBe(
      '<div class="stat stat-half"><dt>Special</dt><dd>Turned as a level 3 undead</dd></div>',
    );
  });

  it("renders nothing when the creature has no special casting/turning trait", () => {
    const creature = {
      data: { level1: { type: undefined, value: 0 } },
    } as unknown as Creature;
    const template = { text: "{{special}}" };

    documentationService.addSpecial(template, creature);

    expect(template.text).toBe("");
  });
});

describe("getCreatureTraits", () => {
  const originalImmunities = State.immunities;

  afterEach(() => {
    State.immunities = originalImmunities;
  });

  it("renders nothing when the creature has no traits, immunities, or trait items", () => {
    State.immunities = [];
    const creature = {
      data: { immunities: [], items: { equipped: [] } },
    } as unknown as Creature;
    const template = { text: "{{traits}}" };

    documentationService.getCreatureTraits(template, creature);

    expect(template.text).toBe("");
  });

  it("wraps trait content in a detail-section with a Traits heading when present", () => {
    State.immunities = [
      {
        name: "construct",
        type: "trait",
        stringRef: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    const creature = {
      data: { immunities: ["construct"], items: { equipped: [] } },
    } as unknown as Creature;
    const template = { text: "{{traits}}" };

    documentationService.getCreatureTraits(template, creature);

    expect(template.text).toBe(
      '<div class="detail-section"><h4>Traits</h4><div class="traits">' +
        '<h5><a href="#construct" class="trait-link">Construct</a></h5>' +
        "</div></div>",
    );
  });

  it("renders a non-trait immunity's description as a paragraph under its own heading when present", () => {
    State.immunities = [
      {
        name: "poison",
        type: "immunity",
        stringRef: "common.traits.construct.name",
        description: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    const creature = {
      data: { immunities: ["poison"], items: { equipped: [] } },
    } as unknown as Creature;
    const template = { text: "{{traits}}" };

    documentationService.getCreatureTraits(template, creature);

    expect(template.text).toContain("<h5>");
    expect(template.text).toContain("<p>");
  });

  it("renders a non-trait immunity without a description as bare text", () => {
    State.immunities = [
      {
        name: "poison",
        type: "immunity",
        stringRef: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    const creature = {
      data: { immunities: ["poison"], items: { equipped: [] } },
    } as unknown as Creature;
    const template = { text: "{{traits}}" };

    documentationService.getCreatureTraits(template, creature);

    expect(template.text).not.toContain("<p>");
  });

  it("omits an immunity that was auto-added to satisfy an engine restriction (e.g. critical-hit needing a helmet)", () => {
    State.immunities = [
      {
        name: "undead",
        type: "trait",
        stringRef: "common.traits.undead.name",
      } as unknown as ImmunityConfig,
      {
        name: "criticalHit",
        type: "immunity",
        stringRef: "common.immunity.criticalHit",
      } as unknown as ImmunityConfig,
    ];
    const creature = {
      data: { immunities: ["undead", "criticalHit"], items: { equipped: [] } },
      autoImmunities: ["criticalHit"],
    } as unknown as Creature;
    const template = { text: "{{traits}}" };

    documentationService.getCreatureTraits(template, creature);

    expect(template.text).not.toContain("critical");
  });
});

describe("getTraitEntries", () => {
  const originalImmunities = State.immunities;

  afterEach(() => {
    State.immunities = originalImmunities;
  });

  it("wraps each trait entry in a container div keyed by the trait's name, with no title", () => {
    State.immunities = [
      {
        name: "construct",
        type: "trait",
        doc: true,
        stringRef: "common.traits.construct.name",
        description: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    expect(documentationService.getTraitEntries()).toBe(
      '<div class="trait-entry" id="construct"><p>Construct</p></div>',
    );
  });

  it("leaves the entry empty when the trait has no description", () => {
    State.immunities = [
      {
        name: "construct",
        type: "trait",
        doc: true,
        stringRef: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    expect(documentationService.getTraitEntries()).toBe(
      '<div class="trait-entry" id="construct"></div>',
    );
  });

  it("skips non-trait immunities and traits excluded from documentation", () => {
    State.immunities = [
      { name: "fire", type: "immunity", doc: true } as unknown as ImmunityConfig,
      { name: "ghostVisual1", type: "trait", doc: false } as unknown as ImmunityConfig,
    ];
    expect(documentationService.getTraitEntries()).toBe("");
  });
});

describe("formatEnumLabel", () => {
  it("renders a SCREAMING_SNAKE_CASE value as Title Case words", () => {
    expect(documentationService.formatEnumLabel("CHAOTIC_EVIL")).toBe("Chaotic Evil");
  });

  it("handles a single word", () => {
    expect(documentationService.formatEnumLabel("NEUTRAL")).toBe("Neutral");
  });

  it("returns an empty string for undefined", () => {
    expect(documentationService.formatEnumLabel(undefined)).toBe("");
  });
});

describe("getSpellQuantity", () => {
  it("returns 'unknown' when memorizedCount is 0 or undefined", () => {
    expect(documentationService.getSpellQuantity(undefined)).toBe("unknown");
    expect(documentationService.getSpellQuantity(0)).toBe("unknown");
  });

  it("returns 'X/day' when there is no renew value", () => {
    expect(documentationService.getSpellQuantity(3)).toBe("3/day");
  });

  it("returns 'at will' when renew is 1 (0 is falsy and hits the 'X/day' branch instead)", () => {
    expect(documentationService.getSpellQuantity(3, 1)).toBe("at will");
  });

  it("returns 'every N rounds' for a renew value above 1", () => {
    expect(documentationService.getSpellQuantity(3, 5)).toBe("every 5 rounds");
  });
});

function fakeAbility(
  resource: string,
  timer?: { name: string; value: number },
  infiniteUse = false,
): CreatureAbility {
  return { name: "ability.test", resource, timer, infiniteUse } as unknown as CreatureAbility;
}

function fakeCreatureForSpells(
  behavior: Partial<Creature["behavior"]>,
  spells: Partial<Creature["data"]["spells"]>,
): Creature {
  return {
    id: 79,
    behavior: { abilities: [], customCodes: [], ...behavior },
    data: { spells: { memorized: [], ...spells } },
  } as unknown as Creature;
}

describe("getCreatureSpell", () => {
  const originalSpells = State.spells;

  afterEach(() => {
    State.spells = originalSpells;
  });

  it("finds a spell in the given memorized list", () => {
    const html = documentationService.getCreatureSpell(
      fakeAbility("SPPR101"),
      [{ file: "SPPR101", memorizedCount: 3 }],
      "m1-ability-0",
    );
    expect(html).toContain("3/day");
  });

  it("wraps a found entry in .ability-entry so multi-column layout keeps it intact", () => {
    const html = documentationService.getCreatureSpell(
      fakeAbility("SPPR101"),
      [{ file: "SPPR101", memorizedCount: 3 }],
      "m1-ability-0",
    );
    expect(html).toMatch(/^<div class="ability-entry">.*<\/div>$/);
  });

  it("renders nothing when the resource isn't in the given list", () => {
    const html = documentationService.getCreatureSpell(fakeAbility("SPPR101"), [], "m1-ability-0");
    expect(html).toBe("");
  });

  it("ignores the recast cooldown timer entirely when there's a real daily memorized count", () => {
    const ability = fakeAbility("SPPR101", { name: "Summoning", value: 2 * 6 });
    const html = documentationService.getCreatureSpell(
      ability,
      [{ file: "SPPR101", memorizedCount: 2 }],
      "m1-ability-0",
    );
    // The bug: a timer used to fully replace "2/day" with "every 2 rounds", hiding the real
    // daily cap. A real count is authoritative, so the timer must not show at all.
    expect(html).toContain("2/day");
    expect(html).not.toContain("every 2 rounds");
    expect(html).not.toContain("round");
  });

  it("uses the recast timer instead of the daily count when infiniteUse is true (e.g. a noDec cast)", () => {
    // A noDec/force/reallyForce cast (without a remove flag) never decrements the memorized
    // slot, so the daily count isn't the real limiter - the timer (in seconds, 6 per round) is.
    // Regression test for Battle Horror's Magic Missiles: memorizedCount: 1 but a 18-second
    // (3-round) noDec recast timer - docs used to say "1/day" instead of "every 3 rounds".
    const ability = fakeAbility("SPPR101", { name: "Summoning", value: 3 * 6 }, true);
    const html = documentationService.getCreatureSpell(
      ability,
      [{ file: "SPPR101", memorizedCount: 1 }],
      "m1-ability-0",
    );
    expect(html).toContain("every 3 rounds");
    expect(html).not.toContain("1/day");
  });

  it("treats an infiniteUse ability with no timer as unlimited ('at will')", () => {
    const ability = fakeAbility("SPPR101", undefined, true);
    const html = documentationService.getCreatureSpell(
      ability,
      [{ file: "SPPR101", memorizedCount: 1 }],
      "m1-ability-0",
    );
    expect(html).toContain("at will");
  });

  it("links the spell name to a hidden popover entry holding its description, keeping the quantity inline", () => {
    const name = translationService.addCustomTranslation(["Test Spell"]);
    const description = translationService.addCustomTranslation(["A test description."]);
    State.spells = [
      { file: "SPPR101", doc: true, name, description },
    ] as unknown as typeof State.spells;
    const html = documentationService.getCreatureSpell(
      fakeAbility("SPPR101"),
      [{ file: "SPPR101", memorizedCount: 3 }],
      "m1-ability-0",
    );

    expect(html).toBe(
      '<div class="ability-entry"><h5><a href="#m1-ability-0-desc" class="trait-link">Test Spell</a> (3/day)</h5></div>' +
        '<div class="spell-popover-entry" id="m1-ability-0-desc" hidden><p>A test description.</p></div>',
    );
  });

  it("renders a bare name with no popover when the spell has doc: 'name' (no description to show)", () => {
    const name = translationService.addCustomTranslation(["Test Spell"]);
    State.spells = [{ file: "SPPR101", doc: "name", name }] as unknown as typeof State.spells;
    const html = documentationService.getCreatureSpell(
      fakeAbility("SPPR101"),
      [{ file: "SPPR101", memorizedCount: 3 }],
      "m1-ability-0",
    );

    expect(html).toBe('<div class="ability-entry"><h5>Test Spell (3/day)</h5></div>');
    expect(html).not.toContain("trait-link");
  });
});

describe("getCreatureSpells", () => {
  it("renders only abilities backed by the base memorized list, not any spellbook variant", () => {
    const creature = fakeCreatureForSpells(
      { abilities: [fakeAbility("SPPR101"), fakeAbility("SPPR102")] },
      {
        memorized: [{ file: "SPPR101", memorizedCount: 3 }],
        spellbooks: [
          { mod: "FaithsAndPowers", memorized: [{ file: "SPPR102", memorizedCount: 1 }] },
        ],
      },
    );
    const template = { text: "{{abilities}}" };

    documentationService.getCreatureSpells(template, creature);

    expect(template.text).toContain("3/day");
    expect(template.text).not.toContain("1/day");
  });

  it("renders nothing when the base memorized list has no matching abilities", () => {
    const creature = fakeCreatureForSpells({ abilities: [fakeAbility("SPPR101")] }, {});
    const template = { text: "{{abilities}}" };

    documentationService.getCreatureSpells(template, creature);

    expect(template.text).toBe("");
  });
});

describe("getCreatureSpellbooks", () => {
  it("renders a labeled section per spellbook variant that has matching abilities", () => {
    const creature = fakeCreatureForSpells(
      { abilities: [fakeAbility("SPPR101"), fakeAbility("SPPR102")] },
      {
        spellbooks: [
          { mod: "FaithsAndPowers", memorized: [{ file: "SPPR101", memorizedCount: 2 }] },
          { mod: "SpellRevisions", memorized: [{ file: "SPPR102", memorizedCount: 5 }] },
        ],
      },
    );
    const template = { text: "{{spellbooks}}" };

    documentationService.getCreatureSpellbooks(template, creature);

    expect(template.text).toContain("Faiths & Powers");
    expect(template.text).toContain("2/day");
    expect(template.text).toContain("Spell Revisions");
    expect(template.text).toContain("5/day");
  });

  it("renders one tab button per variant, linked to its panel via data-tab/id, first tab active", () => {
    const creature = fakeCreatureForSpells(
      { abilities: [fakeAbility("SPPR101"), fakeAbility("SPPR102")] },
      {
        spellbooks: [
          { mod: "FaithsAndPowers", memorized: [{ file: "SPPR101", memorizedCount: 2 }] },
          { mod: "SpellRevisions", memorized: [{ file: "SPPR102", memorizedCount: 5 }] },
        ],
      },
    );
    const template = { text: "{{spellbooks}}" };

    documentationService.getCreatureSpellbooks(template, creature);

    expect(template.text).toContain(
      '<button type="button" class="spellbook-tab-button active" data-tab="spellbook-m79-0">Faiths & Powers</button>',
    );
    expect(template.text).toContain(
      '<button type="button" class="spellbook-tab-button" data-tab="spellbook-m79-1">Spell Revisions</button>',
    );
    expect(template.text).toContain(
      '<div class="spellbook-tab-panel abilities active" id="spellbook-m79-0">',
    );
    expect(template.text).toContain(
      '<div class="spellbook-tab-panel abilities" id="spellbook-m79-1">',
    );
  });

  it("skips a spellbook variant with no matching abilities", () => {
    const creature = fakeCreatureForSpells(
      { abilities: [fakeAbility("SPPR101")] },
      {
        spellbooks: [
          { mod: "FaithsAndPowers", memorized: [{ file: "SPPR101", memorizedCount: 2 }] },
          { mod: "Vanilla", memorized: [] },
        ],
      },
    );
    const template = { text: "{{spellbooks}}" };

    documentationService.getCreatureSpellbooks(template, creature);

    expect(template.text).toContain("Faiths & Powers");
    expect(template.text).not.toContain("Vanilla");
  });

  it("renders nothing when the creature has no spellbooks", () => {
    const creature = fakeCreatureForSpells({ abilities: [fakeAbility("SPPR101")] }, {});
    const template = { text: "{{spellbooks}}" };

    documentationService.getCreatureSpellbooks(template, creature);

    expect(template.text).toBe("");
  });
});

describe("replace (private)", () => {
  it("throws when the token isn't present in the template", () => {
    const template = { text: "no tokens here" };
    expect(() => {
      service.replace(template, "missing", "x");
    }).toThrow(/Token \{\{missing\}\} not found/);
  });

  it("replaces every occurrence of the token, falling back to empty string for undefined", () => {
    const template = { text: "{{key}} and {{key}} again" };
    service.replace(template, "key", undefined);
    expect(template.text).toBe(" and  again");
  });
});

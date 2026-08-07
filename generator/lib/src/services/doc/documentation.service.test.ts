// Template placeholder/fixture strings ("{{special}}", "{{traits}}", the test immunity's
// stringRef) recur because many independent test cases exercise the same template-replace
// contract on different inputs - not copy-paste.
/* eslint-disable sonarjs/no-duplicate-string */
import { afterEach, describe, expect, it } from "vitest";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { CreatureAbility } from "../../model/creature/ability";
import { Creature } from "../../model/creature/creature";
import { Family } from "../../model/creature/family";
import { ImmunityConfig } from "../../model/final/immunity";
import { State } from "../../state";
import documentationService from "./documentation.service";

interface DocumentationServicePrivate {
  monsters: string[];
  replace(template: { text: string }, key: string, value: string | number | undefined): void;
}
const service = documentationService as unknown as DocumentationServicePrivate;

function fakeCreatureForAddCreature(doubleApr: boolean): Creature {
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

describe("getAttackDisplayText", () => {
  it("strips the weapon name, blank lines, THAC0/Speed Factor/Range, and folds enchantment into the damage line", () => {
    const description = [
      "Mandibles",
      "",
      "THAC0: +2",
      "Melee damage: 3D6 (Crushing)",
      "Speed Factor: 5",
      "Enchantment: 2",
      "Range: 2 feet",
      "",
      "Cast spell Digestive Enzymes:",
    ].join("\r\n");

    expect(documentationService.getAttackDisplayText(description)).toBe(
      ["3D6 (Crushing) at +2", "Cast spell Digestive Enzymes:"].join("\r\n"),
    );
  });

  it("strips the damage-type label but leaves the value bare when there is no enchantment", () => {
    const description = ["Jaws", "", "Ranged damage: 1D6 (Piercing)"].join("\r\n");

    expect(documentationService.getAttackDisplayText(description)).toBe("1D6 (Piercing)");
  });

  it("falls back to a standalone Enchantment line when there is no damage line", () => {
    const description = ["Ring", "", "Enchantment: 3"].join("\r\n");

    expect(documentationService.getAttackDisplayText(description)).toBe("Enchantment: +3");
  });

  it("passes through unchanged when there is neither damage nor enchantment", () => {
    const description = ["Fists", "", "Cast spell Rend:"].join("\r\n");

    expect(documentationService.getAttackDisplayText(description)).toBe("Cast spell Rend:");
  });

  it("leaves a description with no name/blank-line header untouched, e.g. a trait item's description", () => {
    const description = ["Melee damage: 1D4 (Piercing)"].join("\r\n");

    expect(documentationService.getAttackDisplayText(description)).toBe("1D4 (Piercing)");
  });

  it("returns the input unchanged for an empty description", () => {
    expect(documentationService.getAttackDisplayText("")).toBe("");
  });

  it("collapses blank separator lines between multiple cast-spell entries", () => {
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

    expect(documentationService.getAttackDisplayText(description)).toBe(
      [
        "1D6 (Piercing)",
        "Cast spell Poison:",
        "Deals poison damage.",
        "Cast spell Disease:",
        "Deals disease damage.",
      ].join("\r\n"),
    );
  });
});

describe("getFamilyMenu", () => {
  it("builds a collapsible family entry linking to every creature in the family", () => {
    const family = {
      id: MonsterFamilyEnum.Bear,
      creatures: [
        { id: 4, name: "monster.bear.name.black" },
        { id: 5, name: "monster.bear.name.brown" },
      ],
    } as unknown as Family;

    expect(documentationService.getFamilyMenu(family)).toBe(
      '<li class="family"><details><summary>Bear</summary><ul>' +
        '<li><a href="#m4">Black Bear</a></li>' +
        '<li><a href="#m5">Brown Bear</a></li>' +
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

describe("addSpecial", () => {
  it("renders a caster special row as a stat-grid entry", () => {
    const creature = {
      data: { level1: { type: "caster", value: 9 } },
    } as unknown as Creature;
    const template = { text: "{{special}}" };

    documentationService.addSpecial(template, creature);

    expect(template.text).toBe(
      '<div class="stat"><dt>Special</dt><dd>Cast spells as a level 9 caster</dd></div>',
    );
  });

  it("renders a turn-undead special row as a stat-grid entry", () => {
    const creature = {
      data: { level1: { type: "turn", value: 3 } },
    } as unknown as Creature;
    const template = { text: "{{special}}" };

    documentationService.addSpecial(template, creature);

    expect(template.text).toBe(
      '<div class="stat"><dt>Special</dt><dd>Turned as a level 3 undead</dd></div>',
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

describe("getTraits", () => {
  const originalImmunities = State.immunities;

  afterEach(() => {
    State.immunities = originalImmunities;
  });

  it("appends the description paragraph when the trait has one", () => {
    State.immunities = [
      {
        name: "construct",
        type: "trait",
        doc: true,
        stringRef: "common.traits.construct.name",
        description: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    expect(documentationService.getTraits()).toContain("<p>");
  });

  it("omits the description paragraph when the trait has none", () => {
    State.immunities = [
      {
        name: "construct",
        type: "trait",
        doc: true,
        stringRef: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    expect(documentationService.getTraits()).not.toContain("<p>");
  });

  it("wraps each trait entry in a container div keyed by the trait's name", () => {
    State.immunities = [
      {
        name: "construct",
        type: "trait",
        doc: true,
        stringRef: "common.traits.construct.name",
        description: "common.traits.construct.name",
      } as unknown as ImmunityConfig,
    ];
    expect(documentationService.getTraits()).toBe(
      '<div class="trait-entry" id="construct"><h5>Construct</h5><p>Construct</p></div>',
    );
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
  it("finds a spell in the given memorized list", () => {
    const html = documentationService.getCreatureSpell(fakeAbility("SPPR101"), [
      { file: "SPPR101", memorizedCount: 3 },
    ]);
    expect(html).toContain("3/day");
  });

  it("wraps a found entry in .ability-entry so multi-column layout keeps it intact", () => {
    const html = documentationService.getCreatureSpell(fakeAbility("SPPR101"), [
      { file: "SPPR101", memorizedCount: 3 },
    ]);
    expect(html).toMatch(/^<div class="ability-entry">.*<\/div>$/);
  });

  it("renders nothing when the resource isn't in the given list", () => {
    const html = documentationService.getCreatureSpell(fakeAbility("SPPR101"), []);
    expect(html).toBe("");
  });

  it("ignores the recast cooldown timer entirely when there's a real daily memorized count", () => {
    const ability = fakeAbility("SPPR101", { name: "Summoning", value: 2 * 6 });
    const html = documentationService.getCreatureSpell(ability, [
      { file: "SPPR101", memorizedCount: 2 },
    ]);
    // The bug: a timer used to fully replace "2/day" with "every 2 rounds", hiding the real
    // daily cap. A real count is authoritative, so the timer must not show at all.
    expect(html).toContain("2/day");
    expect(html).not.toContain("every 2 rounds");
    expect(html).not.toContain("round");
  });

  it("still ignores the timer even when infiniteUse is true, as long as a real count was found", () => {
    // parseAbilitySpell() defaults spell.type to "normal" *after* computing infiniteUse, so
    // infiniteUse ends up true for most presets regardless of intent - it isn't a reliable
    // signal here, so this branch must not special-case it.
    const ability = fakeAbility("SPPR101", { name: "Summoning", value: 2 * 6 }, true);
    const html = documentationService.getCreatureSpell(ability, [
      { file: "SPPR101", memorizedCount: 2 },
    ]);
    expect(html).toContain("2/day");
    expect(html).not.toContain("round");
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

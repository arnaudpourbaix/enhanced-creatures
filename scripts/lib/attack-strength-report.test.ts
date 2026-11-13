import { afterEach, describe, expect, it } from "vitest";
import { PLAYER_CONFIG } from "../../lib/config/player-config";
import type { Creature } from "../../lib/src/model/creature/creature";
import {
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../../lib/src/model/spell-item/effect.enums";
import {
  buildAttackStrengthReport,
  renderAttackStrengthCard,
  renderUnsureWeaponsCard,
  unsureWeapons,
} from "./attack-strength-report";

const STRENGTH = [ItemAbilityFlagEnum.AddStrengthBonus];

function weapon(file: string, natural: boolean | undefined, flags = STRENGTH) {
  return {
    file,
    natural,
    trait: false,
    header: { type: ItemAbilityTypeEnum.Melee, diceThrown: 1, diceSize: 6, abilityflags: flags },
  };
}

// MonsterEnum 1 is a real member, so the id resolves to a name
function fake(data: object, items: object[]): Creature {
  return {
    id: 1,
    files: [],
    adjustments: [],
    data: { items: { equipped: [], remove: [] }, ...data },
    items,
  } as unknown as Creature;
}

describe("attack strength report", () => {
  const edition = PLAYER_CONFIG.strengthEdition;
  afterEach(() => {
    PLAYER_CONFIG.strengthEdition = edition;
  });

  it("gives a natural attack strength in 3e+ only, a manufactured weapon in both", () => {
    const creature = fake({ strength: 19 }, [weapon("CLAW", true), weapon("CLUB", false)]);
    const [claw, club] = buildAttackStrengthReport([creature]);
    expect(claw).toMatchObject({ kind: "natural", strength3e: "19", strength2e: "no bonus" });
    expect(claw.bonus).toEqual({ "3e+": 7, "3e+ weapons": undefined, "2e": 0 });
    expect(club).toMatchObject({ kind: "manufactured" });
    expect(club.bonus).toEqual({ "3e+": 7, "3e+ weapons": 7, "2e": 0 });
  });

  it("plays the 2e strength in the 2e column", () => {
    const creature = fake(
      { strength: 19, strength2e: { strength: 18, exceptionalStrength: 100 } },
      [weapon("CLUB", false)],
    );
    const [club] = buildAttackStrengthReport([creature]);
    expect(club.strength2e).toBe("18/00");
    expect(club.bonus["2e"]).toBe(6);
  });

  it("knows a natural attack asked for strength even after a 3e+ weapons build dropped it", () => {
    PLAYER_CONFIG.strengthEdition = "3e+ weapons";
    const creature = fake({ strength: 19 }, [weapon("CLAW", true, [])]);
    expect(buildAttackStrengthReport([creature])[0].bonus["3e+"]).toBe(7);
  });

  it("skips traits and diceless items (a gaseous form)", () => {
    const diceless = { ...weapon("GAS", true), header: { type: ItemAbilityTypeEnum.Melee } };
    const trait = { ...weapon("RING", undefined), trait: true };
    expect(buildAttackStrengthReport([fake({ strength: 10 }, [diceless, trait])])).toEqual([]);
  });

  it("renders a row per attack, none where an edition adds nothing", () => {
    const html = renderAttackStrengthCard(
      buildAttackStrengthReport([fake({ strength: 19 }, [weapon("CLAW", true)])]),
    );
    expect(html).toContain("Strength on attacks (1)");
    expect(html).toContain(">natural<");
    expect(html).toContain(">+7<");
    expect(html).toContain(">none<");
  });

  it("lists the hand-classified weapons for review, not those made as a natural weapon kind", () => {
    const claws = { ...weapon("CLAWS", true), naturalWeaponKind: "claws" };
    const sword = { ...weapon("SWORD", false), category: 20, icon: "ISW1H04" };
    const headbutt = weapon("HEAD", true);
    const rows = buildAttackStrengthReport([fake({ strength: 19 }, [claws, sword, headbutt])]);
    expect(rows.map((r) => r.classifiedBy)).toEqual(["kind", "hand", "hand"]);
    expect(unsureWeapons(rows).map((g) => g[0].evidence.file)).toEqual(["SWORD", "HEAD"]);
    const html = renderUnsureWeaponsCard(rows);
    expect(html).toContain("Weapons to review (2)");
    expect(html).toContain("ISW1H04");
    expect(html).not.toContain("CLAWS");
  });
});

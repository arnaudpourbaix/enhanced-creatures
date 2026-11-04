import { afterEach, describe, expect, it, vi } from "vitest";
import { SPELL_PROTECTIONS } from "../../../config/spells/spell-protection";
import { ImmunityConfig } from "../../model/final/immunity";
import { CodeLine } from "../../model/misc";
import { PortraitIconEnum } from "../../model/spell-item/effect.enums";
import { SpellGroup } from "../../model/spell-item/spell-group";
import { SpellProtection, SpellProtectionRelation } from "../../model/spell-item/spell-protection";
import { State } from "../../state";
import utils from "../utils/utils.service";
import weiduFunctionService from "./weidu-function.service";

interface WeiduFunctionServicePrivate {
  generateSpellResource(lines: CodeLine[], group: SpellGroup, tab: number): void;
}
const service = weiduFunctionService as unknown as WeiduFunctionServicePrivate;

function fakeImmunity(overrides: Partial<ImmunityConfig> = {}): ImmunityConfig {
  return {
    name: "poison",
    type: "immunity",
    doc: true,
    docOnly: false,
    immunities: [],
    preventEffects: [],
    preventIcons: [],
    displayIcons: [],
    strings: [],
    animations: [],
    spellGroups: [],
    displaySpellIneffective: false,
    effects: [],
    overrides: [],
    ...overrides,
  };
}

describe("callImmunityFunction", () => {
  it("evaluates the strings STR_VAR, which holds install-time variables", () => {
    const lines: CodeLine[] = [];
    weiduFunctionService.callImmunityFunction(
      lines,
      fakeImmunity({ strings: ["%ja_strrefs_poison%"] }),
      0,
    );
    expect(lines.map((l) => l.code).join(" ")).toContain(
      'strings=EVALUATE_BUFFER "%ja_strrefs_poison%"',
    );
  });

  it("emits a display_icons STR_VAR when the immunity config sets displayIcons", () => {
    const lines: CodeLine[] = [];
    weiduFunctionService.callImmunityFunction(
      lines,
      fakeImmunity({
        displayIcons: [PortraitIconEnum.ProtectionFromPoison],
      }),
      0,
    );
    expect(lines).toHaveLength(1);
    expect(lines[0].code).toContain('display_icons="30"');
  });

  it("emits both prevent_icons and display_icons together, keeping them distinct", () => {
    const lines: CodeLine[] = [];
    weiduFunctionService.callImmunityFunction(
      lines,
      fakeImmunity({
        preventIcons: [PortraitIconEnum.Poisoned],
        displayIcons: [PortraitIconEnum.ProtectionFromPoison],
      }),
      0,
    );
    expect(lines[0].code).toContain('prevent_icons="6"');
    expect(lines[0].code).toContain('display_icons="30"');
  });

  it("omits display_icons entirely when displayIcons is empty", () => {
    const lines: CodeLine[] = [];
    weiduFunctionService.callImmunityFunction(lines, fakeImmunity(), 0);
    expect(lines[0].code).not.toContain("display_icons");
  });
});

describe("generateProtectionSpells", () => {
  it("defaults value to -1 when sp.value is undefined (documented behavior; no real config entry omits it)", () => {
    SPELL_PROTECTIONS.push({
      name: "TEST_NO_VALUE",
      stat: "0x0",
      value: undefined,
      relation: SpellProtectionRelation.Equal,
    } as unknown as SpellProtection);
    try {
      const lines: CodeLine[] = [];
      weiduFunctionService.generateProtectionSpells(lines);
      expect(lines.some((l) => l.code.includes("value=-1"))).toBe(true);
    } finally {
      SPELL_PROTECTIONS.pop();
    }
  });
});

describe("generateSpellResource (private)", () => {
  it("defaults spells to an empty array when group.spells is unset", () => {
    const lines: CodeLine[] = [];
    service.generateSpellResource(
      lines,
      { name: "acidSpells", spells: undefined, idsSpells: undefined },
      0,
    );
    expect(lines.some((l) => l.code.includes("ACTION_DEFINE_ARRAY spells"))).toBe(true);
  });
});

describe("generateStringRefs", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sets every existing string's variables to the strrefs of the game being installed", () => {
    let content = "";
    vi.spyOn(utils, "writeFile").mockImplementation((_f, c) => {
      content = c;
    });
    weiduFunctionService.generateStringRefs();
    const bg2Branch = content.indexOf("END ELSE BEGIN");
    expect(content).toContain("ACTION_IF GAME_IS ~bgee~ BEGIN");
    expect(content.indexOf("OUTER_SET ja_strref_two_levels_drained = 25803")).toBeLessThan(
      bg2Branch,
    );
    expect(content.indexOf("OUTER_SET ja_strref_two_levels_drained = 40968")).toBeGreaterThan(
      bg2Branch,
    );
    expect(content).toContain("OUTER_SPRINT ja_strrefs_bleed ~54335~");
  });
});

describe("generateImmunities", () => {
  const before = State.immunities;
  afterEach(() => {
    State.immunities = before;
    vi.restoreAllMocks();
  });

  it("emits no patch function for a docOnly immunity, but does for the others", () => {
    const docOnly = fakeImmunity({ name: "animal", type: "trait", docOnly: true });
    const regular = fakeImmunity({ name: "poison" });
    State.immunities = [docOnly, regular] as typeof State.immunities;
    const written: string[] = [];
    vi.spyOn(utils, "writeFile").mockImplementation((_f, content) => {
      written.push(content);
    });
    weiduFunctionService.generateImmunities();
    const content = written.join("");
    expect(content).toContain(`DEFINE_PATCH_FUNCTION ${utils.getImmunityFunctionName(regular)}`);
    expect(content).not.toContain(
      `DEFINE_PATCH_FUNCTION ${utils.getImmunityFunctionName(docOnly)}`,
    );
    expect(content).not.toContain("animal");
  });
});

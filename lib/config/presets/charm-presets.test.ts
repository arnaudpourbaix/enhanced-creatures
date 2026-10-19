import { describe, expect, it } from "vitest";
import { ScriptTarget } from "../../src/model/constants";
import { SPELLS } from "../spells/spell-database";
import { CHARM_PRESETS } from "./charm-presets";

const preset = (file: string) => CHARM_PRESETS.find((p) => p.preset === file);

describe("CHARM_PRESETS", () => {
  it("has Control Undead target any undead not charmed yet", () => {
    const targets = preset(SPELLS.Wizard.ControlUndead.file)?.ability.targets ?? [];
    const triggers = (Array.isArray(targets) ? targets : [targets]).flatMap(
      (t) => t.triggers ?? [],
    );
    expect(triggers).toContainEqual({ name: "General", params: [ScriptTarget.token, "UNDEAD"] });
    expect(triggers).toContainEqual({
      name: "StateCheck",
      params: [ScriptTarget.token, "STATE_CHARMED"],
      negation: true,
    });
    expect(JSON.stringify(triggers)).not.toContain("SUMMONED");
    expect(JSON.stringify(triggers)).not.toContain("ILLUSIONARY");
  });

  it("doesn't make the charms wait for Control Undead", () => {
    const charm = JSON.stringify(preset(SPELLS.Wizard.CharmPerson.file)?.ability.triggers ?? []);
    expect(charm).toContain(SPELLS.Wizard.Domination.id);
    expect(charm).not.toContain(SPELLS.Wizard.ControlUndead.id);
  });
});

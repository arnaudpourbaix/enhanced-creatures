import { ScriptTarget } from "../../src/model/constants";
import { TargetList } from "../../src/model/script/target";
import { Triggers } from "../../src/model/script/triggers";
import { SpellReference, spellFiles } from "../../src/model/spell-item/spell-reference";
import { ExcludeUnwantedTargetsTriggers, KEEP_PLAYERS_DISABLED } from "../target/common";
import { FNP_SPELLS } from "./fnp-spell-database";
import { SPELLS } from "./spell-database";

/** A spell clearing Mirror Image, with the triggers replacing its preset's in that role */
export interface MirrorCounter {
  spell: SpellReference;
  triggers?: Triggers.Trigger[];
}

/**
 * Mirror Image deflects every single-target spell: against a mirrored enemy, these clear the
 * images first, in this order (see CastOrderService.plan). Dispels, True Seeing and the like end
 * them; Magic Missile's and Flame Arrow's missiles each pop one, Flame Arrow last for its damage.
 */
export const MIRROR_COUNTERS: MirrorCounter[] = [
  { spell: SPELLS.Wizard.DispelMagic, triggers: KEEP_PLAYERS_DISABLED },
  { spell: SPELLS.Priest.DispelMagic },
  { spell: SPELLS.Class.DispelMagic },
  { spell: SPELLS.Wizard.RemoveMagic },
  { spell: SPELLS.Wizard.TrueSeeing },
  { spell: SPELLS.Priest.TrueSeeing },
  { spell: FNP_SPELLS.Priest.TrueSeeing },
  { spell: SPELLS.Class.TrueSight },
  { spell: SPELLS.Class.TrueSightSPCL732 },
  { spell: SPELLS.Wizard.Oracle },
  { spell: SPELLS.Wizard.DetectIllusion },
  { spell: SPELLS.Wizard.MagicMissiles },
  { spell: SPELLS.Wizard.MordenkainenForceMissiles },
  { spell: SPELLS.Wizard.FlameArrow },
];

/**
 * Any able mirrored enemy, a wizard in practice (Mirror Image is a wizard spell): the targets of a
 * remover without its own, like True Seeing
 */
export const MIRRORED_ENEMY_TARGETS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    randomOrder: true,
    triggers: [
      ...ExcludeUnwantedTargetsTriggers,
      { name: "StateCheck", params: [ScriptTarget.token, "STATE_MIRRORIMAGE"] },
    ],
  },
];

/** The counter casting `file`, whichever of its spell's files it is. */
export function mirrorCounterOf(file: string): MirrorCounter | undefined {
  const target = file.toUpperCase();
  return MIRROR_COUNTERS.find((c) => spellFiles(c.spell).some((f) => f.toUpperCase() === target));
}

import presetFactory from "../../src/factories/preset.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

// NumCreatureGT is not used purposely
// Although it is best to maximize spell efficiency, you must remember the solo enemy case.

export const DAMAGE_AOE_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.Cloudkill,
      SPELLS.Wizard.ChainLightning,
      SPELLS.Wizard.Fireburst,
      SPELLS.Wizard.ConeOfCold,
      SPELLS.Priest.MassCauseLightWounds,
      SPELLS.Priest.CloudOfPestilence,
      FNP_SPELLS.Priest.CloudOfPestilence,
      SPELLS.Wizard.LightningBolt,
      SPELLS.Wizard.AgannazarScorcher,
      SPELLS.Wizard.BurningHands,
    ],
    {
      targets: CommonTargetLists.Enemies,
    },
  ),
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.IceStorm,
      SPELLS.Wizard.VitriolicSphere,
      SPELLS.Wizard.Fireball,
      SPELLS.Wizard.SkullTrap,
      SPELLS.Priest.GlyphOfWarding,
      SPELLS.Priest.HolySmite,
      SPELLS.Priest.UnholyBlight,
    ],
    {
      targets: CommonTargetLists.FarthestEnemies,
      minRange: 20,
      actionsAfter: [{ name: "RunAwayFrom", params: [ScriptTarget.lastSeen, 30] }],
    },
  ),
];

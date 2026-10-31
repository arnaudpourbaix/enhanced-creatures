import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";

/** Spells creating a weapon: see SpellReference.createsItems for what keeps them from stacking. */
export const WEAPON_PRESETS: AbilityPreset[] = presetFactory.createSpells(
  [
    SPELLS.Wizard.BlackBladeOfDisaster,
    SPELLS.Wizard.ChillTouch,
    SPELLS.Wizard.DartsOfBone,
    SPELLS.Wizard.EnergyBlades,
    SPELLS.Wizard.GhoulTouch,
    SPELLS.Wizard.IronBody,
    SPELLS.Wizard.LichTouch,
    SPELLS.Wizard.MelfsMinuteMeteors,
    SPELLS.Wizard.MordenkainensForceBlade,
    SPELLS.Wizard.PhantomBlade,
    SPELLS.Wizard.ShockingGrasp,
    SPELLS.Wizard.Stonefist,
    SPELLS.Wizard.TurnPebbleToBoulder,
    SPELLS.Priest.BeastClaw,
    SPELLS.Priest.CauseCriticalWounds,
    SPELLS.Priest.CauseLightWounds,
    SPELLS.Priest.CauseModerateWounds,
    SPELLS.Priest.CauseMortalWounds,
    SPELLS.Priest.CauseSeriousWounds,
    SPELLS.Priest.EnergyBlades,
    SPELLS.Priest.FireSeeds,
    SPELLS.Priest.FlameBlade,
    SPELLS.Priest.Harm,
    FNP_SPELLS.Priest.Harm,
    SPELLS.Priest.Moonblade,
    SPELLS.Priest.Shillelagh,
    SPELLS.Priest.SlayLiving,
    SPELLS.Priest.SolsSearingOrb,
    SPELLS.Priest.SpiritualHammer,
    SPELLS.Priest.StarMetalCudgel,
  ],
  {},
);

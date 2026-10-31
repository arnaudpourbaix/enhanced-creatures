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
      SPELLS.Wizard.AbiDalzimHorridWilting,
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
      SPELLS.Wizard.AcidFog,
      SPELLS.Wizard.DragonsBreath,
      SPELLS.Wizard.IncendiaryCloud,
      SPELLS.Wizard.LanceOfDisruption,
      SPELLS.Wizard.PrismaticSpray,
      SPELLS.Wizard.Shout,
      SPELLS.Wizard.Suffocate,
      SPELLS.Wizard.TelekineticStorm,
      SPELLS.Priest.AssassinVines,
      SPELLS.Priest.EtherealRetribution,
      SPELLS.Priest.FireTrap,
      SPELLS.Priest.ProduceFire,
      SPELLS.Priest.SpikeGrowth,
      SPELLS.Priest.SpikeStones,
      SPELLS.Priest.SpiritualWrath,
      SPELLS.Priest.ThornSpray,
      SPELLS.Priest.WallOfMoonlight,
      SPELLS.Priest.WrithingFog,
      FNP_SPELLS.Priest.MassCauseLightWounds,
      FNP_SPELLS.Priest.WavesOfAgony,
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
      SPELLS.Wizard.AcidStorm,
      SPELLS.Wizard.Comet,
      SPELLS.Wizard.DelayedBlastFireball,
      SPELLS.Wizard.MeteorSwarm,
      SPELLS.Wizard.SnillocsSnowballSwarm,
      SPELLS.Priest.Cloudburst,
      SPELLS.Priest.Earthquake,
      SPELLS.Priest.FireStorm,
      SPELLS.Priest.IceStorm,
      SPELLS.Priest.SmashingWave,
      SPELLS.Priest.SpiritFire,
      SPELLS.Priest.StormOfVengeance,
    ],
    {
      targets: CommonTargetLists.FarthestEnemies,
      actionsAfter: [
        { name: "RunAwayFromNoInterruptNoLeaveArea", params: [ScriptTarget.lastSeen, 10] },
      ],
    },
  ),

  // centered on the caster: each is cast with an enemy within its area, from its projectile
  ...presetFactory.createSpells([SPELLS.Wizard.Stormbolts, SPELLS.Priest.Sunray], {
    targets: CommonTargetLists.Enemies,
    range: 15,
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.MalavonsRage, {
    targets: CommonTargetLists.Enemies,
    range: 8,
  }),
];

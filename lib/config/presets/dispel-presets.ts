import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers } from "../target/common";

const DISPEL_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: [
      ...ExcludeUnwantedTargetsTriggers,
      triggerFactory.checkStatGT(0, "CLERIC_INSECT_PLAGUE", true),
      {
        name: "Or",
        triggers: [
          triggerFactory.checkStatGT(0, "IMPROVEDHASTE"),
          triggerFactory.checkStatGT(0, "MINORGLOBE"),
          triggerFactory.checkStatGT(0, "STONESKINS"),
          triggerFactory.checkStatGT(0, "DEFENSIVE_MODIFIER"),
          triggerFactory.checkStatGT(0, "TRUE_SIGHT"),
          triggerFactory.checkStatGT(0, "WIZARD_RESIST_FEAR"),
          triggerFactory.checkStatGT(0, "CLERIC_CHAOTIC_COMMANDS"),
          triggerFactory.checkStatGT(49, "CLERIC_FREE_ACTION"),
          triggerFactory.checkStatGT(49, "CLERIC_DEFENSIVE_HARMONY"),
          triggerFactory.checkStatGT(49, "RESISTFIRE"),
          triggerFactory.checkStatGT(49, "RESISTCOLD"),
          triggerFactory.checkStatGT(0, "WIZARD_PROTECTION_FROM_MAGIC_WEAPONS"),
          triggerFactory.stateCheck("STATE_MIRRORIMAGE"),
          triggerFactory.stateCheck("STATE_HASTED"),
          triggerFactory.stateCheck("STATE_DRAWUPONHOLYMIGHT"),
        ],
      },
    ],
    randomOrder: true,
  },
];

export const DISPEL_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpell(SPELLS.Wizard.DetectInvisibility, {
    triggers: [triggerFactory.detect("PC"), triggerFactory.see("PC", true)],
  }),
  ...presetFactory.createSpell(SPELLS.Priest.TrueSeeing, {
    triggers: [triggerFactory.detect("PC")],
  }),
  ...presetFactory.createSpell(SPELLS.Innate.MoonDogSight, {
    spell: {
      castOnSelf: true,
    },
    triggers: [triggerFactory.detect("PC")],
    requireVocal: false,
  }),
  ...presetFactory.createSpells(
    [SPELLS.Wizard.DispelMagic, SPELLS.Priest.DispelMagic, SPELLS.Wizard.RemoveMagic],
    {
      targets: DISPEL_TARGET_LISTS,
    },
  ),
  ...presetFactory.createOrderedSpells([SPELLS.Wizard.Breach, SPELLS.Wizard.SpellThrust], {
    targets: [
      {
        name: "Spellcasters",
        includeStatus: ["Able"],
        randomOrder: true,
        triggers: [
          ...ExcludeUnwantedTargetsTriggers,
          triggerFactory.or([
            triggerFactory.hasBounceEffects(),
            triggerFactory.hasImmunityEffects(),
          ]),
        ],
      },
    ],
  }),
  ...presetFactory.createSpells([SPELLS.Priest.DetectEvil, SPELLS.Priest.FindTraps], {
    spell: {
      castOnSelf: true,
    },
    triggers: [{ name: "False" }], // leave it as a manual cast
  }),
];

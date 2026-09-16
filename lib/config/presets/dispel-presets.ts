import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { SPELLS } from "../spells/spell-names";

export const DISPEL_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.DetectInvisibility.file,
    ability: {
      name: SPELLS.Wizard.DetectInvisibility.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        triggerFactory.detect("PC"),
        triggerFactory.checkSpellState("DETECT_INVISIBILITY", true),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.TrueSeeing.file,
    ability: {
      name: SPELLS.Priest.TrueSeeing.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.detect("PC"), triggerFactory.checkSpellState("TRUE_SIGHT", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Innate.MoonDogSight.file,
    ability: {
      name: SPELLS.Innate.MoonDogSight.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkSpellState("TRUE_SIGHT", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create(
    [
      SPELLS.Wizard.DispelMagic.file,
      SPELLS.Priest.DispelMagic.file,
      SPELLS.Wizard.RemoveMagic.file,
    ],
    {
      name: SPELLS.Wizard.DispelMagic.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            triggerFactory.stateCheck("STATE_CHARMED", true),
            triggerFactory.checkStatGT(0, "CLERIC_INSECT_PLAGUE", true),
            {
              name: "Or",
              triggers: [
                triggerFactory.checkStatGT(0, "MINORGLOBE"),
                triggerFactory.checkStatGT(0, "STONESKINS"),
                triggerFactory.checkStatGT(0, "WIZARD_RESIST_FEAR"),
                triggerFactory.checkStatGT(0, "CLERIC_CHAOTIC_COMMANDS"),
                triggerFactory.checkStatGT(49, "RESISTFIRE"),
                triggerFactory.checkStatGT(0, "WIZARD_PROTECTION_FROM_MAGIC_WEAPONS"),
                triggerFactory.stateCheck("STATE_MIRRORIMAGE"),
                triggerFactory.stateCheck("STATE_HASTED"),
                triggerFactory.stateCheck("STATE_DRAWUPONHOLYMIGHT"),
              ],
            },
          ],
        },
      ],
      spell: {
        excludeStateChecks: ["STATE_DISABLED"],
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  ),
  {
    preset: SPELLS.Wizard.Breach.file,
    ability: {
      name: SPELLS.Wizard.Breach.name,
      targets: [
        {
          name: "PCSpellcasters",
          randomOrder: true,
          triggers: [
            triggerFactory.or([
              triggerFactory.hasBounceEffects(),
              triggerFactory.hasImmunityEffects(),
            ]),
          ],
        },
      ],
      spell: {
        excludeStateChecks: ["STATE_DISABLED"],
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.SpellThrust.file,
    ability: {
      name: SPELLS.Wizard.SpellThrust.name,
      targets: [
        {
          name: "PCSpellcasters",
          randomOrder: true,
          triggers: [triggerFactory.checkSpellState("BUFF_PRO_SPELLS")],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.FindTraps.file,
    ability: {
      name: SPELLS.Priest.FindTraps.name,
      spell: {
        selfTarget: true,
      },
      triggers: [{ name: "False" }], // leave it as a manual cast
      requireVocal: true,
    },
  },
  {
    preset: SPELLS.Priest.DetectEvil.file,
    ability: {
      name: SPELLS.Priest.DetectEvil.name,
      spell: {
        selfTarget: true,
      },
      triggers: [{ name: "False" }], // leave it as a manual cast
      requireVocal: true,
    },
  },
];

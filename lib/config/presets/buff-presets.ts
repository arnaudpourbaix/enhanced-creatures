import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY, PRESET_NAMES } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

export const BUFF_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.Vocalize.file,
    ability: {
      name: SPELLS.Wizard.Vocalize.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: false,
      probability: 100,
      triggers: [triggerFactory.stateCheck("STATE_SILENCED")],
    },
  },
  {
    preset: SPELLS.Wizard.Invisibility.file,
    ability: {
      name: SPELLS.Wizard.Invisibility.name,
      spell: {
        excludeStateChecks: ["STATE_INVISIBLE"],
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [triggerFactory.detect("NearestEnemyOf")],
    },
  },
  {
    preset: SPELLS.Wizard.ImprovedInvisibility.file,
    ability: {
      name: SPELLS.Wizard.ImprovedInvisibility.name,
      spell: {
        excludeStateChecks: ["STATE_IMPROVEDINVISIBILITY"],
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [triggerFactory.detect("NearestEnemyOf")],
    },
  },
  {
    preset: SPELLS.Wizard.ShadowDoor.file,
    ability: {
      name: SPELLS.Wizard.ShadowDoor.name,
      spell: {
        excludeStateChecks: ["STATE_IMPROVEDINVISIBILITY"],
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [triggerFactory.detect("NearestEnemyOf"), triggerFactory.hplt(75)],
    },
  },
  {
    preset: SPELLS.Priest.Bless.file,
    ability: {
      name: SPELLS.Priest.Bless.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ResistFear.file,
    ability: {
      name: SPELLS.Priest.ResistFear.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Chant.file,
    ability: {
      name: SPELLS.Priest.Chant.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.DimensionDoor.file,
    ability: {
      name: SPELLS.Wizard.DimensionDoor.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
        },
      ],
      range: 900,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [triggerFactory.stateCheck("STATE_BLIND")],
    },
  },
  {
    preset: PRESET_NAMES.DimensionDoorOffscreen,
    ability: {
      name: SPELLS.Wizard.DimensionDoor.name,
      disableInterrupt: true,
      triggers: [
        triggerFactory.or([
          { name: "Range", params: ["NearestEnemyOf", 15] },
          triggerFactory.attackedBy("ANYONE", "DEFAULT"),
        ]),
      ],
      spell: {
        id: SPELLS.Wizard.DimensionDoor.id,
        targetName: "RR#TRAT",
      },
      requireVocal: false,
      actionsBefore: [
        {
          name: "CreateCreatureOffscreen", // Create a rat offscreen to teleport to
          params: ["RR#TRAT", 0],
        },
      ],
      actionsAfter: [{ name: "Wait", params: [1] }],
    },
  },
  {
    preset: SPELLS.Priest.Barkskin.file,
    ability: {
      name: SPELLS.Priest.Barkskin.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Wizard.Shield.file, FNP_SPELLS.Priest.Shield.file], {
    name: SPELLS.Wizard.Shield.name,
    spell: {
      selfTarget: true,
    },
    triggers: [triggerFactory.checkStat(2, "SCRIPTINGSTATE5")],
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: FNP_SPELLS.Priest.CircleOfBones.file,
    ability: {
      name: FNP_SPELLS.Priest.CircleOfBones.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkSpellState("CIRCLE_OF_BONES", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.MagicResistance.file,
    ability: {
      name: SPELLS.Priest.MagicResistance.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.MinorSpellDeflection.file,
    ability: {
      name: SPELLS.Wizard.MinorSpellDeflection.name,
      spell: {
        selfTarget: true,
      },
      triggers: triggerFactory.seeOneInTargetList("PCSpellcasters"),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.FireShield.file,
    ability: {
      name: SPELLS.Wizard.FireShield.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkStatGT(0, "WIZARD_FIRE_SHIELD", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.MirrorImages.file,
    ability: {
      name: SPELLS.Wizard.MirrorImages.name,
      spell: {
        selfTarget: true,
        excludeStateChecks: ["STATE_MIRRORIMAGE"],
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Haste.file,
    ability: {
      name: SPELLS.Wizard.Haste.name,
      spell: {
        selfTarget: true,
        excludeStateChecks: ["STATE_HASTED"],
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ProtectionFromMissiles.file,
    ability: {
      name: SPELLS.Wizard.ProtectionFromMissiles.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkSpellState("PROTECTION_FROM_NORMAL_MISSILES", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.MinorGlobeOfInvulnerability.file,
    ability: {
      name: SPELLS.Wizard.MinorGlobeOfInvulnerability.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Wizard.Stoneskin.file, SPELLS.Priest.Ironskin.file], {
    name: SPELLS.Wizard.Stoneskin.name,
    spell: {
      selfTarget: true,
    },
    triggers: [triggerFactory.checkStatLT(2, "STONESKINS")],
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Wizard.ProtectionFromMagicalWeapons.file,
    ability: {
      name: SPELLS.Wizard.ProtectionFromMagicalWeapons.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkStatGT(0, "WIZARD_PROTECTION_FROM_MAGIC_WEAPONS", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Blur.file,
    ability: {
      name: SPELLS.Wizard.Blur.name,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.BladeBarrier.file,
    ability: {
      name: SPELLS.Priest.BladeBarrier.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkStatGT(0, "CLERIC_BLADE_BARRIER", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RighteousMagic.file,
    ability: {
      name: SPELLS.Priest.RighteousMagic.name,
      spell: {
        selfTarget: true,
      },
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
      triggers: [triggerFactory.checkStatGT(0, "TRUE_SIGHT", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.HolyPower.file,
    ability: {
      name: SPELLS.Priest.HolyPower.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkStatLT(100, "STR")],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ProtectionFromLightning.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromLightning.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkStatLT(100, "RESISTELECTRICITY")],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.DrawUponHolyMight.file,
    ability: {
      name: SPELLS.Priest.DrawUponHolyMight.name,
      spell: {
        selfTarget: true,
      },
      triggers: [triggerFactory.checkStat(4, "SCRIPTINGSTATE6", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Sanctuary.file,
    ability: {
      name: SPELLS.Priest.Sanctuary.name,
      spell: {
        excludeStateChecks: ["STATE_INVISIBLE"],
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [triggerFactory.detect("NearestEnemyOf")],
    },
  },
  {
    preset: SPELLS.Class.BerserkerRage.file,
    ability: {
      name: SPELLS.Class.BerserkerRage.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        { name: "See", params: ["NearestEnemyOf"] },
        triggerFactory.checkSpellState("BERSERKER_RAGE", false),
      ],
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Class.BarbarianRage.file,
    ability: {
      name: SPELLS.Class.BarbarianRage.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        { name: "See", params: ["NearestEnemyOf"] },
        triggerFactory.checkSpellState("BARBARIAN_RAGE", false),
      ],
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];

import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY, PRESET_NAMES } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { spellFiles } from "../../src/model/spell-item/spell-reference";

export const BUFF_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.Vocalize.file,
    ability: {
      name: SPELLS.Wizard.Vocalize.name,
      spell: {
        castOnSelf: true,
      },
      requireVocal: false,
      probability: 100,
      triggers: [triggerFactory.stateCheck("STATE_SILENCED")],
    },
  },
  {
    preset: SPELLS.Wizard.NonDetection.file,
    ability: {
      name: SPELLS.Wizard.NonDetection.name,
      spell: {
        castOnSelf: true,
      },
      probability: 100,
    },
  },
  {
    preset: SPELLS.Wizard.Invisibility.file,
    ability: {
      name: SPELLS.Wizard.Invisibility.name,
      spell: {
        excludeStateChecks: ["STATE_INVISIBLE"],
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.DimensionDoor.file,
    ability: {
      name: SPELLS.Wizard.DimensionDoor.name,
      //TODO: players looks weird !
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
        // .resource (not .id): DimensionDoor's file moves under Spell Revisions (see its
        // variants), and .id would compile to a bare spell.ids symbol that can fail to resolve
        // entirely once a mod renames it - .resource lets weidu-creature.service.ts bake in the
        // right file per install via an OUTER_SPRINT placeholder instead.
        resource: SPELLS.Wizard.DimensionDoor.file,
        resourceVariants: SPELLS.Wizard.DimensionDoor.variants,
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
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Wizard.Shield.file, FNP_SPELLS.Priest.Shield.file], {
    name: SPELLS.Wizard.Shield.name,
    spell: {
      castOnSelf: true,
    },
    triggers: [triggerFactory.checkStat(2, "SCRIPTINGSTATE5")],
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  ...presetFactory.create(
    [SPELLS.Priest.CircleOfBones.file, FNP_SPELLS.Priest.CircleOfBones.file],
    {
      name: SPELLS.Priest.CircleOfBones.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [triggerFactory.checkSpellState("CIRCLE_OF_BONES", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  ),
  {
    preset: SPELLS.Priest.MagicResistance.file,
    ability: {
      name: SPELLS.Priest.MagicResistance.name,
      spell: {
        castOnSelf: true,
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
        castOnSelf: true,
      },
      triggers: triggerFactory.seeOneInTargetList("Spellcasters"),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.FireShield.file,
    ability: {
      name: SPELLS.Wizard.FireShield.name,
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
        castOnSelf: true,
        excludeStateChecks: ["STATE_MIRRORIMAGE"],
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ReflectedImage.file,
    ability: {
      name: SPELLS.Wizard.ReflectedImage.name,
      spell: {
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Wizard.Stoneskin.file, SPELLS.Priest.Ironskin.file], {
    name: SPELLS.Wizard.Stoneskin.name,
    spell: {
      castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
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
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.HolyPower.file,
    ability: {
      name: SPELLS.Priest.HolyPower.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [triggerFactory.checkStatLT(100, "STR")],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  // Spell Revisions moves this to a different file (see ProtectionFromLightning.variants) -
  // registered under every resolved file so the auto-generated ability preset lookup matches
  // either one.
  ...presetFactory.create(spellFiles(SPELLS.Priest.ProtectionFromLightning), {
    name: SPELLS.Priest.ProtectionFromLightning.name,
    spell: {
      castOnSelf: true,
    },
    triggers: [triggerFactory.checkStatLT(100, "RESISTELECTRICITY")],
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Priest.DrawUponHolyMight.file,
    ability: {
      name: SPELLS.Priest.DrawUponHolyMight.name,
      spell: {
        castOnSelf: true,
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
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [triggerFactory.detect("NearestEnemyOf")],
    },
  },
  {
    preset: SPELLS.Wizard.NahalRecklessDweomer.file,
    ability: {
      name: SPELLS.Wizard.NahalRecklessDweomer.name,
      spell: {
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Aid.file,
    ability: {
      name: SPELLS.Priest.Aid.name,
      spell: {
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ArmorOfFaith.file,
    ability: {
      name: SPELLS.Priest.ArmorOfFaith.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.DivineProtection.file,
    ability: {
      name: SPELLS.Priest.DivineProtection.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [
        {
          name: "CheckSpellState",
          params: [ScriptTarget.lastSeen, "SHIELD_OF_LATHANDER"],
          negation: true,
        },
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.GreaterDivineProtection.file,
    ability: {
      name: SPELLS.Priest.GreaterDivineProtection.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [
        {
          name: "CheckSpellState",
          params: [ScriptTarget.lastSeen, "SHIELD_OF_LATHANDER"],
          negation: true,
        },
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.EntropyShield.file,
    ability: {
      name: SPELLS.Priest.EntropyShield.name,
      spell: { castOnSelf: true },
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.FreeAction.file,
    ability: {
      name: SPELLS.Priest.FreeAction.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  // Stratagems duplicates this at a different file (see PhysicalMirror.variants) - registered
  // under every resolved file so the auto-generated ability preset lookup matches either one.
  ...presetFactory.create(spellFiles(SPELLS.Priest.PhysicalMirror), {
    name: SPELLS.Priest.PhysicalMirror.name,
    spell: {
      castOnSelf: true,
    },
    triggers: [],
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Priest.ProtectionFromEvil.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromEvil.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [
        {
          name: "CheckSpellState",
          params: [ScriptTarget.lastSeen, "PROTECTION_FROM_EVIL"],
          negation: true,
        },
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ProtectionFromGood.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromGood.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [
        {
          name: "CheckSpellState",
          params: [ScriptTarget.lastSeen, "PROTECTION_FROM_EVIL"],
          negation: true,
        },
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ProtectionFromGood10Radius.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromGood10Radius.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [
        {
          name: "CheckSpellState",
          params: [ScriptTarget.lastSeen, "PROTECTION_FROM_EVIL"],
          negation: true,
        },
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ProtectionFromEvil10Radius.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromEvil10Radius.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [
        {
          name: "CheckSpellState",
          params: [ScriptTarget.lastSeen, "PROTECTION_FROM_EVIL"],
          negation: true,
        },
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ShieldOfTheArchons.file,
    ability: {
      name: SPELLS.Priest.ShieldOfTheArchons.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Repulsion.file,
    ability: {
      name: SPELLS.Priest.Repulsion.name,
      spell: {
        castOnSelf: true,
      },
      triggers: [{ name: "Range", params: ["NearestEnemyOf", 10] }],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];

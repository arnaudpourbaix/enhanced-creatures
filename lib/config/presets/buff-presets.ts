import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY, PRESET_NAMES } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

export const BUFF_PRESETS: AbilityPreset[] = [
  ...presetFactory.createOrderedSpells([], {}),
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.MagicResistance,
      SPELLS.Wizard.NonDetection,
      SPELLS.Priest.Bless,
      SPELLS.Priest.ResistFear,
      SPELLS.Priest.Chant,
      SPELLS.Priest.Barkskin,
    ],
    {
      targets: CommonTargetLists.Allies,
    },
  ),
  ...presetFactory.createSpells(
    [SPELLS.Wizard.Shield, FNP_SPELLS.Priest.Shield, SPELLS.Wizard.FireShield],
    {
      triggers: [triggerFactory.checkStat(2, "SCRIPTINGSTATE5", true)],
    },
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.Vocalize, {
    triggers: [triggerFactory.stateCheck("STATE_SILENCED")],
    requireVocal: false,
    probability: 100,
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.Invisibility, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      triggerFactory.stateCheck("STATE_INVISIBLE", true),
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.ImprovedInvisibility, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      triggerFactory.stateCheck("STATE_IMPROVEDINVISIBILITY", true),
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.ShadowDoor, {
    triggers: [
      triggerFactory.stateCheck("STATE_IMPROVEDINVISIBILITY", true),
      triggerFactory.detect("NearestEnemyOf"),
      triggerFactory.hplt(75),
    ],
  }),
  ...presetFactory.createSpells([SPELLS.Priest.CircleOfBones, FNP_SPELLS.Priest.CircleOfBones], {
    triggers: [triggerFactory.checkSpellState("CIRCLE_OF_BONES", true)],
  }),
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
  ...presetFactory.createSpells([SPELLS.Wizard.MinorSpellDeflection], {
    triggers: triggerFactory.seeOneInTargetList("Spellcasters"),
  }),
  ...presetFactory.createSpells([SPELLS.Wizard.MirrorImages, SPELLS.Wizard.ReflectedImage], {}),
  {
    preset: SPELLS.Wizard.Haste.file,
    ability: {
      name: SPELLS.Wizard.Haste.name,
      spell: {
        castOnSelf: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ProtectionFromMissiles.file,
    ability: {
      name: SPELLS.Wizard.ProtectionFromMissiles.name,
      spell: {},
      triggers: [triggerFactory.checkSpellState("PROTECTION_FROM_NORMAL_MISSILES", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.MinorGlobeOfInvulnerability.file,
    ability: {
      name: SPELLS.Wizard.MinorGlobeOfInvulnerability.name,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  // ...presetFactory.create([SPELLS.Wizard.Stoneskin.file, SPELLS.Priest.Ironskin.file], {
  //   name: SPELLS.Wizard.Stoneskin.name,
  //   spell: {},
  //   triggers: [triggerFactory.checkStatLT(2, "STONESKINS")],
  //   requireVocal: true,
  //   probability: DEFAULT_SPELL_PROBABILITY,
  // }),
  {
    preset: SPELLS.Wizard.ProtectionFromMagicalWeapons.file,
    ability: {
      name: SPELLS.Wizard.ProtectionFromMagicalWeapons.name,
      spell: {},
      triggers: [triggerFactory.checkStatGT(0, "WIZARD_PROTECTION_FROM_MAGIC_WEAPONS", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Blur.file,
    ability: {
      name: SPELLS.Wizard.Blur.name,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.BladeBarrier.file,
    ability: {
      name: SPELLS.Priest.BladeBarrier.name,
      spell: {},
      triggers: [triggerFactory.checkStatGT(0, "CLERIC_BLADE_BARRIER", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RighteousMagic.file,
    ability: {
      name: SPELLS.Priest.RighteousMagic.name,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.HolyPower.file,
    ability: {
      name: SPELLS.Priest.HolyPower.name,
      spell: {},
      triggers: [triggerFactory.checkStatLT(100, "STR")],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  // Spell Revisions moves this to a different file (see ProtectionFromLightning.variants) -
  // registered under every resolved file so the auto-generated ability preset lookup matches
  // either one.
  // ...presetFactory.create(spellFiles(SPELLS.Priest.ProtectionFromLightning), {
  //   name: SPELLS.Priest.ProtectionFromLightning.name,
  //   spell: {
  //     castOnSelf: true,
  //   },
  //   triggers: [triggerFactory.checkStatLT(100, "RESISTELECTRICITY")],
  //   requireVocal: true,
  //   probability: DEFAULT_SPELL_PROBABILITY,
  // }),
  {
    preset: SPELLS.Priest.DrawUponHolyMight.file,
    ability: {
      name: SPELLS.Priest.DrawUponHolyMight.name,
      spell: {},
      triggers: [triggerFactory.checkStat(4, "SCRIPTINGSTATE6", true)],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Sanctuary.file,
    ability: {
      name: SPELLS.Priest.Sanctuary.name,
      spell: {},
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
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.DivineProtection.file,
    ability: {
      name: SPELLS.Priest.DivineProtection.name,
      spell: {},
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
      spell: {},
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
      spell: {},
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
  // ...presetFactory.create(spellFiles(SPELLS.Priest.PhysicalMirror), {
  //   name: SPELLS.Priest.PhysicalMirror.name,
  //   spell: {},
  //   triggers: [],
  //   requireVocal: true,
  //   probability: DEFAULT_SPELL_PROBABILITY,
  // }),
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
      spell: {},
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
      spell: {},
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
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Repulsion.file,
    ability: {
      name: SPELLS.Priest.Repulsion.name,
      spell: {},
      triggers: [{ name: "Range", params: ["NearestEnemyOf", 10] }],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];

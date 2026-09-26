import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { PRESET_NAMES } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

export const BUFF_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.Haste,
      SPELLS.Priest.MagicResistance,
      SPELLS.Wizard.NonDetection,
      SPELLS.Priest.Bless,
      SPELLS.Priest.FreeAction,
      SPELLS.Priest.ProtectionFromEvil,
      SPELLS.Priest.ProtectionFromGood,
      SPELLS.Priest.ProtectionFromGood10Radius,
      SPELLS.Priest.ProtectionFromEvil10Radius,
      SPELLS.Priest.ResistFear,
      SPELLS.Priest.Barkskin,
      SPELLS.Priest.Aid,
    ],
    {
      targets: CommonTargetLists.Allies,
    },
  ),
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.ArmorOfFaith,
      SPELLS.Priest.BladeBarrier,
      SPELLS.Wizard.Blur,
      SPELLS.Priest.Chant,
      SPELLS.Priest.CircleOfBones,
      FNP_SPELLS.Priest.CircleOfBones,
      SPELLS.Priest.DivineProtection,
      SPELLS.Priest.DrawUponHolyMight,
      SPELLS.Priest.EntropyShield,
      SPELLS.Wizard.FireShield,
      SPELLS.Priest.GreaterDivineProtection,
      SPELLS.Priest.HolyPower,
      SPELLS.Priest.Ironskin,
      SPELLS.Wizard.MirrorImages,
      SPELLS.Wizard.MinorGlobeOfInvulnerability,
      SPELLS.Wizard.NahalRecklessDweomer,
      SPELLS.Priest.PhysicalMirror,
      SPELLS.Priest.ProtectionFromLightning,
      SPELLS.Wizard.ProtectionFromMagicalWeapons,
      SPELLS.Wizard.ProtectionFromMissiles,
      SPELLS.Wizard.ReflectedImage,
      SPELLS.Priest.Repulsion,
      SPELLS.Priest.RighteousMagic,
      SPELLS.Priest.Sanctuary,
      SPELLS.Wizard.Shield,
      FNP_SPELLS.Priest.Shield,
      SPELLS.Priest.ShieldOfTheArchons,
      SPELLS.Wizard.Stoneskin,
    ],
    {},
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.Vocalize, {
    triggers: [triggerFactory.stateCheck("STATE_SILENCED")],
    requireVocal: false,
    probability: 100,
  }),
  ...presetFactory.createSpells([SPELLS.Wizard.MinorSpellDeflection], {
    triggers: triggerFactory.seeOneInTargetList("Spellcasters"),
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
  ...presetFactory.createSpell(SPELLS.Wizard.DimensionDoor, {
    targets: [
      {
        name: "Players",
        randomOrder: true,
      },
    ],
    range: 900,
  }),
  {
    preset: PRESET_NAMES.DimensionDoorOffscreen,
    ability: {
      name: SPELLS.Wizard.DimensionDoor.name,
      disableInterrupt: true,
      triggers: [
        triggerFactory.or([
          { name: "Range", params: ["NearestEnemyOf", 10] },
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
      actionsBefore: [
        {
          name: "CreateCreatureOffscreen", // Create a rat offscreen to teleport to
          params: ["RR#TRAT", 0],
        },
      ],
      actionsAfter: [{ name: "Wait", params: [1] }],
    },
  },
];

import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import { Triggers } from "../../src/model/script/triggers";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
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
          triggerFactory.checkStatGT(0, "CLERIC_FREE_ACTION"),
          triggerFactory.checkStatGT(0, "CLERIC_DEFENSIVE_HARMONY"),
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

const SPELL_REMOVAL_TARGET_LISTS: TargetList[] = [
  {
    name: "Spellcasters",
    includeStatus: ["Able"],
    randomOrder: true,
    triggers: [
      ...ExcludeUnwantedTargetsTriggers,
      triggerFactory.or([triggerFactory.hasBounceEffects(), triggerFactory.hasImmunityEffects()]),
    ],
  },
];

// The protections worth a Breach, as Stratagems picks them. Its own PRIORITY_BREACH state needs that
// mod, these don't. It can't remove spell protections, and Deflection, Turning and the like stop it.
// This one also hits the caster's side, and players: as in Stratagems, not while it would free one
const KEEP_PLAYERS_DISABLED: Triggers.Trigger[] = [1, 2, 3, 4, 5, 6].flatMap((n) => [
  { name: "StateCheck", params: [`Player${n}`, "STATE_DISABLED"], negation: true },
  { name: "CheckStatGT", params: [`Player${n}`, 0, "CLERIC_INSECT_PLAGUE"], negation: true },
  { name: "Allegiance", params: [`Player${n}`, "ENEMY"], negation: true },
]);

const BREACH_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    randomOrder: true,
    triggers: [
      ...ExcludeUnwantedTargetsTriggers,
      triggerFactory.checkStat(1, "WIZARD_SPELL_IMMUNITY", true),
      triggerFactory.or([
        triggerFactory.checkStatGT(0, "STONESKINS"),
        triggerFactory.checkStatGT(0, "CLERIC_CHAOTIC_COMMANDS"),
        triggerFactory.checkStatGT(0, "WIZARD_PROTECTION_FROM_MAGIC_ENERGY"),
        triggerFactory.checkStatGT(0, "WIZARD_PROTECTION_FROM_MAGIC_WEAPONS"),
        { name: "CheckSpellState", params: [ScriptTarget.token, "DEATH_WARD"] },
      ]),
    ],
  },
];

export const DISPEL_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.TrueSeeing,
      SPELLS.Wizard.DetectInvisibility,
      SPELLS.Wizard.TrueSeeing,
      SPELLS.Wizard.Oracle,
      SPELLS.Wizard.DetectIllusion,
      SPELLS.Priest.InvisibilityPurge,
      FNP_SPELLS.Priest.TrueSeeing,
    ],
    {
      triggers: [triggerFactory.detect("PC"), triggerFactory.see("PC", true)],
    },
  ),
  ...presetFactory.createSpell(SPELLS.Innate.MoonDogSight, {
    spell: {
      castOnSelf: true,
    },
    triggers: [triggerFactory.detect("PC")],
    requireVocal: false,
  }),
  ...presetFactory.createSpells([SPELLS.Priest.DispelMagic, SPELLS.Wizard.RemoveMagic], {
    targets: DISPEL_TARGET_LISTS,
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.DispelMagic, {
    triggers: KEEP_PLAYERS_DISABLED,
    targets: DISPEL_TARGET_LISTS,
  }),
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.KhelbensWardingWhip,
      SPELLS.Wizard.SpellThrust,
      SPELLS.Wizard.PierceMagic,
      SPELLS.Wizard.PierceShield,
      SPELLS.Wizard.RubyRayOfReversal,
      SPELLS.Wizard.SecretWord,
      SPELLS.Wizard.Spellstrike,
    ],
    {
      targets: SPELL_REMOVAL_TARGET_LISTS,
    },
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.Breach, {
    targets: BREACH_TARGET_LISTS,
  }),
  ...presetFactory.createSpells([SPELLS.Priest.DetectEvil, SPELLS.Priest.FindTraps], {
    triggers: [{ name: "False" }], // leave it as a manual cast
  }),
];

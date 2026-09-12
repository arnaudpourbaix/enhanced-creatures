import { AbilityPreset } from "../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "./common";
import { SPELLS } from "./spells/spell-names";
import { BUFF_PRESETS } from "./presets/buff-presets";
import { CHARM_PRESETS } from "./presets/charm-presets";
import { CONFUSION_PRESETS } from "./presets/confusion-presets";
import { CURE_PRESETS } from "./presets/cure-presets";
import { DAMAGE_AOE_PRESETS } from "./presets/damage-aoe-presets";
import { DAMAGE_PRESETS } from "./presets/damage-presets";
import { DEATH_PRESETS } from "./presets/death-presets";
import { DEBUFF_PRESETS } from "./presets/debuff-presets";
import { DISABLING_PRESETS } from "./presets/disabling-presets";
import { DISPEL_PRESETS } from "./presets/dispel-presets";
import { FEAR_PRESETS } from "./presets/fear-presets";
import { HOLD_PRESETS } from "./presets/hold-presets";
import { KIT_PRESETS } from "./presets/kit-presets";
import { SLEEP_PRESETS } from "./presets/sleep-presets";
import { SUMMON_PRESETS } from "./presets/summon-presets";

// Spells from SPELLS with no preset defined yet.
// TODO: fill in targets/triggers/spell for each, then move it to the appropriate presets/*.ts
// file and delete it here.
const NEW_PRESETS: AbilityPreset[] = [
  // Wizard
  {
    preset: SPELLS.Wizard.BigbyIcyGrasp.file,
    ability: {
      name: SPELLS.Wizard.BigbyIcyGrasp.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ColorSpray.file,
    ability: {
      name: SPELLS.Wizard.ColorSpray.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Feeblemind.file,
    ability: {
      name: SPELLS.Wizard.Feeblemind.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.FleshToStone.file,
    ability: {
      name: SPELLS.Wizard.FleshToStone.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.NahalRecklessDweomer.file,
    ability: {
      name: SPELLS.Wizard.NahalRecklessDweomer.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.PolymorphSelf.file,
    ability: {
      name: SPELLS.Wizard.PolymorphSelf.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ReflectedImage.file,
    ability: {
      name: SPELLS.Wizard.ReflectedImage.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ShapeshiftMustardJelly.file,
    ability: {
      name: SPELLS.Wizard.ShapeshiftMustardJelly.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },

  // Priest
  {
    preset: SPELLS.Priest.Aid.file,
    ability: {
      name: SPELLS.Priest.Aid.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimalSummoning1.file,
    ability: {
      name: SPELLS.Priest.AnimalSummoning1.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimalSummoning2.file,
    ability: {
      name: SPELLS.Priest.AnimalSummoning2.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimalSummoning3.file,
    ability: {
      name: SPELLS.Priest.AnimalSummoning3.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimalSummoning5.file,
    ability: {
      name: SPELLS.Priest.AnimalSummoning5.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimalSummoning6.file,
    ability: {
      name: SPELLS.Priest.AnimalSummoning6.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimalSummoning7.file,
    ability: {
      name: SPELLS.Priest.AnimalSummoning7.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimateSkeletonWarrior.file,
    ability: {
      name: SPELLS.Priest.AnimateSkeletonWarrior.name,
      spell: {},
      triggers: [],
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
    preset: SPELLS.Priest.Banishment.file,
    ability: {
      name: SPELLS.Priest.Banishment.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.BlindingBeauty.file,
    ability: {
      name: SPELLS.Priest.BlindingBeauty.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.BoltOfGlory.file,
    ability: {
      name: SPELLS.Priest.BoltOfGlory.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.CauseDisease.file,
    ability: {
      name: SPELLS.Priest.CauseDisease.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.CauseModerateWounds.file,
    ability: {
      name: SPELLS.Priest.CauseModerateWounds.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.CircleOfBones.file,
    ability: {
      name: SPELLS.Priest.CircleOfBones.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Contagion.file,
    ability: {
      name: SPELLS.Priest.Contagion.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Curse.file,
    ability: {
      name: SPELLS.Priest.Curse.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Destruction.file,
    ability: {
      name: SPELLS.Priest.Destruction.name,
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
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.GreaterDivineProtection.file,
    ability: {
      name: SPELLS.Priest.GreaterDivineProtection.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.EnergyDrain.file,
    ability: {
      name: SPELLS.Priest.EnergyDrain.name,
      spell: {},
      triggers: [],
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
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.HolySmite.file,
    ability: {
      name: SPELLS.Priest.HolySmite.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.HolyWord.file,
    ability: {
      name: SPELLS.Priest.HolyWord.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.UnholyWord.file,
    ability: {
      name: SPELLS.Priest.UnholyWord.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.PhysicalMirror.file,
    ability: {
      name: SPELLS.Priest.PhysicalMirror.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ProtectionFromEvil.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromEvil.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ProtectionFromGood.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromGood.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.ProtectionFromGood10Radius.file,
    ability: {
      name: SPELLS.Priest.ProtectionFromGood10Radius.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateLightWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateLightWounds.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateModerateWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateModerateWounds.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateSeriousWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateSeriousWounds.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateCriticalWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateCriticalWounds.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Regeneration.file,
    ability: {
      name: SPELLS.Priest.Regeneration.name,
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
      triggers: [],
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
    preset: SPELLS.Priest.SpiritualHammer.file,
    ability: {
      name: SPELLS.Priest.SpiritualHammer.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SummonDeathKnight.file,
    ability: {
      name: SPELLS.Priest.SummonDeathKnight.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SymbolHopelessness.file,
    ability: {
      name: SPELLS.Priest.SymbolHopelessness.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SymbolPain.file,
    ability: {
      name: SPELLS.Priest.SymbolPain.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SymbolStunning.file,
    ability: {
      name: SPELLS.Priest.SymbolStunning.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SymbolWeakness.file,
    ability: {
      name: SPELLS.Priest.SymbolWeakness.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];

export const ABILITY_PRESETS: AbilityPreset[] = [
  ...BUFF_PRESETS,
  ...KIT_PRESETS,
  ...CHARM_PRESETS,
  ...CONFUSION_PRESETS,
  ...CURE_PRESETS,
  ...DAMAGE_PRESETS,
  ...DAMAGE_AOE_PRESETS,
  ...DEATH_PRESETS,
  ...DEBUFF_PRESETS,
  ...DISABLING_PRESETS,
  ...DISPEL_PRESETS,
  ...FEAR_PRESETS,
  ...HOLD_PRESETS,
  ...SLEEP_PRESETS,
  ...SUMMON_PRESETS,
  ...NEW_PRESETS,
];

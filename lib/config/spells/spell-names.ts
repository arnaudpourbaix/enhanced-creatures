import { StringReference } from "../../src/model/final/stringref";
import { SpellIdentifier } from "../../src/model/ids/spell";

export interface SpellReference {
  file: string;
  id?: SpellIdentifier;
  /** Translation key for this spell's display name when used as an ability, e.g. "spell.Vocalize.name" */
  name?: StringReference;
  duration?:
    | "long" // several hours
    | "mid" // several turns
    | "short"; // several rounds to one turn
}

// Shared by RemoveMagic (wizard), DispelMagic (wizard), and DispelMagic (cleric) below - all
// three display the same in-game name.
const DISPEL_MAGIC_NAME = "spell.DispelMagic.name";

const WIZARD_SPELLS = {
  AgannazarScorcher: {
    file: "SPWI217",
    id: "WIZARD_AGANNAZAR_SCORCHER",
    name: "spell.AgannazarScorcher.name",
  },
  BigbyIcyGrasp: {
    file: "SPWI818",
    id: "WIZARD_BIGBYS_ICY_GRASP",
    name: "spell.BigbyIcyGrasp.name",
  },
  Blur: { file: "SPWI201", id: "WIZARD_BLUR", duration: "mid", name: "spell.Blur.name" },
  Breach: { file: "SPWI513", id: "WIZARD_BREACH", name: "spell.Breach.name" },
  BurningHands: { file: "SPWI103", id: "WIZARD_BURNING_HANDS", name: "spell.BurningHands.name" },
  ChainLightning: {
    file: "SPWI615",
    id: "WIZARD_CHAIN_LIGHTNING",
    name: "spell.ChainLightning.name",
  },
  CharmPerson: { file: "SPWI104", id: "WIZARD_CHARM_PERSON", name: "spell.CharmPerson.name" },
  ChromaticOrb: { file: "SPWI118", id: "WIZARD_CHROMATIC_ORB", name: "spell.ChromaticOrb.name" },
  Cloudkill: { file: "SPWI502", id: "WIZARD_CLOUDKILL", name: "spell.Cloudkill.name" },
  ColorSpray: { file: "SPWI105", id: "WIZARD_COLOR_SPRAY", name: "spell.colorSpray.name" },
  Combust: { file: "SPWI232", id: "WIZARD_COMBUST", name: "spell.Combust.name" },
  ConeOfCold: { file: "SPWI503", id: "WIZARD_CONE_OF_COLD", name: "spell.coneOfCold.name" },
  Confusion: { file: "SPWI401", id: "WIZARD_CONFUSION", name: "spell.Confusion.name" },
  DancingLights: { file: "SPWI126", id: "WIZARD_DANCING_LIGHTS", name: "spell.DancingLights.name" },
  Darkness15Radius: {
    file: "SPWI228",
    id: "WIZARD_DARKNESS_15_FOOT",
    name: "spell.Darkness15Radius.name",
  },
  DetectInvisibility: {
    file: "SPWI203",
    id: "WIZARD_DETECT_INVISIBILITY",
    name: "spell.DetectInvisibility.name",
  },
  DireCharm: { file: "SPWI316", id: "WIZARD_DIRE_CHARM", name: "spell.DireCharm.name" },
  DimensionDoor: {
    file: "SPWI402",
    id: "WIZARD_DIMENSION_DOOR",
    name: "spell.dimensionDoor.name",
  },
  DispelMagic: {
    file: "SPWI326",
    id: "WIZARD_TRUE_DISPEL_MAGIC",
    name: DISPEL_MAGIC_NAME,
  },
  Domination: { file: "SPWI506", id: "WIZARD_DOMINATION", name: "spell.Domination.name" },
  Emotion: {
    file: "SPWI411",
    id: "WIZARD_EMOTION_HOPELESSNESS",
    name: "spell.Emotion.name",
  },
  Feeblemind: { file: "SPWI509", id: "WIZARD_FEEBLEMIND", name: "spell.Feeblemind.name" },
  Fireburst: { file: "SPWI523", id: "WIZARD_SUN_FIRE", name: "spell.Fireburst.name" },
  FireShield: {
    file: "SPWI418",
    id: "WIZARD_FIRE_SHIELD_RED",
    duration: "short",
    name: "spell.FireShield.name",
  },
  FlameArrow: { file: "SPWI303", id: "WIZARD_FLAME_ARROW", name: "spell.FlameArrow.name" },
  FleshToStone: { file: "SPWI604", id: "WIZARD_FLESH_TO_STONE", name: "spell.FleshToStone.name" },
  Glitterdust: { file: "SPWI224", id: "WIZARD_GLITTERDUST", name: "spell.Glitterdust.name" },
  GreaterMalison: {
    file: "SPWI412",
    id: "WIZARD_GREATER_MALISON",
    name: "spell.GreaterMalison.name",
  },
  Haste: { file: "SPWI305", id: "WIZARD_HASTE", duration: "mid", name: "spell.Haste.name" },
  HoldPerson: {
    file: "SPWI306",
    id: "WIZARD_HOLD_PERSON",
    name: "spell.HoldPerson.name",
  },
  Horror: { file: "SPWI205", id: "WIZARD_HORROR", name: "spell.Horror.name" },
  IceStorm: { file: "SPWI404", id: "WIZARD_ICE_STORM", name: "spell.IceStorm.name" },
  ImprovedInvisibility: {
    file: "SPWI405",
    id: "WIZARD_IMPROVED_INVISIBILITY",
    duration: "short",
    name: "spell.ImprovedInvisibility.name",
  },
  Invisibility: {
    file: "SPWI206",
    id: "WIZARD_INVISIBILITY",
    name: "spell.Invisibility.name",
  },
  LightningBolt: {
    file: "SPWI308",
    id: "WIZARD_LIGHTNING_BOLT",
    name: "spell.LightningBolt.name",
  },
  MagicMissiles: {
    file: "SPWI112",
    id: "WIZARD_MAGIC_MISSILE",
    name: "spell.MagicMissiles.name",
  },
  MelfAcidArrow: {
    file: "SPWI211",
    id: "WIZARD_MELF_ACID_ARROW",
    name: "spell.MelfAcidArrow.name",
  },
  MinorGlobeOfInvulnerability: {
    file: "SPWI406",
    id: "WIZARD_MINOR_GLOBE_OF_INVULNERABILITY",
    duration: "mid",
    name: "spell.MinorGlobeOfInvulnerability.name",
  },
  MinorSpellDeflection: {
    file: "SPWI318",
    id: "WIZARD_MINOR_SPELL_DEFLECTION",
    duration: "mid",
    name: "spell.MinorSpellDeflection.name",
  },
  MirrorImages: {
    file: "SPWI212",
    id: "WIZARD_MIRROR_IMAGE",
    duration: "mid",
    name: "spell.MirrorImages.name",
  },
  MordenkainenForceMissiles: {
    file: "SPWI431",
    id: "WIZARD_MORDENKAINENS_FORCE_MISSILES",
    name: "spell.MordenkainenForceMissiles.name",
  },
  NahalRecklessDweomer: {
    file: "SPWI124",
    id: "WIZARD_NAHALS_RECKLESS_DWEOMER",
    name: "spell.NahalRecklessDweomer.name",
  },
  NonDetection: {
    file: "SPWI310",
    id: "WIZARD_NON_DETECTION",
    name: "spell.NonDetection.name",
  },
  ObscuringMist: {
    file: "SPWI106",
    id: "WIZARD_OBSCURING_MIST",
    name: "spell.ObscuringMist.name",
  },
  PolymorphSelf: { file: "SPWI416", id: "WIZARD_POLYMORPH_SELF", name: "spell.PolymorphSelf.name" },
  PowerWordSleep: {
    file: "SPWI220",
    id: "WIZARD_POWER_WORD_SLEEP",
    name: "spell.PowerWordSleep.name",
  },
  PowerWordBlind: {
    file: "SPWI815",
    id: "WIZARD_POWER_WORD_BLIND",
    name: "spell.PowerWordBlind.name",
  },
  PowerWordKill: {
    file: "SPWI912",
    id: "WIZARD_POWER_WORD_KILL",
    name: "spell.PowerWordKill.name",
  },
  PowerWordStun: {
    file: "SPWI715",
    id: "WIZARD_POWER_WORD_STUN",
    name: "spell.PowerWordStun.name",
  },
  ProtectionFromMissiles: {
    file: "SPWI311",
    id: "WIZARD_PROTECTION_FROM_NORMAL_MISSILES",
    duration: "short",
    name: "spell.ProtectionFromMissiles.name",
  },
  ProtectionFromMagicalWeapons: {
    file: "SPWI611",
    id: "WIZARD_PROTECTION_FROM_MAGIC_WEAPONS",
    duration: "short",
    name: "spell.ProtectionFromMagicalWeapons.name",
  },
  RemoveMagic: {
    file: "SPWI302",
    id: "WIZARD_REMOVE_MAGIC",
    name: DISPEL_MAGIC_NAME,
  },
  ReflectedImage: {
    file: "SPWI120",
    id: "WIZARD_REFLECTED_IMAGE",
    name: "spell.ReflectedImage.name",
  },
  ShapeshiftMustardJelly: {
    file: "SPWI496",
    id: "WIZARD_POLYMORPH_MUSTARD_JELLY",
    name: "spell.ShapeshiftMustardJelly.name",
  },
  Shades: {
    file: "SPWI632",
    id: "WIZARD_SHADES",
    name: "spell.Shades.name",
  },
  Shield: {
    file: "SPWI114",
    id: "WIZARD_SHIELD",
    duration: "mid",
    name: "spell.Shield.name",
  },
  ShadowDoor: { file: "SPWI505", id: "WIZARD_SHADOW_DOOR", name: "spell.ShadowDoor.name" },
  Sleep: { file: "SPWI116", id: "WIZARD_SLEEP", name: "spell.Sleep.name" },
  Slow: { file: "SPWI312", id: "WIZARD_SLOW", name: "spell.Slow.name" },
  SpellThrust: { file: "SPWI321", id: "WIZARD_SPELL_THRUST", name: "spell.SpellThrust.name" },
  Spook: { file: "SPWI125", id: "WIZARD_SPOOK", name: "spell.Spook.name" },
  StinkingCloud: {
    file: "SPWI213",
    id: "WIZARD_STINKING_CLOUD",
    name: "spell.StinkingCloud.name",
  },
  Stoneskin: {
    file: "SPWI408",
    id: "WIZARD_STONE_SKIN",
    duration: "long",
    name: "spell.Stoneskin.name",
  },
  TeleportField: {
    file: "SPWI421",
    id: "WIZARD_TELEPORT_FIELD",
    name: "spell.TeleportField.name",
  },
  VitriolicSphere: {
    file: "SPWI426",
    id: "WIZARD_VITRIOLIC_SPHERE",
    name: "spell.VitriolicSphere.name",
  },
  Vocalize: {
    file: "SPWI219",
    id: "WIZARD_VOCALIZE",
    duration: "short",
    name: "spell.Vocalize.name",
  },
  WailOfTheBanshee: {
    file: "SPWI913",
    id: "WIZARD_WAIL_OF_THE_BANSHEE",
    name: "spell.WailOfTheBanshee.name",
  },
  Web: { file: "SPWI215", id: "WIZARD_WEB", name: "spell.Web.name" },
} satisfies Record<string, SpellReference>;

const PRIEST_SPELLS = {
  Aid: {
    file: "SPPR201",
    id: "CLERIC_AID",
    name: "spell.Aid.name",
    duration: "mid",
  },
  AerialServant: {
    file: "SPPR601",
    id: "CLERIC_AERIAL_SERVANT",
    name: "spell.AerialServant.name",
    duration: "mid",
  },
  AnimalSummoning1: {
    file: "SPPR122",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_1",
    name: "spell.AnimalSummoning1.name",
  },
  AnimalSummoning2: {
    file: "SPPR221",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_2",
    name: "spell.AnimalSummoning2.name",
  },
  AnimalSummoning3: {
    file: "SPPR321",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_3",
    name: "spell.AnimalSummoning3.name",
  },
  AnimalSummoning4: {
    file: "SPPR402",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_4",
    name: "spell.AnimalSummoning4.name",
  },
  AnimalSummoning5: {
    file: "SPPR501",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_5",
    name: "spell.AnimalSummoning5.name",
  },
  AnimalSummoning6: {
    file: "SPPR602",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_6",
    name: "spell.AnimalSummoning6.name",
  },
  AnimalSummoning7: {
    file: "SPPR733",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_7",
    name: "spell.AnimalSummoning7.name",
  },
  AnimateDead: {
    file: "SPPR301",
    id: "CLERIC_ANIMATE_DEAD",
    name: "spell.AnimateDead.name",
    duration: "long",
  },
  AnimateSkeletonWarrior: {
    file: "SPPR619",
    id: "CLERIC_ANIMATE_SKELETON_WARRIOR",
    name: "spell.AnimateSkeletonWarrior.name",
    duration: "long",
  },
  ArmorOfFaith: {
    file: "SPPR111",
    id: "CLERIC_ARMOR_OF_FAITH",
    name: "spell.ArmorOfFaith.name",
    duration: "mid",
  },
  Banishment: {
    file: "SPPR616",
    id: "CLERIC_BANISHMENT",
    name: "spell.Banishment.name",
  },
  Barkskin: {
    file: "SPPR202",
    id: "CLERIC_BARKSKIN",
    name: "spell.Barkskin.name",
    duration: "mid",
  },
  BladeBarrier: {
    file: "SPPR603",
    id: "CLERIC_BLADE_BARRIER",
    duration: "short",
    name: "spell.BladeBarrier.name",
  },
  Bless: { file: "SPPR101", id: "CLERIC_BLESS", duration: "mid", name: "spell.Bless.name" },
  BlindingBeauty: {
    file: "SPPR704",
    id: "CLERIC_NATURE_BEAUTY",
    name: "spell.BlindingBeauty.name",
  },
  BoltOfGlory: {
    file: "SPPR612",
    id: "CLERIC_BOLT_OF_GLORY",
    name: "spell.BoltOfGlory.name",
  },
  CallLightning: {
    file: "SPPR302",
    id: "CLERIC_CALL_LIGHTNING",
    name: "spell.CallLightning.name",
  },
  CauseDisease: {
    file: "SPPR329",
    id: "CLERIC_CAUSE_DISEASE",
    name: "spell.CauseDisease.name",
  },
  CauseLightWounds: {
    file: "SPPR121",
    id: "CLERIC_CAUSE_LIGHT_WOUNDS",
    name: "spell.CauseLightWounds.name",
  },
  CauseModerateWounds: {
    file: "SPPR220",
    id: "CLERIC_CAUSE_MODERATE_WOUNDS",
    name: "spell.CauseModerateWounds.name",
  },
  CauseSeriousWounds: {
    file: "SPPR414",
    id: "CLERIC_CAUSE_SERIOUS_WOUNDS",
    name: "spell.CauseSeriousWounds.name",
  },
  CallWoodlandBeeings: {
    file: "SPPR410",
    id: "CLERIC_CALL_WOODLAND_BEINGS",
    name: "spell.callWoodlandBeeings.name",
  },
  CloudOfPestilence: {
    file: "SPPR424",
    id: "CLERIC_CLOUD_OF_PESTILENCE",
    name: "spell.CloudOfPestilence.name",
  },
  Chant: {
    file: "SPPR203",
    id: "CLERIC_CHANT",
    name: "spell.Chant.name",
    duration: "short",
  },
  Chaos: { file: "SPPR709", id: "CLERIC_CONFUSION", name: "spell.Chaos.name" },
  CharmPersonOrAnimal: {
    file: "SPPR204",
    id: "CLERIC_CHARM_PERSON",
    name: "spell.CharmPersonOrAnimal.name",
  },
  CircleOfBones: {
    file: "SPPR332",
    id: "CLERIC_CIRCLE_OF_BONES",
    name: "spell.CircleOfBones.name",
    duration: "short",
  },
  CloakOfFear: { file: "SPPR416", id: "CLERIC_CLOAK_OF_FEAR", name: "spell.CloakOfFear.name" },
  Command: { file: "SPPR102", id: "CLERIC_COMMAND", name: "spell.Command.name" },
  Contagion: { file: "SPPR102", id: "CLERIC_CONTAGION", name: "spell.Contagion.name" },
  CureLightWounds: {
    file: "SPPR103",
    id: "CLERIC_CURE_LIGHT_WOUNDS",
    name: "spell.CureLightWounds.name",
  },
  Curse: {
    file: "SPPR124",
    id: "CLERIC_CURSE",
    name: "spell.Curse.name",
  },
  Destruction: {
    file: "SPPR737",
    id: "CLERIC_DESTRUCTION",
    name: "spell.Destruction.name",
  },
  DetectEvil: {
    file: "SPPR104",
    id: "CLERIC_DETECT_EVIL",
    name: "spell.DetectEvil.name",
  },
  DispelMagic: {
    file: "SPPR303",
    id: "CLERIC_DISPEL_MAGIC",
    name: DISPEL_MAGIC_NAME,
  },
  DivineProtection: {
    file: "SPPR527",
    id: "CLERIC_SHIELD_OF_LATHANDER",
    name: "spell.DivineProtection.name",
  },
  GreaterDivineProtection: {
    file: "SPPR738",
    id: "CLERIC_GREATER_SHIELD_OF_LATHANDER",
    name: "spell.GreaterDivineProtection.name",
  },
  DolorousDecay: {
    file: "SPPR610",
    id: "CLERIC_DOLOROUS_DECAY",
    name: "spell.DolorousDecay.name",
  },
  Doom: { file: "SPPR113", id: "CLERIC_DOOM", name: "spell.Doom.name" },
  DrawUponHolyMight: {
    file: "SPPR214",
    id: "CLERIC_DRAW_UPON_HOLY_MIGHT",
    name: "spell.DrawUponHolyMight.name",
    duration: "short",
  },
  EnergyDrain: { file: "SPPR714", id: "CLERIC_ENERGY_DRAIN", name: "spell.EnergyDrain.name" },
  Entangle: { file: "SPPR105", id: "CLERIC_ENTANGLE", name: "spell.Entangle.name" },
  EntropyShield: {
    file: "SPPR620",
    id: "CLERIC_ENTROPY_SHIELD",
    name: "spell.EntropyShield.name",
    duration: "short",
  },
  FindTraps: { file: "SPPR205", id: "CLERIC_FIND_TRAPS", name: "spell.FindTraps.name" },
  FingerOfDeath: {
    file: "SPPR708",
    id: "CLERIC_FINGER_OF_DEATH",
    name: "spell.FingerOfDeath.name",
  },
  FlameStrike: { file: "SPPR503", id: "CLERIC_FLAME_STRIKE", name: "spell.FlameStrike.name" },
  FreeAction: {
    file: "SPPR403",
    id: "CLERIC_FREE_ACTION",
    name: "spell.FreeAction.name",
    duration: "mid",
  },
  GlyphOfWarding: {
    file: "SPPR304",
    id: "CLERIC_GLYPH_OF_WARDING",
    name: "spell.GlyphOfWarding.name",
  },
  GreaterCommand: {
    file: "SPPR512",
    id: "CLERIC_GREATER_COMMAND",
    name: "spell.GreaterCommand.name",
  },
  Harm: { file: "SPPR608", id: "CLERIC_HARM", name: "spell.Harm.name" },
  HoldPerson: {
    file: "SPPR208",
    id: "CLERIC_HOLD_PERSON",
    name: "spell.HoldPerson.name",
  },
  HoldPersonOrAnimal: {
    file: "SPPR305",
    id: "CLERIC_HOLD_ANIMAL",
    name: "spell.HoldPersonOrAnimal.name",
  },
  HolyPower: {
    file: "SPPR412",
    id: "CLERIC_HOLY_POWER",
    duration: "short",
    name: "spell.HolyPower.name",
  },
  HolySmite: {
    file: "SPPR313",
    id: "CLERIC_HOLY_SMITE",
    name: "spell.HolySmite.name",
  },
  HolyWord: {
    file: "SPPR710",
    id: "CLERIC_HOLY_WORD",
    name: "spell.HolyWord.name",
  },
  UnholyWord: {
    file: "SPPR715",
    id: "CLERIC_UNHOLY_WORD",
    name: "spell.UnholyWord.name",
  },
  Ironskin: {
    file: "SPPR506",
    id: "CLERIC_IRONSKIN",
    duration: "long",
    name: "spell.Ironskin.name",
  },
  MagicResistance: {
    file: "SPPR509",
    id: "CLERIC_MAGIC_RESISTANCE",
    name: "spell.MagicResistance.name",
    duration: "short",
  },
  MassCauseLightWounds: {
    file: "SPPR530",
    id: "CLERIC_MASS_CAUSE_LIGHT_WOUNDS",
    name: "spell.MassCauseLightWounds.name",
  },
  MentalDomination: {
    file: "SPPR405",
    id: "CLERIC_MENTAL_DOMINATION",
    name: "spell.MentalDomination.name",
  },
  MiscastMagic: {
    file: "SPPR310",
    id: "CLERIC_MISCAST_MAGIC",
    name: "spell.MiscastMagic.name",
  },
  Poison: { file: "SPPR411", id: "CLERIC_POISON", name: "spell.Poison.name" },
  PhysicalMirror: {
    file: "SPPR531",
    id: "CLERIC_PHYSICAL_MIRROR",
    name: "spell.PhysicalMirror.name",
  },
  ProtectionFromEvil: {
    file: "SPPR107",
    id: "CLERIC_PROTECT_FROM_EVIL",
    name: "spell.ProtectionFromEvil.name",
    duration: "short",
  },
  ProtectionFromGood: {
    file: "SPPR125",
    id: "CLERIC_PROTECT_FROM_GOOD",
    name: "spell.ProtectionFromGood.name",
    duration: "short",
  },
  ProtectionFromGood10Radius: {
    file: "SPPR431",
    id: "CLERIC_PROTECTION_FROM_GOOD_10_FOOT",
    name: "spell.ProtectionFromGood10Radius.name",
    duration: "mid",
  },
  ProtectionFromLightning: {
    file: "SPPR407",
    id: "CLERIC_PROTECTION_FROM_LIGHTNING",
    name: "spell.ProtectionFromLightning.name",
    duration: "mid",
  },
  RegenerateLightWounds: {
    file: "SPPR119",
    id: "CLERIC_REGENERATE_LIGHT_WOUNDS",
    name: "spell.RegenerateLightWounds.name",
  },
  RegenerateModerateWounds: {
    file: "SPPR218",
    id: "CLERIC_REGENERATE_MODERATE_WOUNDS",
    name: "spell.RegenerateModerateWounds.name",
  },
  RegenerateSeriousWounds: {
    file: "SPPR324",
    id: "CLERIC_REGENERATE_SERIOUS_WOUNDS",
    name: "spell.RegenerateSeriousWounds.name",
  },
  RegenerateCriticalWounds: {
    file: "SPPR419",
    id: "CLERIC_REGENERATE_CRITICAL_WOUNDS",
    name: "spell.RegenerateCriticalWounds.name",
  },
  Regeneration: {
    file: "SPPR711",
    id: "CLERIC_REGENERATE",
    name: "spell.Regeneration.name",
  },
  Repulsion: {
    file: "SPPR515",
    id: "CLERIC_REPULSION",
    name: "spell.Repulsion.name",
  },
  ResistFear: {
    file: "SPPR108",
    id: "CLERIC_REMOVE_FEAR",
    name: "spell.ResistFear.name",
    duration: "mid",
  },
  RighteousMagic: {
    file: "SPPR513",
    id: "CLERIC_RIGHTEOUS_MAGIC",
    name: "spell.RighteousMagic.name",
    duration: "short",
  },
  RigidThinking: {
    file: "SPPR311",
    id: "CLERIC_RIGID_THINKING",
    name: "spell.RigidThinking.name",
  },
  Sanctuary: {
    file: "SPPR109",
    id: "CLERIC_SANCTUARY",
    name: "spell.Sanctuary.name",
    duration: "short",
  },
  ShieldOfTheArchons: {
    file: "SPPR701",
    id: "CLERIC_SHIELD_OF_THE_ARCHONS",
    name: "spell.ShieldOfTheArchons.name",
  },
  Silence: { file: "SPPR211", id: "CLERIC_SILENCE_15_FOOT", name: "spell.Silence.name" },
  SlayLiving: { file: "SPPR511", id: "CLERIC_SLAY_LIVING", name: "spell.SlayLiving.name" },
  SpiritualHammer: {
    file: "SPPR213",
    id: "CLERIC_SPIRITUAL_HAMMER",
    name: "spell.SpiritualHammer.name",
  },
  SummonDeathKnight: {
    file: "SPPR703",
    id: "CLERIC_SUMMON_DEATH_KNIGHT",
    name: "spell.SummonDeathKnight.name",
    duration: "mid",
  },
  SummonInsects: {
    file: "SPPR319",
    id: "CLERIC_SUMMON_INSECTS",
    name: "spell.SummonInsects.name",
  },
  SymbolDeath: { file: "SPPR719", id: "CLERIC_SYMBOL_DEATH", name: "spell.SymbolDeath.name" },
  SymbolHopelessness: {
    file: "SPPR735",
    id: "CLERIC_SYMBOL_HOPELESSNESS",
    name: "spell.SymbolHopelessness.name",
  },
  SymbolPain: { file: "SPPR734", id: "CLERIC_SYMBOL_PAIN", name: "spell.SymbolPain.name" },
  SymbolStunning: { file: "SPPR718", id: "CLERIC_SYMBOL_STUN", name: "spell.SymbolStunning.name" },
  SymbolWeakness: {
    file: "SPPR706",
    id: "CLERIC_SYMBOL_WEAKNESS",
    name: "spell.SymbolWeakness.name",
  },
  TrueSeeing: { file: "SPPR505", id: "CLERIC_TRUE_SIGHT", name: "spell.TrueSeeing.name" },
  UnholyBlight: { file: "SPPR314", id: "CLERIC_UNHOLY_BLIGHT", name: "spell.UnholyBlight.name" },
  WavesOfAgony: { file: "SPPR533", id: "CLERIC_WAVES_OF_AGONY", name: "spell.WavesOfAgony.name" },
  Wither: { file: "SPPR740", id: "CLERIC_WITHER", name: "spell.Wither.name" },
} satisfies Record<string, SpellReference>;

const INNATE_SPELLS = {
  MephitColorSpray: {
    file: "SPIN937",
    id: "MEPHIT_COLOR_SPRAY",
    name: "spell.MephitColorSpray.name",
  },
  HealingLick: { file: "SPIN699", name: "spell.HealingLick.name" },
  MoonDogSight: { file: "SPIN696", name: "spell.MoonDogSight.name", id: "MOON_DOG_HOWL" },
  MoonDogHowl: { file: "SPIN891", name: "spell.MoonDogHowl.name", id: "MOON_DOG_FEAR" },
  SpiderSingleTargetWeb: { file: "BDSPIDGA", name: "spell.SpiderSingleTargetWeb.name" },
  VortexWeb: { file: "SPIN575", id: "VORTEX_WEB", name: "spell.VortexWeb.name" },
} satisfies Record<string, SpellReference>;

const CLASS_SPELLS = {
  BerserkerRage: { file: "SPCL321", id: "BERSERKER_RAGE", name: "spell.BerserkerRage.name" },
  BarbarianRage: { file: "SPCL152", id: "BARBARIAN_RAGE", name: "spell.BarbarianRage.name" },
  OffensiveSpin: { file: "SPCL521", id: "BLADE_OFFENSIVE_SPIN", name: "spell.OffensiveSpin.name" },
  SummonSpiritAnimal: { file: "SPCL621", name: "spell.SummonSpiritAnimal.name" },
} satisfies Record<string, SpellReference>;

export const SPELLS = {
  Wizard: WIZARD_SPELLS,
  Priest: PRIEST_SPELLS,
  Class: CLASS_SPELLS,
  Innate: INNATE_SPELLS,
};

function flattenSpells(
  spells: Record<string, SpellReference>,
): (SpellReference & { key: string })[] {
  return Object.entries(spells).map(([key, spell]) => ({ key, ...spell }));
}

export function getAllSpells(): (SpellReference & { key: string })[] {
  return [
    ...flattenSpells(WIZARD_SPELLS),
    ...flattenSpells(PRIEST_SPELLS),
    ...flattenSpells(CLASS_SPELLS),
    ...flattenSpells(INNATE_SPELLS),
  ];
}

import { setFallback, SpellReference } from "../../src/model/spell-item/spell-reference";

// Types (SpellReference/SpellVariant) and all spell-resolution logic (resolveForMod, spellFiles,
// setFallback, getAllSpells, spellsByKeyword) live in lib/src/model/spell-item/spell-reference.ts,
// not here - this file is just the SPELLS data itself (see the "spell-database is becoming a mess"
// cleanup discussion). Callers needing that logic import it from the model file directly, passing
// SPELLS in where a spell registry argument is expected (e.g. getAllSpells(SPELLS)).

// Shared by RemoveMagic (wizard), DispelMagic (wizard), and DispelMagic (cleric) below - all
// three display the same in-game name.
const DISPEL_MAGIC_NAME = "spell.DispelMagic.name";

const WIZARD_SPELLS = {
  AbiDalzimHorridWilting: {
    file: "SPWI812",
    id: "WIZARD_ABI_DALZIMS_HORRID_WILTING",
    name: "spell.AbiDalzimHorridWilting.name",
    keywords: ["magicDamage"],
  },
  AcidFog: {
    file: "SPWI614",
    id: "WIZARD_ACID_FOG",
    name: "spell.AcidFog.name",
    keywords: ["acid", "cloud"],
  },
  AcidStorm: {
    file: "SPWI724",
    id: "WIZARD_ACID_STORM",
    name: "spell.AcidStorm.name",
    keywords: ["acid"],
    requiresMod: "AllSpellMods",
  },
  AgannazarScorcher: {
    file: "SPWI217",
    id: "WIZARD_AGANNAZAR_SCORCHER",
    name: "spell.AgannazarScorcher.name",
    keywords: ["fire"],
  },
  BeltynsBurningBlood: {
    file: "SPWI427",
    id: "WIZARD_BELTYNS_BURNING_BLOOD",
    name: "spell.BeltynsBurningBlood.name",
    keywords: ["fire"],
    requiresMod: "AllSpellMods",
  },
  BigbyIcyGrasp: {
    file: "SPWI818",
    id: "WIZARD_BIGBYS_ICY_GRASP",
    name: "spell.BigbyIcyGrasp.name",
    keywords: ["cold", "hold"],
    requiresMod: "AllSpellMods",
  },
  Blindness: {
    // Vanilla-only: Spell Revisions repurposes SPWI106 into Obscuring Mist (see that entry) and there
    // is no evidence of where, if anywhere, Blindness itself moves to. Not currently referenced
    // outside this file, so left undocumented beyond this note rather than guessing a replacement.
    file: "SPWI106",
    id: "WIZARD_BLINDNESS",
    name: "spell.Blindness.name",
    keywords: ["blind"],
    obsoletedBy: "AllSpellMods",
  },
  Blur: { file: "SPWI201", id: "WIZARD_BLUR", duration: "mid", name: "spell.Blur.name" },
  Breach: { file: "SPWI513", id: "WIZARD_BREACH", name: "spell.Breach.name" },
  BurningHands: {
    file: "SPWI103",
    id: "WIZARD_BURNING_HANDS",
    name: "spell.BurningHands.name",
    keywords: ["fire"],
  },
  ChainLightning: {
    file: "SPWI615",
    id: "WIZARD_CHAIN_LIGHTNING",
    name: "spell.ChainLightning.name",
    keywords: ["electrical"],
  },
  CharmPerson: {
    file: "SPWI104",
    id: "WIZARD_CHARM_PERSON",
    name: "spell.CharmPerson.name",
    keywords: ["charm"],
  },
  ChillTouch: {
    file: "SPWI117",
    id: "WIZARD_CHILL_TOUCH",
    name: "spell.ChillTouch.name",
    keywords: ["cold"],
  },
  ChromaticOrb: {
    file: "SPWI118",
    id: "WIZARD_CHROMATIC_ORB",
    name: "spell.ChromaticOrb.name",
    keywords: ["magicDamage", "blind"],
  },
  Cloudkill: {
    file: "SPWI502",
    id: "WIZARD_CLOUDKILL",
    name: "spell.Cloudkill.name",
    keywords: ["poison", "cloud"],
  },
  ColorSpray: {
    file: "SPWI105",
    id: "WIZARD_COLOR_SPRAY",
    name: "spell.colorSpray.name",
    keywords: ["blind", "slow", "confusion"],
  },
  Combust: {
    file: "SPWI231",
    id: "WIZARD_COMBUST",
    name: "spell.Combust.name",
    keywords: ["fire"],
    requiresMod: "AllSpellMods",
  },
  ConeOfCold: {
    file: "SPWI503",
    id: "WIZARD_CONE_OF_COLD",
    name: "spell.coneOfCold.name",
    keywords: ["cold"],
  },
  Confusion: {
    file: "SPWI401",
    id: "WIZARD_CONFUSION",
    name: "spell.Confusion.name",
    keywords: ["confusion"],
  },
  Contagion: {
    file: "SPWI409",
    id: "WIZARD_CONTAGION",
    name: "spell.Contagion.name",
    keywords: ["disease"],
  },
  DancingLights: {
    file: "SPWI126",
    id: "WIZARD_DANCING_LIGHTS",
    name: "spell.DancingLights.name",
    hiddenIn: "AllSpellMods",
  },
  Darkness15Radius: {
    file: "SPWI228",
    id: "WIZARD_DARKNESS_15_FOOT",
    name: "spell.Darkness15Radius.name",
    keywords: ["blind"],
    hiddenIn: "AllSpellMods",
  },
  Deafness: {
    file: "SPWI223",
    id: "WIZARD_DEAFNESS",
    name: "spell.Deafness.name",
    obsoletedBy: "AllSpellMods",
  },
  SoundBurst: {
    // Spell Revisions repurposes SPWI223 into this - Deafness above stays the correct name for the
    // same file in vanilla only.
    file: "SPWI223",
    id: "WIZARD_SOUND_BURST",
    name: "spell.SoundBurst.name",
    requiresMod: "AllSpellMods",
  },
  DeathSpell: {
    // Vanilla-only: once Spell Revisions is installed, SPWI605 becomes Banishment (WIZARD_BANISHMENT
    // under Spell Revisions alone, oddly reverting to the WIZARD_DEATH_SPELL symbol - still Banishment
    // content - once Stratagems is also installed). Not currently referenced outside this file.
    file: "SPWI605",
    id: "WIZARD_DEATH_SPELL",
    name: "spell.DeathSpell.name",
    keywords: ["death"],
  },
  DelayedBlastFireball: {
    file: "SPWI712",
    id: "WIZARD_DELAYED_BLAST_FIREBALL",
    name: "spell.DelayedBlastFireball.name",
    keywords: ["fire"],
  },
  DemiShadowMonsters: {
    file: "SPWI527",
    id: "WIZARD_DEMI_SHADOW_MONSTERS",
    name: "spell.DemiShadowMonsters.name",
    duration: "short",
    requiresMod: "AllSpellMods",
  },
  DetectInvisibility: {
    file: "SPWI203",
    id: "WIZARD_DETECT_INVISIBILITY",
    name: "spell.DetectInvisibility.name",
  },
  DireCharm: {
    file: "SPWI316",
    id: "WIZARD_DIRE_CHARM",
    name: "spell.DireCharm.name",
    keywords: ["charm"],
  },
  DimensionDoor: {
    // Spell Revisions removes this from spellbooks (SPWI402's id becomes _DEPRECATED - a leftover
    // resource, not a real spellbook entry, so it can never actually be cast) and adds a genuinely
    // separate, spellbook-integrated "Dimension Jump" at SPWI127/WIZARD_DIMENSION_JUMP instead. The
    // two never coexist, so the variant points at the real replacement, not the deprecated husk.
    file: "SPWI402",
    id: "WIZARD_DIMENSION_DOOR",
    name: "spell.dimensionDoor.name",
    variants: [{ mod: "AllSpellMods", file: "SPWI127", id: "WIZARD_DIMENSION_JUMP" }],
  },
  DispelMagic: {
    file: "SPWI326",
    id: "WIZARD_TRUE_DISPEL_MAGIC",
    name: DISPEL_MAGIC_NAME,
    hiddenIn: "AllSpellMods",
  },
  Domination: {
    file: "SPWI506",
    id: "WIZARD_DOMINATION",
    name: "spell.Domination.name",
    keywords: ["charm"],
  },
  DragonsBreath: {
    file: "SPWI922",
    id: "WIZARD_DRAGONS_BREATH",
    name: "spell.DragonsBreath.name",
    keywords: ["fire"],
    hiddenIn: "AllSpellMods",
  },
  Emotion: {
    file: "SPWI411",
    id: "WIZARD_EMOTION_HOPELESSNESS",
    name: "spell.Emotion.name",
    keywords: ["stun"],
  },
  Feeblemind: {
    file: "SPWI509",
    id: "WIZARD_FEEBLEMIND",
    name: "spell.Feeblemind.name",
    keywords: ["confusion"],
  },
  Fireburst: {
    file: "SPWI523",
    id: "WIZARD_SUN_FIRE",
    name: "spell.Fireburst.name",
    keywords: ["fire"],
  },
  Fireball: {
    file: "SPWI304",
    id: "WIZARD_FIREBALL",
    name: "spell.Fireball.name",
    keywords: ["fire"],
  },
  FireShield: {
    file: "SPWI418",
    id: "WIZARD_FIRE_SHIELD_RED",
    duration: "short",
    name: "spell.FireShield.name",
  },
  FlameArrow: {
    file: "SPWI303",
    id: "WIZARD_FLAME_ARROW",
    name: "spell.FlameArrow.name",
    keywords: ["fire", "missile"],
  },
  FleshToStone: {
    file: "SPWI604",
    id: "WIZARD_FLESH_TO_STONE",
    name: "spell.FleshToStone.name",
    keywords: ["petrify"],
  },
  Glitterdust: { file: "SPWI224", id: "WIZARD_GLITTERDUST", name: "spell.Glitterdust.name" },
  GlobeOfInvulnerability: {
    file: "SPWI602",
    id: "WIZARD_GLOBE_OF_INVULNERABILITY",
    duration: "mid",
    name: "spell.GlobeOfInvulnerability.name",
  },
  Grease: {
    file: "SPWI101",
    id: "WIZARD_GREASE",
    name: "spell.Grease.name",
    keywords: ["movement"],
  },
  GreaterMalison: {
    file: "SPWI412",
    id: "WIZARD_GREATER_MALISON",
    name: "spell.GreaterMalison.name",
  },
  Haste: { file: "SPWI305", id: "WIZARD_HASTE", duration: "mid", name: "spell.Haste.name" },
  HoldMonster: {
    file: "SPWI507",
    id: "WIZARD_HOLD_MONSTER",
    name: "spell.HoldMonster.name",
    keywords: ["hold", "movement"],
  },
  HoldPerson: {
    file: "SPWI306",
    id: "WIZARD_HOLD_PERSON",
    name: "spell.HoldPerson.name",
    keywords: ["hold", "movement"],
  },
  Horror: { file: "SPWI205", id: "WIZARD_HORROR", name: "spell.Horror.name", keywords: ["fear"] },
  IceLance: {
    file: "SPWI323",
    id: "WIZARD_ICELANCE",
    name: "spell.IceLance.name",
    keywords: ["cold"],
    requiresMod: "AllSpellMods",
  },
  IceStorm: {
    file: "SPWI404",
    id: "WIZARD_ICE_STORM",
    name: "spell.IceStorm.name",
    keywords: ["cold"],
  },
  ImprovedInvisibility: {
    file: "SPWI405",
    id: "WIZARD_IMPROVED_INVISIBILITY",
    duration: "short",
    name: "spell.ImprovedInvisibility.name",
  },
  IncendiaryCloud: {
    file: "SPWI810",
    id: "WIZARD_INCENDIARY_CLOUD",
    name: "spell.IncendiaryCloud.name",
    keywords: ["fire", "cloud"],
  },
  Invisibility: {
    file: "SPWI206",
    id: "WIZARD_INVISIBILITY",
    name: "spell.Invisibility.name",
  },
  LarlochEnergyDrain: {
    file: "SPWI914",
    id: "WIZARD_ENERGY_DRAIN",
    name: "spell.LarlochEnergyDrain.name",
    keywords: ["levelDrain"],
  },
  LarlochMinorDrain: {
    file: "SPWI119",
    id: "WIZARD_LARLOCH_MINOR_DRAIN",
    name: "spell.LarlochMinorDrain.name",
    keywords: ["magicDamage"],
  },
  LightningBolt: {
    file: "SPWI308",
    id: "WIZARD_LIGHTNING_BOLT",
    name: "spell.LightningBolt.name",
    keywords: ["electrical"],
  },
  MagicMissiles: {
    file: "SPWI112",
    id: "WIZARD_MAGIC_MISSILE",
    name: "spell.MagicMissiles.name",
    keywords: ["shield", "magicDamage"],
  },
  Maze: { file: "SPWI813", id: "WIZARD_MAZE", name: "spell.Maze.name", keywords: ["maze"] },
  MelfAcidArrow: {
    file: "SPWI211",
    id: "WIZARD_MELF_ACID_ARROW",
    name: "spell.MelfAcidArrow.name",
    keywords: ["acid", "missile"],
  },
  MeteorSwarm: {
    file: "SPWI911",
    id: "WIZARD_METEOR_SWARM",
    name: "spell.MeteorSwarm.name",
    keywords: ["fire"],
  },
  MinorGlobeOfInvulnerability: {
    file: "SPWI406",
    id: "WIZARD_MINOR_GLOBE_OF_INVULNERABILITY",
    duration: "mid",
    name: "spell.MinorGlobeOfInvulnerability.name",
  },
  MinorLightningBolt: {
    file: "SPWI230",
    id: "WIZARD_MINOR_LIGHTNING_BOLT",
    name: "spell.MinorLightningBolt.name",
    keywords: ["electrical"],
    requiresMod: "AllSpellMods",
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
  MonsterSummoning1: {
    file: "SPWI107",
    id: "WIZARD_MONSTER_SUMMONING_LEVEL_1",
    name: "spell.MonsterSummoning1.name",
    requiresMod: "AllSpellMods",
  },
  MonsterSummoning2: {
    file: "SPWI226",
    id: "WIZARD_MONSTER_SUMMONING_LEVEL_2",
    name: "spell.MonsterSummoning2.name",
    requiresMod: "AllSpellMods",
  },
  MonsterSummoning3: {
    file: "SPWI309",
    id: "WIZARD_MONSTER_SUMMONING_LEVEL_3",
    name: "spell.MonsterSummoning3.name",
    requiresMod: "AllSpellMods",
  },
  MonsterSummoning4: {
    file: "SPWI423",
    id: "WIZARD_SPIDER_SPAWN",
    name: "spell.MonsterSummoning4.name",
    requiresMod: "AllSpellMods",
  },
  MonsterSummoning5: {
    file: "SPWI504",
    id: "WIZARD_MONSTER_SUMMONING_LEVEL_5",
    name: "spell.MonsterSummoning5.name",
    requiresMod: "AllSpellMods",
  },
  MonsterSummoning6: {
    file: "SPWI610",
    id: "WIZARD_MONSTER_SUMMONING_LEVEL_6",
    name: "spell.MonsterSummoning6.name",
    requiresMod: "AllSpellMods",
  },
  MonsterSummoning7: {
    file: "SPWI706",
    id: "WIZARD_MONSTER_SUMMONING_LEVEL_7",
    name: "spell.MonsterSummoning7.name",
    requiresMod: "AllSpellMods",
  },
  MonsterSummoning8: {
    file: "SPWI806",
    id: "WIZARD_MONSTER_SUMMONING_LEVEL_8",
    name: "spell.MonsterSummoning8.name",
    requiresMod: "AllSpellMods",
  },
  MordenkainenForceMissiles: {
    file: "SPWI431",
    id: "WIZARD_MORDENKAINENS_FORCE_MISSILES",
    name: "spell.MordenkainenForceMissiles.name",
    keywords: ["shield", "magicDamage"],
    requiresMod: "AllSpellMods",
  },
  NahalRecklessDweomer: {
    file: "SPWI124",
    id: "WIZARD_NAHALS_RECKLESS_DWEOMER",
    name: "spell.NahalRecklessDweomer.name",
    hiddenIn: "AllSpellMods",
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
    requiresMod: "AllSpellMods",
  },
  OtilukesFreezingSphere: {
    file: "SPWI626",
    id: "WIZARD_OTILUKES_FREEZING_SPHERE",
    name: "spell.OtilukesFreezingSphere.name",
    keywords: ["cold"],
    requiresMod: "AllSpellMods",
  },
  PolymorphOther: {
    file: "SPWI415",
    id: "WIZARD_POLYMORPH_OTHER",
    name: "spell.PolymorphOther.name",
    keywords: ["polymorph"],
  },
  PolymorphSelf: { file: "SPWI416", id: "WIZARD_POLYMORPH_SELF", name: "spell.PolymorphSelf.name" },
  PowerWordSleep: {
    file: "SPWI220",
    id: "WIZARD_POWER_WORD_SLEEP",
    name: "spell.PowerWordSleep.name",
    keywords: ["sleep"],
  },
  PowerWordBlind: {
    file: "SPWI815",
    id: "WIZARD_POWER_WORD_BLIND",
    name: "spell.PowerWordBlind.name",
    keywords: ["blind"],
  },
  PowerWordKill: {
    file: "SPWI912",
    id: "WIZARD_POWER_WORD_KILL",
    name: "spell.PowerWordKill.name",
    keywords: ["death"],
  },
  PowerWordStun: {
    file: "SPWI715",
    id: "WIZARD_POWER_WORD_STUN",
    name: "spell.PowerWordStun.name",
    keywords: ["stun"],
  },
  PrismaticSpray: {
    file: "SPWI714",
    id: "WIZARD_PRISMATIC_SPRAY",
    name: "spell.PrismaticSpray.name",
    keywords: ["blind"],
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
  RayOfEnfeeblement: {
    file: "SPWI221",
    id: "WIZARD_RAY_OF_ENFEEBLEMENT",
    name: "spell.RayOfEnfeeblement.name",
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
    hiddenIn: "AllSpellMods",
  },
  Shades: {
    file: "SPWI632",
    id: "WIZARD_SHADES",
    name: "spell.Shades.name",
    requiresMod: "AllSpellMods",
  },
  Shield: {
    file: "SPWI114",
    id: "WIZARD_SHIELD",
    duration: "mid",
    name: "spell.Shield.name",
  },
  ShadowDoor: { file: "SPWI505", id: "WIZARD_SHADOW_DOOR", name: "spell.ShadowDoor.name" },
  ShadowMonsters: {
    file: "SPWI433",
    id: "WIZARD_SHADOW_MONSTERS",
    name: "spell.ShadowMonsters.name",
    duration: "short",
    requiresMod: "AllSpellMods",
  },
  ShroudOfFlame: {
    file: "SPWI525",
    id: "WIZARD_SHROUD_OF_FLAME",
    name: "spell.ShroudOfFlame.name",
    keywords: ["fire"],
    requiresMod: "AllSpellMods",
  },
  SkullTrap: {
    file: "SPWI313",
    id: "WIZARD_SKULL_TRAP",
    name: "spell.SkullTrap.name",
    keywords: ["magicDamage"],
  },
  Sleep: { file: "SPWI116", id: "WIZARD_SLEEP", name: "spell.Sleep.name", keywords: ["sleep"] },
  Slow: {
    file: "SPWI312",
    id: "WIZARD_SLOW",
    name: "spell.Slow.name",
    keywords: ["slow", "movement"],
  },
  SnillocsSnowballSwarm: {
    file: "SPWI227",
    id: "WIZARD_SNILLOCS_SNOWBALL_SWARM",
    name: "spell.SnillocsSnowballSwarm.name",
    keywords: ["cold"],
    requiresMod: "AllSpellMods",
  },
  SpellThrust: { file: "SPWI321", id: "WIZARD_SPELL_THRUST", name: "spell.SpellThrust.name" },
  Spook: { file: "SPWI125", id: "WIZARD_SPOOK", name: "spell.Spook.name", keywords: ["fear"] },
  StinkingCloud: {
    file: "SPWI213",
    id: "WIZARD_STINKING_CLOUD",
    name: "spell.StinkingCloud.name",
    keywords: ["cloud"],
  },
  Stoneskin: {
    file: "SPWI408",
    id: "WIZARD_STONE_SKIN",
    duration: "long",
    name: "spell.Stoneskin.name",
  },
  SummonShadow: {
    file: "SPWI501",
    id: "WIZARD_SUMMON_SHADOW",
    duration: "mid",
    name: "spell.SummonShadow.name",
    requiresMod: "AllSpellMods",
  },
  SymbolDeath: { file: "SPWI817", id: "WIZARD_SYMBOL_DEATH", name: "spell.SymbolDeath.name" },
  SymbolFear: {
    file: "SPWI899",
    id: "WIZARD_NPC_SYMBOL_FEAR",
    name: "spell.SymbolFear.name",
    keywords: ["fear"],
    // NPC-only content (not player-learnable even in vanilla) - hiddenIn only matters for
    // spellbook derivation, so this stays fine to hand a creature directly under any mod.
    hiddenIn: "AllSpellMods",
  },
  TeleportField: {
    file: "SPWI421",
    id: "WIZARD_TELEPORT_FIELD",
    name: "spell.TeleportField.name",
  },
  VampiricTouch: {
    file: "SPWI314",
    id: "WIZARD_VAMPIRIC_TOUCH",
    name: "spell.VampiricTouch.name",
    keywords: ["magicDamage"],
  },
  VitriolicSphere: {
    file: "SPWI426",
    id: "WIZARD_VITRIOLIC_SPHERE",
    name: "spell.VitriolicSphere.name",
    keywords: ["acid"],
    requiresMod: "AllSpellMods",
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
    keywords: ["death"],
  },
  WavesOfFatigue: {
    file: "SPWI508",
    id: "WIZARD_WAVES_OF_FATIGUE",
    name: "spell.WavesOfFatigue.name",
    requiresMod: "AllSpellMods",
  },
  Web: {
    file: "SPWI215",
    id: "WIZARD_WEB",
    name: "spell.Web.name",
    keywords: ["hold", "movement"],
  },
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
    requiresMod: "AllSpellMods",
  },
  AnimalSummoning2: {
    file: "SPPR221",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_2",
    name: "spell.AnimalSummoning2.name",
    requiresMod: "AllSpellMods",
  },
  AnimalSummoning3: {
    file: "SPPR321",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_3",
    name: "spell.AnimalSummoning3.name",
    requiresMod: "AllSpellMods",
  },
  AnimalSummoning4: {
    file: "SPPR402",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_4",
    name: "spell.AnimalSummoning4.name",
    requiresMod: "AllSpellMods",
  },
  AnimalSummoning5: {
    file: "SPPR501",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_5",
    name: "spell.AnimalSummoning5.name",
    requiresMod: "AllSpellMods",
  },
  AnimalSummoning6: {
    file: "SPPR602",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_6",
    name: "spell.AnimalSummoning6.name",
    requiresMod: "AllSpellMods",
  },
  AnimalSummoning7: {
    file: "SPPR733",
    id: "CLERIC_ANIMAL_SUMMONING_LEVEL_7",
    name: "spell.AnimalSummoning7.name",
    requiresMod: "AllSpellMods",
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
    requiresMod: "AllSpellMods",
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
    requiresMod: "AllSpellMods",
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
    keywords: ["blind"],
  },
  BoltOfGlory: {
    file: "SPPR612",
    id: "CLERIC_BOLT_OF_GLORY",
    name: "spell.BoltOfGlory.name",
    keywords: ["magicDamage"],
  },
  CallLightning: {
    file: "SPPR302",
    id: "CLERIC_CALL_LIGHTNING",
    name: "spell.CallLightning.name",
    keywords: ["electrical"],
  },
  CauseDisease: {
    file: "SPPR329",
    id: "CLERIC_CAUSE_DISEASE",
    name: "spell.CauseDisease.name",
    keywords: ["disease"],
    requiresMod: "AllSpellMods",
  },
  CauseCriticalWounds: {
    file: "SPPR414",
    id: "CLERIC_CAUSE_SERIOUS_WOUNDS",
    name: "spell.CauseCriticalWounds.name",
    keywords: ["magicDamage", "causeWounds"],
  },
  CauseLightWounds: {
    file: "SPPR121",
    id: "CLERIC_CAUSE_LIGHT_WOUNDS",
    name: "spell.CauseLightWounds.name",
    keywords: ["magicDamage", "causeWounds"],
    requiresMod: "AllSpellMods",
  },
  CauseSeriousWounds: {
    file: "SPPR322",
    id: "CLERIC_CAUSE_MEDIUM_WOUNDS",
    name: "spell.CauseSeriousWounds.name",
    keywords: ["magicDamage", "causeWounds"],
    requiresMod: "AllSpellMods",
  },
  CauseModerateWounds: {
    file: "SPPR220",
    id: "CLERIC_CAUSE_MODERATE_WOUNDS",
    name: "spell.CauseModerateWounds.name",
    keywords: ["magicDamage", "causeWounds"],
    requiresMod: "AllSpellMods",
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
    keywords: ["magicDamage", "blind", "cloud"],
    requiresMod: "AllSpellMods",
  },
  Chant: {
    file: "SPPR203",
    id: "CLERIC_CHANT",
    name: "spell.Chant.name",
    duration: "short",
  },
  // SPPR709 is CLERIC_CONFUSION both in vanilla and under AllSpellMods (Spell Revisions alone,
  // which isn't a supported install state on its own, briefly renames it to CLERIC_CHAOS - but
  // Stratagems re-asserts CLERIC_CONFUSION once it's also installed) - no variant needed.
  Chaos: {
    file: "SPPR709",
    id: "CLERIC_CONFUSION",
    name: "spell.Chaos.name",
    keywords: ["confusion"],
  },
  CharmPersonOrAnimal: {
    file: "SPPR204",
    id: "CLERIC_CHARM_PERSON",
    name: "spell.CharmPersonOrAnimal.name",
    keywords: ["charm"],
  },
  CircleOfBones: {
    file: "SPPR332",
    id: "CLERIC_CIRCLE_OF_BONES",
    name: "spell.CircleOfBones.name",
    duration: "short",
    requiresMod: "AllSpellMods",
  },
  CloakOfFear: {
    file: "SPPR416",
    id: "CLERIC_CLOAK_OF_FEAR",
    name: "spell.CloakOfFear.name",
    keywords: ["fear"],
  },
  Command: {
    file: "SPPR102",
    id: "CLERIC_COMMAND",
    name: "spell.Command.name",
    keywords: ["sleep"],
  },
  Contagion: {
    file: "SPPR320",
    id: "CLERIC_CONTAGION",
    name: "spell.Contagion.name",
    keywords: ["disease"],
    requiresMod: "AllSpellMods",
  },
  CreepingDoom: {
    file: "SPPR717",
    id: "CLERIC_CREEPING_DOOM",
    name: "spell.CreepingDoom.name",
    keywords: ["miscast"],
  },
  // Once Spell Revisions is installed, SPPR502's id becomes CLERIC_CURE_CRITICAL_WOUNDS_DEPRECATED
  // and genuinely stops working in-game (confirmed in-game, not just hidden from selection) - no
  // replacement, so this spell simply doesn't exist under AllSpellMods.
  CureCriticalWounds: {
    file: "SPPR502",
    id: "CLERIC_CURE_CRITICAL_WOUNDS",
    name: "spell.CureCriticalWounds.name",
    obsoletedBy: "AllSpellMods",
  },
  CureLightWounds: {
    file: "SPPR103",
    id: "CLERIC_CURE_LIGHT_WOUNDS",
    name: "spell.CureLightWounds.name",
  },
  CureMediumWounds: {
    file: "SPPR315",
    id: "CLERIC_CURE_MEDIUM_WOUNDS",
    name: "spell.CureMediumWounds.name",
  },
  CureModerateWounds: {
    file: "SPPR216",
    id: "CLERIC_CURE_MODERATE_WOUNDS",
    name: "spell.CureModerateWounds.name",
    requiresMod: "AllSpellMods",
  },
  CureSeriousWounds: {
    file: "SPPR401",
    id: "CLERIC_CURE_SERIOUS_WOUNDS",
    name: "spell.CureSeriousWounds.name",
  },
  Curse: {
    file: "SPPR124",
    id: "CLERIC_CURSE",
    name: "spell.Curse.name",
    requiresMod: "AllSpellMods",
  },
  Destruction: {
    file: "SPPR737",
    id: "CLERIC_DESTRUCTION",
    name: "spell.Destruction.name",
    keywords: ["death"],
    requiresMod: "AllSpellMods",
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
    requiresMod: "AllSpellMods",
  },
  GreaterDivineProtection: {
    file: "SPPR738",
    id: "CLERIC_GREATER_SHIELD_OF_LATHANDER",
    name: "spell.GreaterDivineProtection.name",
    requiresMod: "AllSpellMods",
  },
  DolorousDecay: {
    file: "SPPR610",
    id: "CLERIC_DOLOROUS_DECAY",
    name: "spell.DolorousDecay.name",
    keywords: ["magicDamage"],
  },
  Doom: { file: "SPPR113", id: "CLERIC_DOOM", name: "spell.Doom.name" },
  DrawUponHolyMight: {
    file: "SPPR214",
    id: "CLERIC_DRAW_UPON_HOLY_MIGHT",
    name: "spell.DrawUponHolyMight.name",
    duration: "short",
  },
  Earthquake: {
    file: "SPPR720",
    id: "CLERIC_EARTHQUAKE",
    name: "spell.Earthquake.name",
    keywords: ["death", "sleep"],
  },
  EnergyDrain: {
    file: "SPPR714",
    id: "CLERIC_ENERGY_DRAIN",
    name: "spell.EnergyDrain.name",
    keywords: ["levelDrain"],
    requiresMod: "AllSpellMods",
  },
  Entangle: {
    file: "SPPR105",
    id: "CLERIC_ENTANGLE",
    name: "spell.Entangle.name",
    keywords: ["movement"],
  },
  EntropyShield: {
    file: "SPPR620",
    id: "CLERIC_ENTROPY_SHIELD",
    name: "spell.EntropyShield.name",
    duration: "short",
    requiresMod: "AllSpellMods",
  },
  FindTraps: { file: "SPPR205", id: "CLERIC_FIND_TRAPS", name: "spell.FindTraps.name" },
  FingerOfDeath: {
    file: "SPPR708",
    id: "CLERIC_FINGER_OF_DEATH",
    name: "spell.FingerOfDeath.name",
    keywords: ["death"],
  },
  FireStorm: {
    file: "SPPR705",
    id: "CLERIC_FIRE_STORM",
    name: "spell.FireStorm.name",
    keywords: ["fire"],
  },
  FlameStrike: {
    file: "SPPR503",
    id: "CLERIC_FLAME_STRIKE",
    name: "spell.FlameStrike.name",
    keywords: ["fire"],
  },
  FreeAction: {
    file: "SPPR403",
    id: "CLERIC_FREE_ACTION",
    name: "spell.FreeAction.name",
    duration: "mid",
  },
  Gate: {
    file: "SPPR703",
    id: "CLERIC_GATE",
    name: "spell.Gate.name",
    duration: "mid",
    obsoletedBy: "AllSpellMods",
  },
  GlyphOfWarding: {
    file: "SPPR304",
    id: "CLERIC_GLYPH_OF_WARDING",
    name: "spell.GlyphOfWarding.name",
    keywords: ["magicDamage"],
  },
  GreaterCommand: {
    file: "SPPR512",
    id: "CLERIC_GREATER_COMMAND",
    name: "spell.GreaterCommand.name",
    keywords: ["sleep"],
  },
  Harm: {
    file: "SPPR608",
    id: "CLERIC_HARM",
    name: "spell.Harm.name",
    keywords: ["magicDamage", "causeWounds"],
  },
  Heal: { file: "SPPR607", id: "CLERIC_HEAL", name: "spell.Heal.name" },
  HoldPerson: {
    file: "SPPR208",
    id: "CLERIC_HOLD_PERSON",
    name: "spell.HoldPerson.name",
    keywords: ["hold"],
  },
  HoldPersonOrAnimal: {
    file: "SPPR305",
    id: "CLERIC_HOLD_ANIMAL",
    name: "spell.HoldPersonOrAnimal.name",
    keywords: ["hold"],
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
    keywords: ["magicDamage"],
  },
  HolyWord: {
    file: "SPPR710",
    id: "CLERIC_HOLY_WORD",
    name: "spell.HolyWord.name",
    keywords: ["death", "stun"],
  },
  UnholyWord: {
    file: "SPPR715",
    id: "CLERIC_UNHOLY_WORD",
    name: "spell.UnholyWord.name",
    keywords: ["death", "confusion"],
  },
  InsectPlague: {
    file: "SPPR517",
    id: "CLERIC_INSECT_PLAGUE",
    name: "spell.InsectPlague.name",
    keywords: ["miscast"],
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
    keywords: ["magicDamage", "causeWounds"],
    requiresMod: "AllSpellMods",
  },
  MassCure: { file: "SPPR514", id: "CLERIC_MASS_CURE", name: "spell.MassCure.name" },
  MentalDomination: {
    file: "SPPR405",
    id: "CLERIC_MENTAL_DOMINATION",
    name: "spell.MentalDomination.name",
    keywords: ["charm"],
  },
  MiscastMagic: {
    file: "SPPR310",
    id: "CLERIC_MISCAST_MAGIC",
    name: "spell.MiscastMagic.name",
    keywords: ["miscast"],
  },
  NeutralizePoison: {
    file: "SPPR404",
    id: "CLERIC_NEUTRALIZE_POISON",
    name: "spell.NeutralizePoison.name",
  },
  Poison: { file: "SPPR411", id: "CLERIC_POISON", name: "spell.Poison.name", keywords: ["poison"] },
  PhysicalMirror: {
    // Vanilla keeps this spell at SPPR613. Stratagems' IWD spells add a level-5 duplicate at
    // SPPR531 and take over the live CLERIC_PHYSICAL_MIRROR id there, relabeling SPPR613's own id
    // to CLERIC_MIRROR_OLD (still literally "Physical Mirror" content).
    file: "SPPR613",
    id: "CLERIC_PHYSICAL_MIRROR",
    name: "spell.PhysicalMirror.name",
    variants: [{ mod: "AllSpellMods", file: "SPPR531", id: "CLERIC_PHYSICAL_MIRROR" }],
  },
  ProduceFire: {
    file: "SPPR420",
    id: "CLERIC_PRODUCE_FIRE",
    name: "spell.ProduceFire.name",
    keywords: ["fire"],
    requiresMod: "AllSpellMods",
  },
  ProtectionFromEvil: {
    file: "SPPR107",
    id: "CLERIC_PROTECT_FROM_EVIL",
    name: "spell.ProtectionFromEvil.name",
    duration: "short",
  },
  ProtectionFromEvil10Radius: {
    file: "SPPR408",
    id: "CLERIC_PROTECTION_FROM_EVIL_10_FOOT",
    name: "spell.ProtectionFromEvil.name",
    duration: "mid",
  },
  ProtectionFromGood: {
    file: "SPPR125",
    id: "CLERIC_PROTECT_FROM_GOOD",
    name: "spell.ProtectionFromGood.name",
    duration: "short",
    requiresMod: "AllSpellMods",
  },
  ProtectionFromGood10Radius: {
    file: "SPPR431",
    id: "CLERIC_PROTECTION_FROM_GOOD_10_FOOT",
    name: "spell.ProtectionFromGood10Radius.name",
    duration: "mid",
    requiresMod: "AllSpellMods",
  },
  ProtectionFromLightning: {
    // Spell Revisions moves the live CLERIC_PROTECTION_FROM_LIGHTNING id from SPPR407 to SPPR521
    // (renamed "Protection from Electricity"), relabeling SPPR407's own id to
    // CLERIC_PROTECTION_FROM_LIGHTNING_DEPRECATED.
    file: "SPPR407",
    id: "CLERIC_PROTECTION_FROM_LIGHTNING",
    name: "spell.ProtectionFromLightning.name",
    duration: "mid",
    variants: [{ mod: "AllSpellMods", file: "SPPR521", id: "CLERIC_PROTECTION_FROM_LIGHTNING" }],
  },
  RegenerateLightWounds: {
    file: "SPPR119",
    id: "CLERIC_REGENERATE_LIGHT_WOUNDS",
    name: "spell.RegenerateLightWounds.name",
    requiresMod: "AllSpellMods",
  },
  RegenerateModerateWounds: {
    file: "SPPR218",
    id: "CLERIC_REGENERATE_MODERATE_WOUNDS",
    name: "spell.RegenerateModerateWounds.name",
    requiresMod: "AllSpellMods",
  },
  RegenerateSeriousWounds: {
    file: "SPPR324",
    id: "CLERIC_REGENERATE_SERIOUS_WOUNDS",
    name: "spell.RegenerateSeriousWounds.name",
    requiresMod: "AllSpellMods",
  },
  RegenerateCriticalWounds: {
    file: "SPPR419",
    id: "CLERIC_REGENERATE_CRITICAL_WOUNDS",
    name: "spell.RegenerateCriticalWounds.name",
    requiresMod: "AllSpellMods",
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
    requiresMod: "AllSpellMods",
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
    keywords: ["confusion"],
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
  Silence: {
    file: "SPPR211",
    id: "CLERIC_SILENCE_15_FOOT",
    name: "spell.Silence.name",
    keywords: ["silence"],
  },
  SlayLiving: {
    file: "SPPR511",
    id: "CLERIC_SLAY_LIVING",
    name: "spell.SlayLiving.name",
    keywords: ["death"],
  },
  SpiritualHammer: {
    file: "SPPR213",
    id: "CLERIC_SPIRITUAL_HAMMER",
    name: "spell.SpiritualHammer.name",
  },
  StaticCharge: {
    file: "SPPR421",
    id: "CLERIC_STATIC_CHARGE",
    name: "spell.StaticCharge.name",
    keywords: ["electrical"],
    requiresMod: "AllSpellMods",
  },
  SummonDeathKnight: {
    file: "SPPR703",
    id: "CLERIC_SUMMON_DEATH_KNIGHT",
    name: "spell.SummonDeathKnight.name",
    duration: "mid",
    requiresMod: "AllSpellMods",
  },
  SummonInsects: {
    file: "SPPR319",
    id: "CLERIC_SUMMON_INSECTS",
    name: "spell.SummonInsects.name",
    keywords: ["miscast"],
  },
  Sunray: {
    file: "SPPR707",
    id: "CLERIC_SUNRAY",
    name: "spell.Sunray.name",
    keywords: ["magicDamage", "blind"],
  },
  Sunscorch: {
    file: "SPPR118",
    id: "CLERIC_SUNSCORCH",
    name: "spell.Sunscorch.name",
    keywords: ["fire", "blind"],
    requiresMod: "AllSpellMods",
  },
  SymbolDeath: {
    file: "SPPR719",
    id: "CLERIC_SYMBOL_DEATH",
    name: "spell.SymbolDeath.name",
    keywords: ["death"],
  },
  SymbolHopelessness: {
    file: "SPPR735",
    id: "CLERIC_SYMBOL_HOPELESSNESS",
    name: "spell.SymbolHopelessness.name",
    keywords: ["stun"],
    requiresMod: "AllSpellMods",
  },
  SymbolPain: {
    file: "SPPR734",
    id: "CLERIC_SYMBOL_PAIN",
    name: "spell.SymbolPain.name",
    requiresMod: "AllSpellMods",
  },
  SymbolStunning: {
    file: "SPPR718",
    id: "CLERIC_SYMBOL_STUN",
    name: "spell.SymbolStunning.name",
    keywords: ["stun"],
  },
  SymbolWeakness: {
    file: "SPPR706",
    id: "CLERIC_SYMBOL_WEAKNESS",
    name: "spell.SymbolWeakness.name",
    keywords: ["disease"],
    requiresMod: "AllSpellMods",
  },
  TrueSeeing: { file: "SPPR505", id: "CLERIC_TRUE_SIGHT", name: "spell.TrueSeeing.name" },
  UnholyBlight: {
    file: "SPPR314",
    id: "CLERIC_UNHOLY_BLIGHT",
    name: "spell.UnholyBlight.name",
    keywords: ["magicDamage"],
  },
  WavesOfAgony: {
    file: "SPPR533",
    id: "CLERIC_WAVES_OF_AGONY",
    name: "spell.WavesOfAgony.name",
  },
  Wither: {
    file: "SPPR740",
    id: "CLERIC_WITHER",
    name: "spell.Wither.name",
    keywords: ["magicDamage"],
    requiresMod: "AllSpellMods",
  },
} satisfies Record<string, SpellReference>;

const INNATE_SPELLS = {
  MephitColorSpray: {
    file: "SPIN937",
    id: "MEPHIT_COLOR_SPRAY",
    name: "spell.MephitColorSpray.name",
  },
  HealingLick: { file: "SPIN699", name: "spell.HealingLick.name" },
  MoonDogSight: { file: "SPIN696", name: "spell.MoonDogSight.name", id: "MOON_DOG_HOWL" },
  MoonDogHowl: {
    file: "SPIN891",
    name: "spell.MoonDogHowl.name",
    id: "MOON_DOG_FEAR",
    keywords: ["fear"],
  },
  SpiderSingleTargetWeb: { file: "BDSPIDGA", name: "spell.SpiderSingleTargetWeb.name" },
  VortexWeb: { file: "SPIN575", id: "VORTEX_WEB", name: "spell.VortexWeb.name" },
} satisfies Record<string, SpellReference>;

const CLASS_SPELLS = {
  BerserkerRage: { file: "SPCL321", id: "BERSERKER_RAGE", name: "spell.BerserkerRage.name" },
  BarbarianRage: { file: "SPCL152", id: "BARBARIAN_RAGE", name: "spell.BarbarianRage.name" },
  OffensiveSpin: { file: "SPCL521", id: "BLADE_OFFENSIVE_SPIN", name: "spell.OffensiveSpin.name" },
  PoisonWeapon: { file: "SPCL423", id: "ASSASSIN_POISON", name: "spell.PoisonWeapon.name" },
  SummonSpiritAnimal: { file: "SPCL621", name: "spell.SummonSpiritAnimal.name" },
} satisfies Record<string, SpellReference>;

export const SPELLS = {
  Wizard: WIZARD_SPELLS,
  Priest: PRIEST_SPELLS,
  Class: CLASS_SPELLS,
  Innate: INNATE_SPELLS,
};

// Fallbacks (see SpellReference.fallback / setFallback) - assigned here, not inline above, since a
// fallback is itself another SPELLS entry and can't reference a sibling from within the same object
// literal. Only the "same slot, different era" pairs have an obvious fallback; the rest of the
// requiresMod-only entries (new spells with no vanilla predecessor) still need one chosen.
setFallback(WIZARD_SPELLS.SoundBurst, WIZARD_SPELLS.Deafness);
setFallback(WIZARD_SPELLS.ObscuringMist, WIZARD_SPELLS.Blindness);
setFallback(WIZARD_SPELLS.Combust, WIZARD_SPELLS.AgannazarScorcher);
setFallback(WIZARD_SPELLS.ShadowMonsters, WIZARD_SPELLS.MonsterSummoning4);
setFallback(WIZARD_SPELLS.MordenkainenForceMissiles, WIZARD_SPELLS.Confusion);
setFallback(WIZARD_SPELLS.DemiShadowMonsters, WIZARD_SPELLS.MonsterSummoning5);
setFallback(WIZARD_SPELLS.SummonShadow, WIZARD_SPELLS.MonsterSummoning5);
setFallback(WIZARD_SPELLS.ShroudOfFlame, WIZARD_SPELLS.Fireburst);
setFallback(PRIEST_SPELLS.CauseLightWounds, PRIEST_SPELLS.Command);
setFallback(PRIEST_SPELLS.CauseModerateWounds, PRIEST_SPELLS.HoldPerson);
setFallback(PRIEST_SPELLS.CauseSeriousWounds, PRIEST_SPELLS.RigidThinking);
setFallback(PRIEST_SPELLS.MassCauseLightWounds, PRIEST_SPELLS.CauseCriticalWounds);
setFallback(PRIEST_SPELLS.Curse, PRIEST_SPELLS.Command);
setFallback(PRIEST_SPELLS.ProtectionFromGood, PRIEST_SPELLS.ProtectionFromEvil);
setFallback(PRIEST_SPELLS.ProtectionFromGood10Radius, PRIEST_SPELLS.ProtectionFromEvil10Radius);
setFallback(PRIEST_SPELLS.CauseDisease, PRIEST_SPELLS.MiscastMagic);
setFallback(PRIEST_SPELLS.Contagion, PRIEST_SPELLS.RigidThinking);
setFallback(PRIEST_SPELLS.CloudOfPestilence, PRIEST_SPELLS.Poison);
setFallback(PRIEST_SPELLS.AnimateSkeletonWarrior, PRIEST_SPELLS.AerialServant);
setFallback(PRIEST_SPELLS.EntropyShield, PRIEST_SPELLS.PhysicalMirror);
setFallback(PRIEST_SPELLS.Banishment, PRIEST_SPELLS.BoltOfGlory);
setFallback(PRIEST_SPELLS.SummonDeathKnight, PRIEST_SPELLS.Gate);
setFallback(PRIEST_SPELLS.Destruction, PRIEST_SPELLS.SymbolDeath);
setFallback(PRIEST_SPELLS.Wither, PRIEST_SPELLS.FingerOfDeath);

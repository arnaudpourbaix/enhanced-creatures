import { SpellGroup } from "../../src/model/spell-item/spell-group";
import { SPELLS } from "./spell-names";

export const SPELL_GROUPS: SpellGroup[] = [
  {
    name: "acidSpells",
    idsSpells: [
      { id: "WIZARD_ACID_STORM" }, // Acid Storm (IWDification)
    ],
    spells: [
      SPELLS.Wizard.VitriolicSphere.file, // Vitriolic Sphere (IWDification)
      "SPIN994", // Acid Pools in Durlag's Tower (ACID_DAMAGE_1)
      "SPWI614", // Acid Fog
      "A#CYR11", // Acid Fog (Divine Remix)
      "SPIN596", // Brown Dragon Acid Breath
      "SPIN691", // Black Dragon Breath
      "SPIN913", // Mimic Acid
    ],
  },
  {
    name: "bleeding",
    spells: [
      // ATWEAKS_SPELLS.Bleeding
    ],
  },
  {
    name: "blindness",
    idsSpells: [
      { id: "CLERIC_SUNSCORCH" }, // Cloud of Pestilence (IWDification)
      { id: "CLERIC_SUNRAY" },
      { id: "WIZARD_BLINDNESS" },
      { id: "WIZARD_PRISMATIC_SPRAY" },
    ],
    spells: [
      SPELLS.Priest.CloudOfPestilence.file, // Sunscorch (IWDification)
      SPELLS.Priest.BlindingBeauty.file,
      SPELLS.Wizard.ChromaticOrb.file,
      SPELLS.Wizard.Glitterdust.file,
      SPELLS.Wizard.PowerWordBlind.file,
      "spdr101.spl", // Chromatic Orb
      "spin595.spl", // Yellow Dragon Scorching Sand
      "spin878.spl", // Level Drain
      "spin893.spl", // Shadow Dragon Breath
      "spin929.spl", // Mist Ball
      "spin931.spl", // Sooty Ball
      SPELLS.Wizard.PowerWordBlind.file, // Power Word, Blind
      "spwi958.spl", // Power Word, Blind
      "spwm178.spl", // Blindness
      "chalcy2.itm", // The Shadow's Blade +3
      "gorwom4.itm", // Drow Flail +3
      "halb06.itm", // Blackmist +4
      "sorb.itm", // Searing Orb
      "sw1h51.itm", // Celestial Fury +3
      "wand19.itm", // Wand of Cursing
      "wand19.spl", // IR/IRR
      "wand19d.spl", // IR/IRR
    ],
  },
  {
    name: "cold",
    idsSpells: [
      { id: "WIZARD_OTILUKES_FREEZING_SPHERE" }, // Otiluke's Freezing Sphere (IWDification)
      { id: "WIZARD_SNILLOCS_SNOWBALL_SWARM" }, // Snilloc's Snowball Swarm (IWDification)
      { id: "WIZARD_ICELANCE" }, // Icelance (IWDification)
    ],
    spells: [
      SPELLS.Wizard.IceStorm.file,
      SPELLS.Wizard.ConeOfCold.file,
      "d1#wi503", // Cone of Cold (mod)
      "DVCONEC", // Cone of Cold (IR)
      "SPCRYO01", // Cone of Cold (mod)
      "SPIN133", // Cone of Cold (mod)
      "SPIN158", // Cone of Cold (mod)
      "SPIN162", // Cone of Cold (mod)
      "SPIN833", // Dragon Cone of Cold
      "WAND06", // Cone of Cold (IR)
      // ATWEAKS_SPELLS.IceStorm,
      // ATWEAKS_SPELLS.ConeOfCold,
      // ATWEAKS_SPELLS.WallOfIce,
      // ATWEAKS_SPELLS.Freeze,
      // ATWEAKS_SPELLS.IceStorn,
    ],
  },
  {
    name: "cloud",
    spells: [
      SPELLS.Priest.CloudOfPestilence.file, // Cloud of Pestilence (IWDification)
      "SPWI004", // Stinking Cloud (trap)
      "SPWI016", // Cloudkill (trap)
      SPELLS.Wizard.StinkingCloud.file, // Stinking Cloud
      SPELLS.Wizard.Cloudkill.file, // Cloudkill
      "SPWI614", // Death Fog
      "A#CYR11", // Death Fog (Divine Remix)
      "SPWI810", // Incendiary Cloud
      "DW#TRPIN", // Incendiary Cloud (Stratagems)
      "SPIN673", // Cloudkill
      "dvckill", // Cloudkill (IR/SR)
      "SPIN940", // Stinking Cloud (mephit)
      "SPIN979", // Golem Gas Cloud
      "SPIN642", // Poisonous Cloud
      // ATWEAKS_SPELLS.Cloudkill,
      // ATWEAKS_SPELLS.WallOfFog,
      // ATWEAKS_SPELLS.FogCloud,
      // ATWEAKS_SPELLS.ToxicVapors,
      // ATWEAKS_SPELLS.OozeStinkingCloud,
      // ATWEAKS_SPELLS.SolidFog,
      // ATWEAKS_SPELLS.StinkingCloud,
    ],
  },
  {
    name: "colorSpray",
    spells: [
      SPELLS.Wizard.ColorSpray.file,
      SPELLS.Innate.MephitColorSpray.file,
      // ATWEAKS_SPELLS.ColorSpray,
      // ATWEAKS_SPELLS.ColorSprayRadiant,
    ],
  },
  {
    name: "confusion",
    spells: [
      SPELLS.Priest.Chaos.file, // Confusion (priest version)
      SPELLS.Wizard.Confusion.file, // Confusion (wizard version)
      "SPIN582", // Confusion
      "SPIN704", // Confusion
      "SPIN839", // Confusion
      "SPIN976", // Confusion
      "SPPR983", // Confusion
      "MISC3M", // Confusion (Divine Remix)
      "A#SHA07", // Confusion (Divine Remix)
      // ATWEAKS_SPELLS.Confusion,
    ],
  },
  {
    name: "curePoison",
    idsSpells: [],
    spells: [
      "SPPR404", // Neutralize Poison
      "cdilnps", // Neutralize Poison (mod)
      "scrl08", // Neutralize Poison (IR)
      "SPIN201", // Neutralize Poison
    ],
  },
  {
    name: "causeWounds",
    idsSpells: [
      { id: "CLERIC_CAUSE_MEDIUM_WOUNDS" }, // Cause medium Wounds (IWDification)
    ],
    spells: [
      SPELLS.Priest.CauseModerateWounds.file, // Cause moderate Wounds (IWDification)
      SPELLS.Priest.CauseLightWounds.file, // Cause Light Wounds (IWDification)
      SPELLS.Priest.MassCauseLightWounds.file, // Mass Cause Light Wounds (IWDification)
      "SPIN202", // Cause Serious Wounds
      "SPIN551", // Cause Serious Wounds (Hive Mother)
      "SPIN986", // Cause Serious Wounds (Beholder)
      SPELLS.Priest.CauseSeriousWounds.file, // Cause Serious Wounds
      "SPPR510", // Cause critical Wounds
      SPELLS.Priest.Harm.file, // Harm
      "sppr699", // Harm
      // ATWEAKS_SPELLS.MarilithCauseSeriousWounds,
      // ATWEAKS_SPELLS.CauseSeriousWounds,
      // ATWEAKS_SPELLS.CauseCriticalWounds,
      // ATWEAKS_SPELLS.Harm,
    ],
  },
  {
    name: "cureWounds",
    idsSpells: [
      { id: "CLERIC_CURE_MODERATE_WOUNDS" }, // Cure moderate Wounds  (IWDification)
      { id: "CLERIC_CURE_MEDIUM_WOUNDS" }, // Cure Medium Wounds  (Spell Revisions)
    ],
    spells: [
      SPELLS.Priest.CureLightWounds.file, // Cure Light Wounds
      "A#JUSTCL", // Cure Light Wounds (Divine Remix)
      "ca#culw", // Cure Light Wounds (PnP Deva)
      "L#KORIEP", // Cure Light Wounds (mod)
      "A7Q6CURE", // Cure Light Wounds (afaaq)
      "SPPR401", // Cure Serious Wounds
      "CA#CURSW", // Cure Serious Wounds (PnP Deva)
      "SPIN200", // Cure Serious Wounds
      "SPIN958", // Cure Serious Wounds
      "SPPR502", // Cure Critical Wounds
      "SPPR514", // Mass Cure
      "A#RE11", // Mass Cure (Divine Remix)
      "DVMCURE", // Mass Cure (IR/SR)
      "SPPR607", // Heal
      "SPWM168", // Heal (Wild Mage)
      "SPWISH39", // Heal
      "spin711", // Heal
      "spin679", // Heal
      "SPIN101", // Cure Light Wounds (Bhaalpower)
      "FINP101", // Cure Light Wounds (TOB Bhaalpower Ascension)
      "SPCL211", // Paladin Lay On Hands
      "BHAAL1A", // Mass Healing (Bhaalpower restored by Ascension/UB)
      // ATWEAKS_SPELLS.CureLightWounds,
      // ATWEAKS_SPELLS.TempleMassCure,
    ],
  },
  {
    name: "death",
    spells: [
      "SPWI605", // Death Spell
      "cdxvdth", // Death Spell (mod)
    ],
  },
  {
    name: "disease",
    spells: [
      SPELLS.Priest.CauseDisease.file, // Cause Disease (IWDification)
      "SPWI409", // Contagion
      // ATWEAKS_SPELLS.CauseDisease,
      // ATWEAKS_SPELLS.PitFiendDisease,
      // ATWEAKS_SPELLS.GhoulLordDisease,
      // ATWEAKS_SPELLS.MummyDisease,
      // ATWEAKS_SPELLS.GreaterMummyDisease,
      // ATWEAKS_SPELLS.ZombieSeaDisease,
      // ATWEAKS_SPELLS.SporeExplosionDisease,
      // ATWEAKS_SPELLS.BoaliskDisease,
    ],
  },
  {
    name: "earthquake",
    spells: [
      "SPOGRE01", // Earthquake (Ogremoch)
      "SPPR720", // Earthquake (Priest version)
      "CA#EQ", // Earthquake (PnP Deva)
      "CDTLQAK", // Earthquake (mod)
      // ATWEAKS_SPELLS.Earthquake,
      // ATWEAKS_SPELLS.RockToMud,
    ],
  },
  {
    name: "electrical",
    idsSpells: [
      { id: "CLERIC_STATIC_CHARGE" }, // Static Charge (IWDification)
    ],
    spells: [
      "CDSTAF12", // Lightning Bolt
      "SPCL722", // Lightning Bolt
      "SPIN579", // Lightning Bolt
      "SPIN714", // Lightning Bolt
      "SPIN932", // Lightning Bolt
      "SPIN933", // Lightning Bolt
      "SIN989", // Lightning Bolt
      "SPWI002", // Lightning Bolt
      "SPWI017", // Minor Lightning Bolt
      "SPWI025", // Minor Lightning Bolt
      "SPWI026", // Minor Lightning Bolt
      "SPWI027", // Minor Lightning Bolt
      SPELLS.Wizard.LightningBolt.file, // Lightning Bolt
      "SPWI399", // Lightning Bolt
      "SPWI997", // Lightning Bolt
      "SPDR601", // Chain Lightning
      SPELLS.Wizard.ChainLightning.file, // Chain Lightning
      "SPBLUN29", // Chain Lightning
      SPELLS.Priest.CallLightning.file, // Call Lightning
      "SPPR987", // Call Lightning
      "SPIN597", // Blue Dragon Lightning Breath
      // ATWEAKS_SPELLS.LightningBolt,
    ],
  },
  {
    name: "entangle",
    spells: [
      SPELLS.Priest.Entangle.file, // Entangle (Priest)
      "SPWM111", // Entangle (Wild Mage)
      "SPIN688", // Plant Growth (Black Dragon)
      "BDBOW06", // Entangle (Hamadryad SoD ?)
      // ATWEAKS_SPELLS.ShamblerEntangle,
      // ATWEAKS_SPELLS.HamadryadEntangle,
    ],
  },
  {
    name: "fatigue",
    spells: [
      "SPWI508", // Waves of Fatigue
    ],
  },
  {
    name: "fear",
    spells: [
      "SPIN203", // Cloak of Fear
      "SPIN536", // Fear
      "SPIN807", // Salyer Fear
      "SPIN882", // Vampire Fear
      "SPIN890", // Demon Fear
      "SPIN895", // Dragon Fear
      "SPIN981", // Fear
      SPELLS.Priest.CloakOfFear.file, // Cloak of Fear
      SPELLS.Priest.SymbolWeakness.file, // Symbol, Fear
      SPELLS.Wizard.Spook.file, // Spook
      SPELLS.Wizard.Horror.file, // Horror
      "SPWI811", // Symbol, Fear
      "SPWI899", // Symbol, Fear
      "SPWI956", // Symbol, Fear
      "SPWM123", // Symbol, Fear
      "dw#licfi", // Fear Aura
      "ca#sfear", // Symbol, Fear
      "A^causfr", // Cause Fear
      "DVFEARSM", // Panic
      "DVHORRO", // Panic
      // ATWEAKS_SPELLS.Fear1,
      // ATWEAKS_SPELLS.Fear2,
      // ATWEAKS_SPELLS.Fear3,
      // ATWEAKS_SPELLS.CauseFear,
      // ATWEAKS_SPELLS.AuraOfFear1,
      // ATWEAKS_SPELLS.AuraOfFear2,
      // ATWEAKS_SPELLS.BlastOfFear,
      // ATWEAKS_SPELLS.CloakOfFear,
      // ATWEAKS_SPELLS.SymbolFear,
    ],
  },
  {
    name: "fire",
    idsSpells: [
      { id: "WIZARD_BELTYNS_BURNING_BLOOD" }, // Beltyn's Burning Blood (IWDification)
      { id: "CLERIC_SUNSCORCH" }, // Sunscorch (IWDification)
      { id: "CLERIC_PRODUCE_FIRE" }, // Produe Fire (IWDification)
    ],
    spells: [
      SPELLS.Wizard.ShroudOfFlame.file, // Shroud of Flame (IWDification)
      "SPIN561", // Fire Giant Lava Pit (FIRE_GIANT_LAVA)
      "SPIN819", // Lava Burst (LAVA_BURST)
      "SPWI022", // Lava Pit (TRAP_MUCK)
      SPELLS.Wizard.BurningHands.file, // Burning Hands
      "SPIN131", // Burning Hands
      SPELLS.Wizard.AgannazarScorcher.file, // Agannazar's Scorcher
      "SPWI940", // Agannazar's Scorcher
      SPELLS.Wizard.Fireball.file, // Fireball
      "DVFBALL", // Fireball (IRR + SRR)
      "SPIN160", // Breath Fireball
      "SPWI001", // Fireball
      "SPWI957", // Fireball
      "WAND05", // Fireball (IRR)
      SPELLS.Wizard.Fireburst.file, // Sunfire
      "CDSLSUN", // Sunfire (mod)
      "A#KOS09", // Sunfire (Divine Remix)
      "SPWI712", // Delayed Blast Fireball
      "A#KOS14", // Delayed Blast Fireball (Divine Remix)
      "SPWI810", // Incendiary Cloud
      "DW#TRPIN", // Incendiary Cloud (Stratagems)
      "SPWI911", // Meteor Swarm
      "SPWI922", // Dragon's Breath
      "SPIN719", // Meteor Swarm
      "SPWISH24", // Meteor Swarm
      "DW#TRPMS", // Meteor Swarm (Stratagems)
      "SPPR705", // Fire Storm
      "CA#FSTOM", // Fire Storm (PnP Deva)
      // ATWEAKS_SPELLS.PitFiendFireball,
      // ATWEAKS_SPELLS.BurningHand,
      // ATWEAKS_SPELLS.SunfireBlazingGloryBuckler,
      // ATWEAKS_SPELLS.FireStorm,
      // ATWEAKS_SPELLS.FlameFan,
      // ATWEAKS_SPELLS.FlameJet,
      // ATWEAKS_SPELLS.HeatAura,
      // ATWEAKS_SPELLS.HeatEmission,
      // ATWEAKS_SPELLS.ImixHeatEmission,
      // ATWEAKS_SPELLS.ImixFireball,
      // ATWEAKS_SPELLS.ZaamanRulFireball,
      // ATWEAKS_SPELLS.Burn,
      // ATWEAKS_SPELLS.Engulf,
      // ATWEAKS_SPELLS.WallOfFire,
      // ATWEAKS_SPELLS.FireBreath,
    ],
  },
  {
    name: "flameArrow",
    spells: ["d5f2303", "d5p2303", "d5p2303W", "d5y391i", SPELLS.Wizard.FlameArrow.file, "SPWI888"],
  },
  {
    name: "fireball",
    spells: [
      "BDBLOWUP",
      "BDDAUSTO",
      "BDKORLAS",
      "BDMORLIS",
      "c0ausp03",
      "SPWI001",
      SPELLS.Wizard.Fireball.file,
      "SPIN957",
      "wand05a",
    ],
  },
  {
    name: "globeOfInvulnerability",
    spells: [
      "spwi602",
      "DWSW602", // Stratagems Cast Previously
      "DW#mlglb", // Stratagems
    ],
  },
  {
    name: "ground",
    spells: [
      "SPIN561", // Fire Giant Lava Pit (FIRE_GIANT_LAVA)
      "SPIN819", // Lava Burst (LAVA_BURST)
      "SPIN994", // Acid Pools in Durlag's Tower (ACID_DAMAGE_1)
      "SPWI022", // Lava Pit (TRAP_MUCK)
      "SPIN914", // Mimic Glue
      "SPWI101", // Grease
      "SPOGRE01", // Earthquake (Ogremoch)
      "SPPR720", // Earthquake (Priest version)
      "CA#EQ", // Earthquake (PnP Deva)
      "CDTLQAK", // Earthquake (mod)
      // ATWEAKS_SPELLS.Earthquake,
      // ATWEAKS_SPELLS.RockToMud,
    ],
  },
  {
    name: "hold",
    spells: [
      SPELLS.Priest.HoldPerson.file, // Hold Person
      SPELLS.Wizard.HoldPerson.file, // Hold Person
    ],
  },
  {
    name: "illusion",
    spells: [
      SPELLS.Priest.BlindingBeauty.file, //Nature's beauty
      SPELLS.Wizard.ObscuringMist.file, //Blindness
      "IKDB2", //Spook (mod)
      SPELLS.Wizard.Spook.file, //Spook
      "spwi223", //Deafness
      "spwm178", //Blindness (Wild mage)
    ],
  },
  {
    name: "insect",
    spells: [
      SPELLS.Priest.SummonInsects.file, // Summon Insects
      "SPPR517", // Insect Plague
      "SPPR717", // Creeping Doom
      "SPIN689", // Summon Insects (Black Dragon)
      "DW#VBAT1", // Bat Cloud (SCSII)
      "DW#VBAT2", // Bat Cloud (SCSII)
      "CA#IPLAG", // Insect Plague (PnP Deva)
      "U#HFDTPD", // Insect Plague (Ruad)
    ],
  },
  {
    name: "lightningBolt",
    spells: [
      "b_tal10",
      "c0dm302",
      "spcl722",
      "spdr301",
      "spin714",
      "spin933",
      "spin989",
      "SPWI002",
      "SPWI017",
      "SPWI231",
      SPELLS.Wizard.LightningBolt.file,
      "SPWI399",
      "SPWI997",
      "wand07",
    ],
  },
  {
    name: "magicMissile",
    spells: [
      SPELLS.Wizard.MordenkainenForceMissiles.file, // Mordenkainen's Force Missiles (IWDification)
      `${SPELLS.Wizard.MordenkainenForceMissiles.file}B`, // Mordenkainen's Force Missiles (IWDification)
      "SPWI003", // Magic Missile
      SPELLS.Wizard.MagicMissiles.file, // Magic Missile
      // ATWEAKS_SPELLS.MagicMissile,
    ],
  },
  {
    name: "maze",
    spells: ["SPIN774", "SPWI813", "BDZHADRO"],
  },
  {
    name: "minorGlobeOfInvulnerability",
    spells: [
      SPELLS.Wizard.MinorGlobeOfInvulnerability.file,
      "RR#WI406", // used by RR for Selina's Amulet
      "SPWM126", // Wild Mage
      "DWSW406", // Stratagems Cast Previously
    ],
  },
  {
    name: "necromancyEffects",
    spells: [
      SPELLS.Priest.HolySmite.file, // Holy Smite
      SPELLS.Priest.UnholyBlight.file, // Unholy Blight
      "spwi117", // Chill Touch
      "spwi117d", // Chill Touch
      "spwi119", // Larloch's Minor Drain
      "spwi221", // Ray of Enfeeblement
      SPELLS.Wizard.SkullTrap.file, // Skull Trap
      SPELLS.Wizard.VampiricTouch.file, // Vampiric Touch
      "spwi812", // Abi-Dalzim's Horrid Wilting
      "spwi812d", // Abi-Dalzim's Horrid Wilting
      "spwi914", // Larloch's Energy Drain
    ],
  },
  {
    name: "petrification",
    spells: [
      SPELLS.Wizard.FleshToStone.file, // Flesh to Stone
      "SPWI604D", // Flesh to Stone
    ],
  },
  {
    name: "poison",
    spells: [
      "SPWI016", // Cloudkill (trap)
      SPELLS.Wizard.Cloudkill.file, // Cloudkill
      "dvckill", // Cloudkill (IR/SR)
      "SPIN979", // Golem Gas Cloud
      "SPIN642", // Poisonous Cloud
      // ATWEAKS_SPELLS.Cloudkill,
      // ATWEAKS_SPELLS.SpiderPoisonClassF,
      // ATWEAKS_SPELLS.WraithSpiderPoisonClassF,
    ],
  },
  {
    name: "polymorph",
    spells: [
      "SPIN538", // Polymorph Other
      "SPWI415", // Polymorph Other
      "CA#PAOO", // Polymorph Other (Pnp Celestial)
    ],
  },
  {
    name: "web",
    spells: [
      "SPDR201", // Web (druid version)
      "SPIN566", // Mimic Web
      SPELLS.Innate.VortexWeb.file, // Vortex web
      "SPIN683", // Web Tangle
      SPELLS.Wizard.Web.file, // Web (wizard version)
      "D0SPIWEB", // Web (D0QUESTPACK)
      "ETTERWEB", // Web (heartwood)
      "spletter", // Web (heartwood)
      "wand14", // Web (IR/IRR)
      "wtpin05", // Web (wtp familiar)
      // ATWEAKS_SPELLS.WebTangle,
      // ATWEAKS_SPELLS.WraithWeb,
      // ATWEAKS_SPELLS.Web,
    ],
  },
];

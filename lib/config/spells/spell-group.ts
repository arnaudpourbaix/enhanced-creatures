import { SpellGroup } from "../../src/model/spell-item/spell-group";
import { SPELLS } from "./spell-names";

export const SPELL_GROUPS: SpellGroup[] = [
  {
    name: "acidSpells",
    idsSpells: [
      { id: "WIZARD_VITRIOLIC_SPHERE" }, // Vitriolic Sphere (IWDification)
      { id: "WIZARD_ACID_STORM" }, // Acid Storm (IWDification)
    ],
    spells: [
      "SPIN994", // Acid Pools in Durlag's Tower (ACID_DAMAGE_1)
      "SPWI614", // Death Fog
      "A#CYR11", // Death Fog (Divine Remix)
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
      { id: "CLERIC_CLOUD_OF_PESTILENCE" }, // Sunscorch (IWDification)
      { id: "CLERIC_SUNSCORCH" }, // Cloud of Pestilence (IWDification)
    ],
    spells: [
      "spdr101.spl", // Chromatic Orb
      "spin595.spl", // Yellow Dragon Scorching Sand
      "spin878.spl", // Level Drain
      "spin893.spl", // Shadow Dragon Breath
      "spin929.spl", // Mist Ball
      "spin931.spl", // Sooty Ball
      "sppr704.spl", // Nature's Beauty
      "sppr707.spl", // Sunray
      "spwi106.spl", // Blindness
      "spwi118.spl", // Chromatic Orb
      "spwi224.spl", // Glitterdust
      "spwi714.spl", // Prismatic Spray
      "spwi815.spl", // Power Word, Blind
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
      "sppr313.spl", // SpellPack b6
      // TODO: check these - not found in any installed mod (SpellPack itself isn't installed
      // locally to check directly; sppr614c.spl exists as a same-named resource inside
      // Stratagems' own files, but that doesn't confirm it's actually SpellPack's - see
      // TODO_ROADMAP.md):
      "sppr614c.spl", // SpellPack b6
      "sppr614d.spl", // SpellPack b6
      "spwi224c.spl", // SpellPack b6
      "halb06.spl", // IR/IRR
      "sw1h51.spl", // IR/IRR
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
      "SPWI404", // Ice Storm
      "SPWI503", // Cone of Cold
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
    idsSpells: [
      { id: "CLERIC_CLOUD_OF_PESTILENCE" }, // Cloud of Pestilence (IWDification)
    ],
    spells: [
      "SPWI004", // Stinking Cloud (trap)
      "SPWI016", // Cloudkill (trap)
      "SPWI213", // Stinking Cloud
      "SPWI502", // Cloudkill
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
      "SPPR709", // Confusion (priest version)
      "SPWI401", // Confusion (wizard version)
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
      { id: "CLERIC_CAUSE_MODERATE_WOUNDS" }, // Cause moderate Wounds (IWDification)
      { id: "CLERIC_CAUSE_LIGHT_WOUNDS" }, // Cause Light Wounds (IWDification)
      { id: "CLERIC_CAUSE_MEDIUM_WOUNDS" }, // Cause medium Wounds (IWDification)
      { id: "CLERIC_MASS_CAUSE_LIGHT_WOUNDS" }, // Mass Cause Light Wounds (IWDification)
    ],
    spells: [
      "SPIN202", // Cause Serious Wounds
      "SPIN551", // Cause Serious Wounds (Hive Mother)
      "SPIN986", // Cause Serious Wounds (Beholder)
      "SPPR414", // Cause Serious Wounds
      "SPPR510", // Cause critical Wounds
      "sppr608", // Harm
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
      "SPPR103", // Cure Light Wounds
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
    idsSpells: [
      { id: "CLERIC_CAUSE_DISEASE" }, // Cause Disease (IWDification)
    ],
    spells: [
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
      "SPWI308", // Lightning Bolt
      "SPWI399", // Lightning Bolt
      "SPWI997", // Lightning Bolt
      "SPDR601", // Chain Lightning
      "SPWI615", // Chain Lightning
      "SPBLUN29", // Chain Lightning
      "SPPR302", // Call Lightning
      "SPPR987", // Call Lightning
      "SPIN597", // Blue Dragon Lightning Breath
      // ATWEAKS_SPELLS.LightningBolt,
    ],
  },
  {
    name: "entangle",
    idsSpells: [
      { id: "WIZARD_CHARM_PLANTS" }, // Charm plants (SpellPack)
    ],
    spells: [
      "SPPR105", // Entangle (Priest)
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
    idsSpells: [
      { id: "WIZARD_EMOTION_FEAR" }, // SpellPack Charm plants
    ],
    spells: [
      "SPIN203", // Cloak of Fear
      "SPIN536", // Fear
      "SPIN807", // Salyer Fear
      "SPIN882", // Vampire Fear
      "SPIN890", // Demon Fear
      "SPIN895", // Dragon Fear
      "SPIN981", // Fear
      "SPPR416", // Cloak of Fear
      "SPPR706", // Symbol, Fear
      "SPWI125", // Spook
      "SPWI205", // Horror
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
      { id: "WIZARD_SHROUD_OF_FLAME" }, // Shroud of Flame (IWDification)
      { id: "CLERIC_SUNSCORCH" }, // Sunscorch (IWDification)
      { id: "CLERIC_PRODUCE_FIRE" }, // Produe Fire (IWDification)
      { id: "CLERIC_WALL_OF_FIRE" }, // Wall of Fire (SpellPack)
    ],
    spells: [
      "SPIN561", // Fire Giant Lava Pit (FIRE_GIANT_LAVA)
      "SPIN819", // Lava Burst (LAVA_BURST)
      "SPWI022", // Lava Pit (TRAP_MUCK)
      "SPWI103", // Burning Hands
      "SPIN131", // Burning Hands
      "SPWI217", // Agannazar's Scorcher
      "SPWI940", // Agannazar's Scorcher
      "SPWI304", // Fireball
      "DVFBALL", // Fireball (IRR + SRR)
      "SPIN160", // Breath Fireball
      "SPWI001", // Fireball
      "SPWI957", // Fireball
      "WAND05", // Fireball (IRR)
      "SPWI523", // Sunfire
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
    spells: ["d5f2303", "d5p2303", "d5p2303W", "d5y391i", "SPWI303", "SPWI888"],
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
      "SPWI304",
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
      "SPPR208", // Hold Person
      "SPWI306", // Hold Person
    ],
  },
  {
    name: "illusion",
    spells: [
      "sppr704", //Nature's beauty
      "spwi106", //Blindness
      "IKDB2", //Spook (mod)
      "spwi125", //Spook
      "spwi223", //Deafness
      "spwm178", //Blindness (Wild mage)
    ],
  },
  {
    name: "insect",
    spells: [
      "SPPR319", // Summon Insects
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
      "SPWI308",
      "SPWI399",
      "SPWI997",
      "wand07",
    ],
  },
  {
    name: "magicMissile",
    idsSpells: [
      {
        id: "WIZARD_MORDENKAINENS_FORCE_MISSILES",
        suffixes: ["B"],
      }, // Mordenkainen's Force Missiles (IWDification)
    ],
    spells: [
      "SPWI003", // Magic Missile
      "SPWI112", // Magic Missile
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
      "spwi406",
      "RR#WI406", // used by RR for Selina's Amulet
      "SPWM126", // Wild Mage
      "DWSW406", // Stratagems Cast Previously
    ],
  },
  {
    name: "necromancyEffects",
    spells: [
      "sppr313", // Holy Smite
      "sppr314", // Unholy Blight
      "spwi117", // Chill Touch
      "spwi117d", // Chill Touch
      "spwi119", // Larloch's Minor Drain
      "spwi221", // Ray of Enfeeblement
      "spwi313", // Skull Trap
      "spwi314", // Vampiric Touch
      "spwi812", // Abi-Dalzim's Horrid Wilting
      "spwi812d", // Abi-Dalzim's Horrid Wilting
      "spwi914", // Larloch's Energy Drain
    ],
  },
  {
    name: "petrification",
    spells: [
      "SPWI604", // Flesh to Stone
      "SPWI604D", // Flesh to Stone
    ],
  },
  {
    name: "poison",
    spells: [
      "SPWI016", // Cloudkill (trap)
      "SPWI502", // Cloudkill
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
      "SPIN575", // Vortex web
      "SPIN683", // Web Tangle
      "SPWI215", // Web (wizard version)
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

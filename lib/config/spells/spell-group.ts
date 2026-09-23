import { SpellGroup } from "../../src/model/spell-item/spell-group";
import { spellsByKeyword } from "../../src/model/spell-item/spell-reference";
import { SPELLS } from "./spell-database";

export const SPELL_GROUPS: SpellGroup[] = [
  {
    name: "acidSpells",
    spells: [
      ...spellsByKeyword(SPELLS, "acid"),
      "SPIN994", // Acid Pools in Durlag's Tower (ACID_DAMAGE_1)
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
    spells: [
      ...spellsByKeyword(SPELLS, "blind"),
      "spdr101.spl", // Chromatic Orb
      "spin595.spl", // Yellow Dragon Scorching Sand
      "spin878.spl", // Level Drain
      "spin893.spl", // Shadow Dragon Breath
      "spin929.spl", // Mist Ball
      "spin931.spl", // Sooty Ball
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
    spells: [
      ...spellsByKeyword(SPELLS, "cold"),
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
      ...spellsByKeyword(SPELLS, "cloud"),
      "SPWI004", // Stinking Cloud (trap)
      "SPWI016", // Cloudkill (trap)
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
      ...spellsByKeyword(SPELLS, "confusion"),
      "SPIN582", // Confusion
      "SPIN704", // Confusion
      "SPIN839", // Confusion
      "SPIN976", // Confusion
      "SPPR983", // Confusion
      // ATWEAKS_SPELLS.Confusion,
    ],
  },
  {
    name: "curePoison",
    idsSpells: [],
    spells: [
      SPELLS.Priest.NeutralizePoison.file,
      "cdilnps", // Neutralize Poison (mod)
      "scrl08", // Neutralize Poison (IR)
      "SPIN201", // Neutralize Poison
    ],
  },
  {
    name: "causeWounds",
    spells: [
      ...spellsByKeyword(SPELLS, "causeWounds"),
      "SPIN202", // Cause Serious Wounds
      "SPIN551", // Cause Serious Wounds (Hive Mother)
      "SPIN986", // Cause Serious Wounds (Beholder)
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
      SPELLS.Priest.CureLightWounds.file,
      "ca#culw", // Cure Light Wounds (PnP Deva)
      "L#KORIEP", // Cure Light Wounds (mod)
      "A7Q6CURE", // Cure Light Wounds (afaaq)
      SPELLS.Priest.CureSeriousWounds.file,
      "CA#CURSW", // Cure Serious Wounds (PnP Deva)
      "SPIN200", // Cure Serious Wounds
      "SPIN958", // Cure Serious Wounds
      SPELLS.Priest.CureCriticalWounds.file,
      SPELLS.Priest.MassCure.file,
      "DVMCURE", // Mass Cure (IR/SR)
      SPELLS.Priest.Heal.file,
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
      ...spellsByKeyword(SPELLS, "death"),
      "cdxvdth", // Death Spell (mod)
    ],
  },
  {
    name: "disease",
    spells: [
      ...spellsByKeyword(SPELLS, "disease"),
      SPELLS.Priest.CauseDisease.file,
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
      SPELLS.Priest.Earthquake.file,
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
      ...spellsByKeyword(SPELLS, "electrical"),
      "CDSTAF12", // Lightning Bolt
      "SPCL722", // Lightning Bolt
      "SPIN579", // Lightning Bolt
      "SPIN714", // Lightning Bolt
      "SPIN932", // Lightning Bolt
      "SPIN933", // Lightning Bolt
      "SIN989", // Lightning Bolt
      "SPWI002", // Lightning Bolt
      "SPWI025", // Minor Lightning Bolt
      "SPWI026", // Minor Lightning Bolt
      "SPWI027", // Minor Lightning Bolt
      "SPWI399", // Lightning Bolt
      "SPWI997", // Lightning Bolt
      "SPDR601", // Chain Lightning
      "SPBLUN29", // Chain Lightning
      "SPPR987", // Call Lightning
      "SPIN597", // Blue Dragon Lightning Breath
      // ATWEAKS_SPELLS.LightningBolt,
    ],
  },
  {
    name: "entangle",
    spells: [
      SPELLS.Priest.Entangle.file,
      "SPWM111", // Entangle (Wild Mage)
      "SPIN688", // Plant Growth (Black Dragon)
      "BDBOW06", // Entangle (Hamadryad SoD ?)
      // ATWEAKS_SPELLS.ShamblerEntangle,
      // ATWEAKS_SPELLS.HamadryadEntangle,
    ],
  },
  {
    name: "fatigue",
    spells: [SPELLS.Wizard.WavesOfFatigue.file],
  },
  {
    name: "fear",
    spells: [
      ...spellsByKeyword(SPELLS, "fear"),
      "SPIN203", // Cloak of Fear
      "SPIN536", // Fear
      "SPIN807", // Salyer Fear
      "SPIN882", // Vampire Fear
      "SPIN890", // Demon Fear
      "SPIN895", // Dragon Fear
      "SPIN981", // Fear
      SPELLS.Priest.SymbolWeakness.file,
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
      ...spellsByKeyword(SPELLS, "fire"),
      "SPIN561", // Fire Giant Lava Pit (FIRE_GIANT_LAVA)
      "SPIN819", // Lava Burst (LAVA_BURST)
      "SPWI022", // Lava Pit (TRAP_MUCK)
      "SPIN131", // Burning Hands
      "SPWI940", // Agannazar's Scorcher
      "DVFBALL", // Fireball (IRR + SRR)
      "SPIN160", // Breath Fireball
      "SPWI001", // Fireball
      "SPWI957", // Fireball
      "WAND05", // Fireball (IRR)
      "CDSLSUN", // Sunfire (mod)
      "DW#TRPIN", // Incendiary Cloud (Stratagems)
      "SPIN719", // Meteor Swarm
      "SPWISH24", // Meteor Swarm
      "DW#TRPMS", // Meteor Swarm (Stratagems)
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
      SPELLS.Wizard.GlobeOfInvulnerability.file,
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
      SPELLS.Wizard.Grease.file,
      "SPOGRE01", // Earthquake (Ogremoch)
      SPELLS.Priest.Earthquake.file,
      "CA#EQ", // Earthquake (PnP Deva)
      "CDTLQAK", // Earthquake (mod)
      // ATWEAKS_SPELLS.Earthquake,
      // ATWEAKS_SPELLS.RockToMud,
    ],
  },
  {
    name: "hold",
    spells: [...spellsByKeyword(SPELLS, "hold")],
  },
  {
    name: "illusion",
    spells: [
      SPELLS.Priest.BlindingBeauty.file,
      SPELLS.Wizard.ObscuringMist.file,
      "IKDB2", //Spook (mod)
      SPELLS.Wizard.Spook.file,
      SPELLS.Wizard.Deafness.file,
      "spwm178", //Blindness (Wild mage)
    ],
  },
  {
    name: "insect",
    spells: [
      SPELLS.Priest.SummonInsects.file,
      SPELLS.Priest.InsectPlague.file,
      SPELLS.Priest.CreepingDoom.file,
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
      SPELLS.Wizard.MinorLightningBolt.file,
      SPELLS.Wizard.LightningBolt.file,
      "b_tal10",
      "c0dm302",
      "spcl722",
      "spdr301",
      "spin714",
      "spin933",
      "spin989",
      "SPWI002",
      "SPWI231",
      "SPWI399",
      "SPWI997",
      "wand07",
    ],
  },
  {
    name: "magicMissile",
    spells: [
      SPELLS.Wizard.MagicMissiles.file,
      SPELLS.Wizard.MordenkainenForceMissiles.file,
      `${SPELLS.Wizard.MordenkainenForceMissiles.file}B`,
      "SPWI003", // Magic Missile
      // ATWEAKS_SPELLS.MagicMissile,
    ],
  },
  {
    name: "maze",
    spells: [...spellsByKeyword(SPELLS, "maze"), "SPIN774", "BDZHADRO"],
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
      SPELLS.Priest.HolySmite.file,
      SPELLS.Priest.UnholyBlight.file,
      SPELLS.Wizard.ChillTouch.file,
      "spwi117d", // Chill Touch
      SPELLS.Wizard.LarlochMinorDrain.file,
      SPELLS.Wizard.RayOfEnfeeblement.file,
      SPELLS.Wizard.SkullTrap.file,
      SPELLS.Wizard.VampiricTouch.file,
      SPELLS.Wizard.AbiDalzimHorridWilting.file,
      "spwi812d", // Abi-Dalzim's Horrid Wilting
      SPELLS.Wizard.LarlochEnergyDrain.file,
    ],
  },
  {
    name: "petrification",
    spells: [
      ...spellsByKeyword(SPELLS, "petrify"),
      "SPWI604D", // Flesh to Stone
    ],
  },
  {
    name: "poison",
    spells: [
      ...spellsByKeyword(SPELLS, "poison"),
      "SPWI016", // Cloudkill (trap)
      "SPIN979", // Golem Gas Cloud
      "SPIN642", // Poisonous Cloud
      "dvckill", // Cloudkill (IR/SR)
      // ATWEAKS_SPELLS.Cloudkill,
      // ATWEAKS_SPELLS.SpiderPoisonClassF,
      // ATWEAKS_SPELLS.WraithSpiderPoisonClassF,
    ],
  },
  {
    name: "polymorph",
    spells: [
      ...spellsByKeyword(SPELLS, "polymorph"),
      "SPIN538", // Polymorph Other
      "CA#PAOO", // Polymorph Other (Pnp Celestial)
    ],
  },
  {
    name: "web",
    spells: [
      SPELLS.Wizard.Web.file,
      SPELLS.Innate.VortexWeb.file,
      "SPDR201", // Web (druid version)
      "SPIN566", // Mimic Web
      "SPIN683", // Web Tangle
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

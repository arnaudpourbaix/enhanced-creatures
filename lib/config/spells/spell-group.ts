import { SpellGroup } from "../../src/model/spell-item/spell-group";
import { SPELLS } from "./spell-database";

/**
 * Spell/item resources per group, for immunities and other effects that need "every X spell" (see
 * weiduFunctionService.generateSpellResources). Each group is named after a SpellKeyword and
 * automatically gathers every SPELLS entry and every spell created by this mod tagged with it -
 * `spells` only lists what no keyword can reach (other mods' files, items, unregistered innates).
 */
export const SPELL_GROUPS: SpellGroup[] = [
  {
    name: "acid",
    spells: [
      "SPIN994", // Acid Pools in Durlag's Tower (ACID_DAMAGE_1)
      "SPIN596", // Brown Dragon Acid Breath
      "SPIN691", // Black Dragon Breath
      "SPIN913", // Mimic Acid
    ],
  },
  {
    name: "bleeding",
    spells: [],
  },
  {
    name: "blind",
    spells: [
      "spdr101", // Chromatic Orb
      "spin595", // Yellow Dragon Scorching Sand
      "spin878", // Level Drain
      "spin893", // Shadow Dragon Breath
      "spin929", // Mist Ball
      "spin931", // Sooty Ball
      "spwi958", // Power Word, Blind
      "spwm178", // Blindness
      "chalcy2.itm", // The Shadow's Blade +3
      "gorwom4.itm", // Drow Flail +3
      "halb06.itm", // Blackmist +4
      "sorb.itm", // Searing Orb
      "sw1h51.itm", // Celestial Fury +3
      "wand19.itm", // Wand of Cursing
      "wand19", // IR/IRR
      "wand19d", // IR/IRR
    ],
  },
  {
    name: "cold",
    spells: [
      "d1#wi503", // Cone of Cold (mod)
      "DVCONEC", // Cone of Cold (IR)
      "SPCRYO01", // Cone of Cold (mod)
      "SPIN133", // Cone of Cold (mod)
      "SPIN158", // Cone of Cold (mod)
      "SPIN162", // Cone of Cold (mod)
      "SPIN833", // Dragon Cone of Cold
      "WAND06", // Cone of Cold (IR)
    ],
  },
  {
    name: "cloud",
    spells: [
      "SPIN642", // Poisonous Cloud
      "SPIN673", // Cloudkill
      "SPIN940", // Stinking Cloud (mephit)
      "SPIN979", // Golem Gas Cloud
      "SPWI004", // Stinking Cloud (trap)
      "SPWI016", // Cloudkill (trap)
      "DW#TRPIN", // Incendiary Cloud (Stratagems)
      "dvckill", // Cloudkill (IR/SR)
    ],
  },
  {
    name: "colorSpray",
    spells: [],
  },
  {
    name: "confusion",
    spells: [
      "SPIN582", // Confusion
      "SPIN704", // Confusion
      "SPIN839", // Confusion
      "SPIN976", // Confusion
      "SPPR983", // Confusion
    ],
  },
  {
    name: "curePoison",
    idsSpells: [],
    spells: [
      "cdilnps", // Neutralize Poison (mod)
      "scrl08", // Neutralize Poison (IR)
      "SPIN201", // Neutralize Poison
    ],
  },
  {
    name: "causeWounds",
    spells: [
      "SPIN202", // Cause Serious Wounds
      "SPIN551", // Cause Serious Wounds (Hive Mother)
      "SPIN986", // Cause Serious Wounds (Beholder)
      "sppr699", // Harm
    ],
  },
  {
    name: "cureWounds",
    spells: [
      "ca#culw", // Cure Light Wounds (PnP Deva)
      "L#KORIEP", // Cure Light Wounds (mod)
      "A7Q6CURE", // Cure Light Wounds (afaaq)
      "CA#CURSW", // Cure Serious Wounds (PnP Deva)
      "SPIN200", // Cure Serious Wounds
      "SPIN958", // Cure Serious Wounds
      "DVMCURE", // Mass Cure (IR/SR)
      "SPWM168", // Heal (Wild Mage)
      "SPWISH39", // Heal
      "spin711", // Heal
      "spin679", // Heal
      "SPIN101", // Cure Light Wounds (Bhaalpower)
      "FINP101", // Cure Light Wounds (TOB Bhaalpower Ascension)
      "SPCL211", // Paladin Lay On Hands
      "BHAAL1A", // Mass Healing (Bhaalpower restored by Ascension/UB)
    ],
  },
  {
    name: "death",
    spells: [
      "cdxvdth", // Death Spell (mod)
    ],
  },
  {
    name: "disease",
    spells: [],
  },
  {
    name: "earthquake",
    spells: [
      "SPOGRE01", // Earthquake (Ogremoch)
      "CA#EQ", // Earthquake (PnP Deva)
      "CDTLQAK", // Earthquake (mod)
    ],
  },
  {
    name: "electrical",
    spells: [
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
    ],
  },
  {
    name: "entangle",
    spells: [
      "SPWM111", // Entangle (Wild Mage)
      "SPIN688", // Plant Growth (Black Dragon)
      "BDBOW06", // Entangle (Hamadryad SoD ?)
    ],
  },
  {
    name: "fatigue",
    spells: [],
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
      "SPWI811", // Symbol, Fear
      "SPWI956", // Symbol, Fear
      "SPWM123", // Symbol, Fear
      "dw#licfi", // Fear Aura
      "ca#sfear", // Symbol, Fear
      "A^causfr", // Cause Fear
      "DVFEARSM", // Panic
      "DVHORRO", // Panic
    ],
  },
  {
    name: "fire",
    spells: [
      "SPIN131", // Burning Hands
      "SPIN160", // Breath Fireball
      "SPIN561", // Fire Giant Lava Pit (FIRE_GIANT_LAVA)
      "SPIN719", // Meteor Swarm
      "SPIN819", // Lava Burst (LAVA_BURST)
      "SPWI001", // Fireball
      "SPWI022", // Lava Pit (TRAP_MUCK)
      "SPWI940", // Agannazar's Scorcher
      "SPWI957", // Fireball
      "SPWISH24", // Meteor Swarm
      "DVFBALL", // Fireball (IRR + SRR)
      "WAND05", // Fireball (IRR)
      "CDSLSUN", // Sunfire (mod)
      "DW#TRPIN", // Incendiary Cloud (Stratagems)
      "DW#TRPMS", // Meteor Swarm (Stratagems)
      "CA#FSTOM", // Fire Storm (PnP Deva)
    ],
  },
  {
    name: "flameArrow",
    spells: ["d5f2303", "d5p2303", "d5p2303W", "d5y391i", "SPWI888"],
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
      "SPIN957",
      "wand05a",
    ],
  },
  {
    name: "globeOfInvulnerability",
    spells: [
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
      "SPOGRE01", // Earthquake (Ogremoch)
      "CA#EQ", // Earthquake (PnP Deva)
      "CDTLQAK", // Earthquake (mod)
    ],
  },
  {
    name: "hold",
    spells: [],
  },
  {
    name: "illusion",
    spells: [
      "IKDB2", //Spook (mod)
      "spwm178", //Blindness (Wild mage)
    ],
  },
  {
    name: "insect",
    spells: [
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
      "SPWI231",
      "SPWI399",
      "SPWI997",
      "wand07",
    ],
  },
  {
    name: "magicMissile",
    spells: [
      `${SPELLS.Wizard.MordenkainenForceMissiles.file}B`,
      "SPWI003", // Magic Missile
    ],
  },
  {
    name: "maze",
    spells: ["SPIN774", "BDZHADRO"],
  },
  {
    name: "minorGlobeOfInvulnerability",
    spells: [
      "RR#WI406", // used by RR for Selina's Amulet
      "SPWM126", // Wild Mage
      "DWSW406", // Stratagems Cast Previously
    ],
  },
  {
    name: "necromancyEffects",
    spells: [
      "spwi117d", // Chill Touch
      "spwi812d", // Abi-Dalzim's Horrid Wilting
    ],
  },
  {
    name: "petrify",
    spells: [
      "SPWI604D", // Flesh to Stone
    ],
  },
  {
    name: "poison",
    spells: [
      "SPWI016", // Cloudkill (trap)
      "SPIN979", // Golem Gas Cloud
      "SPIN642", // Poisonous Cloud
      "dvckill", // Cloudkill (IR/SR)
    ],
  },
  {
    name: "polymorph",
    spells: [
      "SPIN538", // Polymorph Other
      "CA#PAOO", // Polymorph Other (Pnp Celestial)
    ],
  },
  {
    name: "web",
    spells: [
      "SPDR201", // Web (druid version)
      "SPIN566", // Mimic Web
      "SPIN683", // Web Tangle
      "D0SPIWEB", // Web (D0QUESTPACK)
      "ETTERWEB", // Web (heartwood)
      "spletter", // Web (heartwood)
      "wand14", // Web (IR/IRR)
      "wtpin05", // Web (wtp familiar)
    ],
  },
];

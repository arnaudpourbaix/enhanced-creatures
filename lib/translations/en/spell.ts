export default {
  outdoorCast: "This spell can only be cast outdoor",
  restrained: "Restrained",
  grab: {
    grab: "Grab",
    grabbed: "Grabbed",
    description: `Grab and hold your target for {{duration}} rounds.
Grabbed creature will suffer these effects:
- can not move
- loose armor class from dexterity bonus
- -4 AC (opponents get +4 bonus on their attack rolls against grabbed target)
- -4 THAC0`,
  },
  callWoodlandBeeings: {
    name: "Call Woodland Beeings",
    description: `Call Woodland Beings
(Conjuration, Summoning)
Level: 4
Sphere: Animal, Summoning
Range: Visual Range of Caster
Duration: 2 turns
Casting Time: 9
Area of Effect: Special
Saving Throw: None

By means of this spell, the caster is able to summon certain woodland creatures to his location. Naturally, this spell works only outdoors, but not necessarily only in wooded areas.

7th: Dryad (55%), Hamadryad (30%), 5HD Treant (15%)
10th: Hamadryad (55%), 5HD Treant (30%), 7HD Treant (15%)
13th: 7HD Treant (55%), 9HD Treant (30%), 11HD Treant (15%)

The summoned creatures aid the caster by whatever means they possess, staying until they are slain or the spell duration expires.

Dryad (2 Hit Dice):
STR 10, DEX 12, CON 11, INT 14, WIS 15, CHA 18
HP 16, AC 9, THAC0 19, 50% magic resistance
Dimension Door (at will) in wilderness area only.
Dryad Charm (x3), saves vs spell at -3.

Hamadryad (4 Hit Dice):
STR 10, DEX 18, CON 12, INT 14, WIS 14, CHA 18
HP 32, AC 6, THAC0 17, 75% magic resistance
Dimension Door (at will) in wilderness area only.
Dryad Charm (x3), saves vs spell at -3.
Entangle (at will)
Animal Friendship (at will)

5HD Treant:
STR 19, DEX 8, CON 19, INT 12, WIS 16, CHA 12
HP 65, AC 0, THAC0 15, -25% fire resistance
2 Attacks Per Round, 2d6 crushing

7HD Treant:
STR 20, DEX 8, CON 20, INT 12, WIS 16, CHA 12
HP 91, AC 0, THAC0 13, -25% fire resistance
2 Attacks Per Round, 2d8 crushing

9HD Treant:
STR 21, DEX 8, CON 20, INT 12, WIS 16, CHA 12
HP 117, AC 0, THAC0 11, -25% fire resistance
2 Attacks Per Round, 3d6 crushing

11HD Treant:
STR 23, DEX 8, CON 21, INT 12, WIS 16, CHA 12
HP 142, AC 0, THAC0 9, -25% fire resistance
2 Attacks Per Round, 4d6 crushing`,
  },
  colorSpray: {
    name: "Color Spray",
    description: `Color Spray (Alteration)
Level: 1
Range: 30 feet
Duration: Special
Casting Time: 1
Area of Effect: 60 degree arc
Saving Throw: Special

Upon the casting of this spell, a vivid, fan-shaped spray of clashing colors spring forth in front of the caster.
All creatures in the area of effect are entitled a saving throw vs. spell to avoid the effects, if they are above the 6th level or above the level of the caster.
Blind or unseeing creatures are not affected.
Creatures that are not allowed a saving throw, or that fail their saving throw, and whose level is below or equal to the level of the caster are struck unconscious for 4 rounds;
those whose level is 1 or 2 greater than the level of the caster are struck blind for 2 rounds;
those that are 3 or more levels above the level of the caster are disoriented and unable to think or act coherently for 1 round.`,
  },
  dimensionDoor: {
    name: "Dimension Door",
    description: `Dimension Door (Alteration)
Level: 4
Range: 900
Duration: Instant
Casting Time: 1
Area of Effect: The caster
Saving Throw: None

This spell transports the caster to any designated place that is already known to him.
The caster always arrives at exactly the spot desired by simply visualizing an area that he is familiar with.
When the spell is cast, a dimensional portal opens up in front of the caster, which he immediately steps through.
Upon passing through the portal, the caster finds himself at his chosen destination.`,
  },
  coneOfCold: {
    name: "Cone of Cold",
  },

  // Wizard
  Invisibility: { name: "Invisibility" },
  ImprovedInvisibility: { name: "Improved Invisibility" },
  Domination: { name: "Domination" },
  DireCharm: { name: "Dire Charm" },
  CharmPerson: { name: "Charm Person" },
  PowerWordSleep: { name: "Power Word Sleep" },
  PowerWordBlind: { name: "Power Word Blind" },
  PowerWordStun: { name: "Power Word Stun" },
  PowerWordKill: { name: "Power Word Kill" },
  Sleep: { name: "Sleep" },
  Darkness15Radius: { name: "Darkness 15' Radius" },
  Slow: { name: "Slow" },
  Web: { name: "Web" },
  DetectInvisibility: { name: "Detect Invisibility" },
  Horror: { name: "Horror" },
  Spook: { name: "Spook" },
  WailOfTheBanshee: { name: "Wail Of The Banshee" },
  IceStorm: { name: "Ice Storm" },
  DispelMagic: { name: "Dispel Magic" },
  MagicMissiles: { name: "Magic Missiles" },
  ChromaticOrb: { name: "Chromatic Orb" },
  Vocalize: { name: "Vocalize" },
  Glitterdust: { name: "Glitterdust" },
  SpellThrust: { name: "Spell Thrust" },
  MinorSpellDeflection: { name: "Minor Spell Deflection" },
  MirrorImages: { name: "Mirror Images" },
  Haste: { name: "Haste" },
  StinkingCloud: { name: "Stinking Cloud" },
  MelfAcidArrow: { name: "Melf Acid Arrow" },
  Breach: { name: "Breach" },
  FireShield: { name: "Fire Shield" },
  Confusion: { name: "Confusion" },
  LightningBolt: { name: "Lightning Bolt" },
  FlameArrow: { name: "Flame Arrow" },
  ObscuringMist: { name: "Obscuring Mist" },
  AgannazarScorcher: { name: "Agannazar's Scorcher" },
  BurningHands: { name: "Burning Hands" },
  Combust: { name: "Combust" },
  ProtectionFromMissiles: { name: "Protection From Missiles" },
  VitriolicSphere: { name: "Vitriolic Sphere" },
  MordenkainenForceMissiles: { name: "Mordenkainen's Force Missiles" },
  TeleportField: { name: "Teleport Field" },
  MinorGlobeOfInvulnerability: { name: "Minor Globe Of Invulnerability" },
  Stoneskin: { name: "Stoneskin" },
  Fireburst: { name: "Fireburst" },
  Cloudkill: { name: "Cloudkill" },
  ShadowDoor: { name: "Shadow Door" },
  ChainLightning: { name: "Chain Lightning" },
  ProtectionFromMagicalWeapons: { name: "Protection From Magical Weapons" },
  Blur: { name: "Blur" },
  Emotion: { name: "Emotion" },
  GreaterMalison: { name: "Greater Malison" },
  Shield: { name: "Shield" },
  Feeblemind: { name: "Feeblemind" },
  FleshToStone: { name: "Flesh to Stone" },
  ShapeshiftMustardJelly: { name: "Shapeshift: Mustard Jelly" },

  // Priest
  CharmPersonOrAnimal: { name: "Charm Person or Animal" },
  HoldPerson: { name: "Hold Person" },
  HoldPersonOrAnimal: { name: "Hold person or animal" },
  Silence: { name: "Silence" },
  CallLightning: { name: "Call Lightning" },
  Curse: { name: "Curse" },
  GlyphOfWarding: { name: "Glyph of Warding" },
  MiscastMagic: { name: "Miscast Magic" },
  RigidThinking: { name: "Rigid Thinking" },
  SummonInsects: { name: "Summon Insects" },
  Entangle: { name: "Entangle" },
  CureLightWounds: { name: "Cure Light Wounds" },
  Barkskin: { name: "Barkskin" },
  AnimalSummoning1: { name: "Animal Summoning 1" },
  AnimalSummoning2: { name: "Animal Summoning 2" },
  AnimalSummoning3: { name: "Animal Summoning 3" },
  AnimalSummoning4: { name: "Animal Summoning 4" },
  AnimalSummoning5: { name: "Animal Summoning 5" },
  AnimalSummoning6: { name: "Animal Summoning 6" },
  AnimalSummoning7: { name: "Animal Summoning 7" },
  Bless: { name: "Bless" },
  RegenerateLightWounds: { name: "Regenerate Light Wounds" },
  RegenerateModerateWounds: { name: "Regenerate Moderate Wounds" },
  RegenerateSeriousWounds: { name: "Regenerate Serious Wounds" },
  RegenerateCriticalWounds: { name: "Regenerate Critical Wounds" },
  Command: { name: "Command" },
  ResistFear: { name: "Resist fear" },
  Chant: { name: "Chant" },
  Poison: { name: "Poison" },
  CauseLightWounds: { name: "Cause Light Wounds" },
  MassCauseLightWounds: { name: "Mass Cause Light Wounds" },
  SlayLiving: { name: "Slay Living" },
  WavesOfAgony: { name: "Waves of Agony" },
  GreaterCommand: { name: "Greater Command" },
  DolorousDecay: { name: "Dolorous Decay" },
  Harm: { name: "Harm" },
  MagicResistance: { name: "Magic Resistance" },
  FingerOfDeath: { name: "Finger of Death" },
  Wither: { name: "Wither" },
  SymbolDeath: { name: "Symbol of Death" },
  SymbolStunning: { name: "Symbol of Stunning" },
  SymbolWeakness: { name: "Symbol of Weakness" },
  SymbolHopelessness: { name: "Symbol of Hopelessness" },
  SymbolPain: { name: "Symbol of Pain" },
  AerialServant: { name: "Aerial Servant" },
  BladeBarrier: { name: "Blade Barrier" },
  RighteousMagic: { name: "Righteous Magic" },
  TrueSeeing: { name: "True Seeing" },
  FlameStrike: { name: "Flame Strike" },
  MentalDomination: { name: "Mental Domination" },
  HolyPower: { name: "Holy Power" },
  ProtectionFromLightning: { name: "Protection From Lightning" },
  UnholyBlight: { name: "Unholy Blight" },
  DrawUponHolyMight: { name: "Draw Upon Holy Might" },
  CloakOfFear: { name: "Cloak of Fear" },
  Doom: { name: "Doom" },
  CauseSeriousWounds: { name: "Cause Serious Wounds" },
  AnimateDead: { name: "Animate Dead" },
  AnimateSkeletonWarrior: { name: "Animate Skeleton Warrior" },
  Chaos: { name: "Chaos" },
  CloudOfPestilence: { name: "Cloud of Pestilence" },
  BlindingBeauty: { name: "Blinding Beauty" },
  Ironskin: { name: "Ironskin" },
  ProtectionFromGood: { name: "Protection From Good" },
  ProtectionFromEvil: { name: "Protection From Evil" },
  ArmorOfFaith: { name: "Armor Of Faith" },
  Aid: { name: "Aid" },
  SpiritualHammer: { name: "Spiritual Hammer" },
  Contagion: { name: "Contagion" },
  HolySmite: { name: "HolySmite" },
  ProtectionFromGood10Radius: { name: "Protection From Good 10 Radius" },
  FreeAction: { name: "Free Action" },
  DivineProtection: { name: "Divine Protection" },
  GreaterDivineProtection: { name: "Greater Divine Protection" },
  PhysicalMirror: { name: "Physical Mirror" },
  Repulsion: { name: "Repulsion" },
  SummonDeathKnight: { name: "SummonDeathKnight" },
  Regeneration: { name: "Regeneration" },
  ShieldOfTheArchons: { name: "Shield Of The Archons" },
  Banishment: { name: "Banishment" },
  Destruction: { name: "Destruction" },
  HolyWord: { name: "Holy Word" },
  UnholyWord: { name: "Unholy Word" },
  EntropyShield: { name: "Entropy Shield" },
  BoltOfGlory: { name: "Bolt Of Glory" },
  EnergyDrain: { name: "Energy Drain" },

  // Innate
  MephitColorSpray: { name: "Mephit Color Spray" },
  SpiderSingleTargetWeb: { name: "Spider Single Target Web" },
  VortexWeb: { name: "Vortex Web" },

  // Class
  BerserkerRage: { name: "Berserker Rage" },
  BarbarianRage: { name: "Barbarian Rage" },
  OffensiveSpin: { name: "Offensive Spin" },

  // Monster
  DancingLights: { name: "Dancing Lights" },
  MoonDogSight: { name: "Moon Dog Sight" },
  MoonDogHowl: { name: "Moon Dog Howl" },
  MoonDogFear: { name: "Moon Dog Fear" },

  // Faiths & Powers only
  CauseDisease: { name: "Cause Disease" },
  FrostFingers: { name: "Frost Fingers" },
  Forbiddance: { name: "Forbiddance" },
  Shatter: { name: "Shatter" },
  CircleOfBones: { name: "Circle of Bones" },
  ShadowMonsters: { name: "Shadow Monsters" },
  CauseCriticalWounds: { name: "Cause Critical Wounds" },
  DemiShadowMonsters: { name: "Demi-Shadow Monsters" },
  WavesOfFatigue: { name: "Waves of Fatigue" },
  Shades: { name: "Shades" },
  SummonShadows: { name: "Summon Shadows" },
  PolymorphSelf: { name: "Polymorph Self" },
  FindTraps: { name: "Find Traps" },
  Sanctuary: { name: "Sanctuary" },
  CauseModerateWounds: { name: "Cause Moderate Wounds" },
  NahalRecklessDweomer: { name: "Nahal's Reckless Dweomer" },
  ReflectedImage: { name: "Reflected Image" },
  SummonSpiritAnimal: { name: "Summon Spirit Animal" },
  BigbyIcyGrasp: { name: "Bigby's Icy Grasp" },
  HealingLick: { name: "Healing Lick" },
  NonDetection: { name: "Non Detection" },
  DetectEvil: { name: "Detect Evil" },
};

// Same displayed ability name shared by the dread wolf, ghoul, and mummy variants below - each

import description from "./description";

// has its own mechanical description, but the in-game ability name is identical.
const ROTTING_DISEASE_NAME = "Rotting Disease";

// Shared between slime.ability.split (the in-game spell/ability text) and slime.trait.split (the
// docs-only trait entry, which also folds in the creature's immunity bullets - see
// slimes.ts's addTrait calls) so the flavor text has one source of truth.
const SLIME_SPLIT_NAME = "Slime Split";
const SLIME_SPLIT_PUDDING_DESC = `Lightning bolts and blows from weapons divide them into smaller puddings, each able to attack exactly as the original pudding. Smallest pudding does the same damage as the largest.`;
const SLIME_SPLIT_MUSTARD_DESC = `This large creature can divide itself at will into two smaller, faster halves (movement rate 18). Each is capable of attacking, but has only half the hit points the creature had before dividing.`;

export default {
  ankheg: {
    name: "Ankheg",
    weapon: "Mandibles",
    digestiveEnzyme: {
      name: "Digestive Enzymes",
      description:
        "The ankheg can secret acidic digestive enzymes to cause an additional 1d4 points of damage per round for 4 rounds.",
    },
    enzymeStream: {
      name: "Stream of acidic enzymes",
      description: `The ankheg can squirt a stream of acidic enzymes once every six hours to a distance of 30 feet.
A victim struck by the stream of acidic enzymes suffers 8d4 points of damage (half damage if the victim rolls a successful saving throw vs. poison).
It uses this attack technique only when desperate.`,
      description5e: `Any creature, that can see and within 30 feet of the basilisk, must save vs petrify at -4.
On a failed save, the creature magically begins to turn to stone and is restrained.
It must repeat the saving throw at the end of its next turn. On a success, the effect ends. On a failure, the creature is petrified until freed by the greater restoration spell or other magic.`,
    },
  },
  basilisk: {
    name: {
      lesser: "Lesser Basilisk",
      greater: "Greater Basilisk",
    },
    weapon: { claws: "Claws", jaws: "Jaws" },
    ability: {
      petrifyingGaze: {
        name: "Petrifying Gaze",
        description: `Any creature, that can see and within 30 feet of the basilisk, must save vs petrify at -4. On a failed save, the creature is petrified until freed by the greater restoration spell or other magic.`,
        description5e: `Any creature, that can see and within 30 feet of the basilisk, must save vs petrify at -4. On a failed save, the creature magically begins to turn to stone and is restrained.
It must repeat the saving throw on the next round. On a success, the effect ends. On a failure, the creature is petrified until freed by the greater restoration spell or other magic.`,
        petrified: "Petrified",
        turningToStone: "Turning to stone",
      },
      foulBreath: {
        name: "Foul Breath",
        description: `All creatures within 5 feet must roll successful saving throws vs. poison (with a +2 bonus) or die (check each round of exposure).`,
      },
    },
  },
  carrionCrawler: {
    name: "Carrion Crawler",
    weapon: "Tentacles",
  },
  bear: {
    name: {
      black: "Black Bear",
      brown: "Brown Bear",
      cave: "Cave Bear",
      polar: "Polar Bear",
      grizzly: "Grizzly Bear",
    },
    weapon: { claws: "Paws", jaws: "Jaws" },
    hug: { name: "Hug" },
    improvedStreamOfFrost: {
      name: "Improved stream of frost",
      description:
        "Unleash a stream of frost, causing 6d4 points of damage to everything within 10 feet. A save vs. breath weapon is allowed for half damage. Affected creatures are also paralyzed for one turn (saves vs paralyze at -2)",
    },
  },
  cat: {
    name: {
      cheetah: "Cheetah",
      jaguar: "Jaguar",
      leopard: "Leopard",
      lion: "Lion",
      giantLynx: "Giant Lynx",
      mountainLion: "Mountain Lion",
      spottedLion: "Spotted Lion",
      wildTiger: "Wild Tiger",
      hellcat: "Hellcat",
      displacerBeast: "Displacer Beast",
    },
    ability: {
      burstOfSpeed: {
        name: "Burst Of Speed",
        description: `Run at triple speed (45 feet per round) for three rounds. The cat must rest 3 turns before sprinting again.`,
      },
      leap: {
        name: "Leap",
        description: `Leap on its target and strike with both forepaws and both rear claws.`,
        attack: "Leap Attack",
      },
    },
    weapon: { claws: "Paws", jaws: "Jaws", tentacles: "Tentacles" },
  },
  construct: {
    name: {
      helmedHorror: "Helmed Horror",
      battleHorror: "Battle Horror",
      doomSayer: "Doom Sayer",
      doomGuard: "Doom Guard",
    },
    weapon: { flamingSword: "Flaming Greatsword", longSword: "Long Sword" },
    item: { plateMail: "Plate Mail", helmet: "Helmet" },
  },
  dog: {
    name: {
      wild: "Wild Dog",
      war: "War Dog",
      blink: "Blink Dog",
      spectralHound: "Spectral Hound",
    },
    weapon: { jaws: "Jaws" },
    ability: {
      blink: "Blink",
      astralPlaneShift: "Astral Plane Shift",
    },
  },
  fey: {
    name: {
      dryad: "Dryad",
      hamadryad: "Hamadryad",
      sirine: "Sirine",
      nymph: "Nymph",
      nereid: "Nereid",
    },
    trait: {
      nereid: `Resistance to magic (50%)
+4 to AC when attacked (Nereid gets a saving throw vs. poison to avoid damage from a weapon)`,
    },
    weapon: { sirineTouch: "Sirine Touch" },
    ability: {
      dryadDireCharm: "Dryad Charm",
      entangle: {
        name: "Entangle",
        description: `Hamadryad can cast Entangle as the priest spell, but it won't affect its allies since her affinity with nature.`,
      },
      speakWithPlants: {
        name: "Speak With Plants",
        description: `Immunity to entangle spell for 10 rounds.
The caster can question plants as to whether or not creatures have passed through them, cause thickets to part to enable easy passage, require vines to entangle pursuers, and command similar services.`,
      },
      animalFriendship: {
        name: "Animal Friendship",
        description: `The caster can use this spell to attract up to 2 Hit Dice of animal(s) per experience level he possesses (save vs spell to negate).`,
      },
      detectTraps: {
        name: "Detect snares and pits",
        description: `When cast, all traps concealed -normally or magically- of magical or mechanical nature become apparent for 2 turns.`,
      },
      blindingBeauty: {
        name: "Blinding Beauty",
        description: `Looking at a nymph will cause permanent blindness unless the onlookers save versus spell.
If the nymph is nude or disrobes, an onlooker will die unless a saving throw versus spell is successful.`,
      },
      charmSong: {
        name: "Charm Song",
        description: `The charm ability is used through the sirine's song, and all people within 30 feet are subject to it, even if they are hostile or attacking.
Each victim can save vs spell to negate or be charmed for 3 turns.`,
      },
      fogCloud: {
        name: "Fog Cloud",
        description: `As a fog bank, this spell creates a fog of any size and shape up to a maximum 20-foot cube per caster level. The fog obscures all sight, normal and infravision, beyond 2 feet.
Victims are blinded for one round, no save.`,
      },
      touchOfTranquility: {
        name: "Touch of Tranquility",
        description: `If the sirine touches an opponent, the victim must make a saving throw vs. poison; those failing to save are reduced to an Intelligence of 2.`,
      },
      venomSpit: {
        name: "Venom Spit",
        description: `Nereids can spit a venom up to 20 feet that blinds a target for 7 rounds if it hits. 
A blinded victim suffer a -4 penalty to his attack roll, and both saving throws and Armor Class are worsened by 4 until the effects wear off.`,
      },
      drowningKiss: {
        name: "Drowning Kiss",
        description: `Any male humanoid kissed by a Nereid drowns instantly unless he makes a successful saving throw vs. breath weapon with a -2 penalty. 
If the saving throw is successful, he finds total ecstasy : +2 bonus to THAC0, damage, morale, as well as a +20% hp, and Additionally, any spells cast will be as if the caster were two levels higher.
The Nereid can only use this ability on fascinated or helpless victims.`,
      },
      beguilingAura: {
        name: "Beguiling Aura",
        description: `All males that look at a nereid find themselves incapable of harming the creature (no saving throw) for one turn.
This ability has no effect on blinded characters.`,
      },
      attackEvasion: {
        name: "Attack's Evasion",
        description: `All males that look at a nereid find themselves incapable of harming the creature (no saving throw) for one turn.
This ability has no effect on blinded characters.`,
      },
      summonGiantPoisonousSnake: {
        name: "Summon Giant Poisonous Snake",
        description: `Nereids are 85% likely to have a pet that tries to protect its master.`,
      },
      wateryFist: {
        name: "Watery Fist",
        description: `Form the water into the shape of a fist, and cause it to strike and inflict 1d4 points of damage.`,
      },
    },
  },
  golem: {
    name: {
      flesh: "Flesh Golem",
      wax: "Wax Golem",
      clay: "Clay Golem",
      lesserClay: "Lesser Clay Golem",
      greaterClay: "Greater Clay Golem",
      stone: "Stone Golem",
      lesserStone: "Lesser Stone Golem",
      iron: "Iron Golem",
      adamantite: "Adamantite Golem",
      bone: "Bone Golem",
      juggernaut: "Juggernaut Golem",
      snow: "Snow Golem",
      magic: "Magic Golem",
      sand: "Sand Golem",
    },
    weapon: { fists: "Fists", magicalBlast: "Magical Blast" },
    ability: {
      haste: "Haste",
      hideousLaugh: "Hideous Laugh",
      charge: {
        name: "Charge",
        description: `Gradually increases movement for 4 rounds. Peak speed is reached after 2 rounds.`,
        end: "End charge",
      },
      cloudOfPoisonousGas: {
        name: "Cloud Of Poisonous Gas",
        description: `The gas cloud fills a 10-foot cube directly in front of it, which dissipates by the following round, assuming there is somewhere for the gas to go.`,
      },
      wildMagicFlare: {
        name: "Wild Magic Flare",
        description: ``,
      },
      coneOfCold: `Cone of Cold
Casting Time: 1
Saving Throw: Breath half
When this spell is cast, it causes a cone-shaped spray of extreme cold to spring forth.
The cone is 30 feet long and spread out in a horizontal arc of 60 degrees in front of the caster.
It drains heat and causes 10d4+10 cold damage, with a save vs. breath at -4 allowed for half damage.
Stronger Snow Golems will do 15d4+15 cold damage`,
    },
  },
  ogre: {
    name: {
      ogre: "Ogre",
      berserker: "Ogre Berserker",
      mage: "Ogre Mage",
      half: "Half Ogre",
      shaman: "Ogre Shaman",
      ogrillon: "Ogrillon",
    },
    weapon: {
      fists: "Fists",
      giantFlail: "Giant Flail",
      naginata: {
        name: "Naginata",
        description: `Similar to the glaive, the naginata is a pole weapon. Naginata were originally used by the samurai class.
STATISTICS:
Damage: 1D12
Damage type: slashing
Weight: 15
Speed Factor: 8
Proficiency Type: Halberds`,
      },
    },
    ability: {
      coneOfCold: `Cone of Cold
Casting Time: 1
Saving Throw: Breath half
When this spell is cast, it causes a cone-shaped spray of extreme cold to spring forth.
The cone is 60 feet long with a terminal diameter of 20 feet.
It drains heat and causes 8d8 cold damage, with a save vs. breath at -4 allowed for half damage.`,
      fly: {
        name: "Fly",
        description: `The creature affected is able to move vertically and horizontally at a rate of 18.
This effectively prevents ground-based spells such as Earthquake, Entangle, Grease and Web from affecting the creature.
Furthermore, creatures with this ability can cross lava and acid pools without taking damage by hovering above them.`,
      },
      gaseousForm: {
        name: "Gaseous form",
        description: `The gaseous form cannot be physically harmed except by magical fires or lightning, in which case damage is normal, but the gaseous creature may be affected by mind-related attacks such as charm, hold or suggestion spells.`,
      },
    },
  },
  plant: {
    name: {
      treant: "Treant",
      treant11HD: "Treant (11 HD)",
      treant9HD: "Treant (9 HD)",
      treant7HD: "Treant (7 HD)",
      treant5HD: "Treant (5 HD)",
    },
    weapon: {
      branch: "Branch",
    },
  },
  slime: {
    name: {
      black: "Black Pudding",
      white: "White Pudding",
      fission: "Fission Slime",
      mustard: "Mustard Jelly",
      SmallerMustard: "Smaller Mustard Jelly",
      gray: "Gray Ooze",
      green: "Green Slime",
      ochre: "Ochre Jelly",
      olive: "Olive Slime Creature",
      slitheringTracker: "Slithering Tracker",
    },
    weapon: {
      pseudopod: "Pseudopod",
    },
    ability: {
      split: {
        name: SLIME_SPLIT_NAME,
        puddingDesc: SLIME_SPLIT_PUDDING_DESC,
        mustardDesc: SLIME_SPLIT_MUSTARD_DESC,
      },
      toxicVapors: {
        name: "Toxic Vapors",
        description: `Unleash a toxic vapor over a 10-foot radius.
Those near the jelly must roll a saving throw vs. poison each round.
Those who fail the saving throw become lethargic.
Lethargic characters are unable to attack or cast spells, but can still move at half-normal speed.
The toxic effects last for two rounds.`,
      },
    },
    trait: {
      split: {
        pudding: `${SLIME_SPLIT_PUDDING_DESC}
Immune to acid
Immune to cold
Immune to poison
Electricity Resistance: 90%`,
        mustard: `${SLIME_SPLIT_MUSTARD_DESC}
Immune to lightning
Immune to non-magical weapons
Immune to magic missiles spell
Resistance to cold (50%)
Magic Resistance: 10%`,
      },
      fission: `They divide into smaller slimes on death, except if they recieved fire damage.
Immune to lightning
Immune to non-magical weapons
Immune to magic missiles spell
Resistance to cold (50%)
Magic Resistance: 10%`,
    },
  },
  spider: {
    name: {
      gargantuan: "Gargantuan Spider",
      ghostwalk: "Ghostwalk Spider",
      giant: "Giant Spider",
      hairy: "Hairy Spider",
      huge: "Huge Spider",
      hunting: "Hunting Spider",
      phase: "Phase Spider",
      sword: "Sword Spider",
      vortex: "Vortex Spider",
      wraith: "Wraith Spider",
    },
    weapon: { jaws: "Jaws", leg: "Leg" },
    trait: {
      ghostwalk: `Can switch in a ghostly form and becomes incorporeal but can't poison its target while in this form.
True sight`,
    },
    ability: {
      phase: {
        name: "Phase out",
        description:
          "Phase out of the Prime material plane, going invisible until the next phase in.",
      },
      leap: {
        name: "Leap",
        description: "Leaps horizontally as far as 30 feet.",
      },
      leapAttack: {
        name: "Leap Attack",
        description: `Leaps horizontally as far as 30 feet.
Gains Impaling Attack ability for one round.
If the attack is successful, the victim is struck by 4 legs. 
If the spider's leap is greater than 20 feet, each leg receives a +1 bonus to damage. 
Any upward attack against the leaping spider receives a -4 to the attack roll, due to the impaling blades which protect the spider.`,
      },
      impale: {
        name: "Impaling Attack",
      },
      webTangle: {
        name: "Web Tangle",
        standardDesc: `The spider can shoot web strands up to 5 feet to bind a foe.
Characters in contact with the webs must make a saving throw vs. paralyzation or be immobilized by the web for 3 rounds.`,
        ghostwalkDesc: `The spider can shoot invisible web strands up to 5 feet to bind a foe.
Characters in contact with the webs must make a saving throw vs. paralyzation at -2 or be immobilized by the web for 3 rounds.
While restrained in this way, the target is invisible.`,
        wraithDesc: `These creatures create webs that glow with an eerie dim green light. Anyope touching a web will sustain 1d4 points of damage from the numbing cold of the strands.
Characters in contact with the webs must also make a saving throw vs. paralyzation or be immobilized by the web for 4 rounds, sustaining cold damage for each round in the web.`,
      },
    },
  },
  wolf: {
    name: {
      wolf: "Wolf",
      dire: "Dire Wolf",
      dread: "Dread Wolf",
      vampiric: "Vampiric Wolf",
      winter: "Winter Wolf",
      worg: "Worg",
    },
    weapon: { jaws: "Jaws" },
    trait: {
      dread: `Dread wolf regenerates like a troll, regaining 3 hp per round after the first combat round.
Only acid, fire, or total dismemberment will inflict permanent damage.
It is immune to charm, hold, and cold-based spells. Electricity-based spells cause only half damage.
Total dismemberment occurs when the creature's negative hit-point total is equal to or greater than its full positive hit-point total.
However, the creature continues to fight until it reaches -10 hp. It then goes down until it regenerates to at least 0 hit points.`,
    },
    ability: {
      dreadWolfDownState: {
        name: "Dread Wolf down state",
        description: "A down dread wolf is immune to everything but fire and acid.",
      },
      streamOfFrost: {
        name: "Stream of frost",
        description: `Unleash a stream of frost, causing 6d4 points of damage to everything within 10 feet. A save vs. breath weapon is allowed for half damage.`,
      },
      rottingDisease: {
        name: ROTTING_DISEASE_NAME,
        description: `Dread wolves cause a nasty rotting disease that can infect a bitten opponent who fails a save vs. poison within one hour of the fight.
He loses 1 hp per hour until death.`,
      },
    },
  },
  minotaur: {
    name: {
      minotaur: "Minotaur",
    },
    weapon: {
      axe: {
        name: "Huge Axe",
        description: `Huge Axe
STATISTICS:
Damage: 1D12
Damage type: slashing
Weight: 15
Speed Factor: 8
Proficiency Type: Halberds`,
      },
      headbutt: {
        name: "Headbutt",
      },
    },
    ability: {
      charge: {
        name: "Charge",
        description: `If a minotaur is 30 feet or more from its opponent, it can lower its head and charge against any creature that is at least 6 feet tall.
If successful, the charge causes double head-butt damage`,
      },
    },
  },
  ettercap: {
    name: {
      ettercap: "Ettercap",
    },
    weapon: { claws: "Claws", jaws: "Jaws" },
    ability: {},
  },
  wyvern: {
    name: {
      wyvern: "Wyvern",
      baby: "Baby Wyvern",
      greater: "Greater Wyvern",
    },
    weapon: { stinger: "Stinger", jaws: "Jaws" },
    ability: {},
  },
  undead: {
    name: {
      baneguard: "Baneguard",
      banshee: "Banshee",
      bonebat: "Bonebat",
      deathKnight: "Death Knight",
      deathShade: "Death Shade",
      ghast: "Ghast",
      ghost: "Ghost",
      ghoul: "Ghoul",
      ghoulLord: "Ghoul Lord",
      mummy: "Mummy",
      greaterMummy: "Greater Mummy",
      shadow: "Shadow",
      greaterShadow: "Greater Shadow",
      skeleton: "Skeleton",
      skeletonWarrior: "Skeleton Warrior",
      spectre: "Spectre",
      wight: "Wight",
      wraith: "Wraith",
      zombie: "Zombie",
      zombieJuju: "Zombie Juju",
      zombieSea: "Zombie Sea",
    },
    weapon: { touch: "Touch", claws: "Claws", jaws: "Jaws" },
    ability: {
      bansheeFearAura: {
        name: "Fear Aura",
        description: `The mere sight of one causes fear, unless a successful saving throw vs. spell is rolled.
Those who fail must flee in terror for 10 rounds and are 50% likely to drop any items they were carrying in their hands.`,
      },
      skeletonWarriorFearAura: {
        name: "Fear Aura",
        description: `The mere sight of a skeleton warrior causes any creature with fewer than 5 Hit Dice to flee in panic.`,
      },
      blink: "Blink",
      deathWail: {
        name: "Death Wail",
        description: `Any creature within 30 feet of a groaning spirit when she keens must roll a saving throw vs. death magic.
Those who fail die immediately, their faces contorted in horror.`,
      },
      iceWall: {
        name: "Wall of Ice",
        description: `This causes a horizontal sheet to fall upon opponents. The sheet covers a 10-foot-square area per caster level.
The sheet has the same effect as an ice storm's hail stones—3d10 points of damage inflicted to creatures beneath it.`,
      },
      ghoulTouch: {
        name: "Ghoul's Touch",
        description: `Their touch causes humanoids (excluding elves) to become rigid unless a saving throw versus paralyzation is successful. This paralysis lasts for 5 rounds.`,
      },
      ghastTouch: {
        name: "Ghast's Touch",
        description: `Their touch causes humanoids to become rigid unless a saving throw versus paralyzation is successful. This paralysis lasts for 7 rounds.`,
      },
      specterTouch: {
        name: "Specter's Touch",
        description: `Their touch drains two life energy levels from the victim.`,
      },
      ghostTouch: {
        name: "Ghost's Touch",
        description: `Their touch drains two life energy levels from the victim.`,
      },
      bonebatTouch: {
        name: "Bonebat's Touch",
        description: `A bonebat's bite also paralyzes all living creatures except elves for 6 rounds, unless a successful saving throw vs. paralyzation is made.`,
      },
      ghoulLordTouch: {
        name: "Ghoul Lord's Touch",
        description: `Their touch causes humanoids to become rigid unless a saving throw versus paralyzation is successful. This paralysis lasts for 10 rounds.`,
      },
      carrionStench: {
        name: "Carrion Stench",
        description: `Ghasts exude a carrion stench in a 10' radius which causes retching and nausea unless a saving throw versus poison is made.
Those failing to make this save will attack at a penalty of -2.`,
        message: "Affected by Ghast's carrion stench",
      },
      ghoulRottingDisease: {
        name: ROTTING_DISEASE_NAME,
        description: `Loose 10 hit points every 8 hours and 4 point of Constitution and Charisma.`,
      },
      mummyRottingDisease: {
        name: ROTTING_DISEASE_NAME,
        description: `The scabrous touch infects the victim with a rotting disease which is fatal in 6 days.
For each day the rot progresses, the victim permanently loses 2 points of Charisma.
The disease can be cured only with a cure disease spell.
Cure wounds spells have no effect on a person inflicted with mummy rot.`,
        greaterDescription: `The scabrous touch infects the victim with a rotting disease which is fatal in 48 hours.
Every 8 hours, the victim permanently loses 2 points of Charisma and 1 point each of Strength and Constitution.
The disease can be cured only with a cure disease spell.
Cure wounds spells have no effect on a person inflicted with mummy rot.`,
        diseased: "Stricken by mummy rot",
        warning: "Close to dying from mummy rot",
        death: "Succumbs to mummy rot",
      },
      mummyFearAura: {
        name: "Fear Aura",
        description: `The mere sight of a mummy causes such terror in any creature that a saving throw versus spell must be made or the victim becomes paralyzed with fright for 3 rounds.
Humans save against mummies at an additional +2.`,
        greaterDescription: `The mere sight of a greater mummy causes such terror in any creature that a saving throw versus spell at -3 must be made or the victim becomes paralyzed with fright for 4 rounds.
Humans save against mummies at an additional +2.`,
        frightened: "Frightened",
      },
      ghostFearAura: {
        name: "Fear Aura",
        description: `The supernatural power of a ghost is such, however, that the mere sight of one causes any humanoid being to age 10 years and flee in panic for 8 turns unless a saving throw versus spell is made.
Priests above 6th level are immune to this effect, and all other humanoids above 8th level may add +2 to their saving throws.`,
        frightened: "Frightened",
      },
      auraOfEvil: {
        name: "Aura of Evil",
        description: `Ghoul lords do radiate an aura of evil. In fact, this effect is so potent that those of good alignment suffer a -4 on all attack rolls when within 30 feet of these creatures.`,
        message: "Affected by Ghoul Lord's evil aura",
      },
    },
  },
  ettin: {
    name: {
      ettin: "Ettin",
    },
    weapon: { largeSpikedClub: "Large Spiked Club" },
  },
  elemental: {
    name: {},
    weapon: {},
    ability: {},
  },
  snake: {
    name: {
      giantPoisonous: "Giant Poisonous Snake",
    },
    weapon: { jaws: "Jaws" },
    ability: {},
  },
};

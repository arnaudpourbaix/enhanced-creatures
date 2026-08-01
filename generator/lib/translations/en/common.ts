export default {
  immunity: {
    poison: "Immune to poison",
    disease: "Immune to all diseases",
    bleeding: "Immune to bleeding",
    hold: "Immune to hold",
    stun: "Immune to stun",
    maze: "Immune to maze spells",
    sleep: "Immune to sleep",
    fear: "Immune to fear and morale failure",
    charm: "Immune to charm",
    confusion: "Immune to confusion",
    fatigue: "Immune to fatigue",
    abilityDrain: "Immune to ability drain",
    energyDrain: "Immune to level drain",
    blindness: "Immune to blindness",
    fireSpells: "Immune to fire spells",
    fire: "Immune to fire",
    coldSpells: "Immune to cold spells",
    cold: "Immune to cold",
    lightningSpells: "Immune to lightning spells",
    lightning: "Immune to lightning",
    acidSpells: "Immune to acid spells",
    acid: "Immune to acid",
    magic: "Immune to magic",
    magicDamage: "Immune to magic damage",
    cureWoundSpells: "Immune to cure wounds spells",
    causeWoundSpells: "Immune to cause wounds spells",
    cloudSpells: "Immune to cloud spells",
    web: "Immune to web effects",
    entangle: "Immune to entangle effects",
    insectSpells: "Immune to insects spells",
    petrification: "Immune to petrification",
    gazeAttacks: "Immune to gaze attacks",
    polymorph: "Immune to polymorph spells",
    vorpal: "Immune to vorpal effects",
    physicalDamage: "Immune to physical damage",
    slashingDamage: "Immune to slashing damage",
    crushingDamage: "Immune to crushing damage",
    piercingDamage: "Immune to piercing damage",
    missileDamage: "Immune to missile damage",
    missileWeapons: "Immune to missile weapons",
    turnUndead: "Immune to turn undead",
    illusion: "Immune to illusion spells",
    necromancyEffects: "Immune to necromancy effects",
    deathEffects: "Immune to death effects",
    deathSpell: "Immune to death spell",
    mindSpells:
      "Immunity to mind-affecting spells and abilities (charms, compulsions, phantasms, patterns, and morale effects)",
    nonMagicalWeapons: "Immune to non-magical weapons",
    nonSilverNonMagicalWeapons: "Immune to non-magical and non-silver weapons",
    plusOneWeapons: "Immune to all weapons of +1 or less enchantment",
    plusTwoWeapons: "Immune to all weapons of +2 or less enchantment",
    backstab: "Immune to backstab",
    criticalHit: "Immune to critical hits",
    devourBrain: "Immune to devour brain ability",
    magicMissile: "Immune to magic missiles spell",
    earthquakeSpells: "Immune to earthquake spell",
    fireballSpell: "Immune to fireball spell",
    lightningBoltSpell: "Immune to lightning bolt spell",
    flameArrowSpell: "Immune to flame arrow spell",
  },
  resistance: {
    poison: "Resistance to poison (50%)",
    fire: "Resistance to fire (50%)",
    cold: "Resistance to cold (50%)",
    lightning: "Resistance to lightning (50%)",
    acid: "Resistance to acid (50%)",
    magic: "Resistance to magic (50%)",
    magicDamage: "Resistance to magic damage (50%)",
    physicalDamage: "Resistance to physical damage (50%)",
    slashingDamage: "Resistance to slashing damage (50%)",
    crushingDamage: "Resistance to crushing damage (50%)",
    piercingDamage: "Resistance to piercing damage (50%)",
    missileDamage: "Resistance to missile damage (50%)",
    missileWeapons: "Resistance to missile weapons (50%)",
  },
  traits: {
    hover: {
      name: "Hover (flight)",
      desc: `Can flight and is immune to ground-based spells and effects (Earthquake, Entangle, Grease, Web, Lava, Acid pools)`,
    },
    construct: {
      name: "Construct",
      desc: `Immunity to poison, sleep effects, paralysis, stunning, disease, death effects, necromancy effects, mind-affecting spells and abilities (charms, compulsions, phantasms, patterns, and morale effects).
Not subject to critical hits, backstab, nonlethal damage, ability damage, ability drain, fatigue, exhaustion, energy drain, flesh to Stone, insect Plague and similar spells.
Darkvision out to 60 feet.`,
    },
    undead: {
      name: "Undead",
      desc: `Immunity to poison, sleep effects, paralysis, stunning, disease, death effects, necromancy effects, mind-affecting spells and abilities (charms, compulsions, phantasms, patterns, and morale effects).
Not subject to critical hits, backstab, nonlethal damage, ability damage, ability drain, fatigue, exhaustion, energy drain, flesh to Stone, insect Plague and similar spells.
Undead with no Intelligence scores cannot heal damage on their own, though they can be healed.
Negative energy (such as an inflict wounds spell) can heal undead creatures.
Hit Dice: d12
Darkvision out to 60 feet.`,
    },
    fey: {
      name: "Fey",
      desc: `Fey creatures cannot be interrupted while using their spell-like abilities, all of which have a casting time of 1.
In all other aspects, spell-like abilities function exactly like the spells which they mimic.`,
    },
    elemental: {
      name: "Elemental",
      desc: `Immunity to poison, sleep effects, paralysis, bleeding, and stunning.
Not subject to critical hits or backstab. Due to their unique physiology, elementals are not subject to the Mind Flayers' Devour Brain attack.
They are also unaffected by Flesh to Stone, Insect Plague and similar spells.
Darkvision out to 60 feet.`,
    },
    airAffinity: {
      name: "Air affinity",
      desc: "Creatures with this trait receive a +1 bonus to hit and a +4 bonus to damage when fighting airborne opponents.",
    },
    earthAffinity: {
      name: "Earth affinity",
      desc: "Creatures with this trait receive a -2 penalty to hit and damage when fighting airborne and waterborne opponents. They are also unaffected by the Earthquake spell.",
    },
    skeletal: {
      name: "Skeletal",
      desc: "Skeletal undead suffer no damage from cold-based attacks. Due to their bony frames, edged and piercing weapons inflict only half damage.",
    },
    extraplanar: {
      name: "Extraplanar",
      desc: "Extraplanar creatures are immune to Death Spell and are unaffected by all Cure and Cause Wound spells including Heal and Harm.",
    },
    plant: {
      name: "Plant",
      desc: `Immunity to all mind-affecting effects (charms, compulsions, phantasms, patterns, and morale effects).
Immunity to poison, sleep effects, paralysis, polymorph, and stunning.
Not subject to critical hits and backstab.
Infravision.`,
    },
    infravision: "Infravision",
    seeInvisible: "True sight",
    incorporeal: {
      name: "Incorporeal",
      desc: `An incorporeal creature has no physical body.
Immune to backstab and critical hits
Immune to all non-magical attacks.
Has a 50% resistance to every damages.
Deflection bonus (+3 AC).
Attacks pass through armor (+4 THAC0).`,
      // "Do not set off traps that are triggered by weight. (not implemented)",
    },
    blindsight: {
      name: "Blindsight",
      desc: `Invisibility, darkness, and most kinds of concealment are irrelevant.
Blindsight does not subject a creature to gaze attacks.`,
    },
    ooze: {
      name: "Ooze",
      desc: `Blindsight (can see invisible, not subject to gaze attacks).
Immunity to poison, sleep effects, paralysis, stunning, polymorph, blindness, mind-affecting spells and abilities (charms, compulsions, phantasms, patterns, and morale effects).
Not subject to critical hits, backstab.
Darkvision out to 60 feet.
Translucent
Hit Dice: d10`,
    },
    vermin: {
      name: "Vermin",
      desc: `Immunity to mind-affecting spells and abilities (charms, compulsions, phantasms, patterns, and morale effects)
Darkvision out to 60 feet.`,
    },
    spider: "Spider",
    magicalBeast: {
      name: "Magical Beast",
      desc: "Darkvision out to 60 feet.",
    },
    giant: {
      name: "Giant",
      desc: "Darkvision out to 60 feet.",
    },
    ghostVisual1: "Ghosly appearance",
  },
  poison: {
    name: "Type {{type}} poison",
    description: `{{damage}}{{save}}{{saveDamage}}`,
    damage: "Poison damage: {{damage}} over {{duration}}",
    death: "Death within {{duration}}",
    saveDamage: `; {{damage}} damage if the saving throw is successful`,
    typeO: `Paralytic poisons leave the character unable to move for {{duration}}.`,
    typeP: `Weaken the character for {{duration}}.
All of the character's ability scores are reduced by half during this time.
All appropriate adjustments to attack rolls, damage, Armor Class, etc., from the lowered ability scores are applied during the course of the illness.
In addition, the character moves at one-half his normal movement rate.
Finally, the character cannot heal by normal or magical means until the poison is neutralized or the duration of the debilitation is elapsed.`,
    typeQ: `Fall into a coma for {{duration}}`,
    typeR: `The victim's AC and attack rolls are penalized by 1, and Dexterity is penalized by -3 for {{duration}}`,
    typeS: `This poison remains active for 5 rounds and drains 1 point of Constitution each round it is active.
Constitution points can be regained at the rate of 1 per week; a heal spell restores 1-4 points per spell.`,
  },
  creatureTraits: "traits",
  kitAbilities: {
    enrage: "Enrage",
  },
  potion: {
    use: "*quaffs a potion*",
  },
};

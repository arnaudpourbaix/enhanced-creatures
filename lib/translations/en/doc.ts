// Docs-only texts (monsters.html). Never referenced in game, so i18n numbering skips this section
// (see translationService.browseTranslations): adding a key here must not renumber generated.tra.
export default {
  entry: {
    basilisk: "Basilisk",
    clayGolem: "Clay Golem",
    ghoul: "Ghoul",
    mummy: "Mummy",
    shadow: "Shadow",
    stoneGolem: "Stone Golem",
    vampire: "Vampire",
    wyvern: "Wyvern",
    zombie: "Zombie",
  },
  types: {
    aberration: {
      name: "Aberration",
      desc: `Aberrations have bizarre anatomy, strange abilities, an alien mindset, or any combination of the three.
Darkvision out to 60 feet.`,
    },
    animal: {
      name: "Animal",
      desc: `An animal is a living, nonhuman creature, usually a vertebrate with no magical abilities and no innate capacity for language or culture.
Low-light vision.`,
    },
    dragon: {
      name: "Dragon",
      desc: `A dragon is a reptilelike creature, usually winged, with magical or unusual abilities.
Immunity to magic sleep effects and paralysis effects.
Darkvision out to 60 feet and low-light vision.`,
    },
    monstrousHumanoid: {
      name: "Monstrous Humanoid",
      desc: `Monstrous humanoids are similar to humanoids, but with monstrous or animalistic features. They often have magical abilities as well.
Darkvision out to 60 feet.`,
    },
    outsider: {
      name: "Outsider",
      desc: `An outsider is at least partially composed of the essence (but not necessarily the material) of some plane other than the Material Plane. Some creatures start out as some other type and become outsiders when they attain a higher (or lower) state of spiritual existence.
Darkvision out to 60 feet.`,
    },
  },
};

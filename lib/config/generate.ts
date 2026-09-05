export const GLOBAL_CONFIG = {
  files: {
    coreMonsters: "lib/pnp-monster/common/core.tpa",
    spellResources: "lib/common/spell-resources.tpa",
    spellFunctions: "lib/common/spell-functions.tpa",
    immunities: "lib/common/immunities.tpa",
  },
  constitutionAffectHitPoint: true,
  spellcasterPrecastMidDurationSpells: false,
  /**
   * Keep disabled during development: shuffling target order on every
   * regeneration would churn the committed .baf files with no real
   * config change behind it. Enable once, right before a release build,
   * to bake in the intended non-nearest-first target variety.
   */
  enableRandomTargetOrder: false,
  /**
   * Keep disabled during development because it increases installation time.
   * Enable once, right before a release build.
   */
  enableSecondaryTypes: false,
  bafConstants: {
    combatStarted: "JA_COMBAT",
    disableSpellcasting: "JA_DISABLE_SPELLCASTING",
    initGlobal: "JA_INIT",
    precastLongDurationSpells: "JA_PRECAST_LONG",
    precastMidDurationSpells: "JA_PRECAST_MID",
    minorSequencer: "JA_MINOR_SEQUENCER",
    sequencer: "JA_SEQUENCER",
    restTimer: "JA_REST",
    helpTimer: "JA_HELP",
    roundTimer: "JA_ROUND",
    noOpenDoor: "RR#NOPND",
    dialog: "JA_DIALOG",
    monsterShoutId: 99,
    summonerShoutId: 98,
    trackingRange: 150,
    meleeRange: 4,
  },
  tpaConstants: {
    genericScriptsToRemove: [
      "BDANIMN",
      "BDARCHNI",
      "BDENRAGE",
      "BDENSHTV",
      "BDFIG00",
      "BDFIGH01",
      "BDFIGH42",
      "BDFIGH43",
      "BDFMAG01",
      "BDFMAG23",
      "BDGRSHTV",
      "BDNONIN",
      "BDSHM00",
      "BDSUM00",
      "BPASIGHT",
      "BPSIGHT",
      "BPWDASGT",
      "BPWDRSGT",
      "BPWTRSGT",
      "BPWTSIGT",
      "DVMELEE",
      "GENSHT01",
      "SHOUT",
      "WDASIGHT",
      "WDRUNSGT",
      "WTASIGHT",
      "wtrunsgt",
    ],
    genericScriptsToRemoveRx: [/DW#GP.+/, /DW#MG.+/, /DW1.+/, /DW2.+/, /DW3.+/],
    genericScriptsToKeep: ["BDSHOUT", "INITDLG", "RR#PICKP", "SHOUTDLG", "GPSHOUT", "DW#SHDLG"],
  },
};

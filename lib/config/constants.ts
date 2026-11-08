// Values that never change: generated file paths, script variable names, shout ids and the
// generic scripts to replace. Read-only. Tunable values live in player-config.ts and
// build-config.ts.

/** Generated WeiDU files shared by every creature */
export const MOD_FILES = {
  coreMonsters: "lib/pnp-monster/common/core.tpa",
  spellResources: "lib/common/spell-resources.tpa",
  spellFunctions: "lib/common/spell-functions.tpa",
  immunities: "lib/common/immunities.tpa",
  stringRefs: "lib/common/string-refs.tpa",
} as const;

/** Global and timer names, and shout ids, the generated scripts use */
export const BAF_CONSTANTS = {
  combatStarted: "JA_COMBAT",
  disableSpellcasting: "JA_DISABLE_SPELLCASTING",
  initGlobal: "JA_INIT",
  precastLongDurationSpells: "JA_PRECAST_LONG",
  precastMidDurationSpells: "JA_PRECAST_MID",
  restTimer: "JA_REST",
  shoutTimer: "JA_SHOUT",
  helpTimer: "JA_HELP",
  roundTimer: "JA_ROUND",
  noOpenDoor: "JA_DOOR",
  dialog: "JA_DIALOG",
  monsterShoutId: 99,
  summonerShoutId: 98,
} as const;

export interface TpaConstants {
  readonly genericScriptsToRemove: readonly string[];
  readonly genericScriptsToRemoveRx: readonly RegExp[];
  readonly genericScriptsToKeep: readonly string[];
}

/** The game's generic creature scripts our scripts replace, and the ones they keep */
export const TPA_CONSTANTS: TpaConstants = {
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
    "BDMAGE01",
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
  genericScriptsToRemoveRx: [/DW#GP.+/, /DW#MG.+/, /DW#PR.+/, /DW1.+/, /DW2.+/, /DW3.+/],
  genericScriptsToKeep: [
    "BDHELP",
    "BDSHOUT",
    "INITDLG",
    "HUNTER",
    "RR#PICKP",
    "SHOUTDLG",
    "SHOUT",
    "GPSHOUT",
    "GRPSHT01",
    "DW#SPHLP",
    "DW#SHDLG",
  ],
};

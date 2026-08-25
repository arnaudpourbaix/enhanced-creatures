import weiduUtils from "../../services/utils/weidu.utils";
import { SpellbookModName } from "../../../config/spells/spellbook-mod-name";
import { ImmunityName } from "../final/immunity";
import { CreatureSize } from "../game-data/sizes";
import { AlignIdentifier } from "../ids/align";
import { AllegianceIdentifier } from "../ids/allegiance";
import { AnimationIdentifiers } from "../ids/animate";
import { ClassIdentifier } from "../ids/class";
import { GenderIdentifier } from "../ids/gender";
import { GeneralIdentifier } from "../ids/general";
import { KitIdentifier } from "../ids/kit";
import { RaceIdentifier } from "../ids/race";
import { Effect } from "../spell-item/effect";
import { ProficiencyTypeEnum } from "../spell-item/effect.enums";
import { EffectTypeEnum } from "../spell-item/effect.type";
import { WithRequired } from "../utility-types";
import { EquippedItem } from "./item";
import { Movement } from "./movement";

export interface CreatureData {
  level1?: Level;
  level2?: Level;
  level3?: Level;
  movement?: Movement;
  strength?: number;
  exceptionalStrength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  hp?: number;
  /**
   * Bonus HP (+x). For example, Hit Dice 6+1, bonus is 1
   */
  bonusHp?: number;
  /**
   * Specific case when creature have more HP or can fight when HP is below 0 like some bears.
   */
  specialBonusHp?: number;
  ac?: number;
  thac0?: number;
  apr?: number;
  xpv?: number;
  alignment?: AlignIdentifier;
  saveDeath?: number;
  saveWand?: number;
  savePolymorph?: number;
  saveBreath?: number;
  saveSpell?: number;
  morale?: number;
  general?: GeneralIdentifier;
  race?: RaceIdentifier;
  class?: ClassIdentifier;
  kit?: KitIdentifier;
  gender?: GenderIdentifier;
  ea?: AllegianceIdentifier;
  size?: CreatureSize;
  animation?: AnimationIdentifiers;
  modAnimation?: string;
  metalColor?: number;
  minorColor?: number;
  majorColor?: number;
  skinColor?: number;
  leatherColor?: number;
  armorColor?: number;
  hairColor?: number;
  doubleApr?: boolean;
  hideShadow?: number;
  moveSilent?: number;
  crushingAC?: number;
  missileAC?: number;
  piercingAC?: number;
  slashingAC?: number;
  resistFire?: number;
  resistCold?: number;
  resistElectricity?: number;
  resistAcid?: number;
  resistMagic?: number;
  resistSlashing?: number;
  resistCrushing?: number;
  resistPiercing?: number;
  resistMissile?: number;
  script: CreatureDataScript;
  proficiencies: CreatureDataProficiencies;
  immunities: ImmunityName[];
  items: CreatureDataItems;
  spells: CreatureDataSpells;
  effects: CreatureDataEffects;
}

export type MainCreatureDataRequiredKeys =
  | "level1"
  | "movement"
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "ac"
  | "apr"
  | "general"
  | "race"
  | "class"
  | "size";

export type MainCreatureData = WithRequired<CreatureData, MainCreatureDataRequiredKeys>;

export class CreatureDataScript {
  /**
   * BAF scripts to remove from CRE
   */
  remove: string[] = [];
  /**
   * BAF Script location. Auto if empty, at the lowest tier possible.
   * Will raise an error at install if location was not empty (safety measure)
   * Use None to prevent from assigning a script
   */
  location?: ScriptLocation;

  edits?: CreatureScriptEdit[];
}

export interface CreatureScriptEdit {
  files: string[];
  /**
   * Will call REPLACE_TEXTUALLY
   */
  replaces: [string, string][];
}

export class CreatureDataItems {
  remove: string[] = [];
  equipped: EquippedItem[] = [];
}

export class CreatureDataSpells {
  /**
   * Mod-conditional spellbook variants, checked in order at install time via each mod's
   * `weiduCheck` - the first one whose mod is detected installed is used instead of
   * `memorized`. Falls back to `memorized` if none match (or if this is unset).
   */
  spellbooks?: SpellbookVariant[];
  memorized: MemorizedSpell[] = [];
  removeKnown?: boolean;
  removeMemorized?: boolean | string[];
}

export interface SpellbookVariant {
  /** Key into SPELLBOOK_MODS (lib/config/mods.ts), which resolves the actual WeiDU check. */
  mod: SpellbookModName;
  memorized: MemorizedSpell[];
}

export type CreatureDataProficiencies = {
  type: ProficiencyTypeEnum;
  value: number;
}[];

export class CreatureDataEffects {
  remove?: boolean | EffectTypeEnum[];
  list: Effect[] = [];
}

export interface DualValue {
  value: number;
  pnpValue: number;
}

export interface Level extends DualValue {
  type: "caster" | "turn" | "none";
}

export interface MemorizedSpell {
  /**
   * Filename for SPL file (without extension)
   */
  file: string;

  memorizedCount?: number;

  level?: number;
}

export type ScriptLocation = "Override" | "Class" | "Race" | "General" | "Default" | "None";

export const DATA_DEFAULT: Partial<CreatureData> = {
  immunities: [],
  proficiencies: [],
  script: {
    remove: [],
  },
  items: {
    equipped: [],
    remove: [],
  },
  spells: {
    removeKnown: true,
    removeMemorized: true,
    memorized: [],
  },
  effects: {
    remove: [],
    list: [],
  },
};

export const ADJUSTMENT_DATA_DEFAULT: Partial<CreatureData> = {
  ...DATA_DEFAULT,
  spells: {
    removeKnown: undefined,
    removeMemorized: undefined,
    memorized: [],
  },
  effects: {
    remove: [],
    list: [],
  },
};

export const CREATURE_DATA_FIELDS: {
  key: keyof CreatureData;
  fields?: { index: number; size: number }[];
  /**
   * Get value in WEIDU format
   */
  value?: (data: CreatureData) => string | undefined;
  /**
   * Default setter overrides current value if new value is defined
   */
  // `any` is genuinely necessary here, not just convenient: this table is heterogeneous (each
  // entry's setter has its own specific value type), and neither alternative works in both
  // directions at once - `never` lets narrower setters be assigned into the table but makes them
  // uncallable with a real value (see data.test.ts, which calls each field's setter directly with
  // its own real type); `unknown` allows calling but rejects assigning any narrower setter into
  // the table in the first place (see the individual entries below, e.g. `value: Level | number`).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setter?: (data: CreatureData, value: any) => void;
}[] = [
  {
    key: "xpv",
    value: (data) => weiduUtils.getIntegerValue(data.xpv),
    fields: [{ index: 0x14, size: 4 }],
  },
  {
    key: "hp",
    value: (data) => weiduUtils.getIntegerValue(data.hp),
    fields: [
      { index: 0x24, size: 2 },
      { index: 0x26, size: 2 },
    ],
  },
  {
    key: "ac",
    value: (data) => weiduUtils.getIntegerValue(data.ac),
    fields: [
      { index: 0x46, size: 2 },
      { index: 0x48, size: 2 },
    ],
  },
  {
    key: "crushingAC",
    value: (data) => weiduUtils.getIntegerValue(data.crushingAC),
    fields: [{ index: 0x4a, size: 2 }],
  },
  {
    key: "missileAC",
    value: (data) => weiduUtils.getIntegerValue(data.missileAC),
    fields: [{ index: 0x4c, size: 2 }],
  },
  {
    key: "piercingAC",
    value: (data) => weiduUtils.getIntegerValue(data.piercingAC),
    fields: [{ index: 0x4e, size: 2 }],
  },
  {
    key: "slashingAC",
    value: (data) => weiduUtils.getIntegerValue(data.slashingAC),
    fields: [{ index: 0x50, size: 2 }],
  },
  {
    key: "thac0",
    value: (data) => weiduUtils.getIntegerValue(data.thac0),
    fields: [{ index: 0x52, size: 1 }],
  },
  {
    key: "apr",
    value: (data) => weiduUtils.getIntegerValue(data.apr),
    fields: [{ index: 0x53, size: 1 }],
  },
  {
    key: "doubleApr",
    value: (data) => weiduUtils.getBooleanValue(data.doubleApr),
  },
  {
    key: "saveDeath",
    value: (data) => weiduUtils.getIntegerValue(data.saveDeath),
    fields: [{ index: 0x54, size: 1 }],
  },
  {
    key: "saveWand",
    value: (data) => weiduUtils.getIntegerValue(data.saveWand),
    fields: [{ index: 0x55, size: 1 }],
  },
  {
    key: "savePolymorph",
    value: (data) => weiduUtils.getIntegerValue(data.savePolymorph),
    fields: [{ index: 0x56, size: 1 }],
  },
  {
    key: "saveBreath",
    value: (data) => weiduUtils.getIntegerValue(data.saveBreath),
    fields: [{ index: 0x57, size: 1 }],
  },
  {
    key: "saveSpell",
    value: (data) => weiduUtils.getIntegerValue(data.saveSpell),
    fields: [{ index: 0x58, size: 1 }],
  },
  {
    key: "resistFire",
    value: (data) => weiduUtils.getIntegerValue(data.resistFire),
    fields: [
      { index: 0x59, size: 1 },
      { index: 0x5e, size: 1 },
    ],
  },
  {
    key: "resistCold",
    value: (data) => weiduUtils.getIntegerValue(data.resistCold),
    fields: [
      { index: 0x5a, size: 1 },
      { index: 0x5f, size: 1 },
    ],
  },
  {
    key: "resistElectricity",
    value: (data) => weiduUtils.getIntegerValue(data.resistElectricity),
    fields: [{ index: 0x5b, size: 1 }],
  },
  {
    key: "resistAcid",
    value: (data) => weiduUtils.getIntegerValue(data.resistAcid),
    fields: [{ index: 0x5c, size: 1 }],
  },
  {
    key: "resistMagic",
    value: (data) => weiduUtils.getIntegerValue(data.resistMagic),
    fields: [{ index: 0x5d, size: 1 }],
  },
  {
    key: "resistSlashing",
    value: (data) => weiduUtils.getIntegerValue(data.resistSlashing),
    fields: [{ index: 0x60, size: 1 }],
  },
  {
    key: "resistCrushing",
    value: (data) => weiduUtils.getIntegerValue(data.resistCrushing),
    fields: [{ index: 0x61, size: 1 }],
  },
  {
    key: "resistPiercing",
    value: (data) => weiduUtils.getIntegerValue(data.resistPiercing),
    fields: [{ index: 0x62, size: 1 }],
  },
  {
    key: "resistMissile",
    value: (data) => weiduUtils.getIntegerValue(data.resistMissile),
    fields: [{ index: 0x63, size: 1 }],
  },
  {
    key: "level1",
    value: (data) => weiduUtils.getIntegerValue(data.level1?.value),
    fields: [{ index: 0x234, size: 1 }],
    setter: (data, value: Level | number) => {
      if (typeof value === "number") {
        data.level1 = { pnpValue: value, type: "none", value };
      } else {
        data.level1 = value;
      }
    },
  },
  {
    key: "level2",
    value: (data) => weiduUtils.getIntegerValue(data.level2?.value),
    fields: [{ index: 0x235, size: 1 }],
    setter: (data, value: Level | number) => {
      if (typeof value === "number") {
        data.level2 = { pnpValue: value, type: "none", value };
      } else {
        data.level2 = value;
      }
    },
  },
  {
    key: "level3",
    value: (data) => weiduUtils.getIntegerValue(data.level3?.value),
    fields: [{ index: 0x236, size: 1 }],
    setter: (data, value: Level | number) => {
      if (typeof value === "number") {
        data.level3 = { pnpValue: value, type: "none", value };
      } else {
        data.level3 = value;
      }
    },
  },
  {
    key: "gender",
    value: (data) => weiduUtils.getIdsValue("gender", data.gender),
    fields: [
      { index: 0x237, size: 1 },
      { index: 0x275, size: 1 },
    ],
  },
  {
    key: "strength",
    value: (data) => weiduUtils.getIntegerValue(data.strength),
    fields: [{ index: 0x238, size: 1 }],
  },
  {
    key: "exceptionalStrength",
    value: (data) => weiduUtils.getIntegerValue(data.exceptionalStrength),
    fields: [{ index: 0x239, size: 1 }],
  },
  {
    key: "intelligence",
    value: (data) => weiduUtils.getIntegerValue(data.intelligence),
    fields: [{ index: 0x23a, size: 1 }],
  },
  {
    key: "wisdom",
    value: (data) => weiduUtils.getIntegerValue(data.wisdom),
    fields: [{ index: 0x23b, size: 1 }],
  },
  {
    key: "dexterity",
    value: (data) => weiduUtils.getIntegerValue(data.dexterity),
    fields: [{ index: 0x23c, size: 1 }],
  },
  {
    key: "constitution",
    value: (data) => weiduUtils.getIntegerValue(data.constitution),
    fields: [{ index: 0x23d, size: 1 }],
  },
  {
    key: "charisma",
    value: (data) => weiduUtils.getIntegerValue(data.charisma),
    fields: [{ index: 0x23e, size: 1 }],
  },
  {
    key: "morale",
    value: (data) => weiduUtils.getIntegerValue(data.morale),
    fields: [{ index: 0x23f, size: 1 }],
  },
  {
    key: "ea",
    value: (data) => weiduUtils.getIdsValue("ea", data.ea),
    fields: [{ index: 0x270, size: 1 }],
  },
  {
    key: "general",
    value: (data) => weiduUtils.getIdsValue("general", data.general),
    fields: [{ index: 0x271, size: 1 }],
  },
  {
    key: "race",
    value: (data) => weiduUtils.getIdsValue("race", data.race),
    fields: [{ index: 0x272, size: 1 }],
  },
  {
    key: "class",
    value: (data) => weiduUtils.getIdsValue("class", data.class),
    fields: [{ index: 0x273, size: 1 }],
  },
  {
    key: "kit",
    value: (data) => weiduUtils.getIdsValue("kit", data.kit),
    fields: [{ index: 0x246, size: 2 }],
  },
  {
    key: "alignment",
    value: (data) => weiduUtils.getIdsValue("align", data.alignment),
    fields: [{ index: 0x27b, size: 1 }],
  },
  {
    key: "hideShadow",
    value: (data) => weiduUtils.getIntegerValue(data.hideShadow),
    fields: [{ index: 0x45, size: 1 }],
  },
  {
    key: "moveSilent",
    value: (data) => weiduUtils.getIntegerValue(data.moveSilent),
    fields: [{ index: 0x68, size: 1 }],
  },
  {
    key: "animation",
    value: (data) => weiduUtils.getIdsValue("animate", data.animation),
    fields: [{ index: 0x28, size: 4 }],
  },
  {
    key: "modAnimation",
    value: (data) => weiduUtils.getIdsValue("animate", data.modAnimation),
    fields: [{ index: 0x28, size: 4 }],
  },
  {
    key: "metalColor",
    value: (data) => weiduUtils.getIntegerValue(data.metalColor),
    fields: [{ index: 0x2c, size: 1 }],
  },
  {
    key: "minorColor",
    value: (data) => weiduUtils.getIntegerValue(data.minorColor),
    fields: [{ index: 0x2d, size: 1 }],
  },
  {
    key: "majorColor",
    value: (data) => weiduUtils.getIntegerValue(data.majorColor),
    fields: [{ index: 0x2e, size: 1 }],
  },
  {
    key: "skinColor",
    value: (data) => weiduUtils.getIntegerValue(data.skinColor),
    fields: [{ index: 0x2f, size: 1 }],
  },
  {
    key: "leatherColor",
    value: (data) => weiduUtils.getIntegerValue(data.leatherColor),
    fields: [{ index: 0x30, size: 1 }],
  },
  {
    key: "armorColor",
    value: (data) => weiduUtils.getIntegerValue(data.armorColor),
    fields: [{ index: 0x31, size: 1 }],
  },
  {
    key: "hairColor",
    value: (data) => weiduUtils.getIntegerValue(data.hairColor),
    fields: [{ index: 0x32, size: 1 }],
  },
  {
    key: "movement",
    value: (data) =>
      data.movement && !data.movement.hasItem()
        ? weiduUtils.getIntegerValue(data.movement.getGameValue())
        : undefined,
    setter: (data, value: number) => {
      data.movement = new Movement(value);
    },
  },
  {
    key: "size",
  },
  {
    key: "bonusHp",
  },
  {
    key: "specialBonusHp",
  },
  {
    key: "script",
    setter: (data, value: Partial<CreatureDataScript>) => {
      if (value.remove) {
        data.script.remove.push(...value.remove);
      }
      if (value.location !== undefined) {
        data.script.location = value.location;
      }
      if (value.edits! !== undefined) {
        data.script.edits = value.edits;
      }
    },
  },
  {
    key: "proficiencies",
    setter: (data, value: CreatureDataProficiencies) => {
      data.proficiencies.push(...value);
    },
  },
  {
    key: "immunities",
    setter: (data, value: ImmunityName[]) => {
      data.immunities.push(...value);
    },
  },
  {
    key: "items",
    setter: (data, value: Partial<CreatureDataItems>) => {
      if (value.remove) {
        data.items.remove.push(...value.remove);
      }
      if (value.equipped) {
        data.items.equipped.push(...value.equipped);
      }
    },
  },
  {
    key: "spells",
    setter: (data, value: Partial<CreatureDataSpells>) => {
      if (value.spellbooks) {
        data.spells.spellbooks ??= [];
        data.spells.spellbooks.push(...value.spellbooks);
      }
      if (value.memorized) {
        data.spells.memorized.push(...value.memorized);
      }
      if (value.removeKnown !== undefined) {
        data.spells.removeKnown = value.removeKnown;
      }
      if (value.removeMemorized === undefined) return;
      if (typeof value.removeMemorized === "boolean") {
        data.spells.removeMemorized = value.removeMemorized;
      } else if (
        Array.isArray(data.spells.removeMemorized) &&
        Array.isArray(value.removeMemorized)
      ) {
        data.spells.removeMemorized.push(...value.removeMemorized);
      } else if (Array.isArray(value.removeMemorized)) {
        data.spells.removeMemorized = value.removeMemorized;
      }
    },
  },
  {
    key: "effects",
    setter: (data, value: Partial<CreatureDataEffects>) => {
      if (value.list) {
        data.effects.list.push(...value.list);
      }
      if (value.remove === undefined) return;
      if (typeof value.remove === "boolean") {
        data.effects.remove = value.remove;
      } else if (Array.isArray(data.effects.remove) && Array.isArray(value.remove)) {
        data.effects.remove.push(...value.remove);
      } else if (Array.isArray(value.remove)) {
        data.effects.remove = value.remove;
      }
    },
  },
];

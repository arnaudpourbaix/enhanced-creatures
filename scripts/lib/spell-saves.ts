import * as fs from "fs";
import * as path from "path";
import {
  negatingSaves,
  type SaveEffect,
  mergeSaves,
  type SpellSaves,
} from "../../lib/src/model/spell-item/spell-reference";
import { SaveTypeEnum } from "../../lib/src/model/spell-item/effect.enums";
import { addFieldToDatabase } from "./spell-database-writer";

const SPL_TYPE = 0x3ee;
const EFF_TYPE = 0x3f8;
const SELF_TARGET = 1;
/** The target picked when casting: for a spell cast on the caster, the caster */
const PRESET_TARGET = 2;
const DAMAGE = 12;
const SAVE_FOR_HALF = 1 << 8;
const FAIL_FOR_HALF = 1 << 9;

/** Opcodes handing their payload over to another spell (146: cast spell, 148: cast spell at
 * point, 326: apply effects list) or to an EFF file (177: use EFF file). */
const SPELL_RELAYS = new Set([146, 148, 326]);
const EFF_RELAY = 177;
/**
 * An EFF relay's parameter2 naming GENDER.IDS: it only affects summoned or illusory creatures, a
 * side effect aimed at special creatures (other IDS filters - allegiance, alignment, race... -
 * narrow the spell's own audience, and are followed).
 */
const GENDER_FILTER = 7;

/** A NUL-terminated string read from a fixed-size field. */
function cString(value: string): string {
  const end = value.indexOf("\0");
  return end < 0 ? value : value.slice(0, end);
}

/** One effect as read from an SPL feature block or an EFF file - only what save resolution needs. */
export interface RawEffect {
  opcode: number;
  target: number;
  parameter2: number;
  resource: string;
  /** IE save type bitmask (bit N = SaveTypeEnum N) */
  saveType: number;
  /** Added to the target's roll (negative: a penalty) */
  saveBonus: number;
  special: number;
  /** 0: lasts `duration`, 1: permanent, 3: delayed by `duration`... */
  timingMode: number;
  /** In seconds */
  duration: number;
  /** Dispel/resistance: 1 when magic resistance stops it (see EffectDispelResistanceEnum) */
  resistance: number;
}

/** Reads game resources the way the engine does: override first, then the BIFs of chitin.key. */
export class ResourceReader {
  private readonly bifs: string[] = [];
  private readonly locators = new Map<string, number>();
  private readonly bifCache = new Map<number, Buffer>();

  /** `useOverride` false reads the BIFs only: the game as shipped, before any mod. */
  constructor(
    private readonly gameDir: string,
    private readonly useOverride = true,
  ) {
    const key = fs.readFileSync(path.join(gameDir, "chitin.key"));
    if (key.toString("latin1", 0, 8) !== "KEY V1  ") throw new Error("Not a KEY V1 file");
    const bifCount = key.readUInt32LE(8);
    const resCount = key.readUInt32LE(12);
    const bifOffset = key.readUInt32LE(16);
    const resOffset = key.readUInt32LE(20);
    for (let i = 0; i < bifCount; i++) {
      const entry = bifOffset + i * 12;
      const nameOffset = key.readUInt32LE(entry + 4);
      const nameLength = key.readUInt16LE(entry + 8);
      const name = cString(key.toString("latin1", nameOffset, nameOffset + nameLength));
      this.bifs.push(name.replace(/\\/g, "/"));
    }
    for (let i = 0; i < resCount; i++) {
      const entry = resOffset + i * 14;
      const name = cString(key.toString("latin1", entry, entry + 8));
      const type = key.readUInt16LE(entry + 8);
      this.locators.set(`${name.toUpperCase()}.${type}`, key.readUInt32LE(entry + 10));
    }
  }

  /** Every resource of that type in the game: the BIFs', and the override's when read. */
  names(type: number, extension: string): string[] {
    const names = new Set<string>();
    for (const key of this.locators.keys()) {
      const [name, keyType] = key.split(".");
      if (Number(keyType) === type) names.add(name);
    }
    if (this.useOverride) {
      const suffix = `.${extension.toUpperCase()}`;
      for (const file of fs.readdirSync(path.join(this.gameDir, "override"))) {
        if (file.toUpperCase().endsWith(suffix))
          names.add(file.slice(0, -suffix.length).toUpperCase());
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }

  read(name: string, type: number, extension: string): Buffer | undefined {
    if (this.useOverride) {
      const file = path.join(this.gameDir, "override", `${name}.${extension}`);
      if (fs.existsSync(file)) return fs.readFileSync(file);
    }
    const locator = this.locators.get(`${name.toUpperCase()}.${type}`);
    if (locator === undefined) return undefined;
    const bif = this.bif(locator >>> 20);
    const fileCount = bif.readUInt32LE(8);
    const fileOffset = bif.readUInt32LE(16);
    for (let i = 0; i < fileCount; i++) {
      const entry = fileOffset + i * 16;
      if ((bif.readUInt32LE(entry) & 0x3fff) !== (locator & 0x3fff)) continue;
      const offset = bif.readUInt32LE(entry + 4);
      return bif.subarray(offset, offset + bif.readUInt32LE(entry + 8));
    }
    return undefined;
  }

  private bif(index: number): Buffer {
    let bif = this.bifCache.get(index);
    if (!bif) {
      bif = fs.readFileSync(path.join(this.gameDir, this.bifs[index]));
      if (bif.toString("latin1", 0, 8) !== "BIFFV1  ") {
        throw new Error(`${this.bifs[index]}: only uncompressed BIFF V1 is supported`);
      }
      this.bifCache.set(index, bif);
    }
    return bif;
  }
}

const resref = (buffer: Buffer, offset: number) =>
  cString(buffer.toString("latin1", offset, offset + 8)).toUpperCase();

/**
 * The effects of every extended header of an SPL V1, or only of the one a caster of `casterLevel`
 * casts (casting effects, on the caster, aren't).
 */
export function readSplEffects(spl: Buffer, casterLevel?: number): RawEffect[] {
  if (spl.toString("latin1", 0, 8) !== "SPL V1  ") throw new Error("Not a SPL V1 file");
  const headerOffset = spl.readUInt32LE(0x64);
  const headerCount = spl.readUInt16LE(0x68);
  const effectOffset = spl.readUInt32LE(0x6a);
  const effects: RawEffect[] = [];
  const picked = casterLevel === undefined ? undefined : pickHeader(spl, casterLevel);
  for (let h = 0; h < headerCount; h++) {
    if (picked !== undefined && h !== picked) continue;
    const header = headerOffset + h * 0x28;
    const count = spl.readUInt16LE(header + 0x1e);
    const first = spl.readUInt16LE(header + 0x20);
    for (let i = first; i < first + count; i++) {
      const fx = effectOffset + i * 0x30;
      effects.push({
        opcode: spl.readUInt16LE(fx),
        target: spl.readUInt8(fx + 2),
        parameter2: spl.readUInt32LE(fx + 8),
        resource: resref(spl, fx + 0x14),
        saveType: spl.readUInt32LE(fx + 0x24),
        saveBonus: spl.readInt32LE(fx + 0x28),
        special: spl.readUInt32LE(fx + 0x2c),
        timingMode: spl.readUInt8(fx + 0x0c),
        duration: spl.readUInt32LE(fx + 0x0e),
        resistance: spl.readUInt8(fx + 0x0d),
      });
    }
  }
  return effects;
}

/** The single effect of an EFF V2.0 file. */
export function readEffEffect(eff: Buffer): RawEffect {
  if (eff.toString("latin1", 0, 8) !== "EFF V2.0") throw new Error("Not an EFF V2.0 file");
  return {
    opcode: eff.readUInt32LE(0x10),
    target: eff.readUInt32LE(0x14),
    parameter2: eff.readUInt32LE(0x20),
    resource: resref(eff, 0x30),
    saveType: eff.readUInt32LE(0x40),
    saveBonus: eff.readInt32LE(0x44),
    special: eff.readUInt32LE(0x48),
    timingMode: eff.readUInt32LE(0x24),
    duration: eff.readUInt32LE(0x28),
    // an EFF file applies with the relay's own resistance, see relayedEffects
    resistance: 0,
  };
}

function saveTypes(mask: number): SaveTypeEnum[] {
  const types = [
    SaveTypeEnum.Spell,
    SaveTypeEnum.Breath,
    SaveTypeEnum.ParalyzePoisonDeath,
    SaveTypeEnum.RodStaffWand,
    SaveTypeEnum.PetrifyPolymorph,
  ];
  return types.filter((type) => mask & (1 << type));
}

/** Loads a resource's effects, or undefined when the game doesn't have it. */
export interface EffectSource {
  spl(name: string): RawEffect[] | undefined;
  eff(name: string): RawEffect | undefined;
}

/** The header a caster of `casterLevel` casts: the last one whose minimum level it reaches. */
function pickHeader(spl: Buffer, casterLevel: number): number {
  const headerOffset = spl.readUInt32LE(0x64);
  let picked = 0;
  for (let h = 0; h < spl.readUInt16LE(0x68); h++) {
    if (spl.readUInt16LE(headerOffset + h * 0x28 + 0x10) <= casterLevel) picked = h;
  }
  return picked;
}

/**
 * Reads spells and EFF files from `reader`: every header of a spell, or only the one a caster of
 * `casterLevel` casts.
 */
export function readerSource(
  reader: Pick<ResourceReader, "read">,
  casterLevel?: number,
): EffectSource {
  return {
    spl: (name) => {
      const spl = reader.read(name, SPL_TYPE, "SPL");
      return spl && readSplEffects(spl, casterLevel);
    },
    eff: (name) => {
      const eff = reader.read(name, EFF_TYPE, "EFF");
      return eff && readEffEffect(eff);
    },
  };
}

/**
 * `effects` with each relay to another spell or an EFF file without a save of its own replaced by
 * what it relays (its payload only lands if the target fails the relay's own save, so a relay
 * with a save is kept as is). With `all`, every relay is followed, saved or cast on the caster:
 * what the spell does, rather than what decides whether its target escapes it. Relayed spells are
 * followed once each, so a cycle can't loop. An EFF relay filtered by GENDER.IDS only affects
 * summoned or illusory creatures (e.g. Dispel Magic slaying illusions), so it says nothing about
 * the spell's target in general: it's left out.
 */
export function followRelays(
  source: EffectSource,
  effects: RawEffect[],
  seen = new Set<string>(),
  all = false,
): RawEffect[] {
  return effects.flatMap((effect): RawEffect[] => {
    if (effect.opcode === EFF_RELAY && effect.parameter2 === GENDER_FILTER) return [];
    const kept = !all && (saveTypes(effect.saveType).length > 0 || effect.target === SELF_TARGET);
    const relayed = kept ? undefined : relayedEffects(source, effect, seen);
    return relayed ? followRelays(source, relayed, seen, all) : [effect];
  });
}

/** What `effect` relays to, when it's a relay not followed yet (marked as followed). */
function relayedEffects(
  source: EffectSource,
  effect: RawEffect,
  seen: Set<string>,
): RawEffect[] | undefined {
  if (!effect.resource) return undefined;
  // keyed by type: an EFF file is often named after the spell relaying to it
  if (SPELL_RELAYS.has(effect.opcode) && !seen.has(effect.resource)) {
    seen.add(effect.resource);
    const relayed = source.spl(effect.resource);
    // cast on the caster, the spell's preset target is the caster
    if (effect.target !== SELF_TARGET) return relayed;
    return relayed?.map((fx) =>
      fx.target === PRESET_TARGET ? { ...fx, target: SELF_TARGET } : fx,
    );
  }
  if (effect.opcode === EFF_RELAY && !seen.has(`EFF:${effect.resource}`)) {
    seen.add(`EFF:${effect.resource}`);
    const relayed = source.eff(effect.resource);
    // the engine applies an EFF file to the relay's own target, for the relay's own duration
    const { target, timingMode, duration, resistance } = effect;
    return relayed && [{ ...relayed, target, timingMode, duration, resistance }];
  }
  return undefined;
}

/** The effects that decide whether the spell's target escapes it (see negatingSaves). */
export function saveEffects(
  source: EffectSource,
  effects: RawEffect[],
  seen = new Set<string>(),
): SaveEffect[] {
  return followRelays(source, effects, seen).map((effect) => ({
    opcode: effect.opcode,
    saveTypes: saveTypes(effect.saveType),
    saveBonus: effect.saveBonus,
    halved: effect.opcode === DAMAGE && !!(effect.special & (SAVE_FOR_HALF | FAIL_FOR_HALF)),
    self: effect.target === SELF_TARGET,
  }));
}

/** The saving throws negating a spell of the game, or undefined when the game doesn't have it. */
export function spellSaves(source: EffectSource, file: string): SpellSaves | undefined {
  const effects = source.spl(file.toUpperCase());
  return effects && negatingSaves(saveEffects(source, effects, new Set([file.toUpperCase()])));
}

/**
 * One set of saves valid whichever state the game is in: a target is skipped only when it can't
 * fail the spell in either state, so the states' entries add up - and a state where the spell
 * can't be escaped means no check at all. A state without the spell doesn't count.
 */
export function mergeStates(...states: (SpellSaves | undefined)[]): SpellSaves {
  const present = states.filter((saves) => saves !== undefined);
  if (!present.length || present.some((saves) => !saves.length)) return [];
  return mergeSaves(present.flat());
}

const ENUM_NAMES: Record<number, string> = {
  [SaveTypeEnum.Spell]: "SaveTypeEnum.Spell",
  [SaveTypeEnum.Breath]: "SaveTypeEnum.Breath",
  [SaveTypeEnum.ParalyzePoisonDeath]: "SaveTypeEnum.ParalyzePoisonDeath",
  [SaveTypeEnum.RodStaffWand]: "SaveTypeEnum.RodStaffWand",
  [SaveTypeEnum.PetrifyPolymorph]: "SaveTypeEnum.PetrifyPolymorph",
};

/** `saves` as TypeScript source, e.g. `[{ types: [SaveTypeEnum.Spell], bonus: -2 }]`. */
export function savesSource(saves: SpellSaves): string {
  const entries = saves.map(({ types, bonus }) => {
    const list = `types: [${types.map((t) => ENUM_NAMES[t]).join(", ")}]`;
    return bonus ? `{ ${list}, bonus: ${bonus} }` : `{ ${list} }`;
  });
  return `[${entries.join(", ")}]`;
}

/** Adds `saves` to the database entries that don't declare any (see addFieldToDatabase). */
export function addSavesToDatabase(database: string, saves: Map<string, SpellSaves>): string {
  const values = [...saves].map(([file, value]) => ({ file, value: savesSource(value) }));
  return addFieldToDatabase(database, "saves", values);
}

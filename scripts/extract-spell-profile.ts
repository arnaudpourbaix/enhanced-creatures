import * as fs from "fs";
import * as path from "path";
import { getAllFnpSpells } from "../lib/config/spells/fnp-spell-database";
import { type SpellKeyword } from "../lib/config/spells/keyword";
import { SPELLS } from "../lib/config/spells/spell-database";
import {
  type SpellDurationClass,
  type SpellRole,
  type SpellTier,
} from "../lib/config/spells/spell-role";
import { getAllSpells } from "../lib/src/model/spell-item/spell-reference";
import { addFieldToDatabase } from "./lib/spell-database-writer";
import {
  classifyRole,
  classifyTier,
  proposeKeywords,
  readSplHeaderTarget,
  readSplHostile,
  areaHitsAllies,
  parseProjectileIds,
  casterLevelSource,
  minCasterLevel,
  readSplCastingTimes,
  spellDuration,
  spellEffects,
} from "./lib/spell-profile";
import { type EffectSource, type RawEffect, readerSource, ResourceReader } from "./lib/spell-saves";

// Extracts each SPELLS entry's (lib/config/spells/spell-database.ts) and Faiths and Powers spell's
// (lib/config/spells/fnp-spell-database.ts) casting time, role, tier and duration from a game
// install, for the cast order rules - see
// docs/superpowers/specs/2026-10-29-rule-based-spell-priority-design.md. The role is a guess from
// the spell's effects (see classifyRole), meant to be reviewed by hand. Reads the entry's own file
// as shipped (the BIFs alone) and with the install's mods (override first); the modded state wins,
// except for an entry a mod obsoletes.
//
// Writes assets/spells/spell-profile-report.md. With --write, also adds castingTime, role,
// secondary roles and a protection's tier (see classifyTier) to the entries that don't declare
// them, and duration to the protection, buff and summon ones (it
// drives precasting, see StatementBuilderService.precastSpells). A declared value is never changed.
//
// Run: ts-node scripts/extract-spell-profile.ts [--write] [--game <dir>]

const DEFAULT_GAME = "C:/Games/BG2EETest";
const DATABASE = path.join("lib", "config", "spells", "spell-database.ts");
const FNP_DATABASE = path.join("lib", "config", "spells", "fnp-spell-database.ts");
const REPORT = path.join("assets", "spells", "spell-profile-report.md");
const SPL_TYPE = 0x3ee;
const PRO_TYPE = 0x3fd;
const IDS_TYPE = 0x3f0;
/** Roles whose duration is worth precasting (see SpellReference.duration) */
const PRECAST_ROLES: SpellRole[] = ["protection", "buff", "summon"];

function parseArgs(): { gameDir: string; write: boolean } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--game");
  return { gameDir: idx >= 0 ? args[idx + 1] : DEFAULT_GAME, write: args.includes("--write") };
}

interface Profile {
  /** What the spell does, to guess its tier once its role is known */
  effects: RawEffect[];
  role?: SpellRole;
  secondaryRoles: SpellRole[];
  evidence: string[];
  castingTimes: number[];
  duration?: SpellDurationClass;
  /** Its area also hits the caster's allies; undefined without an area projectile */
  hitsAllies?: boolean;
  /** For an entry declaring no keywords: what its game data supports (see proposeKeywords) */
  proposedKeywords?: SpellKeyword[];
}

/** Whether the first header's projectile is an area hitting allies too (see areaHitsAllies). */
function hitsAllies(
  reader: ResourceReader,
  spl: Buffer,
  projectiles: Map<number, string>,
): boolean | undefined {
  const projectile = spl.readUInt16LE(spl.readUInt32LE(0x64) + 0x26);
  const name = projectiles.get(projectile - 1);
  const pro = name === undefined ? undefined : reader.read(name, PRO_TYPE, "PRO");
  return pro && areaHitsAllies(pro);
}

function profile(
  reader: ResourceReader,
  source: EffectSource,
  file: string,
  declaredKeywords: SpellKeyword[] | undefined,
  projectiles: Map<number, string>,
): Profile | undefined {
  const spl = reader.read(file, SPL_TYPE, "SPL");
  const effects = spl && spellEffects(source, file);
  if (!spl || !effects) return undefined;
  // the duration at the lowest level casting the spell, what a precast spell gets at worst
  const lowest = spellEffects(casterLevelSource(reader, minCasterLevel(spl)), file) ?? [];
  const allies = hitsAllies(reader, spl, projectiles);
  const proposedKeywords = declaredKeywords?.length
    ? undefined
    : proposeKeywords(effects, {
        hostile: readSplHostile(spl),
        area: allies !== undefined,
        headerTarget: readSplHeaderTarget(spl),
      });
  return {
    effects,
    ...classifyRole(
      effects,
      declaredKeywords?.length ? declaredKeywords : (proposedKeywords ?? []),
    ),
    castingTimes: readSplCastingTimes(spl),
    duration: spellDuration(lowest),
    hitsAllies: allies,
    proposedKeywords,
  };
}

interface Row {
  /** The database it comes from, as the report names it */
  database: string;
  key: string;
  file: string;
  profile: Profile;
  vanilla?: Profile;
  declared: {
    role?: SpellRole;
    secondaryRoles?: SpellRole[];
    castingTime?: number;
    duration?: SpellDurationClass;
    tier?: SpellTier;
    hitsAllies?: boolean;
  };
}

/** A database entry, from SPELLS or FNP_SPELLS */
interface Entry {
  key: string;
  file: string;
  keywords?: SpellKeyword[];
  obsoletedBy?: unknown;
  role?: SpellRole;
  secondaryRoles?: SpellRole[];
  castingTime?: number;
  duration?: SpellDurationClass;
  tier?: SpellTier;
  hitsAllies?: boolean;
}

/** The tier --write adds: a protection's guess, decent ones left unwritten. */
function newTier(row: Row): SpellTier | undefined {
  if (row.declared.tier) return undefined;
  return classifyTier(row.profile.effects, row.declared.role ?? row.profile.role);
}

const cell = (value: string | number | undefined) => (value === undefined ? "-" : String(value));
const castingTime = (p: Profile) => p.castingTimes.at(0);

function table(rows: Row[]): string[] {
  return [
    "| Spell | File | Role | Secondary roles | Tier | Evidence | Casting time | Extracted duration | Declared duration |",
    "|---|---|---|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.key} | ${r.file} | ${cell(r.declared.role ?? r.profile.role)} | ${(r.declared.secondaryRoles ?? secondaryRoles(r)).join(", ")} | ${r.declared.tier ?? newTier(r) ?? "decent"} | ${r.profile.evidence.join("<br>")} | ${cell(castingTime(r.profile))} | ${cell(r.profile.duration)} | ${cell(r.declared.duration)} |`,
    ),
  ];
}

/**
 * The secondary roles --write adds: what else the spell does besides its role, the declared one
 * when there is one. None for a useless spell.
 */
function secondaryRoles(row: Row): SpellRole[] {
  const role = row.declared.role ?? row.profile.role;
  if (role === "useless") return [];
  return row.profile.secondaryRoles.filter((secondary) => secondary !== role);
}

function section(title: string, note: string, rows: Row[]): string[] {
  return [`## ${title} (${rows.length})`, "", note, "", ...table(rows), ""];
}

/** The duration --write adds: only to precastable roles without a declared one. */
function newDuration(row: Row): SpellDurationClass | undefined {
  const role = row.declared.role ?? row.profile.role;
  if (row.declared.duration || !role || !PRECAST_ROLES.includes(role)) return undefined;
  return row.profile.duration;
}

function writeReport(rows: Row[]) {
  const unclassified = rows.filter((r) => !r.declared.role && !r.profile.role);
  const disagree = rows.filter(
    (r) =>
      r.vanilla &&
      (r.vanilla.role !== r.profile.role || castingTime(r.vanilla) !== castingTime(r.profile)),
  );
  const spread = rows.filter((r) => new Set(r.profile.castingTimes).size > 1);
  const durations = rows.filter(
    (r) => r.declared.duration && r.declared.duration !== r.profile.duration,
  );
  const precast = rows.filter((r) => {
    const duration = newDuration(r);
    return duration === "long" || duration === "mid";
  });
  fs.writeFileSync(
    REPORT,
    [
      "# Spell profiles",
      "",
      "Generated by `scripts/extract-spell-profile.ts`: each entry's role (guessed from its",
      "effects, see `classifyRole`), casting time (first header, lowest caster level) and",
      "duration (longest limited effect at the lowest level casting it: short below 2 turns, mid",
      "below 4 game hours, long from 4), from the modded game. Role shows the declared one when there is one. Run the script",
      "with `--write` to add the missing ones; a declared value is a decision, kept as is.",
      "",
      ...section("Unclassified", "No role could be guessed: pick one by hand.", unclassified),
      ...section(
        "States disagree",
        "Vanilla and modded spells differ in role or casting time; the modded one is used.",
        disagree,
      ),
      ...section(
        "Casting time spread",
        "Casting time changes with caster level; the first header's is used.",
        spread,
      ),
      ...section(
        "Duration vs declared",
        "The extracted duration differs from the declared one: calibrates the thresholds.",
        durations,
      ),
      ...section(
        "Newly precast",
        "`--write` gives these a long or mid duration: creatures memorizing them will precast " +
          "them (mid ones only with spellcasterPrecastMidDurationSpells).",
        precast,
      ),
      ...section(
        "All entries",
        "",
        rows.filter((r) => r.database === "SPELLS"),
      ),
      ...section(
        "Faiths and Powers",
        "Spells of the Faiths and Powers mod (lib/config/spells/fnp-spell-database.ts).",
        rows.filter((r) => r.database !== "SPELLS"),
      ),
    ].join("\n"),
  );
  return { unclassified: unclassified.length, disagree: disagree.length };
}

interface Readers {
  /** PROJECTL.IDS of the modded game */
  projectiles: Map<number, string>;
  vanillaReader: ResourceReader;
  moddedReader: ResourceReader;
  vanilla: EffectSource;
  modded: EffectSource;
}

/** Each entry's profile, from the modded game - from the vanilla one for an entry a mod obsoletes. */
function collect(database: string, entries: Entry[], readers: Readers) {
  const rows: Row[] = [];
  const missing: string[] = [];
  for (const spell of entries) {
    const file = spell.file.toUpperCase();
    const keywords = spell.keywords;
    const { projectiles } = readers;
    const moddedProfile = profile(
      readers.moddedReader,
      readers.modded,
      file,
      keywords,
      projectiles,
    );
    const vanillaProfile = profile(
      readers.vanillaReader,
      readers.vanilla,
      file,
      keywords,
      projectiles,
    );
    // a spell a mod repurposes (Blindness becoming Obscuring Mist) only exists unmodded
    const own = spell.obsoletedBy ? vanillaProfile : moddedProfile;
    if (!own) {
      missing.push(file);
      continue;
    }
    rows.push({
      database,
      file,
      key: spell.key,
      profile: own,
      vanilla: spell.obsoletedBy ? undefined : vanillaProfile,
      declared: {
        role: spell.role,
        secondaryRoles: spell.secondaryRoles,
        castingTime: spell.castingTime,
        duration: spell.duration,
        tier: spell.tier,
        hitsAllies: spell.hitsAllies,
      },
    });
  }
  return { rows, missing };
}

/** Adds the missing fields to `databasePath`; `durations` only where the entries have one. */
function writeDatabase(databasePath: string, rows: Row[], durations: boolean) {
  const values = (pick: (row: Row) => string | undefined) =>
    rows.flatMap((row) => {
      const value = pick(row);
      return value === undefined ? [] : [{ file: row.file, key: row.key, value }];
    });
  let database = fs.readFileSync(databasePath, "utf-8");
  database = addFieldToDatabase(
    database,
    "castingTime",
    values((r) => {
      const time = castingTime(r.profile);
      return time === undefined ? undefined : String(time);
    }),
  );
  database = addFieldToDatabase(
    database,
    "role",
    values((r) => (r.profile.role ? `"${r.profile.role}"` : undefined)),
  );
  database = addFieldToDatabase(
    database,
    "secondaryRoles",
    values((r) => {
      const secondary = secondaryRoles(r);
      return secondary.length ? JSON.stringify(secondary).replace(/,/g, ", ") : undefined;
    }),
    "role",
  );
  database = addFieldToDatabase(
    database,
    "tier",
    values((r) => {
      const tier = newTier(r);
      return tier && `"${tier}"`;
    }),
    "role",
  );
  database = addFieldToDatabase(
    database,
    "keywords",
    values((r) => {
      const proposed = r.profile.proposedKeywords;
      return proposed?.length ? JSON.stringify(proposed).replace(/,/g, ", ") : undefined;
    }),
  );
  database = addFieldToDatabase(
    database,
    "hitsAllies",
    values((r) =>
      r.profile.hitsAllies && r.declared.hitsAllies === undefined ? "true" : undefined,
    ),
    "keywords",
  );
  if (durations) {
    database = addFieldToDatabase(
      database,
      "duration",
      values((r) => {
        const duration = newDuration(r);
        return duration && `"${duration}"`;
      }),
    );
  }
  fs.writeFileSync(databasePath, database);
  console.log(`updated ${databasePath}: format it with prettier`);
}

function main() {
  const { gameDir, write } = parseArgs();
  const vanillaReader = new ResourceReader(gameDir, false);
  const moddedReader = new ResourceReader(gameDir, true);
  const ids = moddedReader.read("PROJECTL", IDS_TYPE, "IDS");
  if (!ids) throw new Error("PROJECTL.IDS not found");
  const readers: Readers = {
    vanillaReader,
    moddedReader,
    projectiles: parseProjectileIds(ids.toString("latin1")),
    vanilla: readerSource(vanillaReader),
    modded: readerSource(moddedReader),
  };
  const spells = collect("SPELLS", getAllSpells(SPELLS), readers);
  const fnp = collect("Faiths and Powers", getAllFnpSpells(), readers);
  const rows = [...spells.rows, ...fnp.rows];
  const counts = writeReport(rows);
  console.log(
    `${rows.length} entries, ${counts.unclassified} unclassified, ${counts.disagree} differing ` +
      `between states (see ${REPORT})`,
  );
  const missing = [...spells.missing, ...fnp.missing];
  if (missing.length) console.log(`not in the game: ${missing.join(", ")}`);
  if (!write) return;
  writeDatabase(DATABASE, spells.rows, true);
  writeDatabase(FNP_DATABASE, fnp.rows, false);
}

main();

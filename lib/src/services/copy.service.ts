import * as fs from "fs";
import * as path from "path";
import logService from "./log.service";

export interface CopyTargets {
  bg1: boolean;
  bg2: boolean;
}

/**
 * Narrows what the copied mod installs, to speed up testing. Entries and kins are matched against
 * their pnp-monster folder names, monsters as case-insensitive substrings of the creature name
 * comment in each entry's main.tpa (so "vampire" keeps every vampire age). Whatever is kept pulls
 * in what it needs: the kin of every kept entry and the entries it depends on (index.json).
 */
export interface CopyFilter {
  entries: string[];
  kins: string[];
  monsters: string[];
}

/** Shape of `lib/pnp-monster/index.json`, written by the generator. */
type EntryIndex = Record<string, { kin: string | null; dependsOn: string[] }>;

interface PathsConfig {
  bg1?: string;
  bg2?: string;
}

// The tp2's %MOD_FOLDER% macro resolves to wherever enhanced_creatures.tp2 itself sits, so
// everything must land inside this subfolder (with the tp2) rather than at the destination's
// root - otherwise %MOD_FOLDER%/lib/... resolves to the game root instead of the mod's own files.
const MOD_SUBFOLDER = "enhanced_creatures";

const PNP_FOLDER = path.join("lib", "pnp-monster");
const INDEX_REL = path.join(PNP_FOLDER, "index.tpa");
const INDEX_JSON_REL = path.join(PNP_FOLDER, "index.json");
// Group 3 is the folder under lib/pnp-monster: "kin/fey" for a kin, "dryad" for an entry.
const GROUP_INCLUDE =
  /^([ \t]*)(INCLUDE "%MOD_FOLDER%\/lib\/pnp-monster\/((?:kin\/)?[^/"]+)\/main\.tpa"[^\r\n]*)$/gm;
const CREATURE_INCLUDE =
  /^(INCLUDE "%MOD_FOLDER%\/lib\/pnp-monster\/[^/"]+\/[0-9a-z]+\.tpa" \/\/ ([^\r\n]*))$/gm;

class CopyService {
  repoRoot = path.resolve(__dirname, "..", "..", "..");
  modDir = path.join(this.repoRoot, "mod");
  configPath = path.join(this.repoRoot, "paths.local.json");
  exampleConfigPath = path.join(this.repoRoot, "paths.example.json");

  async copy(targets: CopyTargets, filter?: CopyFilter): Promise<number> {
    const config = this.loadConfig();
    // Built from mod/ before copying anything, so a filter matching nothing fails early.
    const overrides = filter ? this.buildFilteredFiles(filter) : new Map<string, string>();
    let copiedCount = 0;
    if (targets.bg1 && (await this.copyToTarget("BG1", config.bg1, overrides))) copiedCount++;
    if (targets.bg2 && (await this.copyToTarget("BG2", config.bg2, overrides))) copiedCount++;
    return copiedCount;
  }

  /** Returns the rewritten contents (keyed by path relative to mod/) of the files the filter changes. */
  buildFilteredFiles(filter: CopyFilter): Map<string, string> {
    const files = new Map<string, string>();
    const wanted = (names: string[]) => names.map((n) => n.toLowerCase());
    const entryNames = wanted(filter.entries);
    const kinNames = wanted(filter.kins);
    const monsters = wanted(filter.monsters);
    if (!entryNames.length && !kinNames.length && !monsters.length) return files;

    const index = this.readIndex();
    const allEntries = Object.keys(index);
    const allKins = [...new Set(Object.values(index).flatMap((e) => (e.kin ? [e.kin] : [])))];
    this.checkNames("entry", entryNames, allEntries);
    this.checkNames("kin", kinNames, allKins);

    // The entries asked for (a kin stands for all its entries), or every entry when only
    // --monster narrows the install.
    let selected =
      entryNames.length || kinNames.length
        ? allEntries.filter(
            (e) => entryNames.includes(e) || (index[e].kin && kinNames.includes(index[e].kin)),
          )
        : allEntries;

    // Entries that other kept entries need are kept whole, whatever --monster says.
    const needed = (entries: string[]) => this.withDependencies(index, entries);
    const mainFiles = new Map<string, string>();
    if (monsters.length) {
      selected = selected.filter((entry) => {
        const mainRel = path.join(PNP_FOLDER, entry, "main.tpa");
        const mainPath = path.join(this.modDir, mainRel);
        if (!fs.existsSync(mainPath)) return false;
        const keptNames: string[] = [];
        const content = fs
          .readFileSync(mainPath, "utf-8")
          .replace(CREATURE_INCLUDE, (line: string, _include: string, name: string) => {
            if (monsters.some((m) => name.toLowerCase().includes(m))) {
              keptNames.push(name);
              return line;
            }
            return `// ${line}`;
          });
        if (!keptNames.length) return false;
        mainFiles.set(entry, content);
        logService.log(`Keeping ${entry}: ${keptNames.join(", ")}`);
        return true;
      });
      if (!selected.length) {
        throw new Error(`No creature matches --monster ${filter.monsters.join(", ")}`);
      }
      // An entry that another kept entry needs stays whole.
      const dependedOn = selected.flatMap((e) => index[e].dependsOn);
      for (const entry of needed(dependedOn)) mainFiles.delete(entry);
    }

    const keptEntries = needed(selected);
    const keptKins = new Set(keptEntries.flatMap((e) => (index[e].kin ? [index[e].kin] : [])));
    logService.log(`Keeping entries: ${keptEntries.join(", ")}`);
    logService.log(`Keeping kins: ${[...keptKins].join(", ") || "none"}`);
    for (const [entry, content] of mainFiles) {
      files.set(path.join(PNP_FOLDER, entry, "main.tpa"), content);
    }

    const indexTpa = fs.readFileSync(path.join(this.modDir, INDEX_REL), "utf-8");
    files.set(
      INDEX_REL,
      indexTpa.replace(
        GROUP_INCLUDE,
        (line: string, indent: string, include: string, folder: string) => {
          const keep = folder.startsWith("kin/")
            ? keptKins.has(folder.slice("kin/".length))
            : keptEntries.includes(folder);
          return keep ? line : `${indent}// ${include}`;
        },
      ),
    );
    return files;
  }

  private readIndex(): EntryIndex {
    const indexPath = path.join(this.modDir, INDEX_JSON_REL);
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Missing ${indexPath}: run \`npm run generate\` first.`);
    }
    const oldFormat = new Error(`${indexPath} is in the old format: run \`npm run generate\``);
    let index: unknown;
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    } catch (e: unknown) {
      throw new Error(oldFormat.message, { cause: e });
    }
    if (!this.isEntryIndex(index)) throw oldFormat;
    return index;
  }

  private isEntryIndex(index: unknown): index is EntryIndex {
    if (typeof index !== "object" || index === null) return false;
    return Object.values(index).every((e: unknown) => {
      if (typeof e !== "object" || e === null) return false;
      const { kin, dependsOn } = e as { kin?: unknown; dependsOn?: unknown };
      return (
        (kin === null || typeof kin === "string") &&
        Array.isArray(dependsOn) &&
        dependsOn.every((d) => typeof d === "string")
      );
    });
  }

  private checkNames(label: string, names: string[], available: string[]): void {
    const unknown = names.filter((n) => !available.includes(n));
    if (unknown.length) {
      throw new Error(
        `Unknown ${label}: ${unknown.join(", ")}. Available: ${[...available].sort((a, b) => a.localeCompare(b)).join(", ")}`,
      );
    }
  }

  /** The entries plus everything they depend on, transitively (dependencies missing from the index are ignored). */
  private withDependencies(index: EntryIndex, entries: string[]): string[] {
    const result = new Set(entries);
    const queue = [...entries];
    for (let entry = queue.pop(); entry !== undefined; entry = queue.pop()) {
      for (const dep of index[entry].dependsOn) {
        if (!result.has(dep) && dep in index) {
          result.add(dep);
          queue.push(dep);
        }
      }
    }
    return Object.keys(index).filter((e) => result.has(e));
  }

  private loadConfig(): PathsConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        `Missing ${this.configPath}. Copy ${this.exampleConfigPath} to paths.local.json and fill in your BG1/BG2 install paths.`,
      );
    }
    const raw = fs.readFileSync(this.configPath, "utf-8");
    try {
      return JSON.parse(raw) as PathsConfig;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse ${this.configPath}: ${message}`, { cause: e });
    }
  }

  private async copyToTarget(
    label: string,
    destRoot: string | undefined,
    overrides: Map<string, string>,
  ): Promise<boolean> {
    if (!destRoot) {
      logService.warn(`${label} path is not configured in paths.local.json, skipping`);
      return false;
    }
    if (!fs.existsSync(destRoot)) {
      logService.warn(`${label} path "${destRoot}" does not exist, skipping`);
      return false;
    }
    logService.header(`Copying mod to ${label} (${destRoot})`);
    const dest = path.join(destRoot, MOD_SUBFOLDER);
    await fs.promises.cp(this.modDir, dest, { recursive: true, force: true });
    logService.log(`Copied ${this.modDir} contents`);
    for (const [rel, content] of overrides) {
      fs.writeFileSync(path.join(dest, rel), content);
    }
    if (overrides.size) logService.log(`Applied filter to ${overrides.size} file(s)`);
    return true;
  }
}

const copyService = new CopyService();
export default copyService;

import childProcess from "child_process";
import * as fs from "fs";
import * as path from "path";
import logService from "./log.service";

export interface CopyTargets {
  bg1: boolean;
  bg2: boolean;
}

/** What `copy` does after copying: install the mod with WeiDU, then start the game. */
export interface CopyActions {
  install?: boolean;
  start?: boolean;
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
const TP2_FILE = "enhanced_creatures.tp2";
// The component `copy --install` installs (DESIGNATED in the tp2).
const INSTALL_COMPONENT = "999";
// WeiDU's own default log name for this tp2, so --install overwrites the usual one.
const INSTALL_LOG = "SETUP-ENHANCED_CREATURES.DEBUG";

// What --start runs: the EE launcher, which also loads EEex.
const LAUNCHER = "InfinityLoader.exe";
// Absolute, so --start never runs a cmd.exe found on PATH.
const CMD = process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe";

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

  /**
   * With `install`, WeiDU then installs component 999 in the copied game: that needs exactly one
   * target, since each game is a separate install. `start` then launches that game, and needs
   * `install` (a copy alone changes nothing in game).
   */
  async copy(
    targets: CopyTargets,
    filter?: CopyFilter,
    { install = false, start = false }: CopyActions = {},
  ): Promise<number> {
    this.checkActions(targets, { install, start });
    const config = this.loadConfig();
    // Built from mod/ before copying anything, so a filter matching nothing fails early.
    const overrides = filter ? this.buildFilteredFiles(filter) : new Map<string, string>();
    const chosen: [string, string | undefined][] = [];
    if (targets.bg1) chosen.push(["BG1", config.bg1]);
    if (targets.bg2) chosen.push(["BG2", config.bg2]);
    let copiedCount = 0;
    for (const [label, destRoot] of chosen) {
      if (!(await this.copyToTarget(label, destRoot, overrides))) continue;
      copiedCount++;
      // copyToTarget only succeeds with a configured, existing destRoot.
      if (destRoot) this.runActions(label, destRoot, { install, start });
    }
    return copiedCount;
  }

  private checkActions(targets: CopyTargets, { install, start }: CopyActions): void {
    if (start && !install) {
      throw new Error("--start needs --install");
    }
    if (install && targets.bg1 === targets.bg2) {
      throw new Error("--install needs exactly one game: pass --bg1 or --bg2");
    }
  }

  private runActions(label: string, gameRoot: string, { install, start }: CopyActions): void {
    if (install) this.install(label, gameRoot);
    if (start) this.start(label, gameRoot);
  }

  /** Runs the game's own weidu.exe on the copied tp2, (re)installing component 999 unattended. */
  install(label: string, gameRoot: string): void {
    const weidu = path.join(gameRoot, "weidu.exe");
    if (!fs.existsSync(weidu)) {
      throw new Error(`${label}: ${weidu} not found, cannot install`);
    }
    logService.header(`Installing component ${INSTALL_COMPONENT} in ${label}`);
    const args = [
      `${MOD_SUBFOLDER}/${TP2_FILE}`,
      "--force-install",
      INSTALL_COMPONENT,
      "--language",
      "0",
      "--skip-at-view",
      "--noautoupdate",
      "--no-exit-pause",
      "--log",
      INSTALL_LOG,
    ];
    try {
      // inherit: WeiDU's progress shows live in the terminal.
      childProcess.execFileSync(weidu, args, { cwd: gameRoot, stdio: "inherit" });
    } catch (e: unknown) {
      throw new Error(`${label}: WeiDU install failed, see ${path.join(gameRoot, INSTALL_LOG)}`, {
        cause: e,
      });
    }
    logService.log(`Installed component ${INSTALL_COMPONENT} in ${label}`);
  }

  /**
   * Launches the game with InfinityLoader.exe through `start`, like a double click: a plain
   * detached spawn starts it without a console and it never opens the game. /D makes the game
   * folder its working directory; the empty "" is start's window title.
   */
  start(label: string, gameRoot: string): void {
    const launcher = path.join(gameRoot, LAUNCHER);
    if (!fs.existsSync(launcher)) {
      throw new Error(`${label}: ${launcher} not found, cannot start`);
    }
    logService.log(`Starting ${label} (${launcher})`);
    const quote = (p: string) => `"${path.resolve(p)}"`;
    // Verbatim, so Node doesn't re-escape the quotes cmd needs around paths with spaces.
    const args = ["/c", "start", '""', "/D", quote(gameRoot), quote(launcher)];
    const result = childProcess.spawnSync(CMD, args, {
      cwd: gameRoot,
      stdio: "ignore",
      windowsVerbatimArguments: true,
    });
    if (result.error || result.status !== 0) {
      throw new Error(`${label}: could not start ${launcher}`, { cause: result.error });
    }
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
    let index: unknown;
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    } catch (e: unknown) {
      throw new Error(`${indexPath} is not valid JSON: run \`npm run generate\``, { cause: e });
    }
    if (!this.isEntryIndex(index)) {
      throw new Error(`${indexPath} is in the old format: run \`npm run generate\``);
    }
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

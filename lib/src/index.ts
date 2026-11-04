import chalk from "chalk";
import { program } from "commander";
import * as path from "path";
import { GLOBAL_CONFIG } from "../config/generate";
import copyService, { CopyFilter, CopyTargets } from "./services/copy.service";
import logService from "./services/log.service";
import mainService from "./services/main.service";
import releaseService from "./services/release/release.service";

program.version("0.0.1").description("Generate WEIDU code and BAF files for IE games");

program
  .command("generate", { isDefault: true })
  .description("Generate WEIDU code and BAF files for IE games")
  .option(
    "--release-build",
    "force on the release-only flags (random target order, secondary types, immunity states) - used by release",
  )
  .action(async (opts: { releaseBuild?: boolean }) => {
    try {
      if (opts.releaseBuild) {
        GLOBAL_CONFIG.enableRandomTargetOrder = true;
        GLOBAL_CONFIG.enableSecondaryTypes = true;
        GLOBAL_CONFIG.enableImmunityStates = true;
      }
      await runGenerate();
    } catch (e: unknown) {
      handleError(e);
    }
  });

program
  .command("copy")
  .description(
    "Copy the mod's tp2/lib/languages into local BG1/BG2 folders for testing. " +
      "Filters (all optional, names are pnp-monster folder names, case-insensitive) narrow the " +
      "copied mod's install; whatever is kept also keeps its kin and the entries it depends on. " +
      "The repo's mod/ is never modified.",
  )
  .option("--bg1", "copy to the configured BG1 folder only")
  .option("--bg2", "copy to the configured BG2 folder only")
  .option(
    "--entry <names...>",
    "only install these entries, plus their kin and dependencies (e.g. dryad,doom-sayer)",
    collectList,
  )
  .option(
    "--kin <names...>",
    "only install these kins, with all their entries and dependencies (e.g. fey)",
    collectList,
  )
  .option(
    "--monster <names...>",
    "only install creatures whose name contains one of these (e.g. vampire); " +
      "combined with --entry/--kin it narrows those, alone it keeps every entry with a match",
    collectList,
  )
  .action(async (opts: CopyOptions) => {
    try {
      await runCopy(opts);
    } catch (e: unknown) {
      handleError(e);
    }
  });

program
  .command("release")
  .description("Validate, bump, regenerate, and publish a GitHub release")
  .argument("<version>", "release version, e.g. 1.2.0")
  .action(async (version: string) => {
    try {
      await runRelease(version);
    } catch (e: unknown) {
      handleError(e);
    }
  });

program.parseAsync(process.argv).catch((e: unknown) => handleError(e));

async function runGenerate(): Promise<void> {
  await mainService.generateAll();
  logService.log("Finished!");
  console.log(chalk.green(`\nFinished!`));
}

interface CopyOptions {
  bg1?: boolean;
  bg2?: boolean;
  entry?: string[];
  kin?: string[];
  monster?: string[];
}

// Accepts both repeated/space-separated values and comma lists: --entry dryad,ogre
function collectList(value: string, previous: string[] = []): string[] {
  return [
    ...previous,
    ...value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v),
  ];
}

async function runCopy(opts: CopyOptions): Promise<void> {
  const bg1 = !!opts.bg1;
  const bg2 = !!opts.bg2;
  const both = !bg1 && !bg2;
  const targets: CopyTargets = { bg1: bg1 || both, bg2: bg2 || both };
  const filter: CopyFilter = {
    entries: opts.entry ?? [],
    kins: opts.kin ?? [],
    monsters: opts.monster ?? [],
  };
  logService.filePath = path.join(process.cwd(), "copy.log");
  logService.init();
  const copiedCount = await copyService.copy(targets, filter);
  logService.summary();
  if (logService.hasErrors()) {
    console.error(chalk.red(`\nCopy finished with errors, see copy.log`));
    process.exit(1);
  }
  if (copiedCount === 0) {
    console.error(chalk.yellow(`\nNo targets were copied, see copy.log`));
    process.exit(1);
  }
  logService.log("Finished!");
  console.log(chalk.green(`\nFinished!`));
}

async function runRelease(version: string): Promise<void> {
  logService.filePath = path.join(process.cwd(), "release.log");
  await releaseService.release(version);
  logService.log("Finished!");
  console.log(chalk.green(`\nFinished!`));
}

function handleError(e: unknown): never {
  // Walk the cause chain - wrapper errors (e.g. release's "Packaging/publishing failed") would
  // otherwise hide the underlying failure entirely.
  const parts = [e instanceof Error ? e.message : String(e)];
  let cause = e instanceof Error ? e.cause : undefined;
  while (cause instanceof Error) {
    parts.push(cause.message);
    cause = cause.cause;
  }
  const message = parts.join("\n  Caused by: ");
  logService.log(`ERROR: ${message}`);
  console.error(chalk.red(`\nError: ${message}`));
  process.exit(1);
}

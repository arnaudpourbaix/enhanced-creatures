import chalk from "chalk";
import { program } from "commander";
import * as path from "path";
import checkMonstersService from "./services/check-monsters.service";
import copyService, { CopyTargets } from "./services/copy.service";
import logService from "./services/log.service";
import mainService from "./services/main.service";
import releaseService from "./services/release/release.service";

program.version("0.0.1").description("Generate WEIDU code and BAF files for IE games");

program
  .command("generate", { isDefault: true })
  .description("Generate WEIDU code and BAF files for IE games")
  .action(async () => {
    try {
      await runGenerate();
    } catch (e: unknown) {
      handleError(e);
    }
  });

program
  .command("copy")
  .description("Copy the mod's tp2/lib/languages into local BG1/BG2 folders for testing")
  .option("--bg1", "copy to the configured BG1 folder only")
  .option("--bg2", "copy to the configured BG2 folder only")
  .action(async (opts: { bg1?: boolean; bg2?: boolean }) => {
    try {
      await runCopy(opts);
    } catch (e: unknown) {
      handleError(e);
    }
  });

program
  .command("check-monsters")
  .description("List MonsterEnum members that are missing or unvalidated")
  .action(async () => {
    try {
      await runCheckMonsters();
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

async function runCopy(opts: { bg1?: boolean; bg2?: boolean }): Promise<void> {
  const bg1 = !!opts.bg1;
  const bg2 = !!opts.bg2;
  const both = !bg1 && !bg2;
  const targets: CopyTargets = { bg1: bg1 || both, bg2: bg2 || both };
  logService.filePath = path.join(process.cwd(), "copy.log");
  logService.init();
  const copiedCount = await copyService.copy(targets);
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

async function runCheckMonsters(): Promise<void> {
  logService.filePath = path.join(process.cwd(), "check-monsters.log");
  const { missing, unvalidated, total } = await checkMonstersService.check();
  logService.summary();
  console.log(chalk.bold("\nChecking monsters..."));
  if (!missing.length && !unvalidated.length) {
    console.log(chalk.green("All monsters OK."));
    return;
  }
  if (missing.length) {
    console.log(
      chalk.yellow(
        `\nMissing (${missing.length}) - declared in MonsterEnum, not implemented anywhere:`,
      ),
    );
    console.log(`  ${missing.join(", ")}`);
  }
  if (unvalidated.length) {
    console.log(
      chalk.yellow(
        `\nUnvalidated (${unvalidated.length}) - implemented but failed validation, see check-monsters.log for details:`,
      ),
    );
    console.log(`  ${unvalidated.join(", ")}`);
  }
  console.log(
    chalk.bold(`\n${total - missing.length - unvalidated.length} of ${total} monsters OK.`),
  );
}

async function runRelease(version: string): Promise<void> {
  logService.filePath = path.join(process.cwd(), "release.log");
  await releaseService.release(version);
  logService.log("Finished!");
  console.log(chalk.green(`\nFinished!`));
}

function handleError(e: unknown): never {
  const message = e instanceof Error ? e.message : String(e);
  logService.log(`ERROR: ${message}`);
  console.error(chalk.red(`\nError: ${message}`));
  process.exit(1);
}

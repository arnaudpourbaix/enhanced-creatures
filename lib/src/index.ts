import chalk from "chalk";
import { program } from "commander";
import * as path from "path";
import copyService, { CopyTargets } from "./services/copy.service";
import logService from "./services/log.service";
import mainService from "./services/main.service";
import stateService from "./services/state.service";

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

program.parseAsync(process.argv).catch((e: unknown) => handleError(e));

async function runGenerate(): Promise<void> {
  logService.init();
  await stateService.init();
  logService.section("Checking presets");
  mainService.checkPresets();
  logService.section("Checking spells");
  mainService.checkSpells();
  logService.section("Generating creatures");
  mainService.generateCreatures();
  logService.section("Generating common code");
  mainService.generateCommonCode();
  logService.section("Generating translations");
  mainService.generateTranslations();
  logService.summary();
  if (logService.hasErrors()) {
    console.error(chalk.red(`\nGenerator finished with errors, see generator.log`));
    process.exit(1);
  }
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

function handleError(e: unknown): never {
  const message = e instanceof Error ? e.message : String(e);
  logService.log(`ERROR: ${message}`);
  console.error(chalk.red(`\nError: ${message}`));
  process.exit(1);
}

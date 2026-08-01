import chalk from "chalk";
import { program } from "commander";
import logService from "./services/log.service";
import mainService from "./services/main.service";
import stateService from "./services/state.service";

program
  .version("0.0.1")
  .description("Generate WEIDU code and BAF files for IE games")
  .parse(process.argv);

async function main() {
  logService.init();
  return Promise.resolve()
    .then(() => stateService.init())
    .then(() => {
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
    });
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  logService.log(`ERROR: ${message}`);
  console.error(chalk.red(`\nError: ${message}`));
  process.exit(1);
});

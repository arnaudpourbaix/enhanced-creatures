import * as fs from "fs";
import * as path from "path";
import { PLAYER_CONFIG, StrengthEdition } from "../lib/config/player-config";
import { buildAllCreatures } from "../lib/creatures";
import { MonsterEnum } from "../lib/creatures/monster";
import logService from "../lib/src/services/log.service";
import mainService from "../lib/src/services/main.service";
import stateService from "../lib/src/services/state.service";
import { STRENGTH_EDITIONS } from "./lib/experience-proposals";

// The base creatures' DMG scores under one strength edition, written as JSON for the dashboard's
// XP proposals (both editions side by side). The edition is applied while the creatures are built
// and the builders keep global state, so each edition needs its own process (dashboard.ts runs
// this one for the edition the settings don't play).
//
// Run: ts-node scripts/dmg-edition.ts <2e|3e+> <out.json>

async function main() {
  const [edition, out] = process.argv.slice(2);
  if (!STRENGTH_EDITIONS.includes(edition as StrengthEdition) || !out) {
    throw new Error(`Usage: dmg-edition.ts <${STRENGTH_EDITIONS.join("|")}> <out.json>`);
  }
  PLAYER_CONFIG.strengthEdition = edition as StrengthEdition;
  logService.filePath = path.join(process.cwd(), "dmg-edition.log");
  logService.init();
  await stateService.init();
  mainService.checkPresets();
  mainService.checkSpells();
  const scores = buildAllCreatures().flatMap((creature) => {
    const base = creature.baseScore;
    if (!base) return [];
    const monster = MonsterEnum[creature.id] ?? String(creature.id);
    return [[monster, { xp: base.xp, breakdown: base.breakdown }]];
  });
  fs.writeFileSync(out, JSON.stringify(scores), "utf-8");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

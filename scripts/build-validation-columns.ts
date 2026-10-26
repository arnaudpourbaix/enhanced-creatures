import * as fs from "fs";
import * as path from "path";
import { buildAllCreatures } from "../lib/creatures";
import type { Creature } from "../lib/src/model/creature/creature";
import creatureService, { type CsvFinding } from "../lib/src/services/creature.service";
import monsterFilesService from "../lib/src/services/monster-files.service";
import { parseCsv, serializeCsv, withNameLast } from "./lib/csv";
import { csvBool, requireCsvColumns } from "../lib/src/csv";
import {
  applyValidationColumns,
  rowKey,
  VALIDATION_COLUMNS,
  type ValidationColumn,
} from "./lib/validation-columns";

// One-shot: fills assets/creatures.csv's vlvl / vitems / vscript from a
// baseline of the CURRENT state. For every source row a built creature references: `true` when
// that check produces no finding for the row, blank when it does. Rows no built creature
// references stay blank. An existing `true` is never downgraded. Safe to re-run.
//
// Always operates on ./assets/creatures.csv relative to the repo root (that path is also what the
// generator's monsterFilesService reads). Run from the repo root:
//   ts-node scripts/build-validation-columns.ts

const CSV_PATH = path.join(process.cwd(), "assets", "creatures.csv");

const FINDERS: { col: ValidationColumn; find: (c: Creature) => CsvFinding[] }[] = [
  { col: "vlvl", find: (c) => creatureService.findLevelGaps(c) },
  { col: "vitems", find: (c) => creatureService.findPersistingItems(c) },
  { col: "vscript", find: (c) => creatureService.findOriginalScripts(c) },
];

const csv = parseCsv(fs.readFileSync(CSV_PATH, "utf-8"));
// The Validated* columns are inserted when absent, but the row keys must exist.
requireCsvColumns(csv.header, ["file", "game"], "creatures.csv");
// Deliberately no stateService.init() / checkPresets() / checkSpells(): the three finders only
// read `files`, `adjustments` and `data`, all of which are populated when the entries are built.
const creatures = buildAllCreatures();

const ownedKeys = new Set<string>();
const findingKeys: Record<ValidationColumn, Set<string>> = {
  vlvl: new Set(),
  vitems: new Set(),
  vscript: new Set(),
};

function collectFindingKeys(creature: Creature): void {
  for (const { col, find } of FINDERS) {
    for (const finding of find(creature)) {
      // finding.game is the resolved row's own game, so this lands on the exact per-game row.
      const row = monsterFilesService.getCreatureRow(finding.file, finding.game);
      if (row) findingKeys[col].add(rowKey(row.file, row.game));
    }
  }
}

for (const creature of creatures) {
  for (const f of creature.files) {
    // Every scope-compatible row, not just one: a resref present in both games is a single
    // untagged creature.files entry but two CSV rows, and both are owned by this creature.
    for (const row of monsterFilesService.getCreatureRows(f.name, f.game)) {
      ownedKeys.add(rowKey(row.file, row.game));
    }
  }
  collectFindingKeys(creature);
}

const { header, rows } = applyValidationColumns({
  header: csv.header,
  rows: csv.rows,
  findingKeys,
  ownedKeys,
});

fs.writeFileSync(CSV_PATH, serializeCsv(withNameLast(header), rows, csv.delimiter), "utf-8");

for (const col of VALIDATION_COLUMNS) {
  const trueCount = rows.filter((r) => csvBool(r[col])).length;
  console.log(`${col}: ${trueCount} true / ${rows.length - trueCount} blank`);
}

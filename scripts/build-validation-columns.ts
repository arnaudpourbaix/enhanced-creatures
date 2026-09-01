import * as fs from "fs";
import * as path from "path";
import { familyFactories } from "../lib/creatures";
import type { Creature } from "../lib/src/model/creature/creature";
import creatureService, { type CsvFinding } from "../lib/src/services/creature.service";
import monsterFilesService from "../lib/src/services/monster-files.service";
import { parseCsv, serializeCsv, withNameLast } from "./lib/build-creatures";
import {
  applyValidationColumns,
  rowKey,
  VALIDATION_COLUMNS,
  type ValidationColumn,
} from "./lib/validation-columns";

// One-shot: fills assets/creatures.csv's ValidatedLevel / ValidatedItems / ValidatedScript from a
// baseline of the CURRENT state. For every source row a built creature references: `true` when
// that check produces no finding for the row, blank when it does. Rows no built creature
// references stay blank. An existing `true` is never downgraded. Safe to re-run.
//
// Always operates on ./assets/creatures.csv relative to the repo root (that path is also what the
// generator's monsterFilesService reads). Run from the repo root:
//   ts-node scripts/build-validation-columns.ts

const CSV_PATH = path.join(process.cwd(), "assets", "creatures.csv");

const FINDERS: { col: ValidationColumn; find: (c: Creature) => CsvFinding[] }[] = [
  { col: "ValidatedLevel", find: (c) => creatureService.findLevelGaps(c) },
  { col: "ValidatedItems", find: (c) => creatureService.findPersistingItems(c) },
  { col: "ValidatedScript", find: (c) => creatureService.findOriginalScripts(c) },
];

const csv = parseCsv(fs.readFileSync(CSV_PATH, "utf-8"));
const creatures = familyFactories.flatMap((factory) => factory().creatures);

const ownedKeys = new Set<string>();
const findingKeys: Record<ValidationColumn, Set<string>> = {
  ValidatedLevel: new Set(),
  ValidatedItems: new Set(),
  ValidatedScript: new Set(),
};

for (const creature of creatures) {
  for (const f of creature.files) {
    const row = monsterFilesService.getCreatureRow(f.name, f.game);
    if (row) ownedKeys.add(rowKey(row.file, row.game));
  }
  for (const { col, find } of FINDERS) {
    for (const finding of find(creature)) {
      const row = monsterFilesService.getCreatureRow(finding.file, finding.game);
      if (row) findingKeys[col].add(rowKey(row.file, row.game));
    }
  }
}

const { header, rows } = applyValidationColumns({
  header: csv.header,
  rows: csv.rows,
  findingKeys,
  ownedKeys,
});

fs.writeFileSync(CSV_PATH, serializeCsv(withNameLast(header), rows), "utf-8");

for (const col of VALIDATION_COLUMNS) {
  const trueCount = rows.filter((r) => r[col] === "true").length;
  console.log(`${col}: ${trueCount} true / ${rows.length - trueCount} blank`);
}

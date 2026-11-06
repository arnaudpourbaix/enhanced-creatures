# Experience Formula Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute every adjusted creature file's XP from the AD&D 2e DMG rule (Tables 31 + 32), write it into the mod, and show every file's status, the XP drops and the base XP conflicts in a new dashboard tab.

**Architecture:** A pure scoring module (Tables 31/32) and a detection module (reads one file's folded creature data → Table 32 abilities) feed `experienceService`, which decides each file's status. It appends synthetic per-file `xpv` adjustments, like `applyCsvSummonFiles` already does for summons, and stores its rows on the creature. The dashboard reads those rows.

**Tech Stack:** TypeScript, vitest, ts-node scripts, WeiDU output.

**Spec:** `docs/superpowers/specs/2026-11-06-experience-formula-design.md`

## Global Constraints

- `assets/creatures.csv` is read only, never edited. If its header doesn't match what the code expects, change the code.
- No `lib/creatures/<creature>.test.ts` files. Test generic code in `lib/src/services/experience/*.test.ts` and `scripts/lib/*.test.ts`, and verify creatures through generated output and the dashboard.
- Never lower a file's in-game XP (`drop` keeps the in-game value). Never change a zero-XP file.
- Base creature `xpv` (Monstrous Manual) is never changed; conflicts are only reported.
- Each Table 32 ability counts once. Level 3+ spells (+2) replace level 1–2 spells (+1); they never add up.
- Before every commit: `npx tsc -p . --noEmit`, `npx eslint <changed files>`, `npx vitest run <changed test files>`.

## Review Focus

1. **A file present in both games with different in-game XP per game** (`getCreatureRows` returns a bg1 and a bg2 row with different `xpv`): expected one row per game, each compared against its own in-game XP, never one shared value. Test in Task 4.
2. **A file whose adjustments split it per game** (a bg1-tagged plus a bg2-tagged adjustment, like GORF): expected one status per game scope. Synthetic `xpv` adjustments are game-tagged for those scopes only, so an untagged file is never split. Test in Task 4.
3. **A summon file that also has a data adjustment (e.g. a `level1` bump):** expected `zero`; the formula never writes over the summon's 0. Test in Task 4.
4. **An adjustment that only changes script/items** (skeleton `SKELPETR`): expected `unchanged`, keeping the base book XP, with no new documentation card. Test in Task 4.
5. **A creature with no XP in `creatures.csv` for a file** (a mod-added file without a value): expected not to be treated as a drop; the formula applies. Test in Task 4.

---

### Task 1: Tables 31 and 32 scoring

**Files:**
- Create: `lib/src/services/experience/experience-table.ts`
- Test: `lib/src/services/experience/experience-table.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type XpAbility =
    | "acZeroOrLower" | "bloodDrain" | "breathWeapon" | "causesDisease" | "energyDrain"
    | "flies" | "fourAttacks" | "extraHitPoints" | "highIntelligence" | "magicalWeaponsOnly"
    | "spellImmunity" | "weaponImmunity" | "invisibleAtWill" | "lowSpells" | "highSpells"
    | "magicResistance" | "missileWeapons" | "multipleAttacks30" | "paralysis"
    | "petrification" | "poison" | "magicalItems" | "regeneration" | "singleAttack20"
    | "specialDefense" | "specialMagicalAttack" | "specialAttack" | "swallowsWhole"
    | "weaknessOrFear";
  export const XP_ABILITIES: Record<XpAbility, { modifier: number; label: string }>;
  export interface HitDice { whole: number; plus: boolean }
  export interface DetectedAbility { ability: XpAbility; source: string }
  export interface ExperienceScore {
    hitDice: HitDice; hitDiceValue: number; abilities: DetectedAbility[];
    total: number; xp: number; breakdown: string;
  }
  export function hitDiceValue(hd: HitDice): number;
  export function xpForHitDiceValue(value: number): number;
  export function scoreExperience(hd: HitDice, abilities: DetectedAbility[]): ExperienceScore;
  ```

Modifiers, copied from the spec's Table 32: acZeroOrLower 1, bloodDrain 1, breathWeapon 2, causesDisease 1, energyDrain 3, flies 1, fourAttacks 1, extraHitPoints 1, highIntelligence 1, magicalWeaponsOnly 1, spellImmunity 1, weaponImmunity 1, invisibleAtWill 1, lowSpells 1, highSpells 2, magicResistance 2, missileWeapons 1, multipleAttacks30 2, paralysis 2, petrification 3, poison 2, magicalItems 1, regeneration 1, singleAttack20 2, specialDefense 1, specialMagicalAttack 2, specialAttack 1, swallowsWhole 2, weaknessOrFear 2. Labels are short English names ("AC 0 or lower", "poison", "level 3+ spells", …).

Rules:
- `hitDiceValue`: `whole + 1` when `plus && whole < 10`, otherwise `whole`. Table 31 rows "9+1 to 10+" and "11 to 12+" keep 10+x and 12+x in their own row, and 13+x counts as 13.
- `xpForHitDiceValue(v)`:

  | v | XP |
  |---|---|
  | < 1 | 7 |
  | 1 | 15 |
  | 2 | 35 |
  | 3 | 65 |
  | 4 | 120 |
  | 5 | 175 |
  | 6 | 270 |
  | 7 | 420 |
  | 8 | 650 |
  | 9 | 975 |
  | 10 | 1400 |
  | 11–12 | 2000 |
  | ≥ 13 | 3000 + 1000 × (v − 13) |

- `scoreExperience`: deduplicates abilities, keeping the first source of each. It drops `lowSpells` when `highSpells` is present. `total = hitDiceValue + Σ modifiers` and `xp = xpForHitDiceValue(total)`.
- `breakdown`: format `"4+ HD → 5, +1 AC 0 or lower (AC -2), +2 poison (bite) = 8 → 650"`. Write HD as `whole` or `whole+` when `plus`. With no abilities, it is `"4+ HD → 5 = 5 → 175"`.

- [ ] **Step 1: Write the failing tests**

```ts
it("maps every Table 31 row", () => {
  expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15].map(xpForHitDiceValue))
    .toEqual([7, 15, 35, 65, 120, 175, 270, 420, 650, 975, 1400, 2000, 2000, 3000, 5000]);
});
it("a plus moves up one row only below 10 HD", () => {
  expect(hitDiceValue({ whole: 4, plus: true })).toBe(5);
  expect(hitDiceValue({ whole: 10, plus: true })).toBe(10);
  expect(hitDiceValue({ whole: 13, plus: true })).toBe(13);
});
it("scores the Monstrous Manual ogre (4+1 HD, one modifier) at 270", () => {
  const s = scoreExperience({ whole: 4, plus: true }, [{ ability: "acZeroOrLower", source: "AC 0" }]);
  expect(s).toMatchObject({ hitDiceValue: 5, total: 6, xp: 270 });
});
it("counts an ability once and level 3+ spells replace level 1-2 spells", () => {
  const s = scoreExperience({ whole: 8, plus: false }, [
    { ability: "poison", source: "bite" }, { ability: "poison", source: "sting" },
    { ability: "lowSpells", source: "SPWI112" }, { ability: "highSpells", source: "SPWI304" },
  ]);
  expect(s.total).toBe(12);
  expect(s.abilities.map((a) => a.ability)).toEqual(["poison", "highSpells"]);
});
it("writes the breakdown", () => {
  expect(scoreExperience({ whole: 4, plus: true }, [{ ability: "poison", source: "bite" }]).breakdown)
    .toBe("4+ HD → 5, +2 poison (bite) = 7 → 420");
});
```


- [ ] **Step 2: Run them and confirm they fail.** Run `npx vitest run lib/src/services/experience/experience-table.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `experience-table.ts`** as described in the Interfaces block and rules above.
- [ ] **Step 4: Run them again.** Same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(xp): 2e DMG Table 31/32 scoring`.

---

### Task 2: Detection from stats, immunities, effects and declarations

**Files:**
- Create: `lib/src/services/experience/experience-detection.ts`
- Modify: `lib/src/model/creature/data.ts`: add `xpAbilities?: XpAbility[]` to `CreatureData`. It is not a `CREATURE_DATA_FIELDS` entry, so it is never written to CRE files. Also check that `InputCreatureData` / merge in `data-input.ts` carry it.
- Test: `lib/src/services/experience/experience-detection.test.ts`. Build fixtures like `fakeCreature` in `lib/src/services/doc/adjustment.service.test.ts`.

**Interfaces:**
- Consumes: Task 1 `HitDice`, `DetectedAbility`, `XpAbility`; `adjustmentService.getEffectiveForGame(creature, file, game)`.
- Produces:
  ```ts
  export interface ExperienceScope { creature: Creature; file?: string; game?: Game }
  export function matchingAdjustments(scope: ExperienceScope): CreatureAdjustment[];
  export function detectHitDice(scope: ExperienceScope): HitDice;
  export function detectStatAbilities(scope: ExperienceScope): DetectedAbility[];
  ```
  `file` undefined means the base creature, with no adjustments. `matchingAdjustments` uses the same filter as `getEffectiveForGame`: `a.files.includes(file) && (a.game === undefined || a.game === game)`. It returns `[]` when `file` is undefined.

Signals, using the folded values (`getEffectiveForGame`; a file no adjustment covers returns the base values; for an undefined `file`, use the base values the same way). Fields the effective lacks fold as last defined among the matching adjustments, else `creature.data`:
- HD: `whole` = effective `level.value` (PnP Hit Dice). `plus` = folded `bonusHp > 0`.
- `acZeroOrLower`: effective AC ≤ 0. Source `"AC -2"`.
- `fourAttacks`: effective APR ≥ 4.
- `highIntelligence`: effective Intelligence ≥ 13.
- `extraHitPoints`: folded `bonusHpPerHitDie > 0` or `specialBonusHp > 0`.
- `magicResistance`: folded `resistMagic > 0`.
- `regeneration`: an effect of type `EffectTypeEnum.Regeneration`. Look in `creature.data.effects.list`, the matching adjustments' `effects.list`, and the effects of the creature's trait items (`creature.items` with `trait`).
- `spellImmunity`: the effective immunities plus `creature.autoImmunities` intersect `SPELL_IMMUNITIES`. That is a const you define in this file: every `ImmunityName` that blocks a specific spell or spell family (names ending in `Spell`/`Spells`, plus `charm`, `hold`, `confusion`, `maze`, and the like). Comment each inclusion you are unsure of.
- `weaponImmunity`: an immunity to a damage type (crushing/slashing/piercing/missile damage), or a folded `resistSlashing`/`resistCrushing`/`resistPiercing`/`resistMissile` ≥ 50.
- `magicalWeaponsOnly`: the immunity meaning "hit only by magical weapons" (check what `magicalWeapons` does in `lib/src/model/final/immunity.ts` before using it).
- Declared: folded `xpAbilities`, where an adjustment's list replaces the base list. Each one gets the source `"declared"`.

- [ ] **Step 1: Write failing tests.** One `it` per signal, each asserting the detected `ability` and `source`. Plus:
  - an adjustment `level1: 9` with base `bonusHp: 1` → `{ whole: 9, plus: true }`;
  - an adjustment declaring `xpAbilities: ["flies"]` replaces a base `["swallowsWhole"]`;
  - base scope (`file` undefined) ignores adjustments.
- [ ] **Step 2: Run them and confirm they fail.** Run `npx vitest run lib/src/services/experience/experience-detection.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `matchingAdjustments`, `detectHitDice` and `detectStatAbilities`. Add the `xpAbilities` field.
- [ ] **Step 4: Run them again.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(xp): detect stat, immunity and declared XP abilities`.

---

### Task 3: Detection from attacks, abilities and spells

**Files:**
- Modify: `lib/src/services/experience/experience-detection.ts`
- Test: `lib/src/services/experience/experience-detection.test.ts`

**Interfaces:**
- Consumes: Task 2 `ExperienceScope`, `matchingAdjustments`.
- Produces:
  ```ts
  export function detectAttackAbilities(scope: ExperienceScope): DetectedAbility[];
  export function detectAbilities(scope: ExperienceScope): DetectedAbility[]; // stat + attack
  ```

Signals:
- **On-hit effects.** Look at the effects of the weapons this scope wields: the creature's own `items` that are natural weapons or equipped (base `items.equipped` plus the matching adjustments' `items.equipped`, unless `noWeapon`). Also look at their `castSpells` targets' effects and the natural-weapon `poison` option. Behaviour abilities are included too: `creature.behavior.abilities`, through the effects of the creature's spells they cast (`creatureService.getAbilityCastFiles`). Map opcodes as follows:
  - `Poison` (or the `poison` option, or `secondaryType` "Poison") → `poison`
  - `Paralyze`, `Hold`, `HoldCreatureSpell` → `paralysis`
  - `Petrification` → `petrification`
  - `LevelDrain` → `energyDrain`
  - `Disease` (or `secondaryType` "Disease") → `causesDisease`
  - `Panic` (or `secondaryType` "Fear"), or a negative `StrengthBonus` → `weaknessOrFear`
  - `Invisibility` cast on self → `invisibleAtWill`

  Source = the item/spell file plus its name when known.
- **Spells.** Take the highest level among:
  - the effective `memorized` spells (`MemorizedSpell.level`, else resolve the file through `SPELLS`);
  - each `spellbooks` variant's `memorized` (take the max across variants);
  - `behavior.abilities` with a numeric `level`. `null` means not a spell, so skip it.

  ≥ 3 → `highSpells`, 1–2 → `lowSpells`. The source is the file of the highest spell.
- **`missileWeapons`:** `creature.attack.ranged`, or an equipped item in a launcher/quiver slot.
- **Damage:** for each natural weapon, max damage = `diceThrown × diceSize + (damageBonus ?? 0)`. If the maximum is ≥ 20 → `singleAttack20`. If effective APR > 1 and max × APR ≥ 30 → `multipleAttacks30`. Equipped items whose dice aren't known in mod data are ignored.
- **Declared only** (never detected): `bloodDrain`, `breathWeapon`, `flies`, `swallowsWhole`, `magicalItems`, `specialMagicalAttack`, `specialAttack`. These come only from `xpAbilities` (Task 2). `specialDefense` is also detected from damage resistances (nested `*DamageResistance` immunities, resistX >= 50).
- **Known limit:** `behavior.abilities` is per creature, not per file. A file therefore inherits every ability of its creature. Variants that change behaviour get their own script and creature entry, so this holds in practice.

- [ ] **Step 1: Write failing tests**, one per mapping. For example: a natural weapon whose effects include `Poison` → `poison` with the weapon as source; memorized level-2 and level-4 spells → only `highSpells`; a 2d10+2 natural weapon at APR 2 → both `singleAttack20` and `multipleAttacks30`; an adjustment with `noWeapon` drops the weapon's on-hit abilities.
- [ ] **Step 2: Run them and confirm they fail.** Expected: FAIL.
- [ ] **Step 3: Implement** `detectAttackAbilities` and `detectAbilities`.
- [ ] **Step 4: Run them again.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(xp): detect attack, ability and spell XP abilities`.

---

### Task 4: Statuses, writing XP, wiring

**Files:**
- Create: `lib/src/services/experience/experience.service.ts`
- Modify: `lib/src/services/monster-files.service.ts`: add `xpv: number | undefined` to `CreatureCsvRow`, parsed from a new `XPV_COLUMN = "xpv"` (blank → undefined) and required in `parseCreatureRowsCsv`.
- Modify: `lib/src/model/creature/creature.ts`: add `experience: ExperienceRow[] = []` and `baseExperience?: ExperienceConflict` (filled only on conflict).
- Modify: `lib/src/model/creature/creature-group.ts` `addCreature`: call `experienceService.apply(creature)` right after `creature.validate()`, so abilities are resolved; check this in `creature.factory.ts`.
- Test: `lib/src/services/experience/experience.service.test.ts`, plus extend `monster-files.service.test.ts` for the `xpv` column.

**Interfaces:**
- Consumes: Tasks 1–3; `monsterFilesService.getCreatureRows(file, game)`.
- Produces:
  ```ts
  export type ExperienceStatus = "zero" | "book" | "unchanged" | "formula" | "drop";
  export interface ExperienceRow {
    file: string; game?: Game; status: ExperienceStatus; reason: string;
    inGameXp?: number; newXp: number; score: ExperienceScore;
  }
  export interface ExperienceConflict { bookXp?: number; score: ExperienceScore }
  class ExperienceService {
    evaluate(creature: Creature): { rows: ExperienceRow[]; conflict?: ExperienceConflict };
    apply(creature: Creature): void;
  }
  export default experienceService;
  ```

**Scopes.** For each `creature.files` entry:
- If the file's adjustments are game-tagged, there is one scope per tagged game (same rule as `adjustmentService.getEffectiveDataForFile`).
- Otherwise there is one scope with the file's own `game`.
- Inside a scope, take `getCreatureRows(file, game)`. When those rows have different `xpv` per game, split the scope into one per row's game.

**Status per scope**, first match wins (`score` = `scoreExperience` of the scope, `base` = score of `{ creature }`):
1. A matching adjustment is a `summon`, or sets `xpv: 0` → `zero`, reason `"summon"` / `"xpv 0"`. Or the in-game XP is 0 → `zero`, `"0 in game"`. `newXp` 0.
2. No matching adjustment → `book`, `newXp = creature.data.xpv ?? inGameXp`.
3. `score.total === base.total` and the same ability set → `unchanged`, reason `"adjustment changes nothing the formula reads"`, `newXp` as `book`.
4. `inGameXp === undefined || score.xp >= inGameXp` → `formula`, `newXp = score.xp`.
5. Otherwise → `drop`, `newXp = inGameXp`.

The `reason` for `formula`/`drop` is the score's breakdown.

**`apply`** stores `rows` on `creature.experience` and `conflict` on `creature.baseExperience`. A conflict exists when `creature.data.xpv !== base.xp` (an undefined book XP counts as a conflict). It then appends one synthetic adjustment per row via `creature.setAdjustments`:
- `formula` and `drop`: `{ files: [file], game, data: { xpv: newXp } }`
- `zero` with reason `"0 in game"`: `xpv: 0`
- nothing for the other rows

`game` is set only when the scope came from a game split, so an untagged file is never split by the synthetic entry. Its `variant` stays undefined; `commonVariant` already ignores variant-less entries.

- [ ] **Step 1: Write failing tests** with fake creatures, mocking `monsterFilesService.getCreatureRows`:
  - a base-only file → `book` with the creature's `xpv`;
  - a script-only adjustment → `unchanged`, and no synthetic adjustment appended;
  - a `level1` bump from 4 to 9 with in-game 650 → `formula` 975, and the appended adjustment `{ files: ["F"], data: { xpv: 975 } }` with no `game`;
  - the same bump with in-game 91000 → `drop` with `newXp` 91000, and the appended `xpv: 91000`;
  - a summon adjustment plus `level1` bump → `zero`, nothing appended;
  - in-game 0 without summon → `zero` `"0 in game"`, appended `xpv: 0`;
  - Review Focus 1: bg1 row `xpv` 650 and bg2 row 1400 → two rows, `game` "bg1"/"bg2";
  - Review Focus 2: bg1 and bg2 tagged adjustments → one row per game, appended entries tagged;
  - Review Focus 5: no in-game `xpv` → `formula`;
  - conflict: base `xpv: 300` vs formula 270 → `conflict.bookXp` 300.
- [ ] **Step 2: Run them and confirm they fail.** Run `npx vitest run lib/src/services/experience lib/src/services/monster-files.service.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the `xpv` column, `ExperienceService`, the creature fields and the `addCreature` call.
- [ ] **Step 4: Run them again.** Expected: PASS. Then run the full suite with `npm test`. Expected: everything passes except `pipeline.golden.test.ts`, which now fails because XP output changed (handled in Task 5).
- [ ] **Step 5: Commit** `feat(xp): compute and write adjustment XP by status`.

---

### Task 5: Remove hand-written adjustment XP, guard it, regenerate

**Files:**
- Modify: every `lib/creatures/**/*.ts` adjustment, `adjust` or variant `data` carrying `xpv` other than `0`. Find them with `rg -n "xpv:" lib/creatures`. Keep base creature `xpv` (the `create(...)` data, `VampireAge.xpv`, which feeds base creatures, and similar). Remove only adjustment/variant entries. Also remove comments that only justified the removed value.
- Modify: `lib/src/services/creature.service.ts`: add `checkAdjustmentXp(creature: Creature): boolean`. It logs `"<name>: adjustment for '<files>' sets xpv <n>; adjustment XP comes from the DMG formula (experience.service), only 0 is allowed."` and returns false for any adjustment `data.xpv` that is set and not 0. Call it next to `checkAdjustmentFiles` in `lib/src/factories/creature.factory.ts:237`, folded into the same validity.
- Modify: `mod/` (regenerated).
- Test: `lib/src/services/creature.service.test.ts`.

**Interfaces:**
- Consumes: Task 4 (`apply` must not run its own appended entries through this check: they are appended after `validate()`).

- [ ] **Step 1: Write the failing test.** An adjustment with `xpv: 2250` → `checkAdjustmentXp` returns false and logs. With `xpv: 0` or none → true.
- [ ] **Step 2: Run it and confirm it fails.** Run `npx vitest run lib/src/services/creature.service.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the check, then remove the adjustment `xpv` values.**
- [ ] **Step 4: Regenerate and check.** Run `npm run generate`, then `rg -n "sets xpv" generator.log`. Expected: no match, and no new errors in `generator.log` compared to before. Then run `npm test`. Expected: PASS, including the golden test against the regenerated `mod/`.
- [ ] **Step 5: Commit** `feat(xp): adjustment XP only from the formula` with `lib/creatures`, `lib/src` and `mod/`.

---

### Task 6: Dashboard Experience tab

**Files:**
- Create: `scripts/lib/experience-report.ts`: builds the report from built creatures.
- Create: `scripts/lib/experience-report-html.ts`: renders the tab.
- Modify: `scripts/lib/dashboard-html.ts`:
  - add `experience: ExperienceReportData` to `DashboardData`;
  - add the tab `"experience"` (label "Experience", badge = drops count) to the tab list and to the client `tabs` array;
  - add an Overview card with the headline counts.
- Modify: `scripts/dashboard.ts`: pass `experience: buildExperienceReport(creatures)`.
- Modify: `DEVELOPMENT.md`: list the tab in the Dashboard section.
- Test: `scripts/lib/experience-report.test.ts`

**Interfaces:**
- Consumes: Task 4 `creature.experience`, `creature.baseExperience`, `ExperienceRow`.
- Produces:
  ```ts
  export interface ExperienceReportRow extends ExperienceRow { monster: string; difference?: number }
  export interface ExperienceReportData {
    rows: ExperienceReportRow[];
    drops: ExperienceReportRow[];
    conflicts: { monster: string; bookXp?: number; score: ExperienceScore }[];
    counts: Record<ExperienceStatus, number>;
  }
  export function buildExperienceReport(creatures: Creature[]): ExperienceReportData;
  export function renderExperienceTab(d: ExperienceReportData): string;
  ```
  `monster` is `MonsterEnum[creature.id]`. `difference = newXp − inGameXp`; it is undefined for `zero` or when the in-game XP is unknown.

**Rendering**, reusing `table.counts`, sorting and the filter box from `dashboard-html.ts`:
1. **All files**: monster, file (+ game), status, in-game XP, new XP, difference, breakdown.
   - The status column has a filter `<select>` (all / each status).
   - `zero` rows use a muted class with no difference.
   - `unchanged` rows show their reason under the status.
2. **XP drops to review**: monster, file, in-game XP, formula XP, breakdown.
3. **Base XP conflicts**: monster, book XP, formula XP, breakdown.

Overview card: files whose XP changed (`difference ≠ 0` among `formula`), drops, conflicts.

- [ ] **Step 1: Write failing tests** for `buildExperienceReport` with two fake creatures. Check:
  - `counts` per status;
  - the `drops` subset;
  - `difference` (formula 975 vs in-game 650 → 325; zero → undefined);
  - the conflict carries the monster name.

  Also check that `renderExperienceTab` output contains `id="tab-experience"`-compatible markup, the three section titles, and a `drop` row's file.
- [ ] **Step 2: Run them and confirm they fail.** Run `npx vitest run scripts/lib/experience-report.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the report, the renderer and the dashboard wiring.
- [ ] **Step 4: Run and check.** Run the tests (expected PASS), then `npm run dashboard`. Expected: it writes `mod/docs/dashboard.html`, and the Experience tab lists rows. The console prints the counts, so add a line `Experience: <n> changed, <n> drops, <n> conflicts`.
- [ ] **Step 5: Commit** `feat(dashboard): experience tab` with `mod/docs/dashboard.html`.

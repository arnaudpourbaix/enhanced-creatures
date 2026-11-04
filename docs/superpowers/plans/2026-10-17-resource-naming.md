# Resource Naming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every `ja` resource follows `ja` + kind + scope + owner(2, base 36) + counter(2, base 36);
a monster's code (`toCode(id)`) names its tpa, scripts, resources, summons and assets, and is shown in
the log and the docs. Generation cleans its own output.

**Architecture:** `toCode` and `getResourceName` in `lib/src/services/utils/misc.func.ts` are the only
name builders. Handwritten names move into the scheme as constant values plus asset file renames.
Verification normalises old → new names in a dump of the generated tree and requires identical
contents.

**Tech Stack:** TypeScript, vitest, Python 3 (verification script only, kept in the scratchpad).

**Spec:** `docs/superpowers/specs/2026-10-17-resource-naming-design.md`

## Global Constraints

- Name shape: `^ja[sipbcav][mfec][0-9a-z]{4}$`, lowercase, exactly 8 characters. Kinds: `s` spl,
  `i` itm, `p` standalone pro, `b` bcs script, `c` cre, `a` bam, `v` vvc. Scopes: `m` monster,
  `f` family, `e` entry (reserved), `c` common (owner `00`).
- `toCode(n)`: base 36, 2 chars, zero-padded; throws above 1295. Scripts: counter `00` main, `01`
  summon.
- Mod files use the code too: `<code>.tpa`, WeiDU function `jam<code>_patch`, log `(<code>)`.
- Apart from names, generated contents must not change (normalised comparison). Translation
  numbering unchanged.
- Scoped lint (`npx eslint <changed files>`), `npx tsc -p . --noEmit`. Prettier:
  `npx prettier --check --end-of-line auto <files>` (CRLF working copies).
- Never use `git stash`. Asset renames with `git mv`.

## Review Focus

- A handwritten tpa (`fey/common.tpa`, `undead/common.tpa`, `pnp-spell/symbol_pain/main.tpa`) still
  naming an old file → install fails to find it. Covered by the scheme test (Task 5) and a grep in
  Task 3.
- Icon suffix rule appending `C`/`B` to a new `ja` name ending in 3 digits. Test in Task 2.
- Case: asset files on disk were partly uppercase (`JAGRNSLI.CRE`); new names are lowercase, and the
  generated `COPY` lines use the constant's (lowercase) value. Covered by the dump comparison.
- Old hex files left on disk after regeneration. Covered by the cleaner (Task 6) and Task 8's
  `git status`.
- Tests across the suite asserting old names (`jas0m1`...). Updated in Task 4, never weakened.

---

### Task 1: Dump harness, baseline, and the normaliser

**Files (untracked, never committed):** `lib/src/services/output-manifest.tmp.test.ts`;
`$SCRATCH/normalise.py` (`$SCRATCH` = session scratchpad).

- [ ] **Step 1: Harness** — same as sub-project 2's harness (full pipeline into a temp dir; copies
      `mod/lib/pnp-monster`, `mod/CHANGELOG.md`, `mod/enhanced_creatures.tp2` first), plus: when
      `MANIFEST_DUMP_DIR` is set, copy the whole generated temp tree there (`fs.cpSync(tmp, dir,
{ recursive: true })`) before deleting it.

- [ ] **Step 2: Baseline dump** —
      `MANIFEST_OUT=$SCRATCH/rn-before.txt MANIFEST_DUMP_DIR=$SCRATCH/dump-before npx vitest run lib/src/services/output-manifest.tmp.test.ts`
      Expected: PASS.

- [ ] **Step 3: Normaliser** (`$SCRATCH/normalise.py BEFORE_DIR AFTER_DIR [--handwritten-only]`):
      walks both trees; maps BEFORE paths and contents to new names; compares with AFTER; prints
      differing files (with a short unified diff of the first difference) and exits 1 if any.

```python
import difflib, os, re, sys

B36 = "0123456789abcdefghijklmnopqrstuvwxyz"
code = lambda n: B36[n // 36] + B36[n % 36]

HANDWRITTEN = {  # old (lowercase) -> new; must match Task 3's table exactly
    "jatrea1": "jacm1900", "jatrea2": "jacm1901", "jatrea3": "jacm1902", "jatrea4": "jacm1903",
    "jatrean": "jacm1904", "jadryad": "jacm1500", "jahama": "jacm1600",
    "japuddbl": "jacm1b00", "jablpud": "jacm1b01", "japuddwh": "jacm1i00", "jawhpud": "jacm1i01",
    "jajellmu": "jacm1a00", "jajelmu": "jacm1a01", "jagrnsli": "jacm1f00", "jaolisli": "jacm1g00",
    "jagpsnak": "jacm3700", "jasnake": "jacm3701", "jazombie": "jacm2e00",
    "jaenkis": "jaaf0800", "jafspkp": "jaaf0801", "jaskiss": "javf0800", "jaicew": "jaaf0i00",
    "jaspain": "jasc0000", "jaspaina": "jaac0000", "jaspainb": "jaac0001", "jaspainc": "jaac0002",
    "jasight": "japc0000",
    **{f"jai{n}": f"jaic{code(n)}" for n in [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]},
    "ja6": "jaic0006", "ja7": "jaic0007", "ja8": "jaic0008",
}

def gen(m):  # old generated resource: ja + kind + counter(hex) + m|f + id(hex)
    k, n, s, i = m.group(1).lower(), m.group(2), m.group(3).lower(), m.group(4)
    return f"ja{k}{s}{code(int(i, 16))}{code(int(n, 16))}"

GEN = re.compile(r"(?i)\bja([sip])([0-9a-f])([mf])([0-9a-f]{1,2})\b")
SCRIPT = re.compile(r"(?i)\bjam([0-9a-f]{1,2})(su)?\b(?!_)")
PATCH = re.compile(r"(?i)\bjam([0-9a-f]{1,2})_patch\b")
TPA = re.compile(r"(?i)(pnp-monster/[a-z]+/)([0-9a-f]{1,2})\.tpa\b")
HAND = re.compile(r"(?i)\b(" + "|".join(sorted(map(re.escape, HANDWRITTEN), key=len, reverse=True)) + r")\b")

def norm(text, handwritten_only):
    text = HAND.sub(lambda m: HANDWRITTEN[m.group(1).lower()], text)
    if handwritten_only:
        return text
    text = PATCH.sub(lambda m: f"jam{code(int(m.group(1), 16))}_patch", text)
    text = SCRIPT.sub(lambda m: f"jabm{code(int(m.group(1), 16))}{'01' if m.group(2) else '00'}", text)
    text = GEN.sub(gen, text)
    return TPA.sub(lambda m: f"{m.group(1)}{code(int(m.group(2), 16))}.tpa", text)

def files(root):
    return {os.path.relpath(os.path.join(d, f), root).replace(os.sep, "/")
            for d, _, fs in os.walk(root) for f in fs}

before, after, hw = sys.argv[1], sys.argv[2], "--handwritten-only" in sys.argv
a_files = {f.lower(): f for f in files(after)}
mapped = {norm(f, hw).lower(): f for f in files(before)}  # new path (lowercase) -> old path
bad = 0
for new, old in sorted(mapped.items()):
    target = a_files.get(new)
    if target is None:
        print("MISSING", new, "(from", old + ")"); bad += 1; continue
    x = norm(open(os.path.join(before, old), encoding="latin-1").read(), hw)
    y = open(os.path.join(after, target), encoding="latin-1").read()
    if x != y:
        bad += 1
        print("DIFF", target)
        print("".join(list(difflib.unified_diff(x.splitlines(True), y.splitlines(True), n=1))[:12]))
for extra in sorted(set(a_files) - set(mapped)):
    print("EXTRA", a_files[extra]); bad += 1
print("IDENTICAL" if not bad else f"{bad} problems"); sys.exit(1 if bad else 0)
```

Note: script file names `jam<hex>.baf` / `jam<hex>su.baf` map through `SCRIPT`; `<hex>.tpa` paths
through `TPA` (the regex sees the relative path `lib/pnp-monster/<family>/<hex>.tpa`).

- [ ] **Step 4: Sanity check** — `python $SCRATCH/normalise.py $SCRATCH/dump-before $SCRATCH/dump-before`
      must report problems (BEFORE is mapped, AFTER isn't) and its `MISSING` lines must show the
      expected new names (e.g. `lib/pnp-monster/undead/49.tpa (from lib/pnp-monster/undead/99.tpa)`):
      proof the regexes fire. Fix the script if it crashes or maps nothing.

No commit.

---

### Task 2: `toCode`, `getResourceName`, icon suffix rule

**Files:**

- Modify: `lib/src/services/utils/misc.func.ts`
- Modify: `lib/src/services/spell.service.ts:69-71` and `:128-130`
- Test: `lib/src/services/utils/misc.func.test.ts` (create if absent), `lib/src/services/spell.service.test.ts`

**Interfaces:**

- Produces:

```ts
export type ResourceKind = "s" | "i" | "p" | "b" | "c" | "a" | "v";
export type ResourceScope = "m" | "f" | "e" | "c";
export function toCode(n: number): string; // base 36, 2 chars, throws if n < 0 || n > 1295 || !Number.isInteger(n)
export function getResourceName(
  kind: ResourceKind,
  scope: ResourceScope,
  ownerId: number,
  counter: number,
): string;
```

`getSpellFilename/getItemFilename/getProjectileFilename` keep their signatures in this task (Task 4
switches them).

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from "vitest";
import { getResourceName, toCode } from "./misc.func";

describe("toCode", () => {
  it("is base 36, 2 chars, zero-padded", () => {
    expect(toCode(0)).toBe("00");
    expect(toCode(8)).toBe("08");
    expect(toCode(35)).toBe("0z");
    expect(toCode(36)).toBe("10");
    expect(toCode(153)).toBe("49");
    expect(toCode(1295)).toBe("zz");
  });
  it("throws outside 0-1295", () => {
    expect(() => toCode(1296)).toThrow(/1295/);
    expect(() => toCode(-1)).toThrow();
    expect(() => toCode(1.5)).toThrow();
  });
});

describe("getResourceName", () => {
  it("builds ja + kind + scope + owner + counter, 8 chars", () => {
    expect(getResourceName("s", "m", 153, 0)).toBe("jasm4900");
    expect(getResourceName("i", "m", 153, 1)).toBe("jaim4901");
    expect(getResourceName("b", "m", 153, 1)).toBe("jabm4901");
    expect(getResourceName("s", "f", 8, 3)).toBe("jasf0803");
    expect(getResourceName("i", "c", 0, 19)).toBe("jaic000j");
  });
  it("throws when owner or counter exceeds zz", () => {
    expect(() => getResourceName("s", "m", 1296, 0)).toThrow();
    expect(() => getResourceName("s", "m", 1, 1296)).toThrow();
  });
});
```

In `spell.service.test.ts`, add (follow its existing fixtures for building a spell):
`a spell icon starting with "ja" and ending in 3 digits gets no C/B suffix` (icon `jaac0002` stays
`jaac0002`, header icon stays as given) and keep/assert that `SPWI305` still becomes `SPWI305C`.

- [ ] **Step 2: Run, expect FAIL** — `npx vitest run lib/src/services/utils/misc.func.test.ts lib/src/services/spell.service.test.ts`

- [ ] **Step 3: Implement**

```ts
export type ResourceKind = "s" | "i" | "p" | "b" | "c" | "a" | "v";
export type ResourceScope = "m" | "f" | "e" | "c";

const MAX_CODE = 36 * 36 - 1;

/** A monster's / family's code in every file name: base 36, 2 chars, zero-padded (153 -> "49"). */
export function toCode(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > MAX_CODE) {
    throw new Error(`Code out of range (0-${MAX_CODE}): ${n}`);
  }
  return n.toString(36).padStart(2, "0");
}

/** ja + kind + scope + owner code + counter code: always 8 characters (see resource naming spec). */
export function getResourceName(
  kind: ResourceKind,
  scope: ResourceScope,
  ownerId: number,
  counter: number,
): string {
  return `ja${kind}${scope}${toCode(ownerId)}${toCode(counter)}`;
}
```

`spell.service.ts`: both conditions become `... && !/^ja/i.test(icon) && /\d{3}$/.test(icon)` with a
comment: `// vanilla icons only (SPWI305 -> SPWI305C); mod names (ja...) are exact`.

- [ ] **Step 4: PASS**, tsc, eslint on the 2 source files.
- [ ] **Step 5: Commit** `feat: base-36 resource codes (toCode, getResourceName)`

---

### Task 3: Handwritten resources into the scheme

**Files:** `lib/config/item.ts`, `lib/config/creatures.ts`, `lib/config/spells/spells.ts`,
`lib/spells/projectiles.ts`, `lib/spells/symbol_pain.ts`, `lib/creatures/feys.ts` (icon
`jaenkis`), `lib/creatures/plants.ts` (`copyFrom: "jatrean"` ×4), `lib/creatures/snakes.ts`
(`copyFrom: "jasnake"`), `mod/lib/pnp-monster/fey/common.tpa`, `mod/lib/pnp-monster/undead/common.tpa`,
`mod/lib/pnp-spell/symbol_pain/main.tpa`, and 17 asset files.

Rename table (old → new; owner code in brackets):

| Old                             | New                                                                 | Where                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `jatrea1`–`jatrea4`             | `jacm1900`–`jacm1903`                                               | `NEW_CREATURES.Treant5hd/7hd/9hd/11hd` (Treant 45 `19`)                                                        |
| `jatrean`                       | `jacm1904`                                                          | plants.ts `copyFrom` ×4, `plant/assets/jatrean.cre`                                                            |
| `jadryad`                       | `jacm1500`                                                          | `NEW_CREATURES.DryadSummon`, `fey/assets/jadryad.cre` (Dryad 41 `15`)                                          |
| `jahama`                        | `jacm1600`                                                          | `NEW_CREATURES.HamadryadSummon`, `fey/assets/jahama.cre` (Hamadryad 42 `16`)                                   |
| `japuddbl` / `jablpud`          | `jacm1b00` / `jacm1b01`                                             | `NEW_CREATURES.BlackPudding` / `SplitBlackPudding`, `ooze/assets/JAPUDDBL.CRE` (47 `1b`)                       |
| `japuddwh` / `jawhpud`          | `jacm1i00` / `jacm1i01`                                             | `WhitePudding` / `SplitWhitePudding`, `ooze/assets/JAPUDDWH.cre` (54 `1i`)                                     |
| `jajellmu` / `jajelmu`          | `jacm1a00` / `jacm1a01`                                             | `MustardJelly` / `SplitMustardJelly`, `ooze/assets/JAJELLMU.CRE` (46 `1a`)                                     |
| `jagrnsli`                      | `jacm1f00`                                                          | `GreenSlime`, `ooze/assets/JAGRNSLI.CRE` (51 `1f`)                                                             |
| `jaolisli`                      | `jacm1g00`                                                          | `OliveSlimeCreature`, `ooze/assets/JAOLISLI.CRE` (52 `1g`)                                                     |
| `jagpsnak` / `jasnake`          | `jacm3700` / `jacm3701`                                             | `GiantPoisonousSnake` / snakes.ts `copyFrom`, `snake/assets/jasnake.CRE` (115 `37`)                            |
| `jazombie`                      | `jacm2e00`                                                          | `NEW_CREATURES.Zombie`, `undead/assets/jazombie.cre` (86 `2e`)                                                 |
| `jaenkis`, `jafspkp`, `jaskiss` | `jaaf0800`, `jaaf0801`, `javf0800`                                  | feys.ts icon, `fey/common.tpa`, `fey/assets/*` (Fey family 8 `08`)                                             |
| `jaicew`                        | `jaaf0i00`                                                          | `undead/common.tpa`, `undead/assets/jaicew.bam`, commented `//icon` in death-knight.ts (Undead family 18 `0i`) |
| `jaspain`                       | `jasc0000`                                                          | `NEW_SPELLS.WizardSymbolOfPain`                                                                                |
| `jaspainA`/`B`/`C` (BAM)        | `jaac0000`/`0001`/`0002`                                            | `pnp-spell/symbol_pain/*.BAM`, its `main.tpa`, symbol_pain.ts icons (explicit names, not `${spell}C`/`B`)      |
| `jasight`                       | `japc0000`                                                          | `AreaOfSightNonParty`                                                                                          |
| `jai1`…`jai5`, `jai9`…`jai19`   | `jaic0001`…`jaic0005`, `jaic0009`…`jaic000j` (counter = old number) | `ITEMS`                                                                                                        |
| `ja6`, `ja7`, `ja8`             | `jaic0006`, `jaic0007`, `jaic0008`                                  | `ITEMS.GhostVisuals1-3`                                                                                        |

Before applying, grep each old name across `lib/` and `mod/lib` (excluding generated
`pnp-monster/<family>/<hex>.tpa`, `main.tpa`, `jam*.baf`, `lib/common/*.tpa` which regenerate) to
catch any reference this table misses; add it with a ledger note.

- [ ] **Step 1: Values** — change each constant/literal per the table.
- [ ] **Step 2: Files** — `git mv` each asset to its new lowercase name (`git mv
mod/lib/pnp-monster/ooze/assets/JAGRNSLI.CRE mod/lib/pnp-monster/ooze/assets/jacm1f00.cre`, ...).
      Update the three hand-written tpa files' `COPY` lines.
- [ ] **Step 3: Check** — `tsc`, `npx vitest run` (update any test asserting an old handwritten
      value), then dump + normalise:
      `MANIFEST_OUT=$SCRATCH/rn-t3.txt MANIFEST_DUMP_DIR=$SCRATCH/dump-t3 npx vitest run lib/src/services/output-manifest.tmp.test.ts`
      and `python $SCRATCH/normalise.py $SCRATCH/dump-before $SCRATCH/dump-t3 --handwritten-only`.
      Expected: `IDENTICAL`. Note: `pnp-monster/*/assets` files are copied into the dump by the harness,
      so renamed assets show up there too.
- [ ] **Step 4: Commit** `refactor: handwritten resources follow the naming scheme`

---

### Task 4: Generated resources into the scheme

**Files:** `lib/src/services/utils/misc.func.ts` (`getFilename` → `getResourceName`),
`lib/src/model/creature/abstract-creature.ts` (callers unchanged in shape),
`lib/src/services/effects/grab.service.ts:36`, `lib/src/services/weidu/weidu-creature.service.ts:53,197,846`,
`lib/src/model/creature/family.ts:80,109` (log), tests asserting old names.

- [ ] **Step 1: Tests first** — update `misc.func.test.ts` with:

```ts
it("names creature and family resources with codes", () => {
  expect(getSpellFilename(0, 153)).toBe("jasm4900");
  expect(getItemFilename(1, 153)).toBe("jaim4901");
  expect(getProjectileFilename(2, 8, "f")).toBe("japf0802");
});
```

Run → FAIL.

- [ ] **Step 2: Implement** — `getFilename(num, id, type, kind)` returns
      `getResourceName(kind, type, id, num)`. Scripts: `jam${hex}${su ? "su" : ""}${ext}` →
      `${getResourceName("b", "m", creature.id, options.summon ? 1 : 0)}${ext}`. Tpa file name
      `${creature.id.toString(16)}.tpa` → `${toCode(creature.id)}.tpa`; patch function
      `jam${toCode(creature.id)}_patch`; log `(${toCode(p.monster)})`. Search for any other
      `toString(16)` used in a name (`grep -rn "toString(16)" lib/src lib/creatures`; the
      `WRITE_* 0x...` offsets in weidu services are not names — leave them).
- [ ] **Step 3: Update tests** — run `npx vitest run`, and for each failing assertion on an old
      name, replace it with the mapped new name (same mapping as `normalise.py`). Never delete an
      assertion. List every touched test file in the ledger.
- [ ] **Step 4: Verify** — dump to `$SCRATCH/dump-t4`, then
      `python $SCRATCH/normalise.py $SCRATCH/dump-t3 $SCRATCH/dump-t4` → `IDENTICAL`.
      If something differs, it is either a name the normaliser doesn't know (extend the normaliser and
      ledger it) or a real content change (fix the code).
- [ ] **Step 5: Commit** `refactor: generated resources use base-36 codes`

---

### Task 5: Guards — scheme test and SPL/ITM clash check

**Files:**

- Create: `lib/src/services/resource-names.test.ts` (scheme test)
- Create: `lib/src/services/resource-clash.service.ts` + test
- Modify: `lib/src/services/main.service.ts` (call the clash check at the end of `generateCreatures`
  and `generateCommonCode`, wherever all spells/items are known — read the file to pick the point)

- [ ] **Step 1: Scheme test** (fails if any handwritten `ja` name breaks the scheme):

```ts
import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { ITEMS } from "../../config/item";
import { NEW_CREATURES } from "../../config/creatures";
import { NEW_SPELLS } from "../../config/spells/spells";
import { ProjectileEnum } from "../../spells/projectiles"; // use the real export name

const SCHEME = /^ja[sipbcav][mfec][0-9a-z]{4}$/;
const ALLOW = new Set(["ja_wilderness"]); // not resource names

function assetNames(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...assetNames(full));
    else if (/^ja/i.test(e.name) && !/\.baf$/i.test(e.name)) out.push(path.parse(e.name).name);
  }
  return out;
}

describe("resource names", () => {
  it("every handwritten ja resource follows the scheme", () => {
    const names = [
      ...Object.values(ITEMS),
      ...Object.values(NEW_CREATURES),
      ...Object.values(NEW_SPELLS),
      ...Object.values(ProjectileEnum),
      ...assetNames("mod/lib/pnp-monster"),
      ...assetNames("mod/lib/pnp-spell/symbol_pain"),
    ].filter((n) => typeof n === "string" && /^ja/i.test(n) && !ALLOW.has(n));
    expect(names.filter((n) => !SCHEME.test(n))).toEqual([]);
  });
});
```

(`assetNames("mod/lib/pnp-monster")` also sees generated files once regenerated: generated `.tpa`
are not `ja*`, and generated `.baf` are excluded. Adapt export names after reading the files.)
Run → PASS (Task 3 already renamed). To prove it bites, temporarily set one `ITEMS` value to
`"jasmine1x"` → FAIL; revert.

- [ ] **Step 2: Clash check** — `resourceClashService.check(spellFiles: string[], itemFiles: string[])`
      throws `Error("SPL/ITM name clash: <names>")` when a base name (case-insensitive) is in both.
      Tests: no clash → no throw; `["jasm4900"]` / `["JASM4900"]` → throws listing it. Wire it with all
      generated + handwritten spell/item names (`State.spells`/`State.items` or the families' lists —
      read `main.service.ts` to find where they are complete).
- [ ] **Step 3:** suite, tsc, eslint; **Commit** `feat: resource name guards (scheme test, SPL/ITM clash check)`

---

### Task 6: Generation cleans its own output

**Files:** `lib/src/services/weidu/weidu-family.service.ts` (`createOrUpdateMainFile` when
`!creature`, i.e. the start of a family) or a new `output-cleaner.service.ts` called there; test.

- [ ] **Step 1: Failing test** — in a temp dir build `lib/pnp-monster/fey/` with `29.tpa`,
      `main.tpa`, `jam29.baf`, `common.tpa`, `assets/x.baf`, `assets/jaaf0800.bam`; run the cleaner on
      the family → only `common.tpa` and `assets/*` remain. A `pnp-monster/common/` folder is never
      touched (cleaner only runs on family folders).
- [ ] **Step 2: Implement** — delete, in the family folder only (non-recursive): `*.tpa` except
      `common.tpa`, and `*.baf`. Log each deleted file. Call it once per family before
      `main.tpa` is (re)created.
- [ ] **Step 3:** test PASS; `npm run generate`; `git status --short mod` shows the old hex files
      deleted and the new code-named files added, nothing else unexpected (hand-written files intact).
      Do not commit `mod/` yet (Task 8).
- [ ] **Step 4: Commit (source only)** `feat: generation cleans its generated files`

---

### Task 7: Show the code in the log and the docs

**Files:** `lib/src/services/doc/documentation.service.ts` (`getCreatureHeader`), `mod/docs/monsters.css`, test.

- [ ] **Step 1: Failing test** — card title contains `<span class="creature-code">#49</span>`
      right after the name (for id 153), in both the plain `<h3>` and the adjustments summary.
- [ ] **Step 2: Implement** — `const code = \`<span class="creature-code">#${toCode(creature.id)}</span>\``,
placed after the name and before type tags. CSS: small, muted (`font-size: .75rem; color:
      var(--color-ink-soft); font-family: var(--font-body); font-weight: normal; margin-left: .4rem`).
- [ ] **Step 3:** doc tests PASS (update exact-HTML header assertions to include the code span);
      **Commit** `feat: show each monster's code in the docs`

---

### Task 8: Changelog, regenerate, finish

- [ ] **Step 1:** `mod/CHANGELOG.md` `[Unreleased]` → Changed: "All mod resources renamed to a new
      naming scheme (a monster's base-36 code, also shown in the docs as #code). **Uninstall the previous
      version before installing**; saved games may lose items created by the old version."
- [ ] **Step 2:** `npm run generate`; `git add -A mod`; check `git status`: deleted old hex files,
      added code-named files, renamed assets, docs. Commit `chore: regenerate mod with new resource names`.
- [ ] **Step 3:** full `npx vitest run` (only the pre-existing golden failure), tsc, scoped eslint,
      prettier on changed files. Delete the harness. Roadmap: sub-project 3 ◐ → ✅. Commit `docs: sub-project 3 done`.

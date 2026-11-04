# Docs Entries & Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `docs/monsters.html` into a book-like page: A–Z monster entries (one monster in several
versions), a "Common to all" box per multi-member entry, and D&D 3e creature types as filterable tags.
Fix six creatures' types in game.

**Architecture:** Entries are declared in families with `addEntry(EntryEnum.X, [...])`. Types are
traits listed in `TYPE_TRAITS`, derived per creature from its immunities and its trait item,
including nested ones. The documentation service switches from render-per-family to
collect-then-render. Cards are built from keyed "parts" so a multi-member entry can lift the parts
every member shares into a shared box and omit them from member cards.

**Tech Stack:** TypeScript, vitest, ts-node, hand-written `mod/docs/monsters.js` / `monsters.css`.

**Spec:** `docs/superpowers/specs/2026-10-16-docs-entries-types-design.md`

## Global Constraints

- The generated mod must not change except for:
  - `docs/`;
  - `lib/pnp-monster/undead/main.tpa` INCLUDE **reordering** (same set of lines);
  - in Task 11 only, the six gameplay creatures (Spectral Hound, Dread Wolf, Vampiric Wolf,
    Hell Hound, Moon Dog, Displacer Beast).
- Translation keys get sequential string numbers (`translationService.browseTranslations`). Any new
  key in a numbered section renumbers every later string in the whole mod. All new texts go into the
  new **`doc`** section, which is excluded from numbering.
- New type traits (`aberration`, `animal`, `dragon`, `monstrousHumanoid`, `outsider`) are
  **`docOnly`**: no item, no immunities, no WeiDU function, no `LPF` call.
- Types follow **D&D 3e only**. Nesting means "is a" (`spider` nests `vermin`).
- "Common to all" = present on **every valid member**. No "same text except a number" heuristic.
- Member order = declaration order = registration order. The base creature comes before variants
  that reuse its resources.
- Card anchors stay `#m<id>`. Multi-member entries get `#e<EntryEnum>`.
- Run scoped lint (`npx eslint <changed files>`; full `eslint .` has pre-existing errors) and
  `npx tsc -p . --noEmit`.

## Review Focus

- A member with **no weapon / "By weapon" fallback** while others have weapons: the weapon must stay
  on each card and never produce an empty shared Attacks section.
  Test: Task 8, "does not share weapons when counts differ".
- **All ability scores common**: the member card must drop the whole "Ability Scores" stat, not
  render an empty one. Test: Task 7, "omits the Ability Scores stat when every score is omitted".
- **An entry where one member is invalid**: the shared box is computed over valid members only, and
  the invalid one is not rendered. Test: Task 9, "skips invalid members when computing common parts".
- **Duplicate popover ids**: the shared box reuses the first member's popover ids, so the first
  member's card must not also render them. Test: Task 9, "renders each popover id once".
- **Filtering by a type no visible member has** must hide entry blocks whose cards are all hidden,
  not leave empty headers. Covered by the JS logic in Task 10 and checked manually in Task 12.

---

## File Structure

| File                                                                                                     | Responsibility                                                             |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `lib/translations/en/doc.ts` (new)                                                                       | Docs-only texts: entry names, new type trait names/descriptions            |
| `lib/translations/i18n.ts`                                                                               | Registers `doc` section                                                    |
| `lib/src/services/translation.service.ts`                                                                | Excludes `doc` from string numbering                                       |
| `lib/src/model/final/immunity.ts`                                                                        | `docOnly` flag, 5 new `ImmunityName`s                                      |
| `lib/src/services/state.service.ts`                                                                      | `docOnly` default                                                          |
| `lib/src/services/weidu/weidu-creature.service.ts`, `weidu-function.service.ts`, `weidu-item.service.ts` | Skip `docOnly` immunities                                                  |
| `lib/config/immunity-config.ts`                                                                          | 5 new docOnly trait configs                                                |
| `lib/config/creature-types.ts` (new)                                                                     | `TYPE_TRAITS`                                                              |
| `lib/src/services/creature-type.service.ts` (new)                                                        | `getCreatureTypes(creature)`                                               |
| `lib/creatures/entry.ts` (new)                                                                           | `EntryEnum`, `ENTRY_NAMES`                                                 |
| `lib/src/model/creature/creature.ts`                                                                     | `entry?: EntryEnum`                                                        |
| `lib/src/model/creature/family.ts`                                                                       | `addEntry()`                                                               |
| `lib/creatures/{basilisks,golems,wyvern}.ts`, `lib/creatures/undead/family.ts`                           | Entry declarations                                                         |
| creature files (bears, cats, dogs, wolves, snakes, crawlers, ettercaps, minotaurs, wyvern)               | docOnly type traits                                                        |
| `lib/src/services/doc/card-parts.ts` (new)                                                               | `CardPart`, `WeaponPart`, `CardParts` types                                |
| `lib/src/services/doc/entry-common.ts` (new)                                                             | `getCommonKeys(parts[])` (pure)                                            |
| `lib/src/services/doc/documentation.service.ts`                                                          | Parts builders, omissions, collect-then-render, entries, sidebar, toolbar  |
| `lib/templates/monster.html`, `lib/templates/index.html`                                                 | `{{stats}}`, `{{typeTags}}`, `data-types`, `{{entries}}`, `{{typeFilter}}` |
| `mod/docs/monsters.css`, `mod/docs/monsters.js`                                                          | Entry/box/tag/toolbar styles, type filter                                  |
| `lib/creatures/{cats,dogs,wolves}.ts`                                                                    | Gameplay changes (Task 11)                                                 |

---

### Task 1: Output manifest harness and baseline

Captures a byte-hash manifest of the full pipeline output **before any change**, so Tasks 6 and 11
can prove what moved.

**Files:**

- Create (untracked, never committed): `lib/src/services/output-manifest.tmp.test.ts`

- [ ] **Step 1: Create the harness**

```ts
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { it } from "vitest";
import { State } from "../state";
import mainService from "./main.service";
import stateService from "./state.service";

// Temporary: writes "sha256  relpath" for every generated file to $MANIFEST_OUT.
// Same pipeline as pipeline.golden.test.ts's beforeAll. Delete after Task 12.
const MOD_ROOT = path.resolve(process.cwd(), "mod");

function copyRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function list(dir: string, base = dir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory()
      ? list(full, base)
      : [path.relative(base, full).split(path.sep).join("/")];
  });
}

it("writes output manifest", async () => {
  const out = process.env.MANIFEST_OUT;
  if (!out) throw new Error("MANIFEST_OUT not set");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ec-manifest-"));
  copyRecursive(path.join(MOD_ROOT, "lib/pnp-monster"), path.join(tmp, "lib/pnp-monster"));
  fs.copyFileSync(path.join(MOD_ROOT, "CHANGELOG.md"), path.join(tmp, "CHANGELOG.md"));
  await stateService.init();
  State.modFolder = tmp;
  mainService.checkPresets();
  mainService.checkSpells();
  mainService.generateCreatures();
  mainService.generateCommonCode();
  mainService.generateTranslations();
  const lines = list(tmp)
    .sort()
    .map((f) => {
      const hash = crypto
        .createHash("sha256")
        .update(fs.readFileSync(path.join(tmp, f)))
        .digest("hex");
      return `${hash}  ${f}`;
    });
  fs.writeFileSync(out, lines.join("\n") + "\n");
  const copy = process.env.MANIFEST_COPY_FILE;
  if (copy && process.env.MANIFEST_COPY_TO) {
    fs.copyFileSync(path.join(tmp, copy), process.env.MANIFEST_COPY_TO);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}, 120000);
```

- [ ] **Step 2: Capture the baseline from a clean tree**

Run (Git Bash):

```bash
git stash list   # note: only unrelated copy.service changes may be uncommitted; they don't affect generation
MANIFEST_OUT=$SCRATCH/before.txt npx vitest run lib/src/services/output-manifest.tmp.test.ts
wc -l $SCRATCH/before.txt
```

`$SCRATCH` = the session scratchpad directory. Expected: PASS, several hundred lines.

No commit (the harness stays untracked).

---

### Task 2: `docOnly` immunity flag

A docs-only trait must produce no WeiDU function, no `LPF` call and no item effect.

**Files:**

- Modify: `lib/src/model/final/immunity.ts` (`ImmunityConfig`, around line 107)
- Modify: `lib/src/services/state.service.ts:47-66` (`loadImmunities`)
- Modify: `lib/src/services/weidu/weidu-creature.service.ts:375-394` (`addImmunities`)
- Modify: `lib/src/services/weidu/weidu-function.service.ts:46-54` (`generateImmunities`)
- Modify: `lib/src/services/weidu/weidu-item.service.ts` (loop at line 47 over `item.immunities`)
- Test: `lib/src/services/weidu/weidu-creature.service.test.ts`, `lib/src/services/weidu/weidu-function.service.test.ts`

**Interfaces:**

- Produces: `ImmunityConfig.docOnly: boolean` (defaults `false` in `State.immunities`).

- [ ] **Step 1: Write the failing tests**

In `weidu-function.service.test.ts`, add (adapt the existing State setup pattern in that file):

```ts
it("emits no patch function for a docOnly immunity", () => {
  const before = State.immunities;
  State.immunities = [
    {
      ...State.immunities[0],
      name: "animal",
      type: "trait",
      docOnly: true,
      immunities: [],
      effects: [],
    },
  ] as typeof State.immunities;
  const written: string[] = [];
  vi.spyOn(utils, "writeFile").mockImplementation((_f, content) => {
    written.push(content);
  });
  weiduFunctionService.generateImmunities();
  expect(written.join("")).not.toContain("animal");
  State.immunities = before;
});
```

In `weidu-creature.service.test.ts`, add a test that a creature whose `data.immunities` contains
a `docOnly` immunity gets no `LPF ... END` line for it (reuse the file's existing helper that
builds lines from `addImmunities`, or call the private method through a cast as the file already
does for other private methods):

```ts
it("emits no LPF call for a docOnly immunity", () => {
  const before = State.immunities;
  State.immunities = [
    { name: "animal", type: "trait", docOnly: true, immunities: [], effects: [], overrides: [] },
  ] as unknown as typeof State.immunities;
  const lines: CodeLine[] = [];
  (
    weiduCreatureService as unknown as {
      addImmunities(l: CodeLine[], t: number, i: ImmunityName[], a: CreatureAdjustment[]): void;
    }
  ).addImmunities(lines, 0, ["animal"], []);
  expect(lines).toEqual([]);
  State.immunities = before;
});
```

- [ ] **Step 2: Run them, expect FAIL**

Run: `npx vitest run lib/src/services/weidu/weidu-function.service.test.ts lib/src/services/weidu/weidu-creature.service.test.ts`
Expected: the two new tests FAIL (the function is emitted, the LPF line is added).

- [ ] **Step 3: Implement**

`immunity.ts`, in `ImmunityConfig` after `doc: boolean;`:

```ts
/**
 * Docs-only trait (e.g. a creature type with no in-game effect): generates no WeiDU function,
 * no LPF call and no item effect.
 */
docOnly: boolean;
```

The raw config type used by `immunity-config.ts` must accept it as optional. Find the input type
that `IMMUNITIES/RESISTANCES/TRAITS` are declared with (search `TRAITS:` in
`lib/config/immunity-config.ts`) and make `docOnly` optional there, the same way `doc` is.

`state.service.ts` `loadImmunities`, next to `doc: i.doc ?? true,`:

```ts
        docOnly: i.docOnly ?? false,
```

`weidu-creature.service.ts` `addImmunities`, first line in the loop body after the `!immunity` throw:

```ts
if (immunity.docOnly) continue;
```

`weidu-function.service.ts` `generateImmunities`:

```ts
for (const immunity of State.immunities) {
  if (immunity.docOnly) continue;
  this.generateImmunityFunction(lines, immunity, 0);
}
```

`weidu-item.service.ts`, in the `for (const name of item.immunities)` loop, after the immunity is
looked up: `if (immunity.docOnly) continue;` (read the loop first; if it looks up through a helper,
skip right after that lookup).

- [ ] **Step 4: Run tests, expect PASS**

Run: `npx vitest run lib/src/services/weidu lib/src/services/state.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/src/model/final/immunity.ts lib/src/services/state.service.ts lib/src/services/weidu lib/config/immunity-config.ts
git commit -m "feat: docOnly immunities generate no WeiDU code"
```

---

### Task 3: Docs-only translation section `doc`

**Files:**

- Create: `lib/translations/en/doc.ts`
- Modify: `lib/translations/i18n.ts` (imports + `getTranslationKeys` return)
- Modify: `lib/src/services/translation.service.ts:82-100`
- Test: `lib/src/services/translation.service.test.ts`

**Interfaces:**

- Produces: translation keys `doc.entry.<camel>` and `doc.types.<name>.name` / `.desc`;
  `DOC_ONLY_SECTION = "doc"` excluded from string numbering.

- [ ] **Step 1: Write the failing test**

```ts
it("does not number docs-only translations", () => {
  expect(() => translationService.stringRef("doc.entry.vampire")).toThrow(/not registered/);
  expect(translationService.from("doc.entry.vampire")).toBe("Vampire");
});
```

- [ ] **Step 2: Run, expect FAIL** (type error / key missing)

Run: `npx vitest run lib/src/services/translation.service.test.ts`

- [ ] **Step 3: Implement**

`lib/translations/en/doc.ts`:

```ts
// Docs-only texts (monsters.html). Never referenced in game, so i18n numbering skips this section
// (see translationService.browseTranslations): adding a key here must not renumber generated.tra.
export default {
  entry: {
    basilisk: "Basilisk",
    clayGolem: "Clay Golem",
    ghoul: "Ghoul",
    mummy: "Mummy",
    shadow: "Shadow",
    stoneGolem: "Stone Golem",
    vampire: "Vampire",
    wyvern: "Wyvern",
    zombie: "Zombie",
  },
  types: {
    aberration: {
      name: "Aberration",
      desc: `Aberrations have bizarre anatomy, strange abilities, an alien mindset, or any combination of the three.
Darkvision out to 60 feet.`,
    },
    animal: {
      name: "Animal",
      desc: `An animal is a living, nonhuman creature, usually a vertebrate with no magical abilities and no innate capacity for language or culture.
Low-light vision.`,
    },
    dragon: {
      name: "Dragon",
      desc: `A dragon is a reptilelike creature, usually winged, with magical or unusual abilities.
Immunity to magic sleep effects and paralysis effects.
Darkvision out to 60 feet and low-light vision.`,
    },
    monstrousHumanoid: {
      name: "Monstrous Humanoid",
      desc: `Monstrous humanoids are similar to humanoids, but with monstrous or animalistic features. They often have magical abilities as well.
Darkvision out to 60 feet.`,
    },
    outsider: {
      name: "Outsider",
      desc: `An outsider is at least partially composed of the essence (but not necessarily the material) of some plane other than the Material Plane. Some creatures start out as some other type and become outsiders when they attain a higher (or lower) state of spiritual existence.
Darkvision out to 60 feet.`,
    },
  },
};
```

`i18n.ts`: `import docEn from "./en/doc";` and add `doc: docEn,` as the **last** property of the
returned object.

`translation.service.ts`:

```ts
// Top-level translation sections that only feed the docs: never given a .tra string number, so
// adding to them can't renumber the in-game strings.
const DOC_ONLY_SECTIONS = ["doc"];
```

and in `browseTranslations`, at the top of the loop:

```ts
if (!key && DOC_ONLY_SECTIONS.includes(k)) continue;
```

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run lib/src/services/translation.service.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/translations lib/src/services/translation.service.ts lib/src/services/translation.service.test.ts
git commit -m "feat: docs-only translation section excluded from string numbering"
```

---

### Task 4: Type traits and `getCreatureTypes`

**Files:**

- Modify: `lib/src/model/final/immunity.ts` (`ImmunityName` union: add `"aberration"`, `"animal"`,
  `"dragon"`, `"monstrousHumanoid"`, `"outsider"`, alphabetically)
- Modify: `lib/config/immunity-config.ts` (append 5 entries to the `TRAITS` array)
- Create: `lib/config/creature-types.ts`
- Create: `lib/src/services/creature-type.service.ts`
- Test: `lib/src/services/creature-type.service.test.ts`

**Interfaces:**

- Produces: `TYPE_TRAITS: readonly ImmunityName[]`;
  `creatureTypeService.getCreatureTypes(creature: Creature): ImmunityName[]` (in `TYPE_TRAITS`
  order); `creatureTypeService.getTypeName(type: ImmunityName): string` (translated display name).

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, describe, expect, it } from "vitest";
import { Creature } from "../model/creature/creature";
import { ImmunityConfig } from "../model/final/immunity";
import { State } from "../state";
import creatureTypeService from "./creature-type.service";

const cfg = (name: string, immunities: string[] = []) =>
  ({ name, type: "trait", immunities }) as unknown as ImmunityConfig;

const creature = (immunities: string[], itemImmunities?: string[]) =>
  ({
    data: { immunities },
    items: itemImmunities ? [{ trait: true, immunities: itemImmunities }] : [],
  }) as unknown as Creature;

describe("getCreatureTypes", () => {
  const saved = State.immunities;
  afterEach(() => {
    State.immunities = saved;
  });

  it("returns direct type traits in TYPE_TRAITS order, ignoring non-types", () => {
    State.immunities = [cfg("undead"), cfg("vermin"), cfg("skeletal")];
    expect(
      creatureTypeService.getCreatureTypes(creature(["undead", "skeletal", "vermin"])),
    ).toEqual(["undead", "vermin"]);
  });

  it("follows nested traits transitively", () => {
    State.immunities = [cfg("spider", ["vermin", "web"]), cfg("vermin", ["mindSpells"])];
    expect(creatureTypeService.getCreatureTypes(creature(["spider"]))).toEqual(["vermin"]);
  });

  it("reads the creature's trait item immunities", () => {
    State.immunities = [cfg("undead")];
    expect(creatureTypeService.getCreatureTypes(creature([], ["undead", "cold"]))).toEqual([
      "undead",
    ]);
  });

  it("returns no type when none is declared", () => {
    State.immunities = [cfg("cat", ["infravision"])];
    expect(creatureTypeService.getCreatureTypes(creature(["cat"]))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (module not found)

Run: `npx vitest run lib/src/services/creature-type.service.test.ts`

- [ ] **Step 3: Implement**

`lib/config/creature-types.ts`:

```ts
import { ImmunityName } from "../src/model/final/immunity";

/**
 * D&D 3e creature types, declared on creatures as traits (data.immunities or their trait item).
 * Order is the display order of type tags. Subtypes/features (extraplanar, skeletal, incorporeal,
 * cat, spider...) are not types. A trait nested in another (spider -> vermin) means "is a".
 */
export const TYPE_TRAITS: readonly ImmunityName[] = [
  "aberration",
  "animal",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "giant",
  "magicalBeast",
  "monstrousHumanoid",
  "ooze",
  "outsider",
  "plant",
  "undead",
  "vermin",
];
```

`lib/src/services/creature-type.service.ts`:

```ts
import { TYPE_TRAITS } from "../../config/creature-types";
import { Creature } from "../model/creature/creature";
import { ImmunityName } from "../model/final/immunity";
import { State } from "../state";
import translationService from "./translation.service";

class CreatureTypeService {
  getCreatureTypes(creature: Creature): ImmunityName[] {
    const found = new Set<ImmunityName>();
    const visit = (name: ImmunityName) => {
      if (found.has(name)) return;
      found.add(name);
      const config = State.immunities.find((i) => i.name === name);
      for (const nested of config?.immunities ?? []) visit(nested);
    };
    for (const name of creature.data.immunities) visit(name);
    // Test fixtures built with `as unknown as Creature` may omit items.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    for (const item of (creature.items ?? []).filter((i) => i.trait)) {
      for (const name of item.immunities) visit(name);
    }
    return TYPE_TRAITS.filter((t) => found.has(t));
  }

  getTypeName(type: ImmunityName): string {
    const config = State.immunities.find((i) => i.name === type);
    return translationService.fromOptional(config?.stringRef);
  }
}

const creatureTypeService = new CreatureTypeService();
export default creatureTypeService;
```

`immunity-config.ts`, append to `TRAITS` (match the surrounding entries' shape):

```ts
  {
    name: "aberration",
    type: "trait",
    docOnly: true,
    stringRef: "doc.types.aberration.name",
    description: "doc.types.aberration.desc",
  },
  {
    name: "animal",
    type: "trait",
    docOnly: true,
    stringRef: "doc.types.animal.name",
    description: "doc.types.animal.desc",
  },
  {
    name: "dragon",
    type: "trait",
    docOnly: true,
    stringRef: "doc.types.dragon.name",
    description: "doc.types.dragon.desc",
  },
  {
    name: "monstrousHumanoid",
    type: "trait",
    docOnly: true,
    stringRef: "doc.types.monstrousHumanoid.name",
    description: "doc.types.monstrousHumanoid.desc",
  },
  {
    name: "outsider",
    type: "trait",
    docOnly: true,
    stringRef: "doc.types.outsider.name",
    description: "doc.types.outsider.desc",
  },
```

Check `descriptionService.generateImmunity` returns early for these (they have `description`), so
no custom translation is minted. Nothing to change there.

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run lib/src/services/creature-type.service.test.ts lib/src/services/state.service.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/config/creature-types.ts lib/config/immunity-config.ts lib/src/model/final/immunity.ts lib/src/services/creature-type.service.ts lib/src/services/creature-type.service.test.ts
git commit -m "feat: creature types as 3e type traits"
```

---

### Task 5: `EntryEnum` and `addEntry`

**Files:**

- Create: `lib/creatures/entry.ts`
- Modify: `lib/src/model/creature/creature.ts` (field next to `family!: MonsterFamilyEnum;`, line 48)
- Modify: `lib/src/model/creature/family.ts` (new method after `addCreature`, line 225)
- Test: `lib/src/model/creature/family.test.ts` (create if absent; follow the closest existing
  family test for constructing a minimal `CreatureFamily` subclass)

**Interfaces:**

- Produces: `enum EntryEnum`; `ENTRY_NAMES: Record<EntryEnum, TranslationKey>`;
  `Creature.entry?: EntryEnum`; `CreatureFamily.addEntry(id: EntryEnum, builders: (() => T)[]): void`.

- [ ] **Step 1: Write the failing test**

```ts
it("addEntry registers each builder in order and stamps the entry, even on a failed build", () => {
  const family = new TestFamily(); // minimal subclass used by this test file
  const a = { id: 1, entry: undefined } as unknown as Creature;
  const b = { id: 2, entry: undefined } as unknown as Creature;
  const addCreature = vi.spyOn(family, "addCreature").mockImplementation((build) => {
    family.creatures.push(build());
  });
  family.addEntry(EntryEnum.Vampire, [() => a, () => b]);
  expect(addCreature).toHaveBeenCalledTimes(2);
  expect(family.creatures.map((c) => c.id)).toEqual([1, 2]);
  expect(a.entry).toBe(EntryEnum.Vampire);
  expect(b.entry).toBe(EntryEnum.Vampire);
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run lib/src/model/creature/family.test.ts`

- [ ] **Step 3: Implement**

`lib/creatures/entry.ts`:

```ts
import { TranslationKey } from "../translations/i18n";

/**
 * Monster entries: one monster in several versions (rank, age or size), as in a monster book.
 * Only multi-member entries are listed; a creature without entry is its own single-member entry.
 * Ids are stable: they will name entry-owned resources (see the monster entries roadmap).
 */
export enum EntryEnum {
  Basilisk = 1,
  ClayGolem = 2,
  Ghoul = 3,
  Mummy = 4,
  Shadow = 5,
  StoneGolem = 6,
  Vampire = 7,
  Wyvern = 8,
  Zombie = 9,
}

export const ENTRY_NAMES: Record<EntryEnum, TranslationKey> = {
  [EntryEnum.Basilisk]: "doc.entry.basilisk",
  [EntryEnum.ClayGolem]: "doc.entry.clayGolem",
  [EntryEnum.Ghoul]: "doc.entry.ghoul",
  [EntryEnum.Mummy]: "doc.entry.mummy",
  [EntryEnum.Shadow]: "doc.entry.shadow",
  [EntryEnum.StoneGolem]: "doc.entry.stoneGolem",
  [EntryEnum.Vampire]: "doc.entry.vampire",
  [EntryEnum.Wyvern]: "doc.entry.wyvern",
  [EntryEnum.Zombie]: "doc.entry.zombie",
};
```

`creature.ts`, after `family!: MonsterFamilyEnum;`:

```ts
  /** Monster entry this creature is a version of (docs grouping); unset = its own entry. */
  entry?: EntryEnum;
```

`family.ts`, after `addCreature`:

```ts
  /**
   * Registers the versions of one monster (an entry), in order: members are documented and
   * installed in this order, so a base creature goes before variants that reuse its resources.
   */
  addEntry(id: EntryEnum, builders: (() => T)[]) {
    for (const build of builders) {
      const countBefore = this.creatures.length;
      this.addCreature(build);
      // addCreature keeps a creature whose build threw (valid = false) when create() ran, so
      // stamp whatever it pushed.
      for (const creature of this.creatures.slice(countBefore)) creature.entry = id;
    }
  }
```

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/creatures/entry.ts lib/src/model/creature/creature.ts lib/src/model/creature/family.ts lib/src/model/creature/family.test.ts
git commit -m "feat: monster entries (EntryEnum, addEntry)"
```

---

### Task 6: Declare entries and docs-only types; verify output

**Files:**

- Modify: `lib/creatures/basilisks.ts:72-73`, `lib/creatures/golems.ts:496-500`,
  `lib/creatures/wyvern.ts:67-69`, `lib/creatures/undead/family.ts:34-63`
- Modify (add a docOnly type to `data.immunities`; keep existing entries): see table

| File                          | Creatures                                                                                                                      | Add                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `bears.ts`                    | all 5 bears                                                                                                                    | `"animal"`            |
| `cats.ts`                     | Cheetah, Giant Lynx, Jaguar, Leopard, Lion, Mountain Lion, Spotted Lion, Wild Tiger (**not** Displacer Beast, **not** Hellcat) | `"animal"`            |
| `cats.ts`                     | Hellcat                                                                                                                        | `"outsider"`          |
| `dogs.ts`                     | Wild Dog, War Dog                                                                                                              | `"animal"`            |
| `wolves.ts`                   | Wolf, Dire Wolf                                                                                                                | `"animal"`            |
| `snakes.ts`                   | Giant Poisonous Snake                                                                                                          | `"animal"`            |
| `crawlers.ts`, `ettercaps.ts` | Carrion Crawler, Ettercap                                                                                                      | `"aberration"`        |
| `minotaurs.ts`                | Minotaur                                                                                                                       | `"monstrousHumanoid"` |
| `wyvern.ts`                   | Wyvern, Baby Wyvern, Greater Wyvern                                                                                            | `"dragon"`            |

A creature built with `createFrom` inherits its source's immunities: check whether the source
already got the type before adding it again.

- [ ] **Step 1: Declare entries**

`basilisks.ts`:

```ts
this.addEntry(EntryEnum.Basilisk, [() => this.lesser(), () => this.greater()]);
```

`golems.ts` (Clay first, since its variants reuse its resources):

```ts
this.addCreature(() => this.flesh());
this.addCreature(() => this.sand());
this.addEntry(EntryEnum.ClayGolem, [
  () => this.clay(),
  () => this.lesserClay(),
  () => this.greaterClay(),
]);
this.addEntry(EntryEnum.StoneGolem, [() => this.stone(), () => this.lesserStone()]);
this.addCreature(() => this.iron());
```

(keep the remaining lines as they are)

`wyvern.ts`:

```ts
this.addEntry(EntryEnum.Wyvern, [() => this.wyvern(), () => this.baby(), () => this.greater()]);
```

`undead/family.ts`: replace the matching `addCreature` lines:

```ts
this.addEntry(EntryEnum.Ghoul, [() => ghoul(this), () => ghoulLord(this)]);
this.addCreature(() => ghast(this));
this.addEntry(EntryEnum.Mummy, [() => mummy(this), () => greaterMummy(this)]);
this.addEntry(EntryEnum.Shadow, [() => shadow(this), () => greaterShadow(this)]);
```

and

```ts
this.addEntry(EntryEnum.Zombie, [() => zombie(this), () => zombieLord(this)]);
this.addCreature(() => jujuZombie(this));
this.addCreature(() => seaZombie(this));
```

and replace the 7 vampire lines with

```ts
this.addEntry(EntryEnum.Vampire, [
  () => fledglingVampire(this),
  () => matureVampire(this),
  () => oldVampire(this),
  () => veryOldVampire(this),
  () => ancientVampire(this),
  () => eminentVampire(this),
  () => patriarchVampire(this),
]);
```

Import `EntryEnum` from `lib/creatures/entry.ts` (relative path) in each file.

- [ ] **Step 2: Add the docOnly types** per the table above.

- [ ] **Step 3: Typecheck and test**

Run: `npx tsc -p . --noEmit && npx vitest run lib/src`
Expected: no type errors. Tests pass except the known pre-existing `pipeline.golden.test.ts`
failures.

- [ ] **Step 4: Verify output**

```bash
MANIFEST_OUT=$SCRATCH/after-entries.txt npx vitest run lib/src/services/output-manifest.tmp.test.ts
diff $SCRATCH/before.txt $SCRATCH/after-entries.txt
```

Expected differing paths: **only** `docs/monsters.html` and `lib/pnp-monster/undead/main.tpa`.
Confirm `main.tpa` is a pure reorder:

```bash
MANIFEST_COPY_FILE=lib/pnp-monster/undead/main.tpa MANIFEST_COPY_TO=$SCRATCH/main-after.tpa MANIFEST_OUT=/dev/null npx vitest run lib/src/services/output-manifest.tmp.test.ts
diff <(sort mod/lib/pnp-monster/undead/main.tpa) <(sort $SCRATCH/main-after.tpa)
```

(If the committed `mod/` copy is stale, take the "before" copy with `git stash` instead, per the
harness notes.) Expected: no output from the sorted diff. Any other differing file (`generated.tra`,
`immunities.tpa`, a creature tpa) is a bug: a numbered translation key or a non-skipped docOnly
trait.

- [ ] **Step 5: Commit**

```bash
git add lib/creatures
git commit -m "feat: declare monster entries and 3e types for docs"
```

---

### Task 7: Card parts and omissions

Rebuild a card from keyed parts so callers can omit parts. With no omissions the card must render
as today, except that the stat grid becomes compact (no template whitespace).

**Files:**

- Create: `lib/src/services/doc/card-parts.ts`
- Modify: `lib/templates/monster.html`
- Modify: `lib/src/services/doc/documentation.service.ts` (`addCreature` 236-291,
  `getCreatureAttacks` 322-366, `getCreatureTraits` 596-634, `getTraitItemHtml` 1192-1211,
  `getCreatureSpells` 1213-1225)
- Test: `lib/src/services/doc/documentation.service.test.ts`

**Interfaces:**

- Produces (card-parts.ts):

```ts
export interface CardPart {
  /** Identity for "common to all" comparison: equal keys = same thing on two creatures. */
  key: string;
  html: string;
}

export interface WeaponPart extends CardPart {
  /** Key of the weapon without its enchantment (index-scoped). */
  descKey: string;
  /** Weapon rendered without the enchantment (for the shared box). */
  descHtml: string;
  /** Card body when only the enchantment differs. */
  enchantHtml: string;
}

export interface CardParts {
  stats: CardPart[]; // key `stat:<label>=<value>`, html `<div class="stat ...">...</div>`
  scores: CardPart[]; // key `score:<STR>=<value>`, html `STR 18/76`
  weapons: WeaponPart[];
  traitLinks: CardPart[]; // key `trait:<name>`, html `<a href="#name" class="trait-link">...</a>`
  traitLines: CardPart[]; // key `traitLine:<html>`: trait item lines, immunity entries, hide in shadows
  abilities: (CardPart & { ability: CreatureAbility })[]; // key `ability:<html with id prefix removed>`
}

export type CardOmissions = ReadonlySet<string>;
```

- Produces (DocumentationService): `getCardParts(creature: Creature): CardParts`;
  `addCreature(creature: Creature, omit: CardOmissions = new Set(), typeTags = "")`;
  `renderStats(parts: CardParts, omit: CardOmissions): string`;
  `renderWeapons(parts: CardParts, omit: CardOmissions): string`;
  `renderTraits(parts: CardParts, omit: CardOmissions): string`;
  `renderAbilities(creature: Creature, parts: CardParts, omit: CardOmissions): string`.
  `getCreatureAttacks/getCreatureTraits/getCreatureSpells(template, creature)` keep their
  signatures (used by existing tests) and delegate to parts + render with an empty omission set.

- [ ] **Step 1: Write the failing tests** (in `documentation.service.test.ts`, reusing
      `fakeCreatureForAddCreature`)

```ts
describe("card omissions", () => {
  it("omits a stat whose key is omitted", () => {
    const creature = fakeCreatureForAddCreature(false);
    documentationService.addCreature(creature, new Set(["stat:Morale=12"]));
    const html = service.monsters.at(-1) ?? "";
    expect(html).not.toContain("<dt>Morale</dt>");
    expect(html).toContain("<dt>Armor Class</dt>");
  });

  it("lists only the scores that are not omitted", () => {
    documentationService.addCreature(
      fakeCreatureForAddCreature(false),
      new Set(["score:CON=14", "score:WIS=10"]),
    );
    expect(service.monsters.at(-1)).toContain(
      '<div class="stat stat-wide"><dt>Ability Scores</dt><dd>STR 18, DEX 12, INT 10, CHA 10</dd></div>',
    );
  });

  it("omits the Ability Scores stat when every score is omitted", () => {
    const omit = new Set(
      ["STR=18", "DEX=12", "CON=14", "INT=10", "WIS=10", "CHA=10"].map((s) => `score:${s}`),
    );
    documentationService.addCreature(fakeCreatureForAddCreature(false), omit);
    expect(service.monsters.at(-1)).not.toContain("Ability Scores");
  });

  it("renders the stat grid compactly with no omission", () => {
    documentationService.addCreature(fakeCreatureForAddCreature(false));
    expect(service.monsters.at(-1)).toContain('<div class="stat"><dt>Armor Class</dt><dd>');
  });
});
```

Add a weapon test using the existing weapon fixtures in this file (search for a test that puts a
weapon in `State.items` with `doc: true` and a `description`, e.g. near the "By weapon" test at line
1983). Build a description containing `Enchantment: 3`:

```ts
it("renders only the enchantment when the weapon description is omitted", () => {
  // fixture: one equipped weapon with description lines ["Bite", "", "Melee damage: 1D6 (Piercing)", "Enchantment: 3"]
  const parts = documentationService.getCardParts(creatureWithWeapon);
  expect(parts.weapons[0].descKey).toMatch(/^weaponDesc:0:/);
  documentationService.addCreature(creatureWithWeapon, new Set([parts.weapons[0].descKey]));
  const html = service.monsters.at(-1) ?? "";
  expect(html).toContain('<div class="weapon">Enchantment +3</div>');
  expect(html).not.toContain("1D6");
});
```

Add a traits test: a creature with immunities `["undead"]` (trait config with stringRef) and the
omission `trait:undead` renders no `Traits` section. Add an abilities test: with the omission
built from `getCardParts(c).abilities[0].key`, the abilities section is gone.

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`

- [ ] **Step 3: Implement**

`monster.html`: replace the whole `<dl class="stat-grid"> ... </dl>` block with
`<dl class="stat-grid">{{stats}}</dl>`, change the first line to
`<div class="creature" id="{{id}}" data-types="{{types}}">`, and add `{{typeTags}}` on the line
after `{{header}}`.

`documentation.service.ts`:

```ts
  getCardParts(creature: Creature): CardParts {
    return {
      stats: this.getStatParts(creature),
      scores: this.getScoreParts(creature),
      weapons: this.getWeaponParts(creature),
      ...this.getTraitParts(creature),
      abilities: this.getAbilityParts(creature),
    };
  }

  private getScoreParts(creature: Creature): CardPart[] {
    const d = creature.data;
    const str = d.exceptionalStrength ? `${d.strength}/${d.exceptionalStrength}` : `${d.strength}`;
    const scores: [string, string | number][] = [
      ["STR", str],
      ["DEX", d.dexterity],
      ["CON", d.constitution],
      ["INT", d.intelligence],
      ["WIS", d.wisdom],
      ["CHA", d.charisma],
    ];
    return scores.map(([k, v]) => ({ key: `score:${k}=${v}`, html: `${k} ${v}` }));
  }

  private getStatParts(creature: Creature): CardPart[] {
    const stat = (label: string, value: string | number, cls = "stat") => ({
      key: `stat:${label}=${value}`,
      html: `<div class="${cls}"><dt>${label}</dt><dd>${value}</dd></div>`,
    });
    const d = creature.data;
    const parts = [
      stat("Hit Dice", `${d.level1.pnpValue} (${this.getDisplayHp(creature) ?? 0} hp)`),
      stat("Armor Class", creatureService.getFinalArmorClass(creature)),
      stat("THAC0", `${d.thac0 ?? ""}`),
      stat("Attacks per Round", this.getEffectiveApr(creature)),
      stat("Movement", d.movement.pnpValue),
      stat("Morale", d.morale),
      stat("Alignment", this.formatEnumLabel(d.alignment)),
      stat("Size", d.size.value),
    ];
    // XP Value is omitted when 0/unset (a detected summon has xpv 0).
    if (d.xpv) parts.push(stat("XP Value", d.xpv));
    if (d.kit) parts.push(stat("Kit", this.formatEnumLabel(d.kit)));
    const special = this.getSpecialText(creature);
    if (special) parts.push(stat("Special", special, "stat stat-half"));
    return parts;
  }

  renderStats(parts: CardParts, omit: CardOmissions): string {
    const scores = parts.scores.filter((p) => !omit.has(p.key)).map((p) => p.html);
    const scoreStat = scores.length
      ? `<div class="stat stat-wide"><dt>Ability Scores</dt><dd>${scores.join(", ")}</dd></div>`
      : "";
    return scoreStat + parts.stats.filter((p) => !omit.has(p.key)).map((p) => p.html).join("");
  }
```

Check the exact original order and types of each stat against the current template (Hit Dice,
Armor Class, THAC0, Attacks per Round, Movement, Morale, Alignment, Size, XP, Kit, Special) and the
types of `thac0`/`size` in `MainCreatureData`; adjust the value expressions to match what
`addCreature` passes today. Extract `addSpecial`'s text building into
`private getSpecialText(creature: Creature): string` (returns `""` when none) and make `addSpecial`
use it, so its existing tests keep passing.

Weapons: move the body of the `for` loop in `getCreatureAttacks` into `getWeaponParts`:

```ts
  private getWeaponParts(creature: Creature): WeaponPart[] {
    const parts: WeaponPart[] = [];
    let weaponIndex = 0;
    const dualWielding = creature.attack.dualWielding;
    const mainHandAttacks = this.getEffectiveApr(creature) - (dualWielding ? 1 : 0);
    for (const equippedItem of creature.data.items.equipped) {
      const weapon = itemService.isEquippedWeapon(equippedItem)
        ? State.items.find((i) => i.file === equippedItem.file)
        : undefined;
      if (!weapon?.doc) continue;
      const description = translationService.fromOptional(weapon.description);
      const idPrefix = `m${creature.id}-w${weaponIndex}`;
      const label = dualWielding ? this.getWeaponSlotLabel(equippedItem, mainHandAttacks) : "";
      const proficiency = this.getWeaponProficiencyLabel(weapon.proficiency, creature.data.proficiencies);
      const render = (desc: string) => {
        const entries: { id: string; html: string }[] = [];
        const text = this.getAttackDisplayText(desc, entries, idPrefix);
        const popovers = entries
          .map((e) => `<div class="spell-popover-entry" id="${e.id}" hidden>${e.html}</div>`)
          .join("");
        return { text, html: `<div class="weapon">${label}${text}${proficiency}</div>${popovers}` };
      };
      const full = render(description);
      const withoutEnchantment = render(description.replace(/^Enchantment: \d+\r?\n?/m, ""));
      const enchantment = /^Enchantment: (\d+)$/m.exec(description)?.[1];
      // The id prefix is per creature: drop it so the same weapon compares equal across members.
      const descKey = `weaponDesc:${weaponIndex}:${withoutEnchantment.html.split(idPrefix).join("")}`;
      parts.push({
        key: `weapon:${weaponIndex}:${full.html.split(idPrefix).join("")}`,
        html: full.html,
        descKey,
        descHtml: withoutEnchantment.html,
        enchantHtml: `<div class="weapon">${label}${enchantment ? `Enchantment +${enchantment}` : "No enchantment"}</div>`,
      });
      weaponIndex++;
    }
    return parts;
  }

  renderWeapons(parts: CardParts, omit: CardOmissions): string {
    return parts.weapons
      .filter((w) => !omit.has(w.key))
      .map((w) => (omit.has(w.descKey) ? w.enchantHtml : w.html))
      .join("<hr/>");
  }
```

`getCreatureAttacks(template, creature, omit: CardOmissions = new Set())`: build
`let attacks = this.renderWeapons(this.getCardParts(creature), omit)` (or reuse already-built
parts), keep the existing `By weapon` / `None` fallbacks **only when the creature has no weapon
parts at all** (not when all are omitted), then `this.replace(template, "attacks", attacks)`.
When all weapon parts are omitted, render no Attacks section: make `monster.html` hold `{{attacks}}`
without its wrapper (`<div class="detail-section"><h4>Attacks</h4>` moves into the code and is only
emitted when the value is non-empty). Update `getBaseCard`'s sub-template, which wraps
`{{attacks}}` itself (line 712), so it doesn't double-wrap: give it the same wrapped value.

Traits: split `getTraitItemHtml` into

```ts
  private getTraitItemLines(item: Item): string[] { /* the current map(...) result, before join */ }
  private getTraitItemHtml(item: Item, changed = false): string {
    const html = this.getTraitItemLines(item).join("");
    return changed ? `<div class="adjustment-changed">${html}</div>` : html;
  }
```

and build trait parts from the body of `getCreatureTraits`:

```ts
  private getTraitParts(creature: Creature): Pick<CardParts, "traitLinks" | "traitLines"> {
    const immunities = creature.data.immunities
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter((name) => !creature.autoImmunities?.includes(name))
      .map((name) => State.immunities.find((i) => i.name === name))
      .filter((i): i is ImmunityConfig => i !== undefined);
    const traitLinks = immunities
      .filter((i) => i.type === "trait")
      .map((i) => ({
        key: `trait:${i.name}`,
        html: `<a href="#${i.name}" class="trait-link">${translationService.fromOptional(i.stringRef)}</a>`,
      }));
    const lines: string[] = [];
    for (const equippedItem of creature.data.items.equipped) {
      const item = State.items.find((i) => i.file === equippedItem.file);
      if (item?.trait) lines.push(...this.getTraitItemLines(item));
    }
    for (const immunity of immunities.filter((i) => i.type !== "trait")) {
      const text = translationService.fromOptional(immunity.stringRef);
      lines.push(immunity.description ? `<h5><a href="#${immunity.name}" class="trait-link">${text}</a></h5>` : text);
    }
    const hide = this.getHideInShadowsTrait(creature.data.hideShadow);
    if (hide) lines.push(hide);
    return { traitLinks, traitLines: lines.map((html) => ({ key: `traitLine:${html}`, html })) };
  }

  renderTraits(parts: CardParts, omit: CardOmissions): string {
    const links = parts.traitLinks.filter((p) => !omit.has(p.key)).map((p) => p.html);
    let result = links.length ? `<h5>${links.join(", ")}</h5>` : "";
    result += parts.traitLines.filter((p) => !omit.has(p.key)).map((p) => p.html).join("");
    return result ? `<div class="detail-section"><h4>Traits</h4><div class="traits">${result}</div></div>` : "";
  }
```

`getCreatureTraits(template, creature, omit = new Set())` becomes
`this.replace(template, "traits", this.renderTraits(this.getCardParts(creature), omit))`.

Abilities:

```ts
  private getAbilityParts(creature: Creature): CardParts["abilities"] {
    return this.getResourceAbilities(creature)
      .map((ability, index) => {
        const idPrefix = `m${creature.id}-ability-${index}`;
        const html = this.getCreatureSpell(ability, creature.data.spells.memorized, idPrefix);
        return { ability, html, key: `ability:${html.split(idPrefix).join("")}` };
      })
      .filter((p) => p.html);
  }

  renderAbilities(creature: Creature, parts: CardParts, omit: CardOmissions): string {
    return this.renderAbilitiesSection(
      `m${creature.id}`,
      parts.abilities.filter((p) => !omit.has(p.key)),
    );
  }
```

`getCreatureSpells(template, creature, omit = new Set())` replaces `abilities` with
`this.renderAbilities(creature, this.getCardParts(creature), omit)`.

`addCreature(creature, omit: CardOmissions = new Set(), typeTags = "")`: compute
`const parts = this.getCardParts(creature)` once; replace `id`, `types` (space-separated
`creatureTypeService.getCreatureTypes(creature)`), `header` (via `getCreatureHeader`), `typeTags`,
`stats` (`renderStats`), and pass `omit` to the three section methods (give them an optional
`parts` parameter so parts are built once). Remove the old per-stat `replace` calls.

- [ ] **Step 4: Run all doc tests, expect PASS**

Run: `npx vitest run lib/src/services/doc`
Fix existing assertions that relied on the old multi-line stat grid **only** if they were
whitespace-specific (the `\s*` regexes at lines 71/77 already tolerate it). Do not change what any
existing test asserts semantically.

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/doc lib/templates/monster.html
git commit -m "refactor: build creature cards from keyed parts with omissions"
```

---

### Task 8: Common parts of an entry (pure)

**Files:**

- Create: `lib/src/services/doc/entry-common.ts`
- Test: `lib/src/services/doc/entry-common.test.ts`

**Interfaces:**

- Consumes: `CardParts` (Task 7).
- Produces: `getCommonKeys(members: CardParts[]): Set<string>`: keys present in **every** member
  (stats, scores, weapon `key` and `descKey`, trait links, trait lines, abilities). Returns an empty
  set for fewer than 2 members.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { CardParts } from "./card-parts";
import { getCommonKeys } from "./entry-common";

const parts = (
  p: Partial<Record<keyof CardParts, string[]>>,
  weapons: [string, string][] = [],
): CardParts => ({
  stats: (p.stats ?? []).map((key) => ({ key, html: key })),
  scores: (p.scores ?? []).map((key) => ({ key, html: key })),
  traitLinks: (p.traitLinks ?? []).map((key) => ({ key, html: key })),
  traitLines: (p.traitLines ?? []).map((key) => ({ key, html: key })),
  abilities: [],
  weapons: weapons.map(([key, descKey]) => ({
    key,
    descKey,
    html: key,
    descHtml: descKey,
    enchantHtml: "",
  })),
});

describe("getCommonKeys", () => {
  it("keeps only keys every member has", () => {
    const common = getCommonKeys([
      parts({ stats: ["stat:AC=1", "stat:Morale=16"], scores: ["score:CON=18", "score:STR=18"] }),
      parts({ stats: ["stat:AC=1", "stat:Morale=15"], scores: ["score:CON=18", "score:STR=19"] }),
    ]);
    expect([...common].sort()).toEqual(["score:CON=18", "stat:AC=1"]);
  });

  it("shares a weapon description when only the enchantment differs", () => {
    const common = getCommonKeys([
      parts({}, [["weapon:0:a+3", "weaponDesc:0:a"]]),
      parts({}, [["weapon:0:a+4", "weaponDesc:0:a"]]),
    ]);
    expect(common.has("weaponDesc:0:a")).toBe(true);
    expect(common.has("weapon:0:a+3")).toBe(false);
  });

  it("does not share weapons when counts differ", () => {
    const common = getCommonKeys([parts({}, [["weapon:0:a", "weaponDesc:0:a"]]), parts({})]);
    expect(common.size).toBe(0);
  });

  it("requires every member, not most", () => {
    const common = getCommonKeys([
      parts({ traitLinks: ["trait:undead"] }),
      parts({ traitLinks: ["trait:undead"] }),
      parts({}),
    ]);
    expect(common.has("trait:undead")).toBe(false);
  });

  it("returns nothing for a single member", () => {
    expect(getCommonKeys([parts({ stats: ["stat:AC=1"] })]).size).toBe(0);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run lib/src/services/doc/entry-common.test.ts`

- [ ] **Step 3: Implement**

```ts
import { CardParts } from "./card-parts";

function keysOf(parts: CardParts): Set<string> {
  return new Set([
    ...parts.stats.map((p) => p.key),
    ...parts.scores.map((p) => p.key),
    ...parts.weapons.flatMap((w) => [w.key, w.descKey]),
    ...parts.traitLinks.map((p) => p.key),
    ...parts.traitLines.map((p) => p.key),
    ...parts.abilities.map((p) => p.key),
  ]);
}

/** Keys of the parts every member of an entry has ("Common to all"). */
export function getCommonKeys(members: CardParts[]): Set<string> {
  if (members.length < 2) return new Set();
  const [first, ...rest] = members.map(keysOf);
  return new Set([...first].filter((key) => rest.every((keys) => keys.has(key))));
}
```

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/doc/entry-common.ts lib/src/services/doc/entry-common.test.ts
git commit -m "feat: compute parts common to all entry members"
```

---

### Task 9: Collect-then-render: entries, shared box, sidebar, toolbar

**Files:**

- Modify: `lib/src/services/doc/documentation.service.ts` (`families` field, `generate`,
  `getFamilyDivider`, `getFamilyMenu`, `addFamily`)
- Modify: `lib/templates/index.html` (`<ul>{{families}}</ul>` → `<ul>{{entries}}</ul>`; insert
  `{{typeFilter}}` right after `</header>` of `.intro`)
- Test: `lib/src/services/doc/documentation.service.test.ts` (update the `describe("addFamily")`
  block at line 659; add `describe("entries")`)

**Interfaces:**

- Consumes: `getCardParts`, `renderStats/renderWeapons/renderTraits/renderAbilities`,
  `addCreature(creature, omit, typeTags)` (Task 7); `getCommonKeys` (Task 8);
  `creatureTypeService` (Task 4); `ENTRY_NAMES`, `Creature.entry` (Task 5).
- Produces: `addFamily(family)` collects valid creatures (and indexes files);
  `renderEntries()` fills `monsters`, `sidebar` and `typeFilter`, called by `generate()`.

- [ ] **Step 1: Write the failing tests**

Use a small fake family and `vi.spyOn(translationService, "from")` to return readable names, as
the existing `addFamily` tests do. Example:

```ts
describe("entries", () => {
  it("renders entries A-Z across families, members in declaration order", () => {
    // family 1: Zombie (entry Zombie: zombie id 86, zombie lord id 142); family 2: Ankheg (id 1, no entry)
    documentationService.addFamily(fakeFamily([zombie, zombieLord]));
    documentationService.addFamily(fakeFamily([ankheg]));
    service.renderEntries();
    const html = service.monsters.join("");
    expect(html.indexOf('id="m1"')).toBeLessThan(html.indexOf('id="e9"'));
    expect(html.indexOf('id="m86"')).toBeLessThan(html.indexOf('id="m142"'));
    expect(service.sidebar.join("")).toContain("<summary>Zombie</summary>");
  });

  it("puts common parts in the entry box and omits them from member cards", () => {
    // two members with identical Morale and different HD
    service.renderEntries();
    const html = service.monsters.join("");
    const box = html.slice(html.indexOf('class="entry-shared"'), html.indexOf('class="creature"'));
    expect(box).toContain("<dt>Morale</dt>");
    expect(html.slice(html.indexOf('class="creature"'))).not.toContain("<dt>Morale</dt>");
  });

  it("skips invalid members when computing common parts", () => {
    // member 3 invalid with a different Morale: Morale still common, member 3 not rendered
  });

  it("renders each popover id once", () => {
    // two members sharing an ability with a popover: count occurrences of id="m<firstId>-ability-0"
    const html = service.monsters.join("");
    expect(html.match(/id="m86-ability-0-desc"/g)?.length).toBe(1);
  });

  it("renders a single-member entry as a plain card with its type tags", () => {
    // ankheg with magicalBeast: card contains class="type-tag" data-type="magicalBeast"
  });

  it("renders the type filter with All and one chip per present type", () => {
    expect(service.typeFilter).toContain('data-type="">All');
    expect(service.typeFilter).toContain('data-type="undead"');
  });
});
```

Fill each commented test body with fixtures following the pattern of the first two (the fixtures
are plain `as unknown as Creature` objects like `fakeCreatureForAddCreature`, plus `entry`,
`valid: true`, and `data.immunities`).

Update the existing `addFamily` tests (lines 659-731): after `addFamily(...)`, call
`service.renderEntries()` before asserting on `service.monsters`.
Add `renderEntries(): void; sidebar: string[]; typeFilter: string;` to the
`DocumentationServicePrivate` interface at the top of the test file.

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`

- [ ] **Step 3: Implement**

Fields: replace `private families: string[] = [];` with

```ts
  private collected: Creature[] = [];
  private sidebar: string[] = [];
  private typeFilter = "";
```

Delete `getFamilyDivider` and `getFamilyMenu`.

`addFamily`:

```ts
  addFamily(family: Family) {
    for (const creature of family.creatures) {
      // A creature whose builder threw is kept with valid=false (see CreatureFamily.addCreature):
      // skip it rather than crash the documentation pass on one bad creature.
      if (!creature.valid) continue;
      this.collected.push(creature);
      this.indexCreatureFiles(creature);
    }
  }
```

`generate()`: call `this.renderEntries();` first, then replace the template tokens `entries`
(`this.sidebar.join("")`), `typeFilter`, `monsters` as before.

```ts
  renderEntries() {
    this.monsters = [];
    this.sidebar = [];
    const groups = new Map<string, Creature[]>();
    for (const creature of this.collected) {
      const key = creature.entry !== undefined ? `e${creature.entry}` : `m${creature.id}`;
      groups.set(key, [...(groups.get(key) ?? []), creature]);
    }
    const entries = [...groups.values()].map((members) => ({
      members,
      name:
        members[0].entry !== undefined
          ? translationService.from(ENTRY_NAMES[members[0].entry])
          : translationService.from(members[0].name),
    }));
    entries.sort((a, b) => a.name.localeCompare(b.name));
    const typeCounts = new Map<ImmunityName, number>();
    for (const { members, name } of entries) {
      const types = members.map((m) => creatureTypeService.getCreatureTypes(m));
      for (const t of types.flat()) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
      if (members.length === 1) this.renderSingleEntry(members[0], types[0]);
      else this.renderMultiEntry(name, members, types);
      this.sidebar.push(this.getEntryMenu(name, members, types));
    }
    this.typeFilter = this.getTypeFilter(typeCounts);
  }

  private getTypeTags(types: ImmunityName[]): string {
    if (!types.length) return "";
    const tags = types
      .map((t) => `<a href="#" class="type-tag" data-type="${t}">${creatureTypeService.getTypeName(t)}</a>`)
      .join("");
    return `<div class="type-tags">${tags}</div>`;
  }

  private renderSingleEntry(creature: Creature, types: ImmunityName[]) {
    logService.withSection(creature, `Documenting ${translationService.from(creature.name)}...`, () => {
      this.addCreature(creature, new Set(), this.getTypeTags(types));
    });
  }

  private renderMultiEntry(name: string, members: Creature[], types: ImmunityName[][]) {
    const parts = members.map((m) => this.getCardParts(m));
    const common = getCommonKeys(parts);
    const allTypes = TYPE_TRAITS.filter((t) => types.some((ts) => ts.includes(t)));
    const entryId = `e${members[0].entry}`;
    const label = members.length === 1 ? "member" : "members";
    this.monsters.push(
      `<section class="entry-block" id="${entryId}" data-types="${allTypes.join(" ")}">` +
        `<div class="entry-header"><h2>${name}</h2>${this.getTypeTags(allTypes)}` +
        `<span class="entry-count">${members.length} ${label}</span></div>` +
        this.getSharedBox(members[0], parts[0], common),
    );
    for (const member of members) {
      logService.withSection(member, `Documenting ${translationService.from(member.name)}...`, () => {
        this.addCreature(member, common);
      });
    }
    this.monsters.push(`</section>`);
  }

  // The "Common to all" box shows the first member's rendering of each common part. Its popover
  // ids are the first member's, which is safe: that member's card omits the same parts.
  private getSharedBox(first: Creature, parts: CardParts, common: ReadonlySet<string>): string {
    if (!common.size) return "";
    const only = <T extends CardPart>(list: T[]) => list.filter((p) => common.has(p.key));
    const shared: CardParts = {
      stats: only(parts.stats),
      scores: only(parts.scores),
      traitLinks: only(parts.traitLinks),
      traitLines: only(parts.traitLines),
      abilities: only(parts.abilities),
      weapons: parts.weapons
        .filter((w) => common.has(w.descKey))
        .map((w) => (common.has(w.key) ? w : { ...w, html: w.descHtml })),
    };
    const none = new Set<string>();
    const stats = this.renderStats(shared, none);
    const weapons = this.renderWeapons(shared, none);
    return (
      `<div class="entry-shared"><div class="entry-shared-label">Common to all</div>` +
      (stats ? `<dl class="stat-grid">${stats}</dl>` : "") +
      (weapons ? `<div class="detail-section"><h4>Attacks</h4>${weapons}</div>` : "") +
      this.renderTraits(shared, none) +
      this.renderAbilities(first, shared, none) +
      `</div>`
    );
  }

  private getEntryMenu(name: string, members: Creature[], types: ImmunityName[][]): string {
    const item = (c: Creature, ts: ImmunityName[]) =>
      `<li data-types="${ts.join(" ")}"><a href="#m${c.id}">${translationService.from(c.name)}</a></li>`;
    if (members.length === 1) return item(members[0], types[0]);
    const links = members.map((m, i) => item(m, types[i])).join("");
    return `<li class="family entry"><details><summary>${name}</summary><ul>${links}</ul></details></li>`;
  }

  private getTypeFilter(counts: Map<ImmunityName, number>): string {
    const chips = TYPE_TRAITS.filter((t) => counts.has(t))
      .map((t) => ({ t, name: creatureTypeService.getTypeName(t) }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ t, name }) => `<button type="button" class="type-chip" data-type="${t}">${name} <span>${counts.get(t)}</span></button>`)
      .join("");
    return (
      `<div class="type-filter-bar"><span class="type-filter-label">Filter by type</span>` +
      `<div class="type-chips"><button type="button" class="type-chip on" data-type="">All</button>${chips}</div></div>`
    );
  }
```

Imports: `ENTRY_NAMES` (`../../../creatures/entry`), `TYPE_TRAITS` (`../../../config/creature-types`),
`ImmunityName` (`../../model/final/immunity`), `creatureTypeService` (`../creature-type.service`),
`getCommonKeys` (`./entry-common`), `CardPart, CardParts` (`./card-parts`). Remove the unused
`MonsterFamilyEnum` and `Family` imports only if nothing else uses them.

- [ ] **Step 4: Run, expect PASS**

Run: `npx vitest run lib/src/services/doc`

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/doc lib/templates/index.html
git commit -m "feat: docs grouped by monster entries with common box and type filter"
```

---

### Task 10: Front-end: styles and type filter

**Files:**

- Modify: `mod/docs/monsters.css` (append)
- Modify: `mod/docs/monsters.js` (new `initTypeFilter`, called next to `initFileSearch()` at line 513)

- [ ] **Step 1: Styles** (append to `monsters.css`; tokens from `main.css`)

```css
/* Monster entries (one monster in several versions) and type filter */
.entry-block {
  margin: 1.5rem 0;
}
.entry-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-gold);
  padding-bottom: 0.25rem;
}
.entry-header h2 {
  font-family: var(--font-heading);
  margin: 0;
  color: var(--color-red);
}
.entry-count {
  font-style: italic;
  color: var(--color-ink-soft);
}
.entry-shared {
  margin: 0.75rem 0 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-panel);
  border-left: 4px solid var(--color-gold);
  border-radius: 4px;
}
.entry-shared-label {
  font-family: var(--font-heading);
  font-size: 0.85em;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
  margin-bottom: 0.25rem;
}
.type-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.type-tag {
  font-size: 0.8em;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  background: var(--color-red);
  color: #fff;
  text-decoration: none;
}
.type-filter-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--color-panel);
  border-bottom: 1px solid var(--color-gold);
}
.type-filter-label {
  font-family: var(--font-heading);
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink-soft);
}
.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.type-chip {
  font-family: var(--font-body);
  font-size: 0.8em;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--color-ink-soft);
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-ink);
  cursor: pointer;
}
.type-chip span {
  opacity: 0.6;
}
.type-chip.on {
  background: var(--color-red);
  border-color: var(--color-red);
  color: #fff;
}
```

Check whether `.site-nav` or `.topbar` is sticky in `main.css`; if so set `.type-filter-bar`'s
`top` to that header's height so the bar sticks below it.

- [ ] **Step 2: Filter script** (add to `monsters.js`, same IIFE style as the other `init*`)

```js
// Type filter (toolbar chips + type tags on entry/card titles). One active type at a time; ""
// shows everything. Cards and sidebar links carry data-types; an entry block or sidebar group is
// hidden when none of its members match.
function initTypeFilter() {
  var has = function (el, type) {
    return (
      !type || (" " + (el.getAttribute("data-types") || "") + " ").indexOf(" " + type + " ") !== -1
    );
  };
  function apply(type) {
    document.querySelectorAll(".type-chip").forEach(function (chip) {
      chip.classList.toggle("on", chip.getAttribute("data-type") === type);
    });
    document.querySelectorAll(".content .creature").forEach(function (card) {
      card.hidden = !has(card, type);
    });
    document.querySelectorAll(".entry-block").forEach(function (block) {
      block.hidden = !Array.prototype.some.call(block.querySelectorAll(".creature"), function (c) {
        return !c.hidden;
      });
    });
    document.querySelectorAll(".sidebar li[data-types]").forEach(function (li) {
      li.hidden = !has(li, type);
    });
    document.querySelectorAll(".sidebar li.entry").forEach(function (group) {
      var visible = Array.prototype.some.call(
        group.querySelectorAll("li[data-types]"),
        function (li) {
          return !li.hidden;
        },
      );
      group.hidden = !visible;
      if (type && visible) group.querySelector("details").open = true;
    });
  }
  document.querySelectorAll(".type-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      apply(chip.getAttribute("data-type"));
    });
  });
  document.querySelectorAll(".type-tag").forEach(function (tag) {
    tag.addEventListener("click", function (e) {
      e.preventDefault();
      apply(tag.getAttribute("data-type"));
      window.scrollTo(0, 0);
    });
  });
}
```

Call `initTypeFilter();` after `initFileSearch();`.

- [ ] **Step 3: Regenerate and look**

Run: `npm run generate`, open `mod/docs/monsters.html` in a browser. Check:

- the Vampire entry shows the shared box and reduced cards;
- the Undead chip leaves Spider showing only Wraith Spider;
- an entry block disappears when no member matches;
- popovers in the shared box open;
- "All" restores everything.

- [ ] **Step 4: Commit**

```bash
git add mod/docs/monsters.css mod/docs/monsters.js
git commit -m "feat: docs type filter and entry styles"
```

---

### Task 11: Gameplay changes for six creatures

**Files:**

- Modify: `lib/creatures/cats.ts` (Displacer Beast, `immunities: ["cat"]` around line 834)
- Modify: `lib/creatures/dogs.ts` (Spectral Hound `create` at line 303; Moon Dog `addTrait` line 444;
  Hell Hound `addTrait` line 497)
- Modify: `lib/creatures/wolves.ts` (Dread Wolf `addTrait` line 445; Vampiric Wolf `addTrait` line 540)

Rules (from the spec):

- An **itemless** trait (`extraplanar`, docOnly `outsider`) goes in `data.immunities`.
- An **item** trait (`undead`, `magicalBeast`) is nested into the creature's existing trait item
  (`addTrait` immunities) when it has one, which keeps one item. Otherwise it goes in
  `data.immunities`.
- Remove immunities the added trait already provides (`undead` provides `mindSpells`, which
  provides `charm`, `hold`, `sleep`... see `lib/config/immunity-config.ts` `undead` and
  `mindSpells` entries).

- [ ] **Step 1: Apply**

| Creature        | Change                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Displacer Beast | `immunities: ["cat"]` → `immunities: ["magicalBeast", "backstab"]`                                                                                 |
| Spectral Hound  | add `immunities: ["magicalBeast"]` to its `create` data (it has no `addTrait`)                                                                     |
| Dread Wolf      | `addTrait` immunities `["coldSpells", "cold", "lightningResistance", "charm", "hold"]` → `["undead", "coldSpells", "cold", "lightningResistance"]` |
| Vampiric Wolf   | `addTrait` immunities `["sleep", "charm", "hold", "nonSilverNonMagicalWeapons"]` → `["undead", "nonSilverNonMagicalWeapons"]`                      |
| Hell Hound      | add `"outsider", "extraplanar"` to its `create` data `immunities` (create the array if absent)                                                     |
| Moon Dog        | add `"outsider", "extraplanar"` to its `create` data `immunities`                                                                                  |

Before editing the two wolves, confirm `sleep` is covered: read the `undead` entry (it lists
`sleep` directly) and the `mindSpells` entry (`charm`, `hold`...). If any removed name turns out
not to be covered, keep it.

- [ ] **Step 2: Generate and check the log**

Run: `npm run generate`, then `grep -nE "error|Error|warn" generator.log | grep -iE "displacer|spectral|dread|vampiric|hell hound|moon dog|slot"`
Expected: no slot conflict or "Override existing trait" warnings for these six creatures.

- [ ] **Step 3: Verify output scope**

```bash
MANIFEST_OUT=$SCRATCH/after-gameplay.txt npx vitest run lib/src/services/output-manifest.tmp.test.ts
diff $SCRATCH/after-entries.txt $SCRATCH/after-gameplay.txt
```

Expected differing paths: `docs/monsters.html`, and the generated files of these six creatures
only. Look them up by id: Displacer Beast `cat/26.tpa` (0x26), Spectral Hound `dog/27.tpa` (0x27),
Moon Dog `dog/7a.tpa` (0x7a), Hell Hound `dog/7b.tpa` (0x7b), Dread Wolf `wolf/16.tpa` (0x16),
Vampiric Wolf `wolf/15.tpa` (0x15), plus their `jam<id>*.baf`. `generated.tra` may change only if
an item description changed for these creatures' trait items. If many unrelated files differ,
check `generator.log` for a creature that failed to build (see the harness notes).
Note: Displacer Beast and Spectral Hound get Magical Beast hit dice (d10, `hp.ts`), so their HP
changes: expected.

- [ ] **Step 4: Commit**

```bash
git add lib/creatures/cats.ts lib/creatures/dogs.ts lib/creatures/wolves.ts
git commit -m "feat: 3e types for displacer beast, spectral hound, hell hound, moon dog, dread and vampiric wolves"
```

---

### Task 12: Final verification and cleanup

- [ ] **Step 1: Full checks**

```bash
npx tsc -p . --noEmit
npx vitest run
npx eslint lib/src/services/doc lib/src/services/creature-type.service.ts lib/src/services/translation.service.ts lib/src/services/weidu lib/src/services/state.service.ts lib/config/creature-types.ts lib/config/immunity-config.ts lib/creatures lib/translations lib/src/model
npx prettier --check lib mod/docs/monsters.js mod/docs/monsters.css
```

Expected: tsc clean; tests pass except the known pre-existing golden-test failures (report them,
don't hide them); eslint clean on these files.

- [ ] **Step 2: Regenerate the committed mod**

Run: `npm run generate`. Commit the regenerated `mod/` (docs and the files from Tasks 6 and 11).

```bash
git add mod
git commit -m "chore: regenerate mod"
```

- [ ] **Step 3: Remove the harness and update the roadmap**

Delete `lib/src/services/output-manifest.tmp.test.ts`. In
`docs/superpowers/specs/2026-10-16-monster-entries-roadmap.md`, mark sub-project 1 ✅.

```bash
git add docs/superpowers/specs/2026-10-16-monster-entries-roadmap.md
git commit -m "docs: sub-project 1 done"
```

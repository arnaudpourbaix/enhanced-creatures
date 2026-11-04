# Shared Natural Weapons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One `Creature.addNaturalWeapon(kind, options)` with a kind table, used by the 18 existing
natural-weapon helpers. Generated mod byte-identical.

**Architecture:** A kind table (`lib/config/natural-weapons.ts`) holds the damage type and default
icon per kind. `addNaturalWeapon` builds a `PartialWeapon` from the table and the options, and calls
the existing `this.addWeapon({ weapon, castSpells, grab })`. The 18 helpers keep their names and
signatures; their bodies become one call.

**Tech Stack:** TypeScript, vitest.

**Spec:** `docs/superpowers/specs/2026-10-17-shared-natural-weapons-design.md`

## Global Constraints

- Generated mod output **byte-identical**: zero differing files in the manifest, `docs/` included.
- Translation keys, speeds, slots, icons, ids, item creation order: unchanged.
- Helper names and signatures unchanged; no call site edited.
- `addNaturalWeapon` must never put an explicit `undefined` key into the weapon or its header (an
  `undefined` can override a default in `itemService.getItem`): only set keys whose option is
  defined.
- Scoped lint (`npx eslint <changed files>`) and `npx tsc -p . --noEmit` clean. Prettier: check via
  `tr -d '\r' < file | npx prettier --stdin-filepath file --check` (CRLF working copies make plain
  `--check` fail spuriously).

## Review Focus

- A helper whose old body called `addItem` directly (cat paws, ogre fists, plant branch) now goes
  through `addWeapon`: identical only with no cast spell and no grab. Covered by the manifest.
- `slot: null` vs old `equippedSlot: undefined` / `[]`: `getItem` defaults both to `[]`. Covered by the
  manifest.
- Undead claws keep the `Ghoul` icon (not the `claws` default). Covered by the manifest.
- Basilisk jaws keep `monster.spider.weapon.jaws` as their name key (it's what the code uses today).
- Spider cast-spell order: poison first, then the explicit cast spells. Test in Task 2.

---

### Task 1: Manifest harness and baseline

**Files:** Create (untracked, never committed): `lib/src/services/output-manifest.tmp.test.ts`

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
// Optional MANIFEST_COPY_FILE (relative to the generated root) + MANIFEST_COPY_TO copies one file out.
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
  fs.copyFileSync(
    path.join(MOD_ROOT, "enhanced_creatures.tp2"),
    path.join(tmp, "enhanced_creatures.tp2"),
  );
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

- [ ] **Step 2: Baseline from the clean tree**

Run: `MANIFEST_OUT=$SCRATCH/nw-before.txt npx vitest run lib/src/services/output-manifest.tmp.test.ts`
(`$SCRATCH` = the session scratchpad directory). Expected: PASS, ~350 lines.

No commit.

---

### Task 2: Kind table and `addNaturalWeapon`

**Files:**

- Create: `lib/config/natural-weapons.ts`
- Modify: `lib/src/model/creature/creature.ts` (new method after the `addWeapon` override, ~line 205)
- Test: `lib/src/model/creature/creature.test.ts`

**Interfaces:**

- Produces:

```ts
export type NaturalWeaponKind = "jaws" | "claws" | "fists" | "touch" | "stinger" | "pseudopod" | "branch";
export const NATURAL_WEAPONS: Record<NaturalWeaponKind, { damageType: AbilityDamageTypeEnum; icon: string }>;

export interface NaturalWeaponOptions {
  stringRef: StringReference;
  diceThrown: number;
  diceSize: number;
  speed: number;
  /** Default "WEAPON1"; null = not equipped. */
  slot?: ItemSlot | null;
  id?: number;
  icon?: string;
  damageType?: AbilityDamageTypeEnum;
  damageBonus?: number;
  effects?: Effect[];
  range?: number;
  projectile?: string;
  animationSwing?: { overhand: number; backhand: number; thrust: number };
  immunities?: ImmunityName[];
  doc?: boolean;
  castSpells?: WeaponCastSpell[];
  poison?: { poisonType: PnPPoisonType; saveBonus?: number };
  grab?: CreatureGrabConfig;
}
// Creature:
addNaturalWeapon(kind: NaturalWeaponKind, options: NaturalWeaponOptions): Weapon
```

Match the real types of `id` (item id), `icon` (it is `MonsterItemIconEnum` or a string resref in
`PartialWeapon`: use the same type as `PartialWeapon["icon"]`), `stringRef` (`PartialWeapon["stringRef"]`)
and `projectile` by reading `PartialWeapon` / `ItemHeader` in `lib/src/model/spell-item/spell-item.ts`.

- [ ] **Step 1: Write the failing tests** (in `creature.test.ts`, reusing its `fakeCreature()`)

```ts
describe("addNaturalWeapon", () => {
  it("applies the kind defaults", () => {
    const creature = fakeCreature();
    const weapon = creature.addNaturalWeapon("jaws", {
      stringRef: "monster.bear.weapon.jaws",
      diceThrown: 1,
      diceSize: 6,
      speed: 3,
    });
    expect(weapon.icon).toBe(MonsterItemIconEnum.Jaws);
    expect(weapon.header.damageType).toBe(AbilityDamageTypeEnum.Piercing);
    expect(weapon.header.type).toBe(ItemAbilityTypeEnum.Melee);
    expect(weapon.header.abilityflags).toContain(ItemAbilityFlagEnum.AddStrengthBonus);
    expect(weapon.header.speed).toBe(3);
  });

  it("lets options override icon and damage type", () => {
    const weapon = fakeCreature().addNaturalWeapon("claws", {
      stringRef: "monster.undead.weapon.claws",
      diceThrown: 1,
      diceSize: 4,
      speed: 5,
      icon: MonsterItemIconEnum.Ghoul,
      damageType: AbilityDamageTypeEnum.Crushing,
    });
    expect(weapon.icon).toBe(MonsterItemIconEnum.Ghoul);
    expect(weapon.header.damageType).toBe(AbilityDamageTypeEnum.Crushing);
  });

  it("equips WEAPON1 by default and nothing with slot null", () => {
    const creature = fakeCreature();
    const base = {
      stringRef: "monster.bear.weapon.jaws",
      diceThrown: 1,
      diceSize: 6,
      speed: 3,
    } as const;
    expect(creature.addNaturalWeapon("jaws", base).equippedSlot).toEqual(["WEAPON1"]);
    expect(creature.addNaturalWeapon("jaws", { ...base, slot: null }).equippedSlot).toEqual([]);
    expect(creature.addNaturalWeapon("jaws", { ...base, slot: "SHIELD" }).equippedSlot).toEqual([
      "SHIELD",
    ]);
  });

  it("casts the poison spell before the explicit cast spells", () => {
    const creature = fakeCreature();
    const spy = vi
      .spyOn(poisonService, "getSpell")
      .mockReturnValue({ spell: "POISON" } as WeaponCastSpell);
    const addWeapon = vi.spyOn(creature, "addWeapon");
    creature.addNaturalWeapon("jaws", {
      stringRef: "monster.spider.weapon.jaws",
      diceThrown: 1,
      diceSize: 6,
      speed: 2,
      poison: { poisonType: "A", saveBonus: 2 },
      castSpells: [{ spell: "OTHER" } as WeaponCastSpell],
    });
    expect(spy).toHaveBeenCalledWith({ poisonType: "A", saveBonus: 2 });
    expect(addWeapon.mock.calls[0][0].castSpells?.map((c) => c.spell)).toEqual(["POISON", "OTHER"]);
  });

  it("passes grab through and sets no undefined keys", () => {
    const creature = fakeCreature();
    const addWeapon = vi.spyOn(creature, "addWeapon").mockReturnValue({} as Weapon);
    const grab = { probability: 50 } as unknown as CreatureGrabConfig;
    creature.addNaturalWeapon("jaws", {
      stringRef: "monster.dog.weapon.jaws",
      diceThrown: 1,
      diceSize: 6,
      speed: 3,
      grab,
    });
    const arg = addWeapon.mock.calls[0][0];
    expect(arg.grab).toBe(grab);
    expect(Object.values(arg.weapon).includes(undefined)).toBe(false);
    expect(Object.values(arg.weapon.header).includes(undefined)).toBe(false);
  });
});
```

Use a real `PnPPoisonType` value for `"A"` (read the type in `effect.enums.ts`), and a valid
`CreatureGrabConfig` shape if the cast does not typecheck. Adapt imports/mocks to what
`fakeCreature()` supports (if `addWeapon` needs more creature state to run unmocked, mock it as in the
last test).

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run lib/src/model/creature/creature.test.ts`

- [ ] **Step 3: Implement**

`lib/config/natural-weapons.ts`:

```ts
import { AbilityDamageTypeEnum } from "../src/model/spell-item/effect.enums";
import { MonsterItemIconEnum } from "./item";

/**
 * Natural weapon kinds and their defaults (see Creature.addNaturalWeapon). Everything that varies
 * per creature (name key, speed, slot...) is an option, not a default. Paws are the claws kind.
 */
export type NaturalWeaponKind =
  "jaws" | "claws" | "fists" | "touch" | "stinger" | "pseudopod" | "branch";

export const NATURAL_WEAPONS: Record<
  NaturalWeaponKind,
  { damageType: AbilityDamageTypeEnum; icon: MonsterItemIconEnum }
> = {
  jaws: { damageType: AbilityDamageTypeEnum.Piercing, icon: MonsterItemIconEnum.Jaws },
  claws: { damageType: AbilityDamageTypeEnum.Slashing, icon: MonsterItemIconEnum.Wolf },
  fists: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Fist },
  touch: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Fist },
  stinger: { damageType: AbilityDamageTypeEnum.Piercing, icon: MonsterItemIconEnum.Wolf },
  pseudopod: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Jelly },
  branch: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Golem },
};
```

(check where `AbilityDamageTypeEnum` is exported from by reading an existing import, e.g. in
`lib/creatures/bears.ts`.)

`creature.ts`, after the `addWeapon` override:

```ts
  /**
   * Adds a natural weapon (jaws, claws, fists...): kind defaults from NATURAL_WEAPONS, everything
   * creature-specific from the options. Only defined options are set, so item defaults still apply.
   */
  addNaturalWeapon(kind: NaturalWeaponKind, o: NaturalWeaponOptions): Weapon {
    const defaults = NATURAL_WEAPONS[kind];
    const slot = o.slot === undefined ? "WEAPON1" : o.slot;
    const defined = <T extends object>(obj: T) =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
    const castSpells = [
      ...(o.poison ? [poisonService.getSpell(o.poison)] : []),
      ...(o.castSpells ?? []),
    ];
    return this.addWeapon({
      weapon: defined({
        id: o.id,
        stringRef: o.stringRef,
        icon: o.icon ?? defaults.icon,
        equippedSlot: slot === null ? [] : [slot],
        immunities: o.immunities,
        doc: o.doc,
        header: defined({
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: o.diceThrown,
          diceSize: o.diceSize,
          damageBonus: o.damageBonus,
          damageType: o.damageType ?? defaults.damageType,
          speed: o.speed,
          range: o.range,
          projectile: o.projectile,
          animationSwing: o.animationSwing,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: o.effects,
        }),
      }),
      castSpells,
      grab: o.grab,
    });
  }
```

Export `NaturalWeaponOptions` from `creature.ts` (or a small types file next to it if `creature.ts`
already separates types). `poisonService` is `lib/src/services/effects/poison.service.ts`.

- [ ] **Step 4: Run, expect PASS**; then `npx tsc -p . --noEmit`, `npx eslint lib/config/natural-weapons.ts lib/src/model/creature/creature.ts`.

- [ ] **Step 5: Commit**

```bash
git add lib/config/natural-weapons.ts lib/src/model/creature/creature.ts lib/src/model/creature/creature.test.ts
git commit -m "feat: Creature.addNaturalWeapon with natural weapon kinds"
```

---

### Task 3: Route the 18 helpers through `addNaturalWeapon`

**Files:** `lib/creatures/basilisks.ts`, `bears.ts`, `cats.ts`, `dogs.ts`, `golems.ts`,
`ogres/ogre-creature.ts`, `plants.ts`, `slimes.ts`, `snakes.ts`, `spiders.ts`,
`undead/undead-creature.ts`, `wolves.ts`, `wyvern.ts`.

Keep every helper's name, parameters and return. Replace only its body. Values below are copied
from today's bodies; keep them exact. Remove imports that become unused.

| Helper                                                                  | Body                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| basilisks `createJaws(p)`                                               | `addNaturalWeapon("jaws", { stringRef: "monster.spider.weapon.jaws", diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 5, slot: p.slot ?? "WEAPON1", castSpells: p.castSpell ? [p.castSpell] : undefined })`                                                                                                                                 |
| bears `createPaws(diceThrown, diceSize, hug)`                           | `addNaturalWeapon("claws", { stringRef: "monster.bear.weapon.claws", diceThrown, diceSize, speed: 5, castSpells: [<the existing hug cast spell object, unchanged>] })`                                                                                                                                                                            |
| bears `createJaws(diceThrown, diceSize)`                                | `addNaturalWeapon("jaws", { stringRef: "monster.bear.weapon.jaws", diceThrown, diceSize, speed: 3, slot: "SHIELD" })`                                                                                                                                                                                                                             |
| cats `createPaws(p)`                                                    | keep the `amount`/`effects` computation; then `addNaturalWeapon("claws", { stringRef: "monster.cat.weapon.claws", id: p.id, slot: p.id === undefined ? "WEAPON1" : null, diceThrown: p.diceThrown * 2, diceSize: p.diceSize, speed: 5, effects })`                                                                                                |
| cats `createJaws(diceThrown, diceSize)`                                 | `addNaturalWeapon("jaws", { stringRef: "monster.cat.weapon.jaws", diceThrown, diceSize, speed: 3, slot: "SHIELD" })`                                                                                                                                                                                                                              |
| dogs `createJaws(p)`                                                    | `addNaturalWeapon("jaws", { stringRef: "monster.dog.weapon.jaws", diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 3, castSpells: p.castSpell ? [p.castSpell] : undefined, grab: p.grab })`                                                                                                                                                 |
| golems `createFists({...})`                                             | `addNaturalWeapon("fists", { stringRef: "monster.golem.weapon.fists", diceThrown, diceSize, speed: 4, damageType, effects, castSpells: castSpell ? [castSpell] : undefined })`                                                                                                                                                                    |
| ogre `createFists(p)`                                                   | `addNaturalWeapon("fists", { stringRef: "monster.ogre.weapon.fists", id: p.id, slot: (p.equipped ?? true) ? "WEAPON1" : null, diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 3 })`                                                                                                                                                        |
| plants `createBranch(diceThrown, diceSize, equip = false)`              | `addNaturalWeapon("branch", { stringRef: "monster.plant.weapon.branch", diceThrown, diceSize, speed: 8, range: 5, slot: equip ? "WEAPON1" : null })`                                                                                                                                                                                              |
| slimes `createPseudopod(p)`                                             | `addNaturalWeapon("pseudopod", { stringRef: "monster.slime.weapon.pseudopod", id: p.id, diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 4, range: 5, animationSwing: { backhand: 100, overhand: 0, thrust: 0 }, projectile: "ACIDBLMU", effects: p.effects, castSpells: p.castSpell ? [p.castSpell] : undefined })`                        |
| snakes `createJaws(p)`                                                  | `addNaturalWeapon("jaws", { stringRef: "monster.snake.weapon.jaws", diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 3, poison: p.poisonType ? { poisonType: p.poisonType, saveBonus: p.saveBonus } : undefined })`                                                                                                                         |
| spiders `createJaws(p)`                                                 | `addNaturalWeapon("jaws", { stringRef: "monster.spider.weapon.jaws", diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 2, slot: p.slot ?? "WEAPON1", doc: p.doc ?? true, immunities: p.immunities, effects: p.effects, poison: p.poisonType ? { poisonType: p.poisonType, saveBonus: p.saveBonus } : undefined, castSpells: p.castSpells })` |
| undead `createTouch(p)`                                                 | `addNaturalWeapon("touch", { stringRef: "monster.undead.weapon.touch", diceThrown: p.diceThrown, diceSize: p.diceSize, damageBonus: p.damageBonus, speed: 3, effects: p.effects, slot: p.slot ?? null })`                                                                                                                                         |
| undead `createClaws(p)`                                                 | `addNaturalWeapon("claws", { stringRef: "monster.undead.weapon.claws", icon: MonsterItemIconEnum.Ghoul, diceThrown: p.diceThrown, diceSize: p.diceSize, damageBonus: p.damageBonus, speed: 5, effects: p.effects, slot: (p.equipped ?? true) ? "WEAPON1" : null, castSpells: p.castSpell ? [p.castSpell] : undefined })`                          |
| undead `createJaws(diceThrown, diceSize, castSpells?, slot = "SHIELD")` | `addNaturalWeapon("jaws", { stringRef: "monster.undead.weapon.jaws", diceThrown, diceSize, speed: 3, slot, castSpells })`                                                                                                                                                                                                                         |
| wolves `createJaws(p)`                                                  | `addNaturalWeapon("jaws", { stringRef: "monster.wolf.weapon.jaws", diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 3, slot: p.slot ?? "WEAPON1", castSpells: p.castSpells })`                                                                                                                                                              |
| wyvern `createStinger(p)`                                               | `addNaturalWeapon("stinger", { stringRef: "monster.wyvern.weapon.stinger", id: Ids.Stinger, diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 3, poison: { poisonType: p.poisonType, saveBonus: p.saveBonus } })`                                                                                                                            |
| wyvern `createJaws(p)`                                                  | `addNaturalWeapon("jaws", { stringRef: "monster.wyvern.weapon.jaws", id: Ids.Jaws, diceThrown: p.diceThrown, diceSize: p.diceSize, speed: 2, slot: "SHIELD" })`                                                                                                                                                                                   |

Before editing each helper, compare its current body with the row (the table was written from a read
of the code; if a value differs, the code wins: keep today's value and note it).

- [ ] **Step 1: Apply the table** (each body: `return this.addNaturalWeapon(...)`).

- [ ] **Step 2: Typecheck, lint, tests**

Run: `npx tsc -p . --noEmit`; `npx eslint <the 13 files>` (report pre-existing errors, fix only new
ones); `npx vitest run` (known pre-existing failure: `lib/src/services/pipeline.golden.test.ts`, and
the harness when `MANIFEST_OUT` is unset).

- [ ] **Step 3: Byte-identical check**

```bash
MANIFEST_OUT=$SCRATCH/nw-after.txt npx vitest run lib/src/services/output-manifest.tmp.test.ts
diff $SCRATCH/nw-before.txt $SCRATCH/nw-after.txt && echo IDENTICAL
```

Expected: `IDENTICAL`. If a file differs, copy it out before/after (`MANIFEST_COPY_FILE`/
`MANIFEST_COPY_TO`; for "before", `git switch --detach <base>` then back) and diff it to find the
field that moved; fix the helper or `addNaturalWeapon` (never by editing generated files), re-run.

- [ ] **Step 4: Commit**

```bash
git add lib/creatures
git commit -m "refactor: natural weapon helpers use addNaturalWeapon"
```

---

### Task 4: Final checks and cleanup

- [ ] **Step 1:** `npx tsc -p . --noEmit`, `npx vitest run`, scoped eslint on the branch's changed `.ts`
      files, Prettier via stdin (see Global Constraints) on changed files.
- [ ] **Step 2:** `npm run generate`; `git status --short mod` must show **no** changes (byte-identical).
- [ ] **Step 3:** Delete `lib/src/services/output-manifest.tmp.test.ts`. In
      `docs/superpowers/specs/2026-10-16-monster-entries-roadmap.md`, mark sub-project 2 ✅ (heading
      marker ◐ → ✅) and commit:

```bash
git add docs/superpowers/specs/2026-10-16-monster-entries-roadmap.md
git commit -m "docs: sub-project 2 done"
```

# Baneguard Defensive Blink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Baneguard's (Bladed Skeleton) defensive Blink ability — closing the `// TODO: Blink, 4 rounds duration on a 14 rounds timer` gap at `lib/creatures/undead.ts:2068` — using opcode 222 (`EffectTypeEnum.TeleportField`).

**Architecture:** A fully self-contained innate ability minted via `Creature.addSpell()`, following the exact wiring pattern the Blink Dog already uses (`lib/creatures/dogs.ts`'s `createBlink()`): the spell is minted with its own `ability` config, then that config is pulled back into the creature's AI behavior via `this.ability(id)` inside `setBehavior({ abilities: [...] })`. The engine's own `CHANGE_SPELL ... renew=14` mechanism (`SpellOptions.renew`) handles the 14-round recast cadence, so no extra script-side timer is needed.

**Tech Stack:** TypeScript generator (`ts-node`) that emits WeiDU `.baf`/`.tpa`/`.tra` mod source; Vitest for tests; no new dependencies.

## Global Constraints

- `maxRange: 10` for the `TeleportField` effect (confirmed value, per the approved design spec).
- Melee-engagement trigger range: `5` (confirmed value, per the approved design spec).
- Duration: `4 * Durations.round` seconds active per cast; recast every `renew: 14` rounds.
- Design spec: `docs/superpowers/specs/2026-07-16-baneguard-blink-design.md` — this plan implements it exactly; consult it for the "why" behind any field.

---

### Task 1: Implement and wire Baneguard's Blink ability

**Files:**
- Modify: `lib/creatures/undead.ts:12-39` (add `EffectTargetEnum` import)
- Modify: `lib/creatures/undead.ts:49-68` (add `Blink` to the `Ids` enum)
- Modify: `lib/creatures/undead.ts:2032-2098` (`baneguard()` — remove the TODO comment, mint the spell, wire it into behavior)
- Modify: `lib/translations/en/monster.ts:415-418` (add the `blink` ability name key)
- Regenerated (not hand-edited, produced by Step 6 below): `lib/pnp-monster/undead/*.baf`/`*.tpa` (whichever files correspond to Baneguard — confirm via the diff in Step 7), `docs/monsters.html`, `tra/*/generated.tra`

**Interfaces:**
- Consumes: `EffectTypeEnum.TeleportField` (`lib/src/model/spell-item/effect.type.ts:142`), `TeleportFieldEffect` (`lib/src/model/spell-item/effect.ts:441`, fields `opcode`, `target`, `timing`, `duration`, `maxRange`), `ItemSpellHeader.speed?: number` (`lib/src/model/spell-item/spell-item.ts:148`), `SpellOptions.renew?: number` (`lib/src/model/spell-item/spell-item.ts:102`), `AbstractCreature.addSpell()`/`AbstractCreature.ability()` (`lib/src/model/creature/abstract-creature.ts:57,70`).
- Produces: nothing consumed by later tasks — this is the terminal code change. Task 2 only touches `TODO_ROADMAP.md` prose.

- [ ] **Step 1: Add the `EffectTargetEnum` import**

In `lib/creatures/undead.ts`, the `effect.enums` import block (starts at line 12) is missing `EffectTargetEnum`, which the new effect needs for `target: EffectTargetEnum.Self`. Insert it alphabetically between `EffectStatisticModifierEnum` and `EffectTimingEnum`:

```ts
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
```

- [ ] **Step 2: Add `Blink` to the `Ids` enum**

In `lib/creatures/undead.ts:49-68`, insert `Blink,` alphabetically between `BansheeFearAura,` and `BonebatTouch,`:

```ts
enum Ids {
  AuraOfEvil,
  BansheeFearAura,
  Blink,
  BonebatTouch,
  CarrionStench,
  DeathWail,
  GhoulTouch,
  GhoulLordTouch,
  GhastTouch,
  GhostFearAura,
  GhostTouch,
  GhoulRottingDisease,
  GreaterMummyRottingDisease,
  GreaterMummyFearAura,
  MummyFearAura,
  MummyRottingDisease,
  SkeletonWarriorFearAura,
  SpecterTouch,
  WallOfIce,
}
```

(These are TS numeric enum values used only to key each creature's own `this.spells` array — inserting a new member shifts everyone else's numeric value, but that's harmless: each creature only ever compares its own ids against its own spell list, never across creatures or against a hardcoded number.)

- [ ] **Step 3: Add the translation key**

In `lib/translations/en/monster.ts`, the `undead.ability` object (starts at `monster.ts:409`) has no entry for Blink yet. Insert `blink: "Blink",` right after the `skeletonWarriorFearAura` block (`monster.ts:415-418`), before `deathWail`:

```ts
      skeletonWarriorFearAura: {
        name: "Fear Aura",
        description: `The mere sight of a skeleton warrior causes any creature with fewer than 5 Hit Dice to flee in panic.`,
      },
      blink: "Blink",
      deathWail: {
```

This is a plain string (not the `{ name, description }` shape used by the entries around it), matching `dog.ability.blink` (`monster.ts:96`) — both are full spells whose documentation is auto-generated from the spell/effect data, not hand-written `addTrait()` description text.

- [ ] **Step 4: Remove the TODO comment and mint the Blink spell**

In `lib/creatures/undead.ts`'s `baneguard()` method:

First, remove the TODO comment from the static `data.spells.memorized` list (`undead.ts:2065-2070`) — leave the array with just the Magic Missiles entry:

```ts
        spells: {
          memorized: [
            { file: SPELLS.Wizard.MagicMissiles.file, memorizedCount: 1 },
          ],
        },
```

(`Creature.addSpell()` automatically appends to this same `data.spells.memorized` array when `memorizedCount` is set — see `lib/src/model/creature/creature.ts`'s override — so Blink's entry will be added programmatically by Step 4's `addSpell()` call below, not listed here by hand.)

Then, right after `baneguard.addTrait({ immunities: ["skeletal"] });` (`undead.ts:2081-2083`) and before `baneguard.setBehavior({...})` (`undead.ts:2084`), insert:

```ts
    baneguard.addSpell({
      icon: SPELLS.Wizard.TeleportField.file,
      options: { renew: 14 },
      name: "monster.undead.ability.blink",
      id: Ids.Blink,
      memorizedCount: 1,
      headers: [
        {
          type: ItemAbilityTypeEnum.Magical,
          speed: 1,
          target: ItemAbilityTargetEnum.Caster,
          effects: [
            {
              opcode: EffectTypeEnum.TeleportField,
              target: EffectTargetEnum.Self,
              timing: EffectTimingEnum.InstantLimited,
              duration: 4 * Durations.round,
              maxRange: 10,
            },
          ],
        },
      ],
      ability: {
        spell: {},
        requireVocal: false,
        triggers: [{ name: "Range", params: ["NearestEnemyOf", 5] }],
      },
    });
```

- [ ] **Step 5: Wire the ability into Baneguard's AI behavior**

`addSpell()` alone only registers the spell resource — it doesn't make the AI actually try to cast it. Add `this.ability(Ids.Blink)` to the `abilities` array in `baneguard.setBehavior({...})` (`undead.ts:2084-2097`), alongside the existing Magic Missiles entry:

```ts
    baneguard.setBehavior({
      restHeal: true,
      abilities: [
        {
          preset: SPELLS.Wizard.MagicMissiles.file,
          spell: {
            type: "noDec",
          },
          triggers: [{ name: "Range", params: ["NearestEnemyOf", 10], negation: true }],
          requireVocal: false,
          timer: { name: "MagicMissiles", value: 18 },
        },
        this.ability(Ids.Blink),
      ],
    });
```

This exactly mirrors `dogs.ts`'s `blinkDog.createBlink(); ... blinkDog.setBehavior({ abilities: [this.ability(Ids.Blink)] });` pattern — `this.ability(id)` looks up the spell just added by its `id` and returns the `ability` object embedded in it (`AbstractCreature.ability()`, `abstract-creature.ts:57-61`).

- [ ] **Step 6: Type-check**

Run: `npm run build`
Expected: exits 0, no TypeScript errors.

- [ ] **Step 7: Confirm the change is observable — run the golden pipeline test and expect it to fail**

Run: `npx vitest run lib/src/services/pipeline.golden.test.ts`
Expected: **FAILS**, reporting mismatched files under `lib/pnp-monster/undead/`, `docs/monsters.html`, and the `tra/*/generated.tra` files. This confirms the code change actually altered generated output — if it passes here, something is wrong (the ability isn't wired in, or a translation/id typo prevented it from generating).

- [ ] **Step 8: Regenerate the real mod output**

Run: `npm run atweaks`
This overwrites the actual committed files (`lib/pnp-monster/undead/*.baf`/`*.tpa`, `docs/monsters.html`, `tra/*/generated.tra`) with freshly generated output — the same command used throughout `BUGFIX_ROADMAP.md`/`IMPROVEMENT_ROADMAP.md` for every content-changing fix.

- [ ] **Step 9: Review the diff — confirm only Baneguard-related output changed**

Run: `git status --short` then `git diff --stat`
Expected: changes limited to `lib/creatures/undead.ts`, `lib/translations/en/monster.ts`, Baneguard's specific `.baf`/`.tpa` file(s) under `lib/pnp-monster/undead/` (identify which by the diff — Baneguard's WeiDU files are `BDSKGR03`/`BDTEAM61`, but the generator's own output filenames follow an internal `ja#mXX`-style numbering, so confirm from the diff itself rather than guessing the name), `docs/monsters.html`, and all `tra/*/generated.tra` files (a single new custom translation shows up identically in every language file — expected, not a sign of a broader change, per `LINT_ROADMAP.md`'s note on this same pattern). If anything outside Baneguard changed, stop and investigate before continuing.

- [ ] **Step 10: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including `pipeline.golden.test.ts` (now green, since the committed output matches what Step 8 regenerated).

- [ ] **Step 11: Commit**

```bash
git add lib/creatures/undead.ts lib/translations/en/monster.ts lib/pnp-monster/undead docs/monsters.html tra
git commit -m "$(cat <<'EOF'
feat(generator): implement Baneguard's defensive Blink ability

Closes the TODO_ROADMAP.md gap using opcode 222 (TeleportField), the real
IE-engine Blink effect, as a self-contained innate ability rather than the
existing offensive SPWI421 preset (which targets enemies and risks an
array-merge collision if overridden per-creature). Recasts every 14 rounds
via the engine's own CHANGE_SPELL renew mechanism, triggered when an enemy
closes to melee range.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Close out the roadmap tracking entry

**Files:**
- Modify: `TODO_ROADMAP.md` (repo root)

**Interfaces:**
- Consumes: nothing from Task 1's code — purely documentation.
- Produces: nothing — terminal task.

- [ ] **Step 1: Mark the item resolved**

In `TODO_ROADMAP.md`, find:

```
- ☐ `undead.ts:1981` — a Blink effect (4-round duration, 14-round timer) isn't
  implemented. **Investigated:** `dogs.ts`'s `createBlink()` exists but isn't
  a reusable template - it's an aggressive teleport-strike-in-melee mechanic
  (Thac0 bonus + `Teleport` opcode targeting `FarthestEnemies`), whereas this
  wants a defensive self-buff (blink-out-of-harm status for a fixed duration
  on a cooldown). Needs its own design.
```

Replace it with:

```
- ✅ `undead.ts:1981` — Blink effect (4-round duration, 14-round timer)
  implemented as a self-contained innate ability using opcode 222
  (`EffectTypeEnum.TeleportField`), the real IE-engine Blink effect — full
  design in `docs/superpowers/specs/2026-07-16-baneguard-blink-design.md`.
  Recasts via the engine's own `CHANGE_SPELL renew=14` mechanism rather than
  a script-side timer.
```

(Note: the TODO comment this item tracks actually lives at `undead.ts:2068` in the current file, not `1981` — line numbers had drifted since the roadmap was last written; leave the stale line reference as-is here since that's how every other resolved entry in this file already works, or correct it to `2068` if you're touching the line anyway — either is fine.)

- [ ] **Step 2: Commit**

```bash
git add TODO_ROADMAP.md
git commit -m "$(cat <<'EOF'
docs(generator): mark Baneguard Blink TODO_ROADMAP item resolved

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

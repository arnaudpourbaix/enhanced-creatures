# TODO / FIXME Roadmap

Extracted from `eslint-plugin-sonarjs`'s `todo-tag`/`fixme-tag` scan (2026-07-13) —
47 hits total. Cataloged here instead of left as blocking lint errors, since most
of these need game/mod domain knowledge to triage, not a mechanical fix.
`sonarjs/todo-tag` and `sonarjs/fixme-tag` are off in `eslint.config.mjs`; this
file is the tracking mechanism instead. When one of these is resolved, remove
the source comment and check it off here.

Status legend: 🔴 reported broken · 🟡 missing mechanic/feature gap ·
🔵 needs investigation (unclear from the code alone) · ⚪ acknowledged low priority ·
☐ not started · ✅ resolved

---

## ✅ Reported broken (FIXME) — investigated, both resolved as "understood, won't fix from here"

### ✅ `damage-aoe-presets.ts:129` — FrostFingers doesn't work at all

Investigated: the preset is unused (its one reference, a mummy spellbook slot
in `undead.ts:1644`, is commented out and was replaced by `Command`). Traced
the generator's handling of the preset's `CheckStat(SCRIPTINGSTATE4)` trigger
end-to-end and confirmed it's correctly wired through to generated output —
not a bug in this codebase. **Confirmed by the maintainer: the underlying
Frost Fingers spell is broken in the Faiths & Powers mod itself.** Not
fixable from the generator side. Comment updated in place to say so; kept
(unused) for whenever FNP fixes it.

### ✅ `common.ts:9` — hunterCustomCode statements don't work properly

Investigated: `hunterCustomCode` itself is live (bears, jaguar, mountain
lion), but the two broken statement blocks were already commented out, so
nothing broken ships today. Ruled out a suspected typo (`MoveToSavedLocationn`
with a double "n") — it's a real, separately-documented WeiDU action in this
codebase's own reference table, identical to `MoveToSavedLocation`, not a
mistake. **Confirmed by the maintainer: not every creature sharing this
object should get this patrol behavior** — it would need to be per-creature/
conditional rather than baked into the shared `hunterCustomCode` object to be
re-enabled correctly, not a simple trigger-logic bug. Comment updated in
place to say so.

---

## 🟡 Missing mechanics / feature gaps (TODO)

- ✅ `cure-presets.ts:11` — was a real, live bug, not just an unfilled
  placeholder: `spell: {}` had no `selfTarget: true`, so `parseAbilitySpell()`
  defaulted the cast target to `ScriptTarget.lastSeen`. The fey using this
  preset (`feys.ts:463`) was casting Cure Light Wounds — triggered by its own
  HP dropping below 75% — at its last-seen target instead of itself. Fixed;
  confirmed via regenerated output: `ForceSpell(LastSeenBy(Myself),...)` →
  `ForceSpell(Myself,...)` in `fey/ja#m2c.baf` and `ja#m2csu.baf`.
- ☐ `slimes.ts:233` — black pudding's acid attack should also degrade the
  target's nonmagical armor by -1 AC per hit, cumulative, destroying it at AC 10.
  Not implemented. **Investigated:** no existing stacking/cumulative-penalty
  mechanic in this codebase to reuse - would need new design (likely a
  scripted-state-tracked cumulative `ArmorClassBonus` effect, since IE has no
  native "cumulative permanent AC penalty" opcode).
- ☐ `undead.ts:1042` — an attack that should age the target 10-40 years (1d4×10)
  isn't implemented. **Investigated:** no "age"/`SetAge`-equivalent opcode
  exists anywhere in this codebase's `EffectTypeEnum` model - implementing
  this means adding a brand-new opcode end-to-end (enum value, `Effect`
  subtype, WeiDU writer, docs/description generation), not just a creature
  tweak.
- ✅ `undead.ts:1981` — Blink effect (4-round duration, 14-round timer)
  implemented as a self-contained innate ability using opcode 222
  (`EffectTypeEnum.TeleportField`), the real IE-engine Blink effect — full
  design in `docs/superpowers/specs/2026-07-16-baneguard-blink-design.md`.
  Recasts via the engine's own `CHANGE_SPELL renew=14` mechanism rather than
  a script-side timer.
- ☐ `undead.ts:1639` — spellbook should vary by installed mod/component (SR,
  Faiths & Powers, ...); currently one fixed spellbook. Needs a mod-detection/
  conditional-spellbook mechanism that doesn't exist yet in this generator.
- ☐ `feys.ts:1092` — Quench Fire ability not implemented. Zero code exists,
  just the D&D 5e ritual description as a comment. No obvious IE-engine
  effect equivalent for "extinguish nonmagical fire in an area, counter
  magical fire from lower-level spells" - would need creative reinterpretation
  of what this even means in WeiDU/IE terms, not just a translation.
- ☐ `ability.factory.ts:18` — not a single ability: a design note for a whole
  "situational polymorph form selection" AI system (pick a form based on
  combat state - fleeing, melee, ranged). No creature currently uses this
  path. Substantial feature, not a quick addition.

---

## 🔵 Needs investigation (unclear without more context)

- 🔵 `spell-group.ts:54` — `// TODO: check these:` above 4 "SpellPack b6" and 3
  "IR/IRR" spell resource entries in the `blindness` spell-immunity group.
  **Partially resolved:** the actual game install this mod targets
  (`c:\Games\Baldur's Gate Enhanced Edition\`) has Item Revisions, Stratagems,
  Spell Revisions, and Faiths & Powers installed, giving real evidence to
  check against instead of guessing.
  - ✅ `wand19.spl` and `wand19d.spl` (IR/IRR) — confirmed real (both present
    in the live `override/` folder). Moved out of the TODO block.
  - ✅ `sppr313.spl` (SpellPack b6) — confirmed real (present in the live
    `override/`, plus Spell Revisions/Faiths & Powers/Stratagems backups).
    Moved out of the TODO block.
  - ☐ `halb06.spl`, `sw1h51.spl` (IR/IRR) — **no evidence found anywhere** in
    this install, unlike `wand19.spl`/`wand19d.spl` which Item Revisions
    (v4beta10sd19) does generate — only `halb06.itm`/`sw1h51.itm` exist. Not
    removed (this install's absence isn't proof against every IR version),
    but worth a second look.
  - ☐ `sppr614c.spl`, `sppr614d.spl`, `spwi224c.spl` (SpellPack b6) — no
    evidence found either. Note: `sppr614c.spl` does exist as a same-named
    file inside Stratagems' own resource folder, but OlvynChuru's actual
    "Spell Pack" mod (which Stratagems' readme references as a separate,
    third-party mod) isn't installed locally to confirm the two are the same
    resource — inconclusive, left flagged rather than assumed.
  - These entries are harmless either way if wrong: `weidu-function.service.ts`
    writes them as plain strings into a WeiDU array with no
    `RESOURCE_EXISTS` check (`generateSpellResource()`), so an incorrect
    entry just means blindness-immunity silently doesn't cover a spell that
    doesn't exist in a given install — not a broken one.
- ✅ `undead.ts:370` — investigated: the level-24 header (6d10 cold, 3d10
  crushing) this comment refers to no longer exists in the code, only the
  question remains. The only current caller of `createWallOfIce()` is the
  Death Knight, which casts at `level1: 9` - so today, nobody would reach a
  level-24 tier. **Kept intentionally** (maintainer: might be used later by
  a new creature) rather than deleted as dead-code cleanup.
- ☐ `undead.ts:1150` — bare `//TODO:` with no text, on `deathKnight()`.
  **Kept** (maintainer: this creature is a work in progress).

---

## ⚪ Acknowledged low priority

- `golems.ts:190` — charge mechanic is "a very basic idea... many improvements
  can be done but since this golem is only used once by a mod, it is a low
  priority" (author's own words).

---

## Commented-out "spirit variant" creature files (34 hits, one recurring idea)

Every one of these is the same shape: a creature family has a block of
commented-out `files: [...]` entries for a "Spirit" or mod-specific variant
(Faiths & Powers' Spirit Spider), each tagged `//TODO: <variant name>`. These
read as "this variant exists in some mod/game install but isn't confirmed
supported yet," not bugs — flagging as one decision rather than 34 individual
ones:

| File         | Lines                       | Variant                                                         |
| ------------ | --------------------------- | --------------------------------------------------------------- |
| `bears.ts`   | 187, 310-314                | Spirit Bear                                                     |
| `cats.ts`    | 123, 209-214                | Panther Spirit / Spirit Lion                                    |
| `spiders.ts` | 1068-1072                   | Spirit Spider (Faiths & Powers)                                 |
| `undead.ts`  | 2841-2845 **and** 2896-2900 | Spirit Spider (Faiths & Powers) — **listed twice, identically** |
| `wolves.ts`  | 605-610                     | Spirit Wolf                                                     |

The `undead.ts` duplication (same 5-line list appears twice, ~55 lines apart)
is worth a look on its own — likely a copy-paste artifact from splitting or
merging creature blocks, independent of whether the Spirit Spider variant
itself ever gets implemented.

**Decision needed:** are these "someday, if I get to it" (leave as comments,
maybe consolidate the duplicate undead.ts block) or "not planned" (delete the
dead commented code)? Either way, they don't need 34 separate line items.

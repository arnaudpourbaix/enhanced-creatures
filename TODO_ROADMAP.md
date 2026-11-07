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
- ☐ `vampire.ts` — mage vampires need a spellbook and a caster level.
  DX#DALID (Dalina, Cowled Menace) is a Very Old vampire with class MAGE, but
  her spells are not set up yet: she has 2 level 8 spells in game, so she
  should cast as a level 17 wizard, while the vampire template's `level1` is
  her 11 Hit Dice. NTHAEBAL (Haeball, `TODO: mage !`) and D9TANOV ("Vampire
  Mage") are the same open case.
- ☐ `undead.ts:1639` — spellbook should vary by installed mod/component (SR,
  Faiths & Powers, ...); currently one fixed spellbook. Needs a mod-detection/
  conditional-spellbook mechanism that doesn't exist yet in this generator.
- ☐ `feys.ts:1092` — Quench Fire ability not implemented. Zero code exists,
  just the D&D 5e ritual description as a comment. No obvious IE-engine
  effect equivalent for "extinguish nonmagical fire in an area, counter
  magical fire from lower-level spells" - would need creative reinterpretation
  of what this even means in WeiDU/IE terms, not just a translation.
- ☐ **Polymorph Self, PnP-style (design on hold, 2026-11-03)** — replaces the
  `ability.factory.ts:18` note ("situational polymorph form selection"). Only
  the sirine uses `abilityFactory.polymorphSelf` today. What's settled so far:
  - **When to shift** (maintainer): no interesting spells left, spell failure,
    or interrupted in melee on every cast. Silence blocks the cast itself, so
    it only matters for innate shifts (druids).
  - **PnP Polymorph Self** (maintainer): one form for the whole duration, no
    switching. The form gives its physical abilities, movement speed and
    attacks, without their special effects. No special abilities either (no
    Web Tangle, breath, rage, Hide). Ending it voluntarily heals 1d12 hit
    points; letting it expire doesn't.
  - **Duration:** 1 to 2 turns depending on wizard level. Druid forms have no
    duration.
  - **Form list must be redone:** the game's forms carry their special
    abilities, and without them most are pointless (Mustard Jelly). The
    maintainer will update Polymorph Self with new forms. A creature only
    takes forms that beat its own fighting: for the sirine, a decent archer,
    only the Ogre Mage (strong spells, good melee) and the Mustard Jelly
    competed before the PnP change.
  - **Random pick:** forms as one block with one response each. The weights
    are skewed (e.g. 90/100) because the engine favours the first response.
  - **Open:**
    - Who picks the new forms: the maintainer, or proposed from our PnP
      monsters.
    - When a creature ends the spell for the 1d12 heal.
    - Druids' innate forms (level 7).
    - Wizard Shapechange (level 9) forms: Iron Golem, Mind Flayer, Giant
      Troll, Marilith, Greater Basilisk, Invisible Stalker.
  - **Known bugs until then:**
    - The sirine's Polymorph Self is hand-written, so it sits first in her
      script.
    - The Mage Sirine's gate doesn't check Mirror Images or Greater Malison,
      so she can shift with both still memorized.
    - Forms are re-picked every 2 rounds (12-second `polymorph` timer).
    - Fix for the first two: make the cast a scored entry; role
      `shapeshift` already goes last.

---

## Bodhi

Moved to [BODHI.md](BODHI.md) (scripts, abilities, CRE review and progression).

---

## 🟡 Strength on natural attacks (every creature, in game) — reopened

Creatures get 2e natural dice plus a 3e/5e strength score read through the engine's 2e table
(STR 20 = +8, where 5e gives +5), so strong monsters with natural attacks hit far above both 2e
and 5e (bears: brown 41 per round vs 28 in 5e, polar 56 vs 30). Data, bear options and every
creature with 18+ strength: [docs/research/strength-damage-survey.md](docs/research/strength-damage-survey.md).

The first idea, natural attacks ignoring strength while manufactured weapons keep it (2026-11-07),
is **no longer agreed**: the user wants strength consistent across weapons, as the mod mixes 2e
and 3e+ on purpose. Since then (user):

- 5e is the reference, not 3.5e (absurd).
- In 3e/5e dice grow with the creature too: dice alone don't carry strength.
- Bears with 2 attacks per round (5e's bite + claws) is on the table.

Still to decide: the reference per creature, the strength scale (keep the 2e-table scores or
convert to the score with the same 5e bonus), the attack counts. Look for better rules rather than
per-creature flags (user: no opt-in flag); the juju zombie's 3d4 fists depend on its strength.

---

## 🟡 XP formula (2e DMG Tables 31/32, `lib/src/services/experience/`)

### ☐ Strength on natural attacks — see the global item above

The damage rows count strength today and will follow whatever the game ends up doing.

### ✅ A power level on every created spell

Done 2026-11-06. Every innate spell the mod creates now says how strong it is or what it is, and
the generator refuses one that says neither (`missingPowerLevels`, run after the creatures):

- **Spell-like power** (magic matching a spell: a charm, Blink, Fog Cloud, a death wail): a
  `worthLevel` rated against the PnP spell doing the same (the dryad's charm is Domination-class,
  5; the sirine's song is Dire Charm on everyone in sight, 7), 0 for no power. The spell scoring
  and the XP spell bonus both read it; a preset no longer sets a spell level.
- **A body's attack form** (a leap, a charge, a wolf or bat form, a grab): never a spell, no level;
  it declares an explicit `xpAbility` (user).
- **Nothing needed** when the effects already give a listed Table 32 row (petrifying gaze,
  paralyzing touch, fear aura, disease, poison), for a spell another created spell casts (its
  parent carries it), and for damage a weapon's hit casts (a bear's hug: the damage rows).
- Wizard and priest typed powers keep their level (`worthLevel` when worth something else: bat
  swarm 4, animate dead 7, the ogre mage's gaseous form 1).

### ☐ Bosses and drops

Files whose formula XP is below their in-game XP keep the in-game value (`drop` status, listed
on the dashboard's Experience tab). The final rule must be automated; to decide from the drop
list.

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

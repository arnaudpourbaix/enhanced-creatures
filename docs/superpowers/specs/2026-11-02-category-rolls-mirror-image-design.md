# Category rolls and Mirror Image counters

Date: 2026-11-02. Status: design agreed in conversation, not built.

## Intent

Two linked changes to how generated creature scripts pick spells in a fight:

1. **Category rolls.** A caster must never cast a much weaker spell when a stronger one of the same
   kind is castable (the user: "cast a level 2 spell when a level 8 is available (in the same
   category) is definitely not acceptable"). Weapons and summons already get this from a shared
   roll; every other kind of spell gets it too.
2. **Mirror Image counters.** Mirror Image deflects every single-target spell, so it is a far
   stronger protection than its level says. A caster facing a mirrored enemy clears the images
   first, then uses area spells, then other targets, and throws single-target spells at the
   mirrored enemy only as a last resort.

The first change alone would make Mirror Image worse (Flame Arrow would always beat Magic Missile
against a mirrored caster), so both ship together.

## Background: how the shared roll works

`RandomNumGT` triggers with the same first parameter (range) draw the same value within one script
tick, whatever their threshold (tested in game, memory `shared-random-roll`). Spells of a family
share a range, each keeping its scored chance as threshold: with chances falling down the script, a
weaker spell only passes when the stronger ones above it did. A stronger spell skipped for its own
conditions (immune target, out of range, no target) doesn't use up the roll, so the weaker one can
still go. Today `sharedRoll` in `lib/src/services/baf/memorized-checks.ts` gives weapons
(`createsItems`, range 700) and summons (`role: "summon"`, range 701) a shared range; every other
spell draws its own (`ability.service.ts`, `parseAbility`). `sharedRollOutOfOrder` warns when a
chance rises down the script.

Ordered lists (`!HaveSpell` of the stronger spell) were removed on purpose: they overrode the scored
order, and a stronger spell that can never land (all targets immune) blocked the weaker one for the
whole fight. Don't bring them back.

## Part 1: category rolls

### What a category is (user agreed)

A category is a spell's **role plus its delivery**:

- delivery: **single target**, **area** (`area` keyword) or **cast on the caster** (`castOnSelf`
  keyword or preset `spell.castOnSelf`, without `area`).
- role: from the spell database (`SpellRole`), with **`kill` and `damage` in one category**: Magic
  Missile waits for Disintegrate or Finger of Death (stated in the conversation, the user agreed).

So Magic Missile and Flame Arrow share one roll (single-target damage), Hold Person waits for Hold
Monster, Sleep waits for Hold Monster (both single-target disable, if Sleep is single target in its
data), but Magic Missile never waits for Meteor Swarm (area).

### Outside category rolls (user agreed)

- `reactive` spells (heals, escapes): each fires on its own condition. A Cure Light Wounds on a
  target missing 10 HP beats spending Heal on it.
- Weapons and summons keep their own shared ranges (700, 701), unchanged.
- Precast phases (long and mid duration precasts at init) are unchanged. Buffs cast during combat
  that exclude each other (Haste and Improved Haste) share their category's roll like any spell.
- `useless` spells are never cast anyway.

### Which spells (my call)

Only spells the scored plan places (`CastOrderService.plan`) get a category roll. Hand-written
abilities, custom codes, entries placed with `insertBefore`/`insertAfter`/`insertFirst`/
`insertLast` and the covered phase keep their own rolls and chances: they are hand-tuned (boss
powers among them), and capping their chances to keep a category's order would quietly weaken them
(memory `never-weaken-bosses`). So the category range is assigned where the plan is turned into
abilities (`AbilityOrderService`), not by file like `sharedRoll`.

### Ordering

Strict within a category: the stronger castable spell always wins. Near levels never compete by
chance; a level 3 spell can still go before a level 4 when the level 4 can't land on that target, or
when a counter pass (Part 2) picks it. The user accepts that ("could happen by choice", not
required).

"Stronger" is the existing scored cast order (`CastOrderService.plan`), not the raw level. Each
category gets its own range number (distinct from 700 and 701, and from the per-spell ranges the
random generator hands out). The blocks of one category are interleaved with other categories in
the script (the cast order alternates roles); the shared value still holds across that.

Chances must not rise down the script within a category (`sharedRollOutOfOrder` must cover every
category range, and generation must not warn for any creature). Scored chances don't have to
decrease with score today, so the builder decides how to keep them non-increasing (for instance cap
each block at the previous one's chance in its category); see "Left to the builder".

## Part 2: Mirror Image

### Facts (from the user)

- Mirror Image deflects any single-target spell.
- It creates 2 + level/3 images (rounded down), up to 8 at level 18. A hit that beats AC goes to the
  real target 1 time in n+1 with n images (33% with 2, 25% with 3, ...). Even one image halves a
  spell.
- A script can't tell how many images remain: `STATE_MIRRORIMAGE` only says whether there are any
  (checked in BG2EE `STATE.IDS` and `STATS.IDS`; `CLERIC_PHYSICAL_MIRROR` is another spell). Treat
  every mirrored target as the same risk, and keep applying the order below as long as the state is
  up: a Magic Missile may leave images behind.
- Magic Missile fires 5 missiles at level 9 and can clear 5 images; Flame Arrow fires 5 arrows at
  level 10 and can clear images too, but does much more damage, so it comes after Magic Missile as a
  counter.

### Order against a mirrored enemy (user agreed)

1. **Image removers**, in this order: any dispel (wizard and priest Dispel Magic, Remove Magic), True
   Seeing (every version, True Sight included), Oracle and Detect Illusion; then Magic Missile and
   Mordenkainen's Force Missiles (my guess, agreed with the rest: it hits like Magic Missile); then
   Flame Arrow.
2. **Area spells**, as usual: they aren't deflected.
3. **Single-target spells at other targets**, enemies without images.
4. **Last resort**: single-target spells at the mirrored enemy, only when nothing above is possible.

"Single-target spell" means a hostile spell without `area` and not cast on the caster. Weapon spells
and touch charges are cast on the caster: this rule doesn't touch them.

### How it behaves

- **Counter pass (placement is my call).** It comes after the reactive spells and the opening
  protections (a badly hurt caster still heals or escapes first, and round-1 Stoneskin still goes),
  and ahead of every other attack. Dispels, True Seeing, Oracle and Detect Illusion are `reactive`
  in the database: their reactive blocks stay where they are, and they get extra counter blocks aimed
  at mirrored targets, in the remover order above. Remover blocks aimed at `STATE_MIRRORIMAGE`
  targets come ahead of the regular order. Inside a category roll a counter block takes the lowest threshold (it is placed first), so
  it wins whenever its situation holds; otherwise the strict order applies.
- **Removers only counter when the target is mirrored.** Their other uses stay as they are (dispels
  against buffed enemies, True Seeing against invisible ones). Today `DISPEL_TARGET_LISTS` already
  lists `STATE_MIRRORIMAGE` among many buffs, and Magic Missile and Force Missiles prefer mirrored
  spellcasters first (`damage-presets.ts`); True Seeing, Oracle, Detect Illusion and Flame Arrow
  have no mirror rule yet.
- **Single-target spells skip mirrored targets in their regular pass**, then get a later pass at
  mirrored targets. The later pass comes after every regular pass, so area spells and other
  targets come first.
- **A failed roll may fall through to the last resort (user agreed).** When an area spell or a spell
  aimed at an unmirrored enemy fails its chance roll, the last-resort block can fire that tick. That
  is accepted randomness, not a bug: the last resort is not guarded by repeating the conditions of
  the blocks above. The user: a good measure, since area spells are often hard to cast for friendly
  fire.
- Only the target the spell is aimed at matters, not which enemy cast Mirror Image.
- **Counters aim at any mirrored enemy (user).** Mirror Image is a wizard spell, so in practice
  that's a wizard. Melee clears images for free but slowly: a low-level fighter with one attack per
  round must hit to pop each of 3 or 4 images, while one Magic Missile clears several at once
  (unless Shield blocks it).
- **No intelligence limit (user).** Unlike the `Unprotected` target status
  (`requireIntelligence: true`), the rule applies to every caster: spellcasters are intelligent
  anyway.

## Non-goals

- Melee targeting: melee creatures keep attacking mirrored enemies. Each hit pops an image and costs
  nothing (the user: "melee hits are not limited, spells are").
- Counting images.
- Any state or check that needs another mod (Stratagems' BUFF_* or PRIORITY_* states).

## Anti-goals (a failure even if it works)

- A much weaker spell cast while a stronger one of its category is castable.
- A spell blocked for the whole fight because a stronger one can never land (no `!HaveSpell` lists).
- Single-target spells wasted on images while an image remover, an area spell or another target was
  available.
- A remover spent on a target that isn't mirrored, in its counter role.
- Generated scripts growing out of hand: the user already cut summon targeting for size (each summon
  went from 39 to 17 blocks). The last-resort pass adds blocks for every single-target spell, so keep
  it to the plain target lists.

## Constraints

- Project rules in memory apply: only abilities the PnP monster has, never another mod's resources,
  `creatures.csv` is the source of truth, no per-creature test files (test generic code in services
  and factories, check creatures through generated output).
- `npm run generate` must finish without new warnings; tests and the golden pipeline test must pass
  after regenerating `mod/`.
- Game data comes from `C:/Games/BG2EE` only.

## Left to the builder

- How chances are kept non-increasing within a category, and how the counter blocks fit that.
- The range numbers for category rolls.
- Whether delivery comes from keywords alone or also from the SPL's target type.
- Where the counter pass and the last-resort pass live (statement builder phases, cast-order
  service, presets), and how a spell is marked as an image remover.
- How the generator log reports categories (the "Cast order:" lines are a good place).

## To test in game

- A caster with Magic Missile and Flame Arrow against a mirrored mage: Magic Missile first.
- Dispel Magic or True Seeing used to clear images before any single-target spell.
- A caster with Hold Person and Hold Monster: never Hold Person while Hold Monster is castable on the
  same target.
- A stronger spell blocked by its conditions (immune target) letting the weaker one through.

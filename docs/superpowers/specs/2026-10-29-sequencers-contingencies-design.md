# Sequencers and contingencies: design

Brainstormed 2026-10-28/29.

## Goal

Wizards built from a spellbook automatically get the minor sequencer, spell sequencer,
contingency and chain contingency their caster level allows. Each is picked from an ordered list
of named entries that the spellbook references. The entries themselves are defined once in a
shared registry, and in game they use the real mechanics wherever the engine allows it.

Today [spellcaster.ts](../../../lib/src/model/creature/spellcaster.ts) only declares the shape
(unused), and `abilityService.getSequencer`/`getMinorSequencer` build a one-shot scripted
ability no creature uses.

## The four kinds (rules to respect)

| Kind              | Caster needs           | Contains                         | Itself a spell of level |
| ----------------- | ---------------------- | -------------------------------- | ----------------------- |
| Minor sequencer   | wizard level 4 (CL 7)  | 2 spells of level 1–2            | 4                       |
| Spell sequencer   | wizard level 7 (CL 14) | 3 spells of level 1–4            | 7                       |
| Contingency       | wizard level 6 (CL 12) | 1 spell of level ≤ floor(CL ÷ 3) | 6                       |
| Chain contingency | wizard level 9 (CL 18) | 3 spells of level 1–8            | 9                       |

"CL" is caster level. "Wizard level N" means the caster can cast wizard spells of level N, i.e.
the first caster level with a slot of that level in `MageSpellTable`.

Contingency limit by caster level: 12–14 → 4, 15–17 → 5, 18–20 → 6, 21–23 → 7, 24+ → 8. This
table goes in the doc comment of the contingency helper.

Contingency conditions are the 7 the engine offers, chosen by whoever defines a contingency:

- `hit`: hit, not necessarily damaged
- `seeEnemy`
- `hp50`, `hp25`, `hp10`
- `helpless`: stunned, held, paralysed, asleep, webbed…
- `poisoned`

The existing `ContingencyTrigger` type already lists them.

A caster holds **at most one of each kind**.

## Declaring them

### One shared registry

Every named sequencer and contingency is defined once, in a registry alongside the spell
database (like `SPELLS`). For example, a minor sequencer with two Magic Missiles exists once, not
as `NecroMissiles` in one book and `UndeadMissiles` in another. Each entry becomes one generated
spell, so defining the same thing twice would generate two identical spells.

```ts
export const SEQUENCERS = {
  DoubleMagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]),
  NecroOpening: spellSequencer([s.Slow, s.Contagion, s.Horror]),
  ...
};
export const CONTINGENCIES = {
  EscapeInvisible: contingency("hp50", [s.ImprovedInvisibility]),
  LastStand: chainContingency("hp25", [s.ImprovedInvisibility, s.Stoneskin, s.MinorGlobeOfInvulnerability]),
  ...
};
```

- Spells inside an entry are cast in the listed order.
- Two registry entries of the same kind with the same contents (and same condition, for
  contingencies) are a generation **error**.

### Spellbooks reference entries

A spellbook only lists references to registry entries, ordered by preference:

```ts
export const VampireNecromancerSpellbook: SpellBook = {
  name: "VampireNecromancerSpellbook",
  values: [/* unchanged */],
  sequencers: [SEQUENCERS.NecroOpening, SEQUENCERS.DoubleMagicMissiles],
  contingencies: [CONTINGENCIES.LastStand, CONTINGENCIES.EscapeInvisible],
};
```

A creature with no spellbook can reference registry entries directly on its spells data. Those
are used as declared, with no caster-level check or picking.

## Picking

A spellbook is built for a caster level by `spellService.createSpellbooks`. That happens for the
base monster, and again for every adjustment that rebuilds its book. For example, vampire
D9BGUARD at CL 14 and DX#DALID at CL 16 use the same book.

Each time, for each of the 4 kinds, the generator picks the first referenced entry that fits:

- the kind is allowed at that caster level;
- for a contingency, every contained spell's level is ≤ floor(CL ÷ 3).

Picking also runs per mod variant, the same way spellbooks already do (see
`spellBookVariants`). A contained spell resolves through its fallback chain. An entry whose
spells resolve to different files gets one generated SPL per distinct content. _(My call.)_

**Warning** (in generator.log, under the creature) when a caster qualifies for a kind but no
referenced entry fits. This applies to every mage spellbook, including today's books that have no
references yet, so the warnings will appear right away. Adding references to existing books is
content work outside this project. _(My call: the user accepted the warnings showing up
immediately.)_

## Spell slots and rest

Picked sequencers and contingencies **don't take a spell slot**. They're memorized on top of the
caster's normal slots. Under the PnP rules a wizard memorizes them, casts them to prepare them,
and then frees the slot. Strictly that costs 2 rests to get them back; we cheat a little and allow
one rest, as SCS does.

## In game

All generated SPLs below are **memorized** by the casters that picked them. That one mechanism
does three jobs:

- it decides which CRE has which entry, since CREs that share a script can pick different ones;
- it marks an entry as used, because the SPL is removed once used;
- it renews the entry after rest.

The spells inside an entry are never memorized.

### Sequencers (both kinds)

- One SPL per entry casts its contained spells instantly, in order, with the sequencer release
  visual. One SPL can hold several cast-spell effects, so no helper spells are needed.
- The script uses it like any memorized spell: `HaveSpellRES` gating, normal targeting, and spell
  checks combined from its contained spells, the way today's `generateSequencer` already merges
  them.
- It is placed in [SPELL_PRIORITY_ORDER](../../../lib/config/spell-priority-order.ts) by its
  resource, like any other spell. A creature can move it with the usual `AbilityEntry`
  `insertBefore`/`insertAfter`.
- There's no fixed "opening move" slot: a CL-18 wizard may well keep its minor sequencer for late
  in the fight.
- A registry sequencer missing from `SPELL_PRIORITY_ORDER` is a generation **error**, not today's
  "cast last" warning.

### Contingencies

_(Revised 2026-10-30: enemy contingencies used to be fired by the script.)_

- Every contingency is two SPLs. The memorized one sets up a real engine contingency:
  `CastSpellOnCondition` (`effect.type.ts`) with the defined condition and a single target. A plain
  contingency only casts on the caster; a chain contingency picks `self` (default), `lastHitter` or
  `nearestEnemy`. When the condition holds, the engine casts a second SPL
  that casts the contained spell(s), whose names show as they land. No script fires it.
- The set-up shows nothing. It is cast along with the script's init block (`HaveSpellRES` →
  `ApplySpellRES` → `RemoveSpellRES`, applied so no spell name is announced). Rest resets init and restores the SPL, re-arming it.
- `nearestEnemy` on a hostile caster works: tested in game with a chain contingency.
- The fired spells get no target checks: the engine doesn't make them.

## Targets

- A spell counts as **self** when its preset casts on the caster (`castOnSelf`, or the
  `castOnSelf` keyword). Presets such as Improved Invisibility, which target "myself or allies",
  count as self when used inside an entry. _(My call.)_
- An entry that mixes self spells and enemy spells is an **error**.
- An enemy entry whose spells have different preset target lists is a **warning**: the combined
  checks may make it rarely or never fire. It could become an error later. An entry repeating the
  same spell, such as double Magic Missiles, never triggers it.

## Validation

Errors:

- mixed self and enemy spells in one entry;
- a contained spell over the kind's limit: minor 2, sequencer 4, chain 8, and 8 for a
  contingency, which is the most any caster can reach;
- the wrong number of spells: minor 2, sequencer 3, contingency 1, chain contingency 3;
- a contained spell unknown to the spell registry, or not a wizard/priest spell;
- duplicate registry entries (same kind, same contents and condition);
- a contingency condition outside the 7;
- a registry sequencer missing from `SPELL_PRIORITY_ORDER`.

Warnings:

- an enemy entry whose spells have different target lists;
- a caster that qualifies for a kind but has no fitting entry.

## Non-goals

- Copying SCS's sequencer spells or depending on SCS (see the other-mods rule: never copy another
  mod's spells).
- Contingencies applied without a cast, at spawn.
- Taking spell slots, or memorizing the contained spells.
- Adding references to existing spellbooks (separate content work).
- Priests, since they have no equivalent here.

## Existing code to replace

Nothing uses these yet, so they can be removed or reshaped freely:

- `SpellCaster` in spellcaster.ts;
- `abilityService.getSequencer`, `getMinorSequencer` and `generateSequencer`;
- `creatureGroup.sequencer` and `minorSequencer`;
- the `minorSequencer` global;
- the `JA_MINOR_SEQUENCER` and `JA_SEQUENCER` constants in `config/generate.ts`.

## Left to the builder

- Generated resource names: follow the resource-naming scheme. Registry entries are shared across
  monsters, so they likely use the common scope.
- Sequencer release visual and contingency set-up and trigger visuals: copy what the game's own
  sequencer and contingency spells use.
- Where the self-contingency precast sits relative to the other precast blocks.
- Doc and adjustment cards: show the picked entries alongside the spellbook.

# Variant scripts

Date: 2026-11-02. Status: design agreed in conversation, not built.

## Intent

Every file of a monster currently runs the same main script (`jabm<id>00`), and that script holds
the spells and powers of **every** adjustment combined. Since the category rolls and Mirror Image
passes, a spellbook costs a lot of script: the Very Old Vampire's `jabm4j00` went from about 10.7k
to 51.6k lines because one file (DX#DALID) is a necromancer. The other Very Old Vampires
(L#2EDVAM, OHHDRAGO, CBVAMGRY, L#RVVAMP) now run 41k lines of mage logic they can never use. Fight
five Very Old Vampires where one is a mage, and the game runs five big scripts instead of four
average ones and one big one.

For scale (installed BG2EE game, 8,617 scripts): the median script is 38 lines, SCS's largest is
51k. Today's generated caster vampire scripts (49.6k to 53k lines) would be the three largest
scripts in the game.

The fix: files that bring spells or abilities of their own belong to a **variant**, and such a
variant gets **its own script**. Plain files keep a base script holding only the base monster's
abilities.

## Goals

- A variant that declares spells or abilities gets its own script, built from the base creature
  plus that variant (and its parent variants). Its files run that script, nothing else does.
- The base script only holds what the base creature and the files outside such variants have.
- Adding new spells anywhere other than a variant is a **generation error** (the user: "it should
  produce an error, this will avoid performance issue in game"). The author has to declare a
  variant.
- Variants can declare their own abilities (at-will powers, ability entries), not only spells, so
  a power only some files have can move out of the base.

## Non-goals

- No new `MonsterEnum` entries: variants stay sub-species of one monster id.
- No change to how a single script is built (scoring, rolls, mirror passes stay as they are). This
  only decides *which* spells and abilities each script is built from.
- No documentation page change is required (doc cards already group by variant).

## Anti-goals

- A plain file running a spellbook it doesn't have. That's the bug this design removes.
- A spellcasting file running a script without its spells (it would never cast them).
- Silently turning adjustments into variants: the error is wanted, so authors see where scripts
  split.

## The rules

### 1. What "declares spells or abilities" means

A variant is **scripted** (gets its own script) when its own declaration, meaning its `data`
merged over its parent's plus any new `behavior` input (see 3), adds to what the script must
handle:

- a memorized spell file (`spells.memorized`, or any `spells.spellbooks` entry's `memorized`) that
  its parent doesn't memorize. The parent is the base creature for a root variant, or the parent
  variant.
- any `spells.combos` entry the parent doesn't have;
- any ability of its own (see 3).

More uses of a spell the parent already memorizes are **not** new spells (my call). The ogre
bosses' extra Berserk uses (SPCL321) or Tazok's don't add script blocks. Removing spells
(`removeMemorized`, `removeKnown`, `cumulative: false` with a subset) never makes a variant
scripted.

A variant that only changes stats (lacedon / greater lacedon) is not scripted. Its files run its
nearest scripted ancestor's script, or the base script if it has none.

### 2. The error

Generation fails, through the usual "Failed to build X" path, when any of these adds a new spell
file or combo as defined above:

- a plain `setAdjustments` entry;
- a variant's `adjust` entry, i.e. one file in a variant adding spells the variant doesn't have.
  That file needs its own sub-variant (my call: the same reasoning as the user's rule applied one
  level down. Otherwise the variant's other files would run that file's spells).

The message names the creature, the files and the new spell files, and says to declare a variant.

Files with `script.location: "None"` are exempt (my call): they run none of our scripts, so their
spells add no blocks anywhere, and they're left out of every script's spell set (NTHAEBAL, a
future mage, stays a plain adjustment). Summon files are not exempt: they share the summon
script, so new spells on one summon file bloat every summon.

A file may belong to at most one scripted variant chain. Two unrelated scripted variants claiming
the same file is an error (my call).

Today's offenders found in generated output (spell files added inside a `SOURCE_RES` block). The
builder must check each one against the "new file" rule, since some only add uses:

| Creature | Added spell lines | Note |
|---|---|---|
| skeleton-monster (48) | 122 | |
| vampire 4m | 112 | |
| vampire 4j (Very Old) | 66 | DX#DALID necromancer |
| archer-skeleton (44) | 34 | |
| ogre-mage (0w) | 21 | |
| vampire 4o | 18 | |
| ogre-berserker (0v) | 6 | SPCL321 uses: likely not new |
| sirine (17) | 4 | Charm Song, and SPWI212/SPWI412 for AC#DT30S |
| half-ogre (0t) | 3 | Tazok SPCL321 uses: likely not new |
| zombie (2g) | 2 | SAHZOM01: Animate Dead, Odor of Death |
| sword-spider (1n) | 1 | WISPID03: Leap Attack |
| skeleton (29) | 1 | SPCL423 |

Converting them to variants is part of this work. Each creature's generated stats must stay the
same: the .cre patches must be unchanged except for script assignment.

### 3. Variant abilities

`VariantInput` gains a `behavior` field taking the same input as `Creature.setBehavior` (ability
entries, raw abilities, custom codes). Entries are added to the parent's behavior, not replacing
it. They only end up in that variant's script (and its sub-variants' scripts). A variant with
`behavior` is scripted.

Moving existing base abilities into variants is **not** part of this work. Today every ability is
declared on the base and that stays valid. This only opens the door.

**Abilities for spells a script's files don't have (user decided).** When a script is built, an
explicit ability (base behavior, custom code abilities, ability entries) whose cast spell no file
running that script memorizes is dropped from that script. Abilities with
`memorizedSpellCheck: false` (e.g. the sirine's Touch of Tranquility) and powers that don't come
from a memorized spell (item powers) are kept. Example: Bodhi's `ibodhi4`–`ibodhi7` abilities are
declared on the base, but only BODHI2 and the chapter 6 lair files memorize them (ImprovedBodhi
spellbook). Once those files are variants, the base script loses the ibodhi blocks and the variant
scripts keep them. For a creature without scripted variants, every file runs the base script and
its spell set is the union of all, so nothing is dropped and output stays byte-identical.
`checkSpellAbilities`'s "not memorized anywhere" warning stays per creature (over all scripts).

### 4. Script names

`ja` + `b` + `m` + 2-character creature code + 2-character counter (`getResourceName`). `00` stays
the base script and `01` the base summon script. Scripted variants take `02`, `03`, ... in
declaration order, depth first (a sub-variant right after its parent) (my call). If a scripted
variant has summon files (unlikely, the user wants it supported), its summon script takes the next
counter. Renumbering when variants are reordered is fine: output is unreleased (memory
`standard-patterns-over-stable-names`).

### 5. Script assignment (WeiDU)

- The base `patchCreatureScript` skips the files of every scripted variant (added to `skipFiles`
  next to summon, location and no-script files).
- Each scripted variant assigns its script to its own files (minus those of its scripted
  sub-variants, and its summon files, which get its summon script).
- Per-adjustment `script.location` and `script.location: "None"` keep working. A location
  adjustment must assign the script its file actually runs, not always `scriptName` as
  `weidu-creature.service.ts` does today (line ~678).
- Game-scoped files and summons keep their current handling, applied per script.
- Every script, base and variant, gets `COMPILE`d.

## Constraints

- Golden test and the manifest/dump workflow (memory `verify-generator-refactor`) are how output
  changes get checked. Creatures without scripted variants must produce **byte-identical** output.
- Never weaken bosses (memory `never-weaken-bosses`): converting an offender to a variant must not
  lose any spell, stat or ability a file has today.
- No `lib/creatures/<creature>.test.ts` files (memory `no-creature-test-files`). Test the generic
  code in factories/services, verify creatures through generated output.
- Translation keys: variant labels stay plain strings, not `t()` keys (adding keys renumbers .tra,
  memory `tra-numbering-shifts`).

## Success

- `jabm4j00` (Very Old Vampire base) drops back to about the plain vampire size (~10k lines), and
  DX#DALID runs its own script (~52k) alone.
- Same pattern for the other caster vampire ages and the skeleton/ogre-mage offenders.
- No other creature's output changes.

## Left to the builder

- How a script gets built for a variant. The likely route is a per-script view of the creature:
  merged data, the adjustments relevant to that script, base + variant behavior, with
  `abilityOrderService.resolve`, cover phase and `atWillService.applyCooldowns` re-run for that
  view. Today those run once per creature, over the union of all adjustments
  (`creatureService.memorizedSpellFiles`, `statement-builder.precastSpells`, `creatureAbilities`).
- `behavior.spellbookFiles` / `JA_SPELLBOOK` exists so a shared script can brake at-will powers
  only for files with a spellbook (Tanova among patriarchs). Once spell-adding files all have their
  own script, check whether it's still reachable. If not, remove it rather than keep dead code.
- The script header comment for a variant script (e.g. creature name + variant label).
- Whether `generator.log` should list each creature's scripts and their sizes.
- The order of work (generic mechanism first, then the error, then converting offenders) and
  whether the error starts as a warning during conversion.

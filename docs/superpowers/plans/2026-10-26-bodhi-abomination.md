# Bodhi as an Abomination vampire: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bodhi becomes a new vampire age, Abomination, with per-encounter
values that never weaken her. Our script casts her SCS powers (only when
SCS is installed), her own scripts keep only their story blocks, and the
holy water works again.

**Architecture:** A seventh `VAMPIRE_AGES` entry built by the existing
`vampire()` builder in `lib/creatures/vampire.ts`, plus per-file
adjustments for the tiers. SCS spells are memorized through a new
mod-conditional spellbook (`SPELLBOOK_MODS`) and cast through ordinary
`RawCreatureAbility` entries gated by `HaveSpellRES`. Her scripts are
trimmed and C6BWEAK is patched with the existing install-time
`script.edits` (`removeBlocks` / `replaces`).

**Tech Stack:** TypeScript generator (ts-node), vitest, WeiDU output under
`mod/`.

**Spec:** `docs/superpowers/specs/2026-10-26-bodhi-abomination-design.md`
(background and raw CRE data: `BODHI.md`).

## Global Constraints

- **Never weaken:** no generated value may be below the original CRE's
  value for that encounter (BODHI.md, "Current CRE files"). The only
  lowering is Spellhold, and even there it stays at or above its own files.
- **`assets/creatures.csv` belongs to the user.** Never edit it; the user
  does the CSV steps marked **USER**.
- **No SCS resource is copied or recreated.** `ibodhi*` are cast by resref,
  only when the file exists in the game (install-time check).
- **No resource renames for existing vampires.** Register every new spell,
  item and projectile from the Abomination factory, called last in
  `createVampireEntry()`, so existing `ja*` resource names don't shift. The
  new age-name translation key shifts `.tra` numbering; that's accepted.
- **Game scope:** Bodhi's files exist in BG2EE and EET (BG2 part) only.
- **Commits only with the user's go-ahead** (ask at each commit step).
- After any generator change: `npm run generate`, then `npx vitest run`
  (the golden test compares `mod/` with a fresh generation).

## Review Focus

1. **A story beat stops firing because a strip pattern hit a story
   block:** the C6BODHI low-HP heal + dialogue, the PPBODHI4 spawn waves
   and the BODHI2 "educational" timer must survive on both the SCS and the
   vanilla script versions. Task 5's fixture test pins this.
2. **No SCS installed:** her abilities must vanish cleanly (no
   `ForceSpellRES` of a missing file, no stuck action). Task 4 pins that
   the ibodhi abilities require `HaveSpellRES`, and the spellbook variant
   is the only thing memorizing them.
3. **The mod-conditional spellbook replaces `memorized`:** if the variant
   omits the age's own powers (domination, Bat Swarm, forms…), SCS
   installs lose them. Task 4 pins that the variant's list is a superset.
4. **Spellhold's lowering goes below its own file** (e.g. PPBODHI4 STR 22,
   DEX 21, VVBODHI drain 5). Task 2 pins each Spellhold file's values.
5. **Holy water on an install where C6BWEAK differs** (no `VAMPREG2` in
   its text): the replace silently does nothing. Task 3 pins the replace,
   and the manual check reads the decompiled C6BWEAK.

---

### Task 1: The Abomination age, with Bodhi's files

**Files:**
- Modify: `lib/creatures/monster.ts` (append `VampireAbomination = 168`
  after `Vampyre = 167`, the last value; its tpa code is `toCode(168)` = `4o`)
- Modify: `lib/translations/en/monster.ts` (`monster.vampire.name.abomination: "Abomination"`, next to `patriarch`)
- Modify: `lib/creatures/vampire.ts` (`VAMPIRE_AGES[7]`, a new
  `Ids.VampireWillDominationAbomination` appended at the end of `enum Ids`,
  `abominationVampire`, `createVampireEntry`, remove the WIP Bodhi
  adjustment from `patriarchVampire`)
- Create: `lib/creatures/vampire.test.ts`

**Interfaces:**
- Produces: `export const abominationVampire: (entry: CreatureEntry<Creature>) => Creature`,
  registered last in `createVampireEntry()`.
- Produces: optional `VampireAge` fields the Abomination needs and
  `vampire()` reads instead of its hard-coded values when set: `ac?: number`
  (default 1), `apr?: number` (default 1), `extraImmunities?: ImmunityName[]`
  and `extraEffects?: Effect[]` (appended to the trait). Later tasks use
  `abominationVampire`'s creature through `cre.setAdjustments`.

**Age values** (spec, "The Abomination age"): `level1 25`, `bonusHp 0`,
`strength 24`, `dexterity 24`, `intelligence 20`, `charisma 19`,
`movement 27`, `xpv 21000`, `turnAs "lich"`, `ac −4`, `apr 3`,
`magicResistance 75`, `regeneration 12`, `weaponImmunity "plusThreeWeapons"`,
no `sunlight`, domination `{ id: Ids.VampireWillDominationAbomination, mode: "will", saveBonus: -6 }`.
Extra immunities/effects: physical (slash/crush/pierce/missile) resistance
25, cold and electricity 100, magic damage resistance 50, Death (opcode 13)
immunity, see invisible, turn undead. Use the existing `ImmunityName`s where
one gives exactly that value (e.g. `"cold"`, `"physicalDamageResistance"`,
`"magicDamageResistance"`, `"turnUndead"`, `"seeInvisible"`). Otherwise
use an explicit effect. Claws: `levelDrain({ levels: 3 })`.

- [ ] **Step 1: Write the failing test**

`lib/creatures/vampire.test.ts`, building the entry like `entry.test.ts`
(`stateService.init()`, the vampire entry factory) and finding the creature
whose monster is `MonsterEnum.VampireAbomination`:

```ts
it("adds an Abomination age above Patriarch", () => {
  expect(abomination.data.level1.pnpValue).toBe(25);
  expect(abomination.data.strength).toBe(24);
  expect(abomination.data.dexterity).toBe(24);
  expect(abomination.data.intelligence).toBe(20);
  expect(abomination.data.charisma).toBe(19);
  expect(abomination.data.movement).toBe(27);
  expect(abomination.data.ac).toBe(-4);
  expect(abomination.data.apr).toBe(3);
});
it("dominates with a -6 save, Patriarch keeping -5", () => {
  // the memorized domination spell's save bonus, per age
});
it("regenerates 12 HP/round from its traits", () => {
  // sum of the trait item's opcode 98 effects, converted to HP/round = 12
});
it("leaves Patriarch's existing resource names unchanged", () => {
  // Patriarch's spell/item files equal the ones in today's mod/lib/pnp-monster/vampire/4m.tpa
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run lib/creatures/vampire.test.ts`
Expected: FAIL (`VampireAbomination` undefined).

- [ ] **Step 3: Implement the enum, translation, age, factory, and remove
  the WIP Bodhi adjustment from `patriarchVampire`**

- [ ] **Step 4: Run the test again**

Run: `npx vitest run lib/creatures/vampire.test.ts`
Expected: PASS.

- [ ] **Step 5: USER: remap the CSV.** In `assets/creatures.csv`, set
  MonsterId `VampireAbomination` on BODHI, BODHIAMB, CUBODHI, BODHI2,
  PPBODHI3, PPBODHI4, VVBODHI, C6BODHI, CBBODH66, DRBOD, CHEVIL08, FINBODH,
  OHB3BODH. Clear X#BODHI's MonsterId (she leaves the mod: spec, "X#BODHI
  leaves the mod"). Wait for the user to confirm.

- [ ] **Step 6: Regenerate and check**

Run: `npm run generate && npx vitest run`
Expected: all pass; `mod/lib/pnp-monster/vampire/4o.tpa` exists and patches
exactly the 13 files; `grep -i "x#bodhi" mod/lib/pnp-monster/vampire/*.tpa`
finds nothing; `4m.tpa` no longer lists any Bodhi file.

- [ ] **Step 7: Commit** (ask first)

```bash
git add lib/creatures/monster.ts lib/creatures/vampire.ts lib/creatures/vampire.test.ts lib/translations/en/monster.ts mod/
git commit -m "feat(vampire): add the Abomination age for Bodhi"
```

---

### Task 2: Per-encounter values, claws and the blood item

**Files:**
- Modify: `lib/creatures/vampire.ts` (`abominationVampire`)
- Test: `lib/creatures/vampire.test.ts`

**Interfaces:**
- Consumes: `abominationVampire` (Task 1).
- Produces: a blood regeneration item, created in `abominationVampire`
  (`+12 HP/round`, `effectFactory.regeneration(12)`, undroppable, equipped
  in a free ring/amulet-type slot). Its resref is exported as
  `ABOMINATION_BLOOD_ITEM` (a function or const reading
  `cre.item(Ids.VampireAbominationBlood).file`) for Task 3.
- Produces: claws per drain profile: 3 (age), 5, 5 + 4 magic damage
  (as `BODHI.ITM`: opcode 12 4 magic, as decoded in BODHI.md). Equipped per
  adjustment in WEAPON1.

**Adjustments** (one entry per file, per `variant-factory-adjust-model`;
values from the spec's "Per-encounter values" table):

| Files | Data |
|---|---|
| PPBODHI3 | level1 14, STR 21, DEX 20, AC −1, APR 8 (5/2), MR 30, physical/magic damage resistance 0, cold/electricity 50, no Death immunity / see invisible, drain 5 |
| PPBODHI4 | as PPBODHI3 but STR 22, DEX 21, drain 3 |
| VVBODHI | as PPBODHI4 but drain 5 |
| C6BODHI, CBBODH66, CHEVIL08, FINBODH, DRBOD | drain 5 + 4 magic claws, blood item |
| OHB3BODH | STR 21, DEX 20, cold/electricity 50, regeneration 60 HP/round in total, immunity to level 1–2 spells |
| every file | xpv = the higher of its own CRE XP and the age's |

CHEVIL08 keeps its allegiance and its non-vampire equipment (AMUL25,
BOOT01, POTN55): don't add them to `items.remove`. Add `"dw#bldd3"`,
`"bodhi"` and every other weapon or ring from BODHI.md's table that
`vampire()`'s `items.remove` lacks to the Abomination's own removal list.
Keep MINHP1, MINHP20 and MONHP1.

- [ ] **Step 1: Write the failing tests**

```ts
it.each([
  ["PPBODHI3", { level: 14, str: 21, dex: 20, drain: 5 }],
  ["PPBODHI4", { level: 14, str: 22, dex: 21, drain: 3 }],
  ["VVBODHI", { level: 14, str: 22, dex: 21, drain: 5 }],
])("keeps Spellhold's %s at or above its own file", (file, v) => { /* resolved adjustment data */ });
it("gives Ch6 and ToB the blood item and the magic-damage claws", () => {
  // C6BODHI, CBBODH66, CHEVIL08, FINBODH, DRBOD: blood item equipped, claws drain 5 + 4 magic
});
it("never removes Bodhi's story items", () => {
  // no adjustment or age removal list contains minhp1, minhp20, monhp1
});
it("gives OHB3BODH 60 HP/round", () => { /* trait 12 + its own 48 */ });
```

- [ ] **Step 2: Run, see them fail**

Run: `npx vitest run lib/creatures/vampire.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement the adjustments, claws and blood item**

- [ ] **Step 4: Run the tests, regenerate**

Run: `npx vitest run lib/creatures/vampire.test.ts && npm run generate && npx vitest run`
Expected: PASS. In `4o.tpa`, check each file's `patchCreature` values
against BODHI.md's table: none is below its own file.

- [ ] **Step 5: Commit** (ask first)

---

### Task 3: The holy water

**Files:**
- Modify: `lib/creatures/vampire.ts` (Abomination `script.edits`)
- Test: `lib/creatures/vampire.test.ts`

**Interfaces:**
- Consumes: `ABOMINATION_BLOOD_ITEM` (Task 2).

- [ ] **Step 1: Write the failing test**

```ts
it("makes C6BWEAK destroy the blood item instead of VAMPREG2", () => {
  const edit = abomination.data.script.edits?.find((e) => e.files.includes("C6BWEAK"));
  expect(edit?.replaces).toContainEqual([
    'DestroyItem("VAMPREG2")',
    `DestroyItem("${ABOMINATION_BLOOD_ITEM}")`,
  ]);
});
it("doesn't make her immune to Slow", () => {
  // no trait / age effect is an opcode 101 (immunity) to opcode 40
});
```

- [ ] **Step 2: Run, see it fail** (`npx vitest run lib/creatures/vampire.test.ts`)

- [ ] **Step 3: Add the `script.edits` entry**: `{ files: ["C6BWEAK"], replaces: [[…, …]] }`.
  Keep `C6BWEAK`, `C6WEAK` and `C6WEAK2` out of every `script.remove`.

- [ ] **Step 4: Run, regenerate, check**

Run: `npx vitest run && npm run generate`
Expected: PASS; `4o.tpa` has the `REPLACE_TEXTUALLY` in a `C6BWEAK`
`DECOMPILE_AND_PATCH`. Manual check: decompile the game's C6BWEAK (BIFF,
`weidu.exe --out <dir> c6bweak.bcs` run from `C:/Games/BG2EE`) and confirm
the decompiled text is exactly `DestroyItem("VAMPREG2")`. If it's spelled
differently, match the real text.

- [ ] **Step 5: Commit** (ask first)

---

### Task 4: Her SCS powers, cast by our script

**Files:**
- Modify: `lib/config/mods.ts` (`SPELLBOOK_MODS.ImprovedBodhi`, and its
  name in `SpellbookModName`)
- Modify: `lib/creatures/vampire.ts` (Abomination spellbook variants +
  abilities)
- Test: `lib/creatures/vampire.test.ts`

**Interfaces:**
- Produces: `SPELLBOOK_MODS.ImprovedBodhi = { name: "SCS Improved Bodhi", weiduCheck: "FILE_EXISTS_IN_GAME ~ibodhi5.spl~" }`.
  It's true with SCS #8080 and with the older Tactics version (both create
  `ibodhi*`).
- Consumes: `CreatureDataSpells.spellbooks` (a variant *replaces*
  `memorized` when its check passes) and `RawCreatureAbility.spell`
  (`{ resource, type: "force", memorizedSpellCheck: true, remove: true }`).

**What each tier memorizes in the `ImprovedBodhi` variant** (spec,
"Abilities"; on top of everything the age itself memorizes, so the list is
a superset):

| Files | ibodhi spells |
|---|---|
| BODHI2 | `ibodhi5` (Touch of Death), `ibodhi6` (Sepulchral Sleep) |
| C6BODHI, CBBODH66, CHEVIL08, FINBODH, DRBOD | `ibodhi4`, `ibodhi5`, `ibodhi6`, `ibodhi7` |
| everyone else | none (no variant) |

**Abilities** (targeting from BODHI.md, "Her extra abilities" and the SCS
script conditions), placed after the age's survival blocks (mist flee):
- Touch of Death: a target below 25% HP, or a level 9+ summon. Skip
  `HasItemEquiped("plat16", target)` wearers. 4-round timer.
- Sepulchral Sleep: skip elves, sleep-immune targets (`SLEEP_IMMUNITY`),
  `CHAOTIC_COMMANDS`, MR > 50. Once per fight.
- Chill of the Grave: a level 9+ target, cold resistance < 50, MR < 50.
  Once per fight. Use `alliesCheck` (the PWILT area).
- Deathly Shroud: `Difficulty(HARDEST)`, self, once.
- Every one: `HaveSpellRES` (memorized check), the age's form checks
  (`!CheckSpellState(Myself,JA_ANIMALFORM)` and
  `!CheckSpellState(Myself,JA_GASEOUSFORM)`), the shared round timer.

- [ ] **Step 1: Write the failing tests**

```ts
it("memorizes ibodhi spells only through the ImprovedBodhi spellbook", () => {
  // no file's base memorized list contains ibodhi*; BODHI2's variant has exactly ibodhi5, ibodhi6
  // C6BODHI's variant has ibodhi4..7
});
it("keeps every age power in the ImprovedBodhi spellbook", () => {
  // each variant's memorized ⊇ the file's base memorized
});
it("casts ibodhi spells only when memorized", () => {
  // each ibodhi ability: spell.resource ibodhi4..7, memorizedSpellCheck !== false
});
it("never casts Cloud of Bats or Abyssal Darkness", () => {
  // no ability or memorized spell references ibodhi1 / ibodhi2 / ibodhi3 / ibodhi8 / dw#nprun
});
```

- [ ] **Step 2: Run, see them fail**

- [ ] **Step 3: Implement the mod entry, the variants and the abilities**

- [ ] **Step 4: Run, regenerate, check**

Run: `npx vitest run && npm run generate`
Expected: PASS. In `4o.tpa`, the ibodhi `ADD_MEMORIZED_SPELL`s sit only
inside the `ACTION_IF FILE_EXISTS_IN_GAME ~ibodhi5.spl~` branch. In the
generated `jabm4o00.baf`, every ibodhi block has `HaveSpellRES("ibodhiN")`
and comes after the gaseous-form flee.

- [ ] **Step 5: Commit** (ask first)

---

### Task 5: Her own scripts keep only their story blocks

**Files:**
- Modify: `lib/creatures/vampire.ts` (Abomination `script.edits` /
  `script.remove`)
- Create: `mod/lib/pnp-monster/vampire/assets/bodhi/vanilla/BODHI2.BAF`,
  `C6BODHI.BAF` (vanilla versions decompiled from the BIFF, as test
  fixtures; `weidu.exe` run from `C:/Games/BG2EE`)
- Test: `lib/creatures/vampire.test.ts`

**Interfaces:**
- Consumes: `CreatureScriptEdit.removeBlocks` (each removes every
  `IF…END` block whose text contains the string, case-insensitive).
- Produces: a test helper `stripBlocks(baf: string, patterns: string[]): string[]`
  in the test file. It mirrors `weidu-creature.service.ts`'s
  `removeBlocksContaining` and returns the surviving blocks.

**Rules:**
- `script.remove` gets `"dw#chbod"` (CHEVIL08 keeps `chalDIE`).
- One `script.edits` entry for `BODHI2`, `C6BODHI`, `finbodhi` and
  `ppbodhi4`, whose `removeBlocks` patterns strip every combat, movement,
  spell and form block. A starting set, to adjust until the tests pass:
  `AttackOneRound`, `SelectWeaponAbility`, `MoveToObject`, `RunAwayFrom`,
  `RandomWalk`, `ibodhi`, `dw#nprun`, `dw#hprem`, `OpenDoor`, `EscapeArea`,
  `ClearActions`, `VAMPIRE_DOMINATION`, `WIZARD_CONTROL_UNDEAD`.
- Don't touch the dialogue/cutscene files' scripts (BODHI, BODHIAMB,
  PPBODHI3, `vvvamesc`, `vvbodhi`, `INIT1`, `SHOUTINV`, `chalDIE`). Read
  each one decompiled; if one has combat blocks that pre-empt ours, stop
  and report to the user instead of changing it.

- [ ] **Step 1: Write the failing tests**

```ts
const patterns = abominationStoryEdit.removeBlocks!;
it("keeps BODHI2's story on SCS and vanilla", () => {
  for (const baf of [scsBodhi2, vanillaBodhi2]) {
    const kept = stripBlocks(baf, patterns).join("\n");
    expect(kept).toContain('!GlobalTimerNotExpired("educational","LOCALS")');
    expect(kept).toMatch(/HPPercentLT\(Myself,25\)[\s\S]*StartDialogueNoSet/);
    expect(kept).not.toMatch(/AttackOneRound|ForceSpellRES|SelectWeaponAbility/);
  }
});
it("keeps C6BODHI's heal, death and archers", () => {
  // SCS: HPLT(Myself,10) + CLERIC_HEAL + StartDialogueNoSet; Die() + BODHI_MIST_FORM_CHANGE;
  // Die() + VAMPIRE_GAS_FORM_CHANGE; CreateCreature("bodfgt02"; no combat blocks.
  // vanilla: its own low-HP / death blocks survive, and no archer spawn appears
});
it("keeps finbodhi's DestroySelf and PPBODHI4's hunt", () => {
  // finbodhi: STATE_REALLY_DEAD + DestroySelf; ppbodhi4: every CreateCreatureObject wave,
  // J#BodhiUltimatum, NumberOfTimesTalkedTo, !Allegiance(Myself,ENEMY); no ReallyForceSpell left
});
it("drops dw#chbod", () => { expect(abomination.data.script.remove).toContain("dw#chbod"); });
```

- [ ] **Step 2: Run, see them fail**

- [ ] **Step 3: Add the edits; adjust the patterns until the tests pass
  without touching a story block**

- [ ] **Step 4: Run, regenerate**

Run: `npx vitest run && npm run generate`. Expected: PASS.

- [ ] **Step 5: Commit** (ask first)

---

### Task 6: Docs and final check

**Files:**
- Modify: `BODHI.md` (mark the built items done; point to the plan)
- Generated: `mod/docs/monsters.html`

- [ ] **Step 1: Regenerate and run everything**

Run: `npm run generate && npx vitest run && npx tsc -p . --noEmit && npx eslint lib/creatures/vampire.ts lib/config/mods.ts`
Expected: all clean.

- [ ] **Step 2: Never-weaken audit.** For each of the 13 files, compare
  `4o.tpa`'s values (level, STR, DEX, AC, APR, MR, resistances,
  regeneration, drain, XP) with BODHI.md's "Current CRE files" table. List
  any value below its own file, and fix it before going on.

- [ ] **Step 3: Docs check.** `mod/docs/monsters.html` has an Abomination
  section with the 13 files, its abilities, and the Spellhold / Ch6 / ToB /
  BP2 adjustment cards.

- [ ] **Step 4: Commit** (ask first)

- [ ] **Step 5: In-game test list for the user** (not automatable): the
  Ch3 lesson fight ends in dialogue; the Spellhold hunt plays out; in Ch6,
  the holy water takes her from 24 to 12 HP/round; she still turns to mist
  and goes to her coffin; the ToB Pocket Plane challenge and the Ascension
  ending work; on an install without SCS she has no ibodhi powers.

# aTweaks Generator — Functional Specification

## 1. Purpose

The **generator** is a TypeScript code generator that produces the WeiDU/BAF/IDS source files for **aTweaks**, a monster-overhaul mod for Infinity Engine games (Baldur's Gate: Enhanced Edition and family). Instead of hand-writing `.baf` (creature AI scripts) and `.tpa` (WeiDU patch code), mod content — creatures, spells, items, effects, AI behavior — is authored as strongly-typed TypeScript objects. The generator compiles that model into the actual WeiDU/BAF text files that WeiDU installs into the game.

**Primary design goals** (from the model and code):
- **Type safety over hand-written script**: every BAF trigger/action, IDS identifier, opcode, and CRE field is a typed TS construct, so invalid combinations are caught at compile time instead of failing silently at install/runtime.
- **Declarative content, generated behavior**: a creature file declares *what* a creature is (stats, abilities, immunities) and the generator derives *how* it behaves (target selection, casting logic, weapon selection, script structure).
- **Reduced predictability for players who read game files**: target lists and response weights are shuffled per generation (Fisher–Yates) rather than using a stable order (unlike SCS), so a fixed "attack order" can't be reverse-engineered from static files.
- **Single source of truth for shared rules**: immunities, spell groups, presets, and target lists are defined once in `config/` and reused across every creature/spell that needs them.

---

## 2. High-Level Architecture

```
lib/
├── config/            User-customizable declarative data (presets, immunities, target lists, spell registry…)
│   └── presets/        Ability-casting behavior templates, grouped by spell category
├── creatures/          Actual creature content, authored per monster family
├── spells/             Custom spell content needing bespoke effect logic
├── translations/        In-game strings (i18n), per language
├── templates/           HTML templates for the generated documentation site
└── src/
    ├── model/           Strongly-typed domain model (creature, script, spell-item, ids, final)
    ├── factories/        Stateless builders: declarative input → model/AST objects
    ├── services/         Business logic + all file I/O (BAF generation, WeiDU generation, effects, docs, translations)
    ├── state.ts          Global registry shared across the whole run
    └── index.ts          CLI entry point
```

Output is written to the **mod root**, one directory above `generator/` (`c:/Games/Baldur's Gate Enhanced Edition/aTweaks/`):
- `lib/pnp-monster/<family>/` — per-family BAF + TPA output
- `lib/common/` — shared WeiDU function libraries (spell resources, spell functions, immunities)
- `tra/<language>/generated.tra` — generated string tables
- `docs/monsters.html` — generated bestiary documentation

---

## 3. CLI Entry Point (`src/index.ts`)

Uses `commander` only for `--version`/`--description`/`--help`; there are no real subcommands or flags — it is a single fixed pipeline, run via `npm run atweaks` (`ts-node lib/src/index.ts`) or compiled via `npm run build` (`tsc`) into `lib/index.js`, exposed as the `generate` bin.

```
stateService.init()
  → mainService.checkPresets()
  → mainService.checkSpells()
  → mainService.generateCreatures()
  → mainService.generateCommonCode()
  → mainService.generateTranslations()
```

---

## 4. Global State (`src/state.ts`, `services/state.service.ts`)

`State` is a static registry populated once at startup and read/appended throughout the run:

| Field | Contents |
|---|---|
| `State.actions` / `State.triggers` | Parsed catalogs of every BAF action/trigger signature (from `model/script/actions.ts` / `triggers.ts`) |
| `State.immunities` | Fully resolved `ImmunityConfig[]`, merged from `config/immunity-config.ts` (`IMMUNITIES`, `RESISTANCES`, `TRAITS`), effects pre-compiled via the effect service |
| `State.modFolder` | Hardcoded to `".."` — the mod root, anchor for every output path |
| `State.creatures` / `State.spells` / `State.items` | Accumulators populated as content is authored, used for cross-referencing (e.g. resolving a spell's translated name in generated comments) |

`stateService.init()` also triggers auto-generation of immunity documentation as a side effect.

---

## 5. Data Model Layer (`src/model/**`)

The strongly-typed domain model that all content is authored against. Almost every model has an author-facing "partial/raw/input" counterpart (`PartialX`, `RawX`, `InputX`) built with generic helpers (`DeepPartial`, `PartialBy`, `DeepPartialBy`, `WithRequired`, `AtLeast` in `utility-types.ts`); a factory/service layer fills in defaults and produces the fully-resolved model that gets serialized.

### 5.1 Creature model (`model/creature/*.ts`)

- **`AbstractCreature`** — base class shared by `Creature` and `CreatureFamily`; owns `items`/`spells`/`projectiles` and provides `addItem`/`addSpell`/`addProjectile`/`addWeapon`/`attachSpellToWeapon` (auto-generates resource filenames and delegates construction to services).
- **`Creature`** — the central entity: `name` (translation key), `family`, `data: CreatureData` (full CRE stat block), `behavior: CreatureBehavior` (AI/abilities), `attack: CreatureAttack` (weapon/target logic), `files: string[]` (target CRE resrefs), `newFiles` (declarative CRE-copy instructions), `adjustments: CreatureAdjustment[]` (per-file overrides, e.g. summon variants), `effectFiles`, `autoGenerate` (toggles for computed THAC0/HP/enchantment/saves), `notEnforceFiles`. `addTrait()` synthesizes a hidden ring-slot item purely to carry passive effects/immunities.
- **`CreatureFamily<T>`** — a group of related creatures sharing items/spells/projectiles (e.g. all bear variants). `create()` builds a new creature; `createFrom()` clones an existing one as a variant baseline; `preset()/sequencer()/minorSequencer()` reference ability presets.
- **`CreatureData` / `MainCreatureData`** (`data.ts`) — direct model of a CRE file's stat block (ability scores, AC per damage type, saves, resistances, alignment/race/class/kit/gender, animation, script location, proficiencies, immunities, equipped items, memorized spells, effects). `CREATURE_DATA_FIELDS` is the declarative table mapping every field to its **binary offset in the CRE format**, with a value-formatting getter and optional custom merge setter — effectively the model-to-WeiDU-patch compiler for creature stats.
- **`InputCreatureData`** — author-facing shape (deep-partial, with `movement`/`level1-3` widened to accept plain numbers as shorthand).
- **`CreatureAdjustment`** — per-file/difficulty override layered on a base creature (`summon`, `noWeapon`, `scriptName`).
- **`CreatureAttack`** — melee/ranged availability, dual-wielding (auto-adjusts APR and proficiencies), `targetPriorities`, conditional weapon-slot selection, weighted attack actions.
- **`CreatureBehavior`** — AI flags (`help`, `tracking`, `walk`, `combatWalk`, `restHeal`, `usePotions`, `useKitAbilities`, `hideInShadows`, `canPolymorph`), `dialog`, `abilities: CreatureAbility[]`, `spellcaster?`, `customCodes`/`additionalCodes` (hand-authored script insertions at named hook points).
- **`CreatureAbility` / `RawCreatureAbility` / `CreatureAbilitySpell`** — special/innate abilities compiled into BAF response blocks; a `spell` shorthand (with cast type `normal|noDec|force|reallyForce`, recast-guard conditions, probability) is expanded by services into concrete actions — the clearest "author intent → generated BAF" abstraction in the codebase.
- **`SpellCaster`** — sequencer/contingency mechanics (minorSequencer, sequencer, contingency, chainContingency), referencing ability presets by name.
- **`KitConfig` / `KitAbility`** — declarative kit definition: level-scaling immunity/movement functions, abilities with level-scaled use counts.
- **`CreatureGrabConfig` / `GrabGlobalConfig`** — grapple-attack modeling (probability, save, duration, damage-per-round).
- **`Movement`** — stateful class converting a tabletop movement rate (`pnpValue`) plus bonuses/improved-haste into the in-engine tick value.
- **`ItemSlot` / `WeaponSlot` / `EquippedItem`** — inventory slot vocabulary and pre-equipped item descriptors.

### 5.2 Script model (`model/script/*.ts`)

Represents the BAF language as a typed discriminated-union AST, rendered to text by a separate service rather than string-templated by hand.

- **`Actions.Action`** (`actions.ts`) — ~70 typed BAF action interfaces (`Attack`, `MoveToObject`, `Spell`, `EquipItem`, `SetGlobal`, `Wait`, `CreateCreatureObject`, …), each with a literal `name` and typed `params`. `ACTIONS` is a parallel documentation/metadata table (name, WeiDU signature, description, section).
- **`Triggers.Trigger`** (`triggers.ts`) — ~130 typed BAF trigger/condition interfaces (`HaveSpell`, `HP`/`HPGT`/`HPLT`, `StateCheck`, `Range`, `Global`, `TimerExpired`, `RandomNum`, an `Or` meta-trigger, …), each with typed `params` and optional `negation`. `TRIGGERS` mirrors `ACTIONS`'s metadata shape.
- **`Statements` / `ConditionalStatement` / `Response` / `CustomCode` / `AdditionalCode`** (`script.ts`) — the structural "IF…THEN…END" block model:
  - `ConditionalStatement { comment?, target?, triggers, responses }`
  - `Response { weight, actions }` (BAF weighted-response mechanism)
  - `CustomCode { location, type: insertBefore|insertAfter|replace, statements, abilities }` — inserts hand-authored logic at one of ~19 fixed named hook points in the generated script (`attack`, `init`, `rest`, `dialog`, `shouts`, `potions`, `trackTargets`, `turnHostile`, `randomWalkCombat`, etc.) — revealing that the generator builds each creature script from a fixed template skeleton with well-defined insertion points, not free-form scripting.
  - `AdditionalCode` — lighter variant (just triggers+actions, no responses/weights).
- **`TargetList` / `TargetStatus` / `TargetPriority`** (`target.ts`) — named target-selection lists (`NearestEnemies`, `PCsFighters`, …) with filtering/ordering/limiting; target-status reactions (`Grabbed`, `Held`, `Stunned`, …); ordered target-priority rules for combat/attack logic.

### 5.3 Spell/Item/Effect model (`model/spell-item/*.ts`)

Models Infinity Engine SPL/ITM/EFF/PRO binary resources as typed data.

- **`Effect`** (`effect.ts`) — `BaseEffect` is the common opcode envelope (target, power, timing, parameters, duration, probability, dice, save types/bonus, flags, resource); ~45 concrete `XxxEffect` shapes discriminated by `opcode: EffectTypeEnum`, plus a `ParamLessEffect` catch-all for opcodes needing no extra fields. `EffectFile = Effect & {file}` represents an effect materialized as a standalone `.eff` resource.
- **`effect.enums.ts`** — supporting enums (`ColorEnum` — 256-value palette, `ItemCategoryEnum`, `ItemAnimationEnum`, `EffectDamageTypeEnum`, `SaveTypeEnum`, `EffectFlagsEnum`, `PortraitIconEnum` — ~200 status icons, spell/item bitflags, and `getCastSpellOnConditionValue()` mapping human-readable trigger conditions to opcode-232 values).
- **`effect.type.ts`** — `EffectTypeEnum`, the master opcode-number enum tying all `Effect` subtypes together.
- **`Spell` / `Item`** (`spell-item.ts`) — full SPL/ITM models: name/translation key, groups (auto-registers into named immunity/protection groups), effects, headers (one per ability/level), patch options (`copyFrom`, `deleteHeaders`/`deleteOpcodes` for modifying existing resources), `options` (casting-time overrides, auto-renew for innates, racial resistance injection). `Weapon = WithRequired<Item, "header">`. `WeaponCastSpell` — declarative "this weapon casts a spell on hit."
- **`Projectile`** (`projectile.ts`) — PRO resource model: type, speed, sounds, animation, color, extended/area-effect info (radius, explosion effect, cone width, etc.).
- **`SpellGroup`** (`spell-group.ts`) — named bucket of spells (by resref or IDS-id pattern) used to build cross-cutting immunity/protection groups.
- **`SpellProtection`** (`spell-protection.ts`) — models the opcode 318/324 parameter encoding: a stat/value/relation DSL for "protect against spells whose targeting matches X."
- **`PotionConfig`** (`potion.ts`) — potion resref list + conditional AI logic for when a creature should use it.

### 5.4 IDS constants (`model/ids/*.ts`)

TypeScript mirrors of the game's `.ids` lookup tables (alignment, allegiance/EA, animation, attack style, class, damage type, extended stats, gender, general category, kit, area type, object selectors, projectile/missile ids, race, slot, "specific" faction tags, spell identifiers, spell-state, creature state, stat identifiers) — giving compile-time safety to every place a trigger/action/effect needs a symbolic game identifier instead of a raw magic number/string.

### 5.5 Final leaf types (`model/final/*.ts`)

- **`ImmunityName` / `ImmunityConfig`** — `ImmunityName` is a ~100-entry closed union naming every supported immunity/resistance/trait. `ImmunityConfig` is the authoritative definition record: type (`trait|immunity|resistance`), doc visibility, implied/composite immunities, blocked opcodes/icons/strings/spell-groups, granted effects, optional item-slot carrier, and overrides — the master registry entry expanded into concrete SPL/ITM effects and creature-trait items.
- **`StringReference`** — `TranslationKey | number`: any in-game text can be a raw dialog.tlk strref or a translation key resolved later by the translation system.

### 5.6 Shared top-level files

- **`constants.ts`** — saving-throw tables by class/level, strength-to-hit/damage table, named duration constants in game ticks (`round`, `turn`, `hour`, …), shared object-selector shorthands.
- **`misc.ts`** — `BuilderOptions` (build-time flags), `CodeLine` (one indented output line), `AbilityPreset` (pairs a preset name with its ability definition).
- **`parameter.ts`** — `ParamType`/`ParamObject`, the classification of BAF parameter kinds (id/resref/number/object-selector).
- **`utility-types.ts`** — generic TS helpers (`DeepPartial`, `PartialBy`, `DeepPartialBy`, `WithRequired`, `AtLeast`, path/leaves template-literal machinery, non-function property filters) underpinning the Partial/Full model split used throughout.

---

## 6. Configuration Layer (`lib/config/**`) — primary user-customization surface

Per the README, this is where a modder makes changes without touching the generator engine or content files: plain declarative TS data typed against the model, no control flow beyond small factory helper calls.

| File | Role |
|---|---|
| `generate.ts` (`GLOBAL_CONFIG`) | Output/reference paths (core monster tpa, shared spell-resource/function/immunity tpa), generation-behavior toggles (`constitutionAffectHitPoint`, `spellcasterPrecastMidDurationSpells`), canonical BAF global-variable names (`bafConstants`) shared across every generated script, and `tpaConstants.genericScriptsToRemove` (vanilla scripts stripped from every patched creature). |
| `common.ts` | Custom splstate identifiers, `DEFAULT_SPELL_PROBABILITY` (70), `PRESET_NAMES`, reusable `TargetList[]` templates (charm/sleep/fear/hold fallback lists). |
| `creatures.ts` | Creature taxonomy: size table (`attackRange`/`grabModifier` by size), IDS-based creature-type groupings for special-case rules (vapor-immune, earth/air/water/flying/incorporeal/gargantuan/grab-immune/huge/large creatures), construct HP-by-size table. |
| `ability-presets.ts` + `presets/*.ts` | **The ability preset system** — the canonical "how to cast this spell/ability" behavior template (target-list composition with anti-globe/anti-resist checks, probability, cooldown, vocal requirement, self-target flag), organized by category (buff, charm, confusion, cure, damage, damage-aoe, death, debuff, disabling, dispel, fear, hold, sleep, summon). A creature references a spell by resref; the generator looks up the matching preset to auto-generate the BAF casting logic — one canonical behavior reused by every creature that has that spell. |
| `immunity-config.ts` | Largest config file — three parallel catalogs sharing the `ImmunityConfig` shape: `IMMUNITIES` (~50, full protections), `RESISTANCES` (50%-strength counterparts), `TRAITS` (composite creature-type packages like `undead`, `construct`, `fey`, `incorporeal` bundling many immunities + their own effects + optional carrier item in one name). |
| `item.ts` | Trait/immunity marker item registry (`ja#i1`…`ja#i18`), weapon icon enum. |
| `kit-ability.ts` (`KITS`) | Per-kit granted immunities/movement bonus/innate abilities with level-scaled usage counts. |
| `poison.ts` (`POISONS`) | PnP poison-type table (letter grades A–…): damage, save-damage, duration, fatal/immediate-death constants. |
| `potion.ts` (`POTIONS`) | AI rules for when NPCs use potions (HP-threshold triggers, undead exclusion, randomized probability). |
| `spell-group-name.ts` / `spell-group.ts` | Named spell-category taxonomy (`SpellGroupName`) and its concrete spell-membership mapping (`SPELL_GROUPS`) — referenced by immunity configs to auto-generate "protection from spell X/Y/Z" effects. |
| `spell-names.ts` (`SPELLS`, `FNP_SPELLS`) | Master spell registry: friendly name → `{file, id?, duration?}` — the primary lookup content authors use instead of hardcoding resrefs. |
| `spell-protection.ts` | Named reusable spell-protection opcode definitions, plus a collision table of existing vanilla spell-protection slots. |
| `stringRef.ts` (`EXISTING_STRING_REFERENCES`) | Vanilla game string-ref IDs reused instead of duplicating existing UI strings. |
| `target-config.ts` / `target-name.ts` | `TARGET_LISTS` — named target-selection list → ordered BAF target-object strings; `TargetStatusName` union for status-based ability filters. |

**What's customizable here in practice**: cast probabilities, target-list composition/order, per-spell cast guard conditions, cooldowns, immunity/resistance/trait bundles and their effects, spell taxonomy, poison/potion tables, kit bonuses, and global BAF constants/removed-script lists.

---

## 7. Content Layer (`lib/creatures/**`, `lib/spells/**`)

### 7.1 Creatures

- `creatures/index.ts` exports `familyFactories: (() => Family)[]` — one factory per monster family (ankheg, basilisk, bear, cat, construct, crawler, dog, ettercap, ettin, fey, golem, minotaur, ogre, plant, slime, spider, undead, werewolf, wolf, wyvern).
- Each family file defines a `class X extends Creature` (helper methods for reusable weapon/attack templates, e.g. `createPaws()`, `createJaws()`, `createTouch()`) and a `class XFamily extends CreatureFamily<X>` whose constructor builds each named variant via `this.create({ monster, name, files, data })`, chaining `.createPaws(...)`, `.setBehavior({ walk, customCodes, abilities })`, `.setAdjustments([...])`.
- `data` fields map to D&D stat-block concepts (ability scores, AC, APR, XP value, alignment, morale, race/class/gender IDS identifiers, size, movement, item/script removal lists, immunities referencing the config layer).
- Custom BAF snippets are injected via `CustomCode` (raw triggers/responses at named hook points); innate abilities are declared via full custom spell/item definitions or by referencing `SPELLS`/`FNP_SPELLS` and letting the preset system supply casting logic.
- `creatures/monster.ts` centralizes `MonsterEnum`/`MonsterFamilyEnum`; `creatures/common.ts` holds cross-family shared `CustomCode` (e.g. hunter AI).

### 7.2 Spells

- `spells/index.ts` exports `SPELL_FUNCTIONS: Spell[]` — a small curated list of spells needing bespoke effect logic beyond a preset (call woodland beings, color spray, dimension door, cone of cold, projectiles).
- Example: `color_spray.ts` builds a fully custom, level-scaled multi-header spell. `cone_of_cold.ts` exports a factory function returning a `PartialSpell` parametrized by damage/projectile, reused by multiple monster-specific variants while still tying into the preset system for casting logic.
- Most "ordinary" spells need no file here at all — referenced purely by resref via `config/spell-names.ts`, with casting behavior supplied entirely by `config/presets/*.ts`.

---

## 8. Factories (`src/factories/*.ts`) — stateless model/AST builders, no I/O

| Factory | Responsibility |
|---|---|
| `action.factory.ts` | Helper builders (`setGlobal`, `setGlobalTimer`, `enableInterrupt`, `disableInterrupt`) → `Action`/`Action[]`. |
| `trigger.factory.ts` | Helper builders (`hplt`, `range`, `allegiance`, `stateCheck`, target-validity bundles, `Or` composition) → `Trigger`/`Trigger[]`. |
| `response.factory.ts` | Wraps actions into weighted `Response`s; builds one response per configured attack with weapon-slot/interrupt handling. |
| `baf.factory.ts` | Expands triggers/targets/responses into one or more `ConditionalStatement`s per target-list entry, or a combined OR-block — turning "attack N target-list entries" into repeated IF/THEN BAF blocks. |
| `preset.factory.ts` | Clones a `RawCreatureAbility` template across multiple preset names. |
| `ability.factory.ts` | `polymorphSelf` — self-buff + weighted-random true-polymorph-form ability set. |
| `creature.factory.ts` | Core creature assembly: merges input data into `CreatureData` via `CREATURE_DATA_FIELDS`, resolves behavior/abilities, and `validate()` — the final gate (duplicate-id checks, defaults, cascades into stat computation, immunity handling, weapon checks, doc generation). |
| `effect.factory.ts` | Reusable composite effect bundles (`damageOverTime`, `paralyze`, `restrained`, `cureAll`, `charm`, `blindness`, `fear`, `levelDrain`, `naturalMovementSpeed`). |

---

## 9. Services (`src/services/**`) — business logic + file I/O

### 9.1 BAF generation (`services/baf/*.ts`)

- **`statement-builder.service.ts`** — the heart of AI-behavior generation: ~20 ordered builder stages (`dialog`, `init`, `rest`, `precastLongDurationSpells`, `turnHostile`, `detectCombat`, `shouts`, `followSummoner`, `randomWalkNoCombat`, `noActionOutsideOfCombat`, `handlePanic`, `thievesAbilities`, `precastMidDurationSpells`, `creatureAbilities`, `potions`, `attack`, `trackTargets`, `randomWalkCombat`), each supporting `customCodes`/`additionalCodes` insertion.
- **`ability.service.ts`** — resolves declarative abilities (presets, spell refs) into fully realized `CreatureAbility` objects with trigger guards, probability rolls, and Sequencer/MinorSequencer composition.
- **`target.service.ts`** — resolves named target lists into concrete WeiDU object strings and computes attack-target priority ordering.
- **`baf-generator.service.ts`** — final text emission: converts statements to raw BAF (`IF…THEN RESPONSE #weight…END`), formats parameters, and **writes** `lib/pnp-monster/<family>/<creatureId-hex>.baf` (+ `...su.baf` for summon variants).

### 9.2 WeiDU (.tpa) generation (`services/weidu/*.ts`)

All extend `AbstractWeiduService` (shared byte-offset write helpers, conditional per-file source guards).

| Service | Output |
|---|---|
| `weidu-core.service.ts` | `lib/pnp-monster/common/core.tpa` — custom IDS entries, common projectiles, immunity-carrier item creation. |
| `weidu-creature.service.ts` | Per-creature `.tpa`: compiles the BAF, creates owned projectiles/effects/spells/items, patches every target `.cre` file (stats, items, spells, immunities, script assignment), applies adjustment overrides. |
| `weidu-family.service.ts` | `main.tpa` per family — aggregates `INCLUDE`s of each creature `.tpa` plus family-level shared resources. |
| `weidu-function.service.ts` | Shared libraries: `lib/common/spell-resources.tpa`, `spell-functions.tpa`, `immunities.tpa`. |
| `weidu-effect.service.ts` | Universal effect-opcode emitter (`ADD_EFFECT`/`ADD_ITEM_EQEFFECT`/`ADD_CRE_EFFECT`) and standalone `.eff` file creation. |
| `weidu-item.service.ts` | Item creation (header, ability headers, effects, immunity function attachment). |
| `weidu-projectile.service.ts` | Projectile creation (`.pro` field writes, area-effect structures). |
| `weidu-spell.service.ts` | Spell creation (headers, effects, immunity attachment, patch-mode header/opcode deletion). |

### 9.3 Effects (`services/effects/*.ts`)

- **`effect.service.ts`** — universal declarative-`Effect` → opcode/parameter1/parameter2/special resolver (~70+ opcode cases), used by nearly every other service/factory that touches effects.
- **`grab.service.ts`** — grapple mechanic: hidden spell + melee-triggered cast applying grabbed-status effects, save bonus from strength/size, size-based grab immunity.
- **`immunity.service.ts`** — walks a creature's immunity list, resolves item-slot conflicts (e.g. helmet requirement for critical-hit immunity), pushes carrier items into equipped items.
- **`poison.service.ts`** — PnP poison-letter-grade → WeiDU `WeaponCastSpell` compiler (damage/duration math, special-cased paralytic/coma/weaken/wraith-spider types).

### 9.4 Documentation (`services/doc/*.ts`)

- **`description.service.ts`** — converts effects/items/spells/immunities into human-readable English descriptions (weapon stat blocks, trait descriptions, per-opcode effect text), registered as new in-game string refs so they become real item/spell descriptions.
- **`documentation.service.ts`** — builds the static HTML bestiary: simple `{{token}}` template replacement (strict — throws on missing tokens) over `templates/index.html` + `templates/monster.html`, one card per creature, plus an immunity/trait glossary, written to `docs/monsters.html`.

### 9.5 Top-level services

- **`creature.service.ts`** — statistical derivation during validation: kit bonuses, dual-wielding APR adjustment, dexterity-based AC, movement adjustments, half-integer APR normalization, weapon defaults, and PnP-style HP/THAC0/saving-throw autogeneration.
- **`item.service.ts`** — builds `Item`/`Weapon` model objects, slot-membership helpers.
- **`kit.service.ts`** — applies class-kit bonuses (immunities, level-scaled spell-like abilities), handles kit removal on adjustments.
- **`spell.service.ts`** — builds `Spell` model objects, auto-injects racial-resistance/self-protection effect files, registers spells into state.
- **`translation.service.ts`** — the i18n → in-game-string pipeline (§10).
- **`state.service.ts`** — bootstraps `State` (§4).

### 9.6 Utilities (`services/utils/*.ts`)

- **`utils.service.ts`** — token replacement in cloned trigger/action trees, string-ref resolution, naming helpers, recursive immunity-inheritance checks, the canonical `writeFile()` primitive (used by BAF/translation output), per-family output folder resolution, spell-type/level inference from filename prefix.
- **`weidu.utils.ts`** — small formatting helpers (`getIntegerValue`, `getBooleanValue`, `getIdsValue`).
- **`misc.func.ts`** — deterministic filename generators (`ja#<s|i|p><indexHex><f|m><creatureIdHex>` — the `ja#` mod resource namespace).
- **`string-ref.utils.ts`** — looks up pre-existing vanilla string references by symbolic name/group.

---

## 10. Translations (`lib/translations/**`)

- `translations/en/*.ts` — plain nested TS object literals (common, monster, spell, item, description, ability) holding every in-game string (creature/ability/item/spell names and descriptions, including alternate 5e-flavor text variants).
- `translations/i18n.ts` — declares `LANGUAGES` (english, french, german, italian, polish, russian, spanish); only English is currently populated, other languages fall back to it. `TranslationKey` is a computed literal-union of every leaf dot-path in the English bundle, giving compile-time-checked autocomplete for every `name: "monster.bear.name.black"`-style reference used throughout content/config.
- `translation.service.ts` — assigns each translation key a sequential string ref (starting at 10000), supports ad-hoc custom translations (used by description/poison services for generated text) and `{{var}}` interpolation, and finally emits `@<ref> = ~<text>~` lines per language into `tra/<lang>/generated.tra`.

---

## 11. Templates (`lib/templates/`)

Two plain HTML files with `{{placeholder}}` tokens (manual string replacement, not a real template engine despite `ejs` being a dependency):
- `index.html` — documentation page skeleton (`{{families}}`, `{{monsters}}`, `{{traits}}`).
- `monster.html` — per-creature stat-block fragment (ability scores, AC, movement, HD, THAC0, APR, attacks, traits, size, morale, XP, abilities), concatenated into `index.html`'s `{{monsters}}` slot.

---

## 12. Output Layer

All output is written under the mod root (`aTweaks/`, one level above `generator/`):

```
lib/pnp-monster/
├── <family>/                 (ankheg, basilisk, bear, cat, construct, crawler, dog,
│                              ettercap, ettin, fey, golem, minotaur, ogre, plant,
│                              slime, spider, undead, wolf, wyvern)
│   ├── main.tpa               family orchestrator: shared setup + INCLUDEs of each creature .tpa
│   ├── <creatureId-hex>.tpa   per-creature WeiDU patch (CRE/ITM/SPL creation + ACTION_FOR_EACH cre patch)
│   ├── ja#m<id>.baf           per-creature AI script
│   └── ja#m<id>su.baf         summon-variant AI script (if applicable)
└── common/
    └── core.tpa               shared IDS entries, common projectiles, immunity-item creation

lib/common/
├── spell-resources.tpa        DEFINE_ACTION_FUNCTION get_<group>_resources per spell group
├── spell-functions.tpa        DEFINE_ACTION_FUNCTION create_spell_<name> per spell
└── immunities.tpa             DEFINE_PATCH_FUNCTION <name>_<type> per immunity/resistance/trait

tra/<language>/generated.tra    generated WeiDU string table (per configured language)
docs/monsters.html              generated static bestiary documentation
```

A per-creature `.tpa` (e.g. black bear's `4.tpa`) typically: compiles its `.baf` script(s); creates any owned spells/items (weapon attacks, special abilities) via raw byte-offset writes; then `ACTION_FOR_EACH`-patches every vanilla `.cre` resource sharing that creature's stat block — validating it, stripping existing effects/spells/items/proficiencies, writing the full stat block (`LPF patchCreature`), assigning the generated script (`LPF patchCreatureScript`, including the configured `removeScripts` list), and applying any per-file adjustment overrides (e.g. summon variants get zeroed XP and `SUMMONED` gender).

---

## 13. End-to-End Pipeline

```
index.ts
 └─ stateService.init()                         load Actions/Triggers catalogs, resolve Immunities, generate immunity docs
 └─ mainService.checkPresets() / checkSpells()   validate ability-presets.ts / spell-names.ts
 └─ mainService.generateCreatures()
     for each familyFactory (creatures/index.ts):
       family = factory()                       builds all Creature objects via addSpell/addItem/addWeapon/
                                                  setData/setBehavior/setAttack/validate
       descriptionService.generateCreatureSpells/Items(...)
       weiduFamilyService.createOrUpdateMainFile(family.id)
       weiduFamilyService.generateFamilyData(family)
       for each valid creature:
         bafGeneratorService.generate(creature)      → <family>/ja#m<id>.baf (+ su.baf)
         weiduCreatureService.generateWeiduScript(creature)
                                                      → <family>/<id>.tpa, registers INCLUDE in main.tpa
       weiduFamilyService.generateFinalCode(family)
       documentationService.addFamily(family)
     documentationService.generate()             → docs/monsters.html
 └─ mainService.generateCommonCode()
     weiduCoreService.generateSpellStates()/generateProjectiles()  → common/core.tpa
     weiduFunctionService.generateSpellResources/Functions/Immunities()  → lib/common/*.tpa
 └─ mainService.generateTranslations()
     translationService.generateWeiduFiles()      → tra/<lang>/generated.tra
```

**Key architectural pattern**: factories are pure, stateless AST/model builders with no I/O; services resolve declarative config into concrete WeiDU semantics and perform all disk writes. `State` is the shared registry threading data (translated names, cross-references) between every layer, populated up front and appended to as content is declared.

---

## 14. Customization Guide (summary)

| Change you want to make | Where to edit |
|---|---|
| Add/adjust a monster or its stats/abilities | `lib/creatures/<family>.ts` |
| Add a custom spell with bespoke scaling logic | `lib/spells/*.ts` |
| Change how a spell/ability is cast (targeting, probability, cooldown) | `lib/config/presets/*.ts` / `lib/config/ability-presets.ts` |
| Add/adjust an immunity, resistance, or creature-type trait bundle | `lib/config/immunity-config.ts` |
| Add/rename a spell resource reference | `lib/config/spell-names.ts` |
| Change target-selection lists | `lib/config/target-config.ts` |
| Change poison or potion behavior | `lib/config/poison.ts` / `lib/config/potion.ts` |
| Change kit bonuses | `lib/config/kit-ability.ts` |
| Change global generation behavior/BAF constants | `lib/config/generate.ts` |
| Change or add in-game text | `lib/translations/en/*.ts` |
| Change generated documentation layout | `lib/templates/*.html` |

Generate the mod with `npm run atweaks` from the `generator/` folder; because target-list shuffling uses Fisher–Yates, every generation run reshuffles response/target ordering across all scripts.

# Move preset ability-name translations onto the SPELLS constants

## Problem

Preset files (`lib/config/presets/*.ts`) give each ability a display name via
a hardcoded string like `name: "ability.Vocalize"`, resolved against
`lib/translations/en/ability.ts`. This has drifted: `ability.ts` mixes
lowerCamelCase and PascalCase keys for no reason, and has dead entries (e.g.
`CloakOfFear` is defined but nothing references it — only the lowercase
`cloakOfFear` variant is ever used). The string is also disconnected from the
`SPELLS` constant it names, so nothing catches it if the two drift apart.

Mapping all ~100 preset `name: "ability.X"` usages against the spell each
belongs to (see below) shows the relationship is 1:1 in the overwhelming
majority of cases — exactly the shape that fits directly on the `SPELLS`
entry instead of floating free in the preset file.

## Design

### New `name` field on the spell reference types

```ts
// spell-names.ts
export interface SpellReference {
  file: string;
  id?: SpellIdentifier;
  name?: string; // translation key, e.g. "spell.Vocalize.name"
  duration?: "long" | "mid" | "short";
}
```

```ts
// spell-item.ts
export interface BaseSpell {
  file: string;
  type: SpellTypeEnum;
  level: number;
  name?: string; // translation key
}
```

`name` is populated only for the ~90 spells (of ~135 catalogued) actually
used as a preset/ability display name — not a blanket addition to every
entry.

### Translations move into `spell.ts`

New entries are added to `lib/translations/en/spell.ts`, nested as
`<Key>: { name: "Display Name" }` to match its existing shape (used today by
`lib/spells/*.ts`'s own `{ name, description }` spells). The key casing
matches the `SPELLS`/`FNP_SPELLS` property it belongs to (PascalCase, e.g.
`Vocalize`, `CloakOfFear`), since that's the string already being typed at
the call site — no separate re-casing step.

Three spells already have a `lib/spells/*.ts` definition with its own
lowerCamelCase `spell.ts` entry: `DimensionDoor` → `spell.dimensionDoor`,
`ConeOfCold` → `spell.coneOfCold`, `CallWoodlandBeeings` →
`spell.callWoodlandBeeings`. Their `SPELLS` entry's `name` field points at
that *existing* entry (e.g. `SPELLS.Wizard.DimensionDoor.name =
"spell.dimensionDoor.name"`) rather than creating a PascalCase duplicate for
the same spell.

### Spells offered as both a base-game and Faiths & Powers version

Nine ability names are shared by a preset that offers a base-game `SPELLS`
spell and its Faiths & Powers `FNP_SPELLS` counterpart as interchangeable
alternates (`presetFactory.create([SPELLS.X.file, FNP_SPELLS.Priest.Y.file],
{...})`): `Doom`, `GreaterMalison`, `CloudOfPestilence`, `Emotion`,
`RigidThinking`, `CloakOfFear`, `AnimateDead`, `CauseSeriousWounds`, `Chaos`.
For these, `name` is defined on the base-game `SPELLS` entry only (it's
always present, unlike the FNP variant which depends on mod selection); the
preset references that one field for both.

Two ability names are shared across two base-game spells from different
classes with no FNP involvement — `holdPerson`
(`SPELLS.Priest.HoldPersonCleric` + `SPELLS.Wizard.HoldPersonWizard`) and
`dispelMagic` (`SPELLS.Wizard.DispelMagicWizard` +
`SPELLS.Priest.DispelMagicCleric` + `SPELLS.Wizard.RemoveMagic`). `name` is
defined on the first-listed spell in each case and reused for the others.

Spells that only exist as an FNP variant with no base-game equivalent
(`FrostFingers`, `Shatter`, `WavesOfFatigue`, `ShadowMonsters`,
`DemiShadowMonsters`, `SummonShadows`, `Shades`, `CauseDisease`,
`CauseLightWounds`, `CauseCriticalWounds`) get `name` on the `FNP_SPELLS`
entry directly, since there's nothing else to hang it on.

### Preset call sites

The ~100 `name: "ability.X"` occurrences across the 14 preset files become
`name: SPELLS.Section.Key.name` (or `FNP_SPELLS.Priest.Key.name` for the
FNP-only cases above).

### `ability.ts` cleanup

Once a preset stops referencing an `ability.ts` key, that entry is deleted.
What remains is the handful of entries that aren't 1:1 with a single spell
and stay out of scope for this pass (see below).

## Out of scope

- Non-preset call sites that reference a single spell by a hardcoded
  `ability.X` string (`kit-ability.ts`'s two rage abilities,
  `ability.factory.ts`'s `polymorphSelf`) — left as-is.
- `ability.ts` entries that aren't 1:1 with a single spell: `enrage` (shared
  by `BerserkerRage`, `BarbarianRage`, and a bear ability with no spell
  backing at all), `unknown`, `test`, `MinorSequencer`, `Sequencer`. These
  stay in `ability.ts`.
- No change to the translation *content* (display strings) — only where the
  key lives and how it's referenced.

## Verification

Same as the last two refactors: `npm run build` (tsc), `npx eslint lib`,
`npx vitest run`. The golden end-to-end pipeline test
(`pipeline.golden.test.ts`) byte-compares every generated file — including
the `.tra` translation files — against what's committed, so a wrong or
mismatched translation key surfaces there even though no test asserts
translation strings directly.

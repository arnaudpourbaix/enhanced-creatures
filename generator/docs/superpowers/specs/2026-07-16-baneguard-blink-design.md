# Baneguard's defensive Blink ability

## Problem

`TODO_ROADMAP.md` flags an unimplemented ability on the Baneguard (Bladed
Skeleton, `lib/creatures/undead.ts:2068`): `// TODO: Blink, 4 rounds duration
on a 14 rounds timer`. The roadmap's own investigation concluded this needed
its own design rather than reusing the Dog's `createBlink()` (`dogs.ts:56`),
since that one is an aggressive teleport-strike-in-melee mechanic (`Teleport`
opcode + Thac0 bonus + an attack action), not a defensive self-buff.

Opcode 222 (`EffectTypeEnum.TeleportField`) is the real IE-engine "Blink"
effect — it causes the target to randomly teleport away whenever struck,
for the duration it's active. It's already fully modeled in this codebase
(`TeleportFieldEffect` in `effect.ts:441`, dispatched in
`effect.service.ts:182`) but has never been used as a creature effect
before — only as a shared preset (`SPWI421`, `disabling-presets.ts:291`)
that targets enemies offensively, which is unrelated to this use case.

## Design

### Approach

A fully self-contained ability, minted via `addSpell()`, independent of the
shared `SPWI421` preset — same shape as the Dog's `createBlink()`, but with
`TeleportField` instead of `Teleport`, and no attack follow-up. This avoids
a real risk with reusing the shared preset: `applyPreset()` merges a
creature's ability overrides via `deepmerge(preset.ability, ability, {})`
with default (concatenating) array-merge behavior (per `BUGFIX_ROADMAP.md`
#1) — overriding the preset's `targets: [{ name: "Players" }]` with
`targets: [{ name: "Self" }]` would likely concatenate rather than replace,
leaving Baneguard's Blink still also targeting enemies. It would also change
shared config the Ghost's spellbook also depends on.

### `undead.ts` changes

- Add `Blink` to the existing `Ids` enum (`undead.ts:49`).
- In `baneguard()`, replace the TODO comment with the `addSpell()` call
  below, inlined directly into `baneguard.setBehavior().abilities` alongside
  the existing Magic Missiles ability entry — no separate method, since
  (unlike the Dog's `createBlink()`) this ability belongs to a single
  one-off creature, not something shared across the Undead family.

### Ability shape

```ts
this.addSpell({
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
    spell: { },
    requireVocal: false,
    triggers: [{ name: "Range", params: ["NearestEnemyOf", 5] }],
  },
});
```

- **Header**: `Magical`/`Caster` (self-cast, no attack component) — the
  `slimes.ts:89` pattern, not the Dog's `Melee` header. `speed: 1` casts it
  as close to instantly as possible, appropriate for a defensive reaction.
- **Effect**: `InstantLimited` + `duration` is this codebase's "active for N
  seconds" pattern (same shape as the Dog's Thac0Bonus effect). `maxRange:
  10` is the random-teleport escape distance (your call, no prior
  `TeleportField`-as-creature-effect precedent existed to match against).
- **`options: { renew: 14 }`**: this is the actual recast mechanism, not
  just a documentation value — `SpellOptions.renew` ("Spell will be removed
  and added again after set rounds, so you only need to memorize it once.
  (only work for innates)", `spell-item.ts:102`) compiles to a real
  `CHANGE_SPELL ... renew=14` macro call (`weidu-spell.service.ts:55`). This
  is what makes a plain `memorizedCount: 1` + `spell: {}` (normal type, no
  `noDec`) sufficient: the engine itself re-grants the spell every 14 rounds,
  which is why the separate `timer`/`noDec` pattern Magic Missiles uses
  (a script-side cooldown wrapper) isn't needed here.
- **`requireVocal: false`**: matches Magic Missiles — a skeleton has no
  verbal component to interrupt.
- **Trigger**: `Range(NearestEnemyOf, 5)`, no negation — casts only when an
  enemy has closed to melee range (your call; matched to `golems.ts:240`'s
  existing "close" cutoff, used there as a negated ranged-attack gate,
  here used positively).

### Translation

Add `blink: "Blink"` under `undead.ability` in
`lib/translations/en/monster.ts` (next to the existing `dog.ability.blink`
entry, `monster.ts:96`) — a plain string, not the `{ name, description }`
object shape used by `addTrait()`-documented abilities elsewhere in the same
`ability` object, since this is a full spell (its own doc entry is
auto-generated from the spell/effect data, same as the Dog's Blink).

### Verification

Same process as the closed roadmaps: `npm run atweaks` to regenerate,
diff the Baneguard's `.baf`/`.tpa` output and `docs/monsters.html` to confirm
only the expected new ability shows up, then `npm test`.

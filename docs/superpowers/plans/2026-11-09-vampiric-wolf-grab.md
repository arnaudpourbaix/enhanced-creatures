# Vampiric Wolf Grab Plan

**Status:** agreed 2026-11-09, not implemented yet.

**Goal:** bring the vampiric wolf's attack pattern in line with PnP: a bite trips the prey, a called shot at -4 grasps a limb, the victim escapes only by a Strength check (one attempt per round), the wolf gnaws every round, and a grasped arm can't use a weapon.

**Code:** `lib/creatures/wolf/vampiric-wolf.ts`, `lib/src/model/creature/grab.ts`, `lib/src/services/effects/grab.service.ts`, `docs/research/grab-mechanic.md`.

## PnP reference

> A bite attack will cause a running or standing victim to fall if the victim fails a saving throw vs. paralysis. Once the prey falls, the wolves continue to attack, shifting to the victim's arms so that he can no longer use a weapon. This involves a called-shot attack in which a vampiric wolf has a -4 penalty to hit; success means the wolf has grasped an arm in its mouth, and the victim cannot get free unless he makes a successful Strength check (one attempt per round). A victim's legs may be similarly grasped. Once a grasping bite is made, damage is continually inflicted each round as the wolf gnaws on the limb.

## Current behavior

- Every bite: Sleep 2 rounds, save vs. paralysis, wakes on damage (the "fall"). Matches PnP.
- Target priority: grabbed, then sleeping victims (sleepers through Player1–6). Matches PnP.
- WEAPON2 (vs. sleepers): grab with `trigger: "both"` and `onlyGrabProneTarget`. The victim saves vs. paralysis at -1 (Strength +1, Small -4, prone +4) to avoid the grab, then the same save every round. No -4 to hit.
- WEAPON3 (vs. grabbed): +30 to hit bite standing in for the gnawing. It uses the wolf's only attack, applies Sleep again to a held victim, and gives the HP gain again.
- The hold: no movement, -4 AC, -4 THAC0, no Dexterity bonus. The victim still attacks.

## Changes

### 1. Called-shot grab (vampiric wolf)

- [ ] WEAPON2: `bonusToHit: -4`, grab `trigger: "probability"`, so a hit grasps with no save.
- [ ] WEAPON2 grab: `damagePerRound` = the bite's damage, `addStrengthBonus: true`. The wolf stops attacking while it holds, like the ankheg.
- [ ] Remove WEAPON3 and its `Grabbed` entry in `targetStatusWeaponSlot`. Keep the `Grabbed` target priority so the pack still converges on the held victim.
- [ ] Update the vampiric wolf row in the "Current users" table of `docs/research/grab-mechanic.md`.

### 2. Arm grasp: victim can't attack (generic grab option)

- [ ] New `CreatureGrabConfig` option (e.g. `victimNoAttack`): the hold sets the victim's attacks per round to 0, for the hold's duration. Reuse the opcode the grip already uses on the grabber (tested in game).
- [ ] Vampiric wolf WEAPON2 uses it.
- [ ] The grab's description mentions it.
- [ ] Test in `grab.service.test.ts`.

### 3. Escape by Strength check (generic grab option)

**Rule:** d20 ≤ Strength frees the victim, so the chance to stay held is (20 − STR) × 5%. STR 18: 10%, STR 10: 50%, STR 20+: always free.

**Config:** `escape?: "save" | "strength"`, default `"save"`, so the ankheg, revenant and hell hound don't change.

**Mechanism:**

- The check spell has no save. A spell application rolls one probability value that all its effects share. grab-mechanic.md already relies on this for the seize and the hold.
- Split that roll into 5% slices. Slice k (probability 5(k−1)..5k−1) is an op 326 (Apply effects list) that applies only when the victim's STR < 21 − k. SPLPROT.2DA row 125 `STAT(STR)<n` already exists (`ADD_SPLPROT_ENTRY` can add rows if needed).
- A victim with Strength S has 20 − S active slices, and only one slice can match the roll, so it stays held with probability (20 − S) × 5%. No extra roll is needed.
- The op 326 applies a new "fail" spell that casts the hold and deals the grip's damage. Today the check does both on a failed save.
- About 17 slices cover STR 3–19.
- The check reads the victim's current Strength, so the Strength spell, girdles and Strength drain all count.

**Tasks:**

- [ ] `escape` option in `grab.ts`, built in `grab.service.ts` (check spell + fail spell).
- [ ] The description says "Strength check" in place of the save.
- [ ] Tests in `grab.service.test.ts`.
- [ ] Vampiric wolf WEAPON2 uses `escape: "strength"`.
- [ ] grab-mechanic.md: spell chain table and configuration table.

**Details:**

- Exceptional Strength (18/xx) counts as plain 18. Could give +1 at 18/51+ if wanted.
- No modifier for now. An optional `strengthCheckModifier` could shift the slices later.

**In-game test (risk):** check that op 326 effects share the spell's single probability roll. If they don't, the fallback is one op 326 per STR value (SPLPROT "STR equals", the existing `ANALYZE_STRENGTH` row) with its own probability. That roll is per effect, but only one effect matches a given victim, so the odds come out the same.

## Open question

- The wolf gains 8 + Strength damage bonus HP on every bite. PnP only has the wolves drinking blood once the victim is helpless. Keep it on every bite, or only on bites against helpless victims (WEAPON2 and the grip damage)?

## Verification

- `npm test`, regenerate mod/, and read the vampiric wolf output (`mod/lib/pnp-monster/vampiric-wolf/`): only the wolf and the grab service output should change when `escape` and `victimNoAttack` are off by default.
- In game: grab lands on a sleeper at -4, a high-STR victim escapes most rounds, the victim can't attack while held, the wolf gnaws every round.

# Spell registry vs installed-mod snapshots

## File collisions (2)

Two or more SPELLS entries share the same resource file.

| file | entries | verdict |
| --- | --- | --- |
| SPWI106 | Wizard.Blindness (001_vanilla); Wizard.ObscuringMist (004_stratagems_newspells) | disjoint (needs per-mod availability) |
| SPWI223 | Wizard.Deafness (001_vanilla); Wizard.SoundBurst (004_stratagems_newspells) | disjoint (needs per-mod availability) |

## Identity mismatches (20)

A SPELLS entry's declared `id` doesn't match the file's actual spell.ids constant in one or more snapshots.

| key | file | declared id | mismatched in |
| --- | --- | --- | --- |
| Priest.AnimalSummoning4 | SPPR402 | CLERIC_ANIMAL_SUMMONING_LEVEL_4 | 001_vanilla (CLERIC_ANIMAL_SUMMONING_1) |
| Priest.AnimalSummoning5 | SPPR501 | CLERIC_ANIMAL_SUMMONING_LEVEL_5 | 001_vanilla (CLERIC_ANIMAL_SUMMONING_2) |
| Priest.AnimalSummoning6 | SPPR602 | CLERIC_ANIMAL_SUMMONING_LEVEL_6 | 001_vanilla (CLERIC_ANIMAL_SUMMONING_3) |
| Priest.CureCriticalWounds | SPPR502 | CLERIC_CURE_CRITICAL_WOUNDS | 004_stratagems_newspells (CLERIC_CURE_CRITICAL_WOUNDS_DEPRECATED) |
| Priest.PhysicalMirror | SPPR613 | CLERIC_PHYSICAL_MIRROR | 004_stratagems_newspells (CLERIC_MIRROR_OLD) |
| Priest.ProtectionFromLightning | SPPR407 | CLERIC_PROTECTION_FROM_LIGHTNING | 004_stratagems_newspells (CLERIC_PROTECTION_FROM_LIGHTNING_DEPRECATED) |
| Priest.Repulsion | SPPR515 | CLERIC_REPULSION | 001_vanilla (CLERIC_REPULSE_UNDEAD) |
| Priest.SummonDeathKnight | SPPR703 | CLERIC_SUMMON_DEATH_KNIGHT | 001_vanilla (CLERIC_GATE) |
| Priest.SymbolWeakness | SPPR706 | CLERIC_SYMBOL_WEAKNESS | 001_vanilla (CLERIC_SYMBOL_FEAR) |
| Wizard.AcidFog | SPWI614 | WIZARD_ACID_FOG | 001_vanilla (WIZARD_DEATH_FOG), 004_stratagems_newspells (WIZARD_DEATH_FOG) |
| Wizard.BigbyIcyGrasp | SPWI818 | WIZARD_BIGBYS_ICY_GRASP | 001_vanilla (WIZARD_BIGBYS_CLENCHED_FIST) |
| Wizard.Blindness | SPWI106 | WIZARD_BLINDNESS | 004_stratagems_newspells (WIZARD_OBSCURING_MIST) |
| Wizard.DancingLights | SPWI126 | WIZARD_DANCING_LIGHTS | 004_stratagems_newspells (WIZARD_EXPEDITIOUS_RETREAT) |
| Wizard.Darkness15Radius | SPWI228 | WIZARD_DARKNESS_15_FOOT | 004_stratagems_newspells (WIZARD_DECASTAVE) |
| Wizard.Deafness | SPWI223 | WIZARD_DEAFNESS | 004_stratagems_newspells (WIZARD_SOUND_BURST) |
| Wizard.DimensionDoor | SPWI402 | WIZARD_DIMENSION_DOOR | 004_stratagems_newspells (WIZARD_DIMENSION_DOOR_DEPRECATED) |
| Wizard.ObscuringMist | SPWI106 | WIZARD_OBSCURING_MIST | 001_vanilla (WIZARD_BLINDNESS) |
| Wizard.SoundBurst | SPWI223 | WIZARD_SOUND_BURST | 001_vanilla (WIZARD_DEAFNESS) |
| Wizard.SummonShadow | SPWI501 | WIZARD_SUMMON_SHADOW | 001_vanilla (WIZARD_ANIMATE_DEAD) |
| Wizard.WavesOfFatigue | SPWI508 | WIZARD_WAVES_OF_FATIGUE | 001_vanilla (WIZARD_CHAOS) |

## Availability gaps (4)

A SPELLS entry's `id`, searched for directly rather than trusted at its declared file, isn't present from 001_vanilla onward, or lives at a different file than declared wherever it does exist.

| key | declared file | id | available in (actual file) | verdict |
| --- | --- | --- | --- | --- |
| Priest.CureCriticalWounds | SPPR502 | CLERIC_CURE_CRITICAL_WOUNDS | 001_vanilla (SPPR502) | ok |
| Wizard.Blindness | SPWI106 | WIZARD_BLINDNESS | 001_vanilla (SPWI106) | ok |
| Wizard.Deafness | SPWI223 | WIZARD_DEAFNESS | 001_vanilla (SPWI223) | ok |
| Wizard.DimensionDoor | SPWI402 | WIZARD_DIMENSION_DOOR | 001_vanilla (SPWI402) | ok |

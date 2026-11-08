# Changelog

All notable changes to Enhanced Creatures are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Current version in doc's header
- Zombies
- Vampires
- Docs: the monsters page groups the versions of a monster under one entry heading, with a "Common to all" box for what they share, and an A-Z sidebar
- Docs: D&D 3e creature types are shown as tags on each monster, with a type filter
- Ettin is now installed (it was generated but never included by the installer)
- AI: rework how summons and disables are valued
- AI: gate touch and short range spells on hostile targets
- AI: new vampire necromancer combos, changelog commit hook
- AI: presets for wizard and priest spells, shared rolls
- AI: review buff to sleep presets against BG2EE spell data
- AI: review summon, weapon and remaining presets
- AI: category roll ranges
- AI: roll range and mirror image checks on abilities
- AI: image removers
- AI: category rolls and mirror image passes in the cast order
- AI: abilities for the mirror image passes
- AI: last resort at mirrored enemies takes one target list
- AI: regenerate for category rolls and mirror image counters
- Variants: detect variants bringing new spells or abilities
- Scripts: plan one script per scripted variant
- Scripts: build a creature view per script
- Scripts: generate and assign one script per scripted variant
- Variants: refuse new spells outside a variant
- Spells: recastTimer spaces a spell's casts
- Spells: every spell a creature casts declares its role
- Spells: Invisibility is a great protection
- AI: the covered phase takes a creature's own protections and buffs
- Log: each script's cast order in its creature's section
- AI: spell entries are placed by score, with their own configuration
- AI: a cleric's priorities: Hold Person, party buffs, Command last
- AI: auras first, split heals, worth levels, no duplicate abilities
- Doc: show long spell renew periods in turns
- HP: drop the constitution hit point house rule
- Spells: combo groups, random combo pick, spellbook level check
- Dashboard: experience tab
- XP: a power level or a tag on every created spell
- XP: round damage tiers and refined DMG rows

### Changed

- All mod resources renamed to a new naming scheme (a monster's base-36 code, also shown in the docs as #code). **Uninstall the previous version before installing**. Creatures already in a saved game (and summons created from mod creature files) keep the old names, so they lose this mod's scripts (AI), abilities and trait items; start a new game (or visit fresh areas) for the full effect
- Displacer Beast is now a Magical Beast (same immunities); its hit dice are d10, so it has more HP
- Spectral Hound is now a Magical Beast (immune to infravision-type effects, like other magical beasts); its hit dice are d10, so it has more HP
- Hell Hound and Moon Dog are now Outsiders with the Planar Essence trait (immune to cure/cause wounds and death spells)
- Dread Wolf and Vampiric Wolf are now Undead and gain the undead immunities
- Undead are turned according to the PnP turning table: "+3" Hit Dice count as the next row (e.g. wights, wraiths, mummies, spectres are harder to turn), and creatures turned as a specific undead use that row (e.g. ju-ju zombies as spectres, zombie lords as vampires). Banshees are now easier to turn
- Wyvern, Baby Wyvern and Greater Wyvern use dragon hit dice (d12), so they have more HP
- Wraith Spider, Dread Wolf and Vampiric Wolf use undead hit dice (d12), so they have more HP
- Dread Wolf and Vampiric Wolf have their undead turn level raised by one (harder to turn)
- Mod files reorganised by monster (one folder per monster entry)
- AI: review area spells, drop spells missing from BG2EE
- Design and plan for category rolls and mirror image counters
- Variant scripts design
- Variant scripts plan
- Vampire: spellcasting vampires as scripted variants
- Ogre-mage: spellcasting chieftains as a scripted sub-variant
- Skeletons: spellcasting skeletons as scripted variants
- Sirine, polar bear, sword spider: files with their own spells as scripted variants
- Regenerate mod with variant scripts
- At-will: drop the shared-script spellbook brake
- Regenerate mod without the spellbook brake
- Regenerate mod (sirine keeps its Polymorph Self forms)
- Ogre-mage: the Chieftain variant declares the chieftains' spellbook
- Ogre-mage: Invisibility and Darkness at will, chieftain spells only in their script
- Ogre-mage: every spell placed by score
- Ogre-mage: Fly is a buff, cast under cover and in the open
- Creatures: every spell placed by score
- Vampire: one necromancer variant helper; DX#DALID at level 16
- Vampire: Bodhi is a variant of the abomination age
- Skeleton: mage and cleric variants move to their own entries
- XP: experience of adjusted creatures now follows the AD&D 2e DMG rule (Hit Dice + special abilities), even when that gives less XP than the original game; a few story bosses (Bodhi in her lair) keep their original XP
- 2e strengths found, and the design to keep them next to the 3e/5e ones
- XP: the threat system is a comparison only

### Fixed

- GH Action Release was not working
- AI: keep Magic Missile's mirrored target list for hand-placed casters
- AI: mirror image passes keep their spell's own target checks
- Variants: sub-variant spells replace their parent's; kit spells need no variant
- Scripts: keep abilities for spells granted in game; location slots per script
- Fey: Speak with Plants is reactive, cast once entangled
- Vampire patriarch
- Doc: Attacks list the main hand before the off-hand
- Ooze: puddings and mustard jelly split again
- Docs: creature search finds monsters with adjustments
- Doc: hide the engine's TRUECLASS kit
- Vampire: the abomination extends the Ravenloft age table

## [0.4.0] - 2026-10-09

### Added

- Many Undead

### Fixed

- BAF script fixes and improvements (spell triggers, attacks, tracking)
- Many other fixes

## [0.3.0] - 2026-09-16

### Added

- Most greater cats gain a leap attack
- Cheetah gains Burst of Speed
- Add Nereid
- Variant system to better categorize adjustments
- Improved documentation
- Many BG2 creatures coverage

### Fixed

- Sword spider main attack is now its leg so it has better synergy with leap attack
- Many small fixes

## [0.2.1] - 2026-08-11

### Added

- Clarify mainhand and offhand attacks in documentation

### Fixed 

- Number of attacks was wrong for creatures that have more than 4

## [0.2.0] - 2026-08-11


### Added

- Initial release, 1645 creatures out of 5404


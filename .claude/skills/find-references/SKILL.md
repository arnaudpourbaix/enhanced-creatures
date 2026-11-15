---
name: find-references
description: Use when asking who summons, spawns, casts, gives, uses or otherwise references a game resource (CRE, SPL, ITM, EFF, BCS, DLG, 2DA...) by resref - e.g. "who is summoning WIBHSHA1?", "which creatures know SPWI603?", "where does this creature come from?". Scans the BGEE/BG2EE installs (override + BIFs) and the generated mod/ output.
---

# Find references

Run from the repo root (cwd `/C/Games/...`, capital C):

```
npx ts-node scripts/find-references.ts <RESREF>... [--game bg1|bg2|<dir>] [--depth N]
```

- Several resrefs at once are fine (`WIBHSHA1 WIBHSHA2`); a file extension is stripped.
- Without `--game` it searches every game in `paths.local.json` (bg1 = BGEE, bg2 = BG2EE). A
  creature listed in `assets/bg1/creatures.csv` lives in BGEE, `assets/bg2` in BG2EE.
- `--depth` (default 2) follows referrers that are SPL, ITM, EFF, 2DA, PRO, DLG or BCS one more
  level: the summon spell's casters, the dialog's or script's owner creature. Use 3 for long
  chains (CRE <- SPL <- ITM <- STO/CRE). Each level is a full scan (~10 s per game).

## Reading the output

Each referrer comes with where it names the resref:

- SPL/ITM/EFF: the effect opcode (`op 67 create creature`, `op 146 cast spell`...) and the spell
  level / item ability holding it.
- CRE: the field (`known spell`, `item`, `override script`, `dialog`, `effect op ...`).
- ARE: `actor "<name>"` (placed in the area), `spawn point`, `rest encounter`.
- BCS: the script action (`CreateCreature`, `SpellRES`...) from ACTION.IDS.
- DLG: the action line text (e.g. `CreateCreature("WIBHSHA1",[347.333],SW)`), or `transition` when
  another dialog chains into it.
- `mod/ files naming X`: this mod's generated BAF/D/TP2 files (not installed yet, or ours).

## Blind spots (say so when the answer is "nothing")

- Numeric references: `Spell()`/`ReallyForceSpell()` with a SPELL.IDS number in scripts, op 127
  summon tables picked by index (the MONSUM*.2DA row itself is found, not who picks it).
- Compressed BIFs are skipped.

Summarize the chain for the user (who places/summons it, in which area or by which creature),
not the raw dump.

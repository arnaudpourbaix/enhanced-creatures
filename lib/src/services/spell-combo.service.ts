import { MOD_LAYER_ORDER } from "../../config/mods";
import { SPELL_COMBOS } from "../../config/spells/spell-combos";
import { SpellbookModName } from "../../config/spells/spellbook-mod-name";
import { Effect } from "../model/spell-item/effect";
import {
  CastSpellOnConditionTargetEnum,
  CastSpellOnConditionType,
  EffectCastSpellTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
} from "../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import { ContingencyTrigger, SpellCombo, SpellComboKind } from "../model/spell-item/spell-combo";
import { PartialSpellHeader, Spell } from "../model/spell-item/spell-item";
import { resolveForMod, SpellReference } from "../model/spell-item/spell-reference";
import { StringReference } from "../model/final/stringref";
import spellService from "./spell.service";
import { getResourceName } from "./utils/misc.func";

/** Owner code of the combo SPLs in the common scope (`jasc01xx`). */
const COMBO_OWNER = 1;

/** Range of an enemy combo's header when none of its spells sets one. */
const DEFAULT_RANGE = 30;

/** The name of each kind's SPLs. */
const KIND_NAMES: Record<SpellComboKind, StringReference> = {
  minorSequencer: "ability.MinorSequencer",
  spellSequencer: "ability.Sequencer",
  contingency: "ability.Contingency",
  chainContingency: "ability.ChainContingency",
};

/** The engine condition (CastSpellOnCondition, Global Constraints) of each contingency trigger. */
export const CONTINGENCY_CONDITIONS: Record<ContingencyTrigger, CastSpellOnConditionType> = {
  hit: "HitBy([ANYONE])",
  seeEnemy: "See([EVILCUTOFF])",
  hp50: "HPPercentLT(Myself,50)",
  hp25: "HPPercentLT(Myself,25)",
  hp10: "HPPercentLT(Myself,10)",
  helpless: "StateCheck(Myself,STATE_HELPLESS)",
  poisoned: "StateCheck(Myself,STATE_POISONED)",
};

const isContingency = (combo: SpellCombo): boolean =>
  combo.kind === "contingency" || combo.kind === "chainContingency";

/** One combo with its spells resolved for some mods: one generated SPL (two for a self contingency). */
interface ComboEntry {
  combo: SpellCombo;
  spells: SpellReference[];
  /** The SPL a caster memorizes. */
  file: string;
  /** Contingencies only: the SPL a self contingency's set-up casts (unused for enemy ones). */
  wrapper?: string;
  /** Built on demand by allSpells(). */
  built?: Spell[];
}

/**
 * The SPLs generated for sequencers and contingencies (see SpellCombo). Names are computed without
 * presets, so creatures and SPELL_PRIORITY_ORDER can ask for them at module load; the SPLs
 * themselves (whose shape depends on isSelf) are only built by allSpells(), at write time.
 */
class SpellComboService {
  /** By `combo.key` + resolved files, in allocation order. */
  private entries = new Map<string, ComboEntry>();
  private counter = 0;
  private registryAllocated = false;

  /**
   * The SPL a caster memorizes for this combo under `mod`: mods resolving the combo's spells to the
   * same files share it. The first call names every SPELL_COMBOS entry for every MOD_LAYER_ORDER
   * mod, in registry order, so names don't depend on which combos creatures pick; other combos
   * (test fixtures) are named on demand after those.
   */
  comboFile(combo: SpellCombo, mod: SpellbookModName): string {
    this.allocateRegistry();
    return this.allocate(combo, resolve(combo, mod)).file;
  }

  /**
   * Whether the combo's spells are cast on the caster (a self contingency is a real engine
   * contingency, an enemy one is fired by the script). A stub until presets are available here.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-function-argument -- stub: the real check needs presets
  isSelf(combo: SpellCombo): boolean {
    return false;
  }

  /** Every generated SPL, for writing: each built once, in allocation order. */
  allSpells(): Spell[] {
    this.allocateRegistry();
    return [...this.entries.values()].flatMap((entry) => (entry.built ??= this.build(entry)));
  }

  /** The combo whose memorized SPL is `file` (case-insensitive), if any. */
  comboOfFile(file: string): SpellCombo | undefined {
    const target = file.toLowerCase();
    return [...this.entries.values()].find((e) => e.file.toLowerCase() === target)?.combo;
  }

  /** Forgets every name and SPL, for tests. */
  reset(): void {
    this.entries.clear();
    this.counter = 0;
    this.registryAllocated = false;
  }

  private allocateRegistry(): void {
    if (this.registryAllocated) return;
    this.registryAllocated = true;
    for (const combo of SPELL_COMBOS) {
      for (const mod of MOD_LAYER_ORDER) {
        // a combo holding a spell some mod lacks (no fallback) simply doesn't exist there
        const spells = tryResolve(combo, mod);
        if (spells) this.allocate(combo, spells);
      }
    }
  }

  private allocate(combo: SpellCombo, spells: SpellReference[]): ComboEntry {
    const key = [combo.key, ...spells.map((s) => s.file.toUpperCase())].join("|");
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { combo, spells, file: this.nextName() };
      // every contingency reserves its wrapper's name, so naming never depends on isSelf
      if (isContingency(combo)) entry.wrapper = this.nextName();
      this.entries.set(key, entry);
    }
    return entry;
  }

  private nextName(): string {
    const name = getResourceName("s", "c", COMBO_OWNER, this.counter);
    this.counter++;
    return name;
  }

  private build(entry: ComboEntry): Spell[] {
    const { combo, spells, file, wrapper } = entry;
    const self = this.isSelf(combo);
    if (!isContingency(combo) || !self) return [this.castingSpell(combo, spells, file, self)];
    if (!wrapper || !combo.condition)
      throw new Error(`Spell combo ${combo.key}: not a contingency`);
    const setUp = this.spell(combo, file, {
      type: ItemAbilityTypeEnum.Magical,
      target: ItemAbilityTargetEnum.Caster,
      effects: [
        {
          opcode: EffectTypeEnum.CastSpellOnCondition,
          target: EffectTargetEnum.Self,
          conditionTarget: CastSpellOnConditionTargetEnum.Myself,
          condition: CONTINGENCY_CONDITIONS[combo.condition],
          // stays until its condition fires
          timing: EffectTimingEnum.InstantPermanentUntilDeath,
          resource: wrapper,
        },
      ],
    });
    // TODO: the game's Contingency set-up visual (no reference to it in this repo yet)
    return [setUp, this.castingSpell(combo, spells, wrapper, true)];
  }

  /**
   * The SPL casting the combo's spells instantly, in order: at the caster, or at a creature within
   * the smallest range of its spells.
   */
  private castingSpell(
    combo: SpellCombo,
    spells: SpellReference[],
    file: string,
    self: boolean,
  ): Spell {
    const ranges = spells.flatMap((s) => (s.range === undefined ? [] : [s.range]));
    const effects: Effect[] = spells.map((s) => ({
      opcode: EffectTypeEnum.CastSpell,
      type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
      resource: s.file,
    }));
    // TODO: the game's sequencer release visual (no reference to it in this repo yet)
    return this.spell(combo, file, {
      type: ItemAbilityTypeEnum.Magical,
      ...(self
        ? { target: ItemAbilityTargetEnum.Caster }
        : {
            target: ItemAbilityTargetEnum.LivingActor,
            range: ranges.length ? Math.min(...ranges) : DEFAULT_RANGE,
          }),
      effects,
    });
  }

  private spell(combo: SpellCombo, file: string, header: PartialSpellHeader): Spell {
    return spellService.getSpell(
      { name: KIND_NAMES[combo.kind], level: 1, headers: [header] },
      file,
    );
  }
}

/** The combo's spells for `mod`, through their fallbacks (see resolveForMod). */
function resolve(combo: SpellCombo, mod: SpellbookModName): SpellReference[] {
  return combo.spells.map((s) => resolveForMod(s, mod));
}

/** Same as resolve, undefined when a spell isn't available for `mod`. */
function tryResolve(combo: SpellCombo, mod: SpellbookModName): SpellReference[] | undefined {
  try {
    return resolve(combo, mod);
  } catch {
    return undefined;
  }
}

const spellComboService = new SpellComboService();
export default spellComboService;

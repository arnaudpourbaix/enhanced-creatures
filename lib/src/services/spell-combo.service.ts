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
  RemoveEffectsByResourceTypeEnum,
} from "../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import { ContingencyTrigger, SpellCombo, SpellComboKind } from "../model/spell-item/spell-combo";
import { PartialSpell, PartialSpellHeader, Spell } from "../model/spell-item/spell-item";
import { resolveForMod, SpellReference } from "../model/spell-item/spell-reference";
import { StringReference } from "../model/final/stringref";
import { AbilityPreset } from "../model/misc";
import logService from "./log.service";
import { getResourceName } from "./utils/misc.func";

/** Owner code of the combo SPLs in the common scope (`jasc01xx`). */
const COMBO_OWNER = 1;

/** Range of an enemy combo's header when none of its spells sets one. */
const DEFAULT_RANGE = 30;

/** The name of each kind's SPLs (and of the abilities casting them). */
export const KIND_NAMES: Record<SpellComboKind, StringReference> = {
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

/** What builds the SPLs: SpellService, see useSpellBuilder. */
interface SpellBuilder {
  getSpell(spell: PartialSpell, file: string): Spell;
}

export const isContingency = (combo: SpellCombo): boolean =>
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
  private spellBuilder?: SpellBuilder;
  /** The spells' presets (without the combos' own), see usePresets. */
  private presets?: AbilityPreset[];

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
   * Every SPL a caster may memorize for this combo: one per MOD_LAYER_ORDER mod having all its
   * spells (see comboFile), deduped, in mod order.
   */
  filesOf(combo: SpellCombo): string[] {
    return [
      ...new Set(
        MOD_LAYER_ORDER.flatMap((mod) =>
          this.spellsFor(combo, mod) ? [this.comboFile(combo, mod)] : [],
        ),
      ),
    ];
  }

  /** The combo's spells for `mod` (see comboFile), undefined when one isn't available there. */
  spellsFor(combo: SpellCombo, mod: SpellbookModName): SpellReference[] | undefined {
    return tryResolve(combo, mod);
  }

  /**
   * Given by spell.service.ts: importing it here would close an import cycle through
   * ability-presets.ts, which builds the combos' presets at load.
   */
  useSpellBuilder(builder: SpellBuilder): void {
    this.spellBuilder = builder;
  }

  /**
   * The presets of the spells combos hold (ABILITY_PRESETS can't be imported here: it holds the
   * combos' own presets, built from isSelf), given by ability-presets.ts before building those.
   */
  usePresets(presets: AbilityPreset[]): void {
    this.presets = presets;
  }

  /**
   * Whether the combo's spells are cast on the caster (a self contingency is a real engine
   * contingency, an enemy one is fired by the script): each of them is when its preset has no
   * targets, is cast on self, or only targets lists named `Myself...` (e.g. MyselfAndNearestAllies).
   */
  isSelf(combo: SpellCombo): boolean {
    return combo.spells.every((spell) => this.spellIsSelf(combo, spell));
  }

  /**
   * Throws when the combo mixes self and enemy spells (see isSelf). Warns when an enemy combo's
   * spells target different lists: the combo is cast at the first one's targets.
   */
  checkTargets(combo: SpellCombo): void {
    const selves = combo.spells.map((spell) => this.spellIsSelf(combo, spell));
    if (selves.some(Boolean) && !selves.every(Boolean)) {
      throw new Error(`Spell combo ${combo.key} mixes self and enemy spells`);
    }
    if (selves.some(Boolean)) return;
    const lists = new Set(
      combo.spells.map((spell) =>
        (this.presetOf(combo, spell).ability.targets ?? []).map((t) => t.name).join(),
      ),
    );
    if (lists.size > 1) {
      logService.warn(
        `Spell combo ${combo.key}: its spells have different preset target lists, the first one's are used`,
      );
    }
  }

  /** Every generated SPL, for writing: each built once, in allocation order. */
  allSpells(): Spell[] {
    this.allocateRegistry();
    return [...this.entries.values()].flatMap((entry) => (entry.built ??= this.build(entry)));
  }

  /** The combo whose memorized SPL is `file` (case-insensitive), if any. */
  comboOfFile(file: string): SpellCombo | undefined {
    return this.entryOfFile(file)?.combo;
  }

  /** The spells (resolved for its mods) cast by the combo SPL `file`, see comboOfFile. */
  spellsOfFile(file: string): SpellReference[] | undefined {
    return this.entryOfFile(file)?.spells;
  }

  /** Whether `file` is a self contingency's memorized SPL: precast, then the engine fires it. */
  isSelfContingencyFile(file: string): boolean {
    const combo = this.comboOfFile(file);
    return !!combo && isContingency(combo) && this.isSelf(combo);
  }

  /** Whether `file` is an enemy contingency's memorized SPL: the script fires it on its condition. */
  isEnemyContingencyFile(file: string): boolean {
    const combo = this.comboOfFile(file);
    return !!combo && isContingency(combo) && !this.isSelf(combo);
  }

  /** Forgets every name and SPL (not the presets), for tests. */
  reset(): void {
    this.entries.clear();
    this.counter = 0;
    this.registryAllocated = false;
  }

  private entryOfFile(file: string): ComboEntry | undefined {
    this.allocateRegistry();
    const target = file.toLowerCase();
    return [...this.entries.values()].find((e) => e.file.toLowerCase() === target);
  }

  private spellIsSelf(combo: SpellCombo, spell: SpellReference): boolean {
    const { ability } = this.presetOf(combo, spell);
    const keywords = ability.keywords ?? spell.keywords ?? [];
    return (
      !ability.targets?.length ||
      !!ability.spell?.castOnSelf ||
      keywords.includes("castOnSelf") ||
      ability.targets.every((t) => t.name.startsWith("Myself"))
    );
  }

  private presetOf(combo: SpellCombo, spell: SpellReference): AbilityPreset {
    if (!this.presets) throw new Error(`Spell combo ${combo.key}: usePresets was never called`);
    const preset = this.presets.find((p) => p.preset === spell.file);
    if (!preset) throw new Error(`Spell combo ${combo.key}: no preset for spell ${spell.file}`);
    return preset;
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
        // a recast (after rest) replaces a still pending contingency instead of adding a second one
        {
          opcode: EffectTypeEnum.RemoveEffectsByResource,
          target: EffectTargetEnum.Self,
          type: RemoveEffectsByResourceTypeEnum.Default,
          resource: file,
        },
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
            range: comboRange(spells),
          }),
      effects,
    });
  }

  /**
   * An innate level 1 SPL (the level only picks the memorization slot) of power 0: spell
   * protections (globes, Spell Turning...) don't act on the combo itself, only on the spells it
   * casts, which keep their own levels.
   */
  private spell(combo: SpellCombo, file: string, header: PartialSpellHeader): Spell {
    if (!this.spellBuilder) throw new Error("Spell combos: useSpellBuilder was never called");
    return this.spellBuilder.getSpell(
      { name: KIND_NAMES[combo.kind], level: 1, power: 0, headers: [header] },
      file,
    );
  }
}

/** The range of an enemy combo (SPL header and preset): the smallest of its spells' ranges. */
export function comboRange(spells: SpellReference[]): number {
  const ranges = spells.flatMap((s) => (s.range === undefined ? [] : [s.range]));
  return ranges.length ? Math.min(...ranges) : DEFAULT_RANGE;
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

import { isAvailableInMod, MOD_LAYER_ORDER } from "../../config/mods";
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
import {
  ContingencyTarget,
  ContingencyTrigger,
  SpellCombo,
  SpellComboKind,
} from "../model/spell-item/spell-combo";
import { PartialSpell, PartialSpellHeader, Spell } from "../model/spell-item/spell-item";
import { resolveForMod, SpellReference } from "../model/spell-item/spell-reference";
import { StringReference } from "../model/final/stringref";
import { AbilityPreset } from "../model/misc";
import logService from "./log.service";
import translationService from "./translation.service";
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

/** Removes the trigger of the contingency set up by the SPL `file`. */
function removeContingency(file: string): Effect {
  return {
    opcode: EffectTypeEnum.RemoveEffectsByResource,
    target: EffectTargetEnum.Self,
    type: RemoveEffectsByResourceTypeEnum.Default,
    resource: file,
  };
}

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

/** The engine target (CastSpellOnCondition) of each contingency target. */
const CONTINGENCY_TARGETS: Record<ContingencyTarget, CastSpellOnConditionTargetEnum> = {
  self: CastSpellOnConditionTargetEnum.Myself,
  lastHitter: CastSpellOnConditionTargetEnum.LastHitter,
  nearestEnemy: CastSpellOnConditionTargetEnum.NearestEnemy,
};

/** What builds the SPLs: SpellService, see useSpellBuilder. */
interface SpellBuilder {
  getSpell(spell: PartialSpell, file: string): Spell;
}

export const isContingency = (combo: SpellCombo): boolean =>
  combo.kind === "contingency" || combo.kind === "chainContingency";

/** One combo with its spells resolved for some mods: one generated SPL (two for a contingency). */
interface ComboEntry {
  combo: SpellCombo;
  /** The spells it casts, see spellsFor. */
  spells: SpellReference[];
  /** The SPL a caster memorizes. */
  file: string;
  /** Contingencies only: the SPL its set-up casts when it fires. */
  wrapper?: string;
  /** Built on demand by allSpells(). */
  built?: Spell[];
}

/** A combo's spells for one mod: the ones it casts, and why the others were left out. */
interface Resolution {
  spells: SpellReference[];
  dropped: string[];
}

/**
 * The SPLs generated for sequencers and contingencies (see SpellCombo). Names need the spells'
 * presets (see spellsFor); the SPLs themselves are only built by allSpells(), at write time.
 */
class SpellComboService {
  /** By `combo.key` + resolved files, in allocation order. */
  private entries = new Map<string, ComboEntry>();
  private counter = 0;
  private registryAllocated = false;
  private spellBuilder?: SpellBuilder;
  /** The spells' presets (without the combos' own), see usePresets. */
  private presets?: AbilityPreset[];
  /** resolve's results, by combo and mod. */
  private resolved = new Map<SpellCombo, Map<SpellbookModName, Resolution | undefined>>();

  /**
   * The SPL a caster memorizes for this combo under `mod`: mods resolving the combo's spells to the
   * same files share it. The first call names every SPELL_COMBOS entry for every MOD_LAYER_ORDER
   * mod, in registry order, so names don't depend on which combos creatures pick; other combos
   * (test fixtures) are named on demand after those.
   */
  comboFile(combo: SpellCombo, mod: SpellbookModName): string {
    this.allocateRegistry();
    const spells = this.spellsFor(combo, mod);
    if (!spells)
      throw new Error(`Spell combo ${combo.key}: none of its spells can be cast under ${mod}`);
    return this.allocate(combo, spells).file;
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

  /**
   * The spells the combo casts under `mod`, through their fallbacks (see resolveForMod); undefined
   * when one isn't available there (no fallback) or when it would cast none (see dropOtherSide).
   * Throws, like resolveForMod, on a fallback cycle.
   */
  spellsFor(combo: SpellCombo, mod: SpellbookModName): SpellReference[] | undefined {
    const { spells } = this.resolution(combo, mod) ?? {};
    return spells?.length ? spells : undefined;
  }

  private resolution(combo: SpellCombo, mod: SpellbookModName): Resolution | undefined {
    let byMod = this.resolved.get(combo);
    if (!byMod) {
      byMod = new Map<SpellbookModName, Resolution | undefined>();
      this.resolved.set(combo, byMod);
    }
    if (!byMod.has(mod)) byMod.set(mod, this.resolve(combo, mod));
    return byMod.get(mod);
  }

  private resolve(combo: SpellCombo, mod: SpellbookModName): Resolution | undefined {
    let resolved: SpellReference[];
    try {
      resolved = combo.spells.map((s) => resolveForMod(s, mod));
    } catch (error) {
      // a combo holding a spell some mod lacks (no fallback) simply doesn't exist there
      if (error instanceof Error && error.message.startsWith("No spell available"))
        return undefined;
      throw error;
    }
    return this.dropOtherSide(combo, mod, resolved);
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
   * Whether the combo's spells are cast on the caster: each of them is when its preset has no
   * targets, is cast on self, or only targets lists named `Myself...` (e.g. MyselfAndNearestAllies).
   */
  isSelf(combo: SpellCombo): boolean {
    return combo.spells.every((spell) => this.spellIsSelf(combo, spell));
  }

  /**
   * Throws when the combo mixes self and enemy spells (see isSelf), when a plain contingency aims at
   * anyone but the caster, and when a chain contingency's target doesn't suit its spells. Warns when a contingency aims at its last hitter on another condition
   * than `hit` (nobody may have hit it), when an enemy sequencer's spells target different lists
   * (it is cast at the first one's targets), and when a fallback is left out (see dropOtherSide).
   * Run with the log on: names are allocated at module load, before it is.
   */
  checkTargets(combo: SpellCombo): void {
    this.warnDroppedFallbacks(combo);
    // an anySide spell suits either side
    const selves = combo.spells
      .filter((spell) => !spell.anySide)
      .map((spell) => this.spellIsSelf(combo, spell));
    if (selves.some(Boolean) && !selves.every(Boolean)) {
      throw new Error(`Spell combo ${combo.key} mixes self and enemy spells`);
    }
    if (isContingency(combo)) {
      this.checkContingencyTarget(combo, selves);
      return;
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

  /** One warning per fallback dropOtherSide leaves out, naming the mods it does so for. */
  private warnDroppedFallbacks(combo: SpellCombo): void {
    const mods = new Map<string, SpellbookModName[]>();
    for (const mod of MOD_LAYER_ORDER) {
      for (const message of this.resolution(combo, mod)?.dropped ?? []) {
        mods.set(message, [...(mods.get(message) ?? []), mod]);
      }
    }
    for (const [message, list] of mods) {
      logService.warn(`Spell combo ${combo.key} (${list.join(", ")}): ${message}`);
    }
  }

  private checkContingencyTarget(combo: SpellCombo, selves: boolean[]): void {
    const target = combo.target ?? "self";
    if (combo.kind === "contingency" && target !== "self") {
      throw new Error(`Spell combo ${combo.key}: a contingency can only target the caster`);
    }
    const selfSpells = selves.every(Boolean);
    if (selves.length && selfSpells !== (target === "self")) {
      throw new Error(
        `Spell combo ${combo.key}: its target ${target} doesn't suit its ${selfSpells ? "self" : "enemy"} spells`,
      );
    }
    if (target === "lastHitter" && combo.condition !== "hit") {
      logService.warn(
        `Spell combo ${combo.key}: aimed at its last hitter on "${String(combo.condition)}": nobody may have hit it`,
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

  /**
   * A readable name for the combo SPL `file` (a memorized one or a self contingency's wrapper),
   * for docs and comments: its kind and its key, e.g. "Minor Sequencer (Double Magic Missiles)".
   */
  labelOf(file: string): string | undefined {
    const entry = this.entryOrWrapperOf(file);
    if (!entry) return undefined;
    const key = entry.combo.key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return `${translationService.from(KIND_NAMES[entry.combo.kind])} (${key})`;
  }

  /** The spells (resolved for its mods) cast by the combo SPL `file`, see comboOfFile. */
  spellsOfFile(file: string): SpellReference[] | undefined {
    return this.entryOfFile(file)?.spells;
  }

  /**
   * The names of the spells cast by the combo SPL `file` (a memorized one or a self contingency's
   * wrapper), for comments: in cast order, a spell held several times counted once ("Magic
   * Missiles x2, Fireball").
   */
  spellNamesOf(file: string): string | undefined {
    const spells = this.entryOrWrapperOf(file)?.spells;
    if (!spells?.length) return undefined;
    const counts = new Map<string, number>();
    for (const spell of spells) {
      const name = translationService.from(spell.name);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts].map(([name, count]) => (count > 1 ? `${name} x${count}` : name)).join(", ");
  }

  /** The combo whose memorized SPL or self contingency's wrapper is `file` (case-insensitive). */
  private entryOrWrapperOf(file: string) {
    this.allocateRegistry();
    const target = file.toLowerCase();
    return [...this.entries.values()].find(
      (e) => e.file.toLowerCase() === target || e.wrapper?.toLowerCase() === target,
    );
  }

  /** Whether `file` is a contingency's memorized SPL: set up at init, then the engine fires it. */
  isContingencyFile(file: string): boolean {
    const combo = this.comboOfFile(file);
    return !!combo && isContingency(combo);
  }

  /** Forgets every name and SPL (not the presets), for tests. */
  reset(): void {
    this.entries.clear();
    this.counter = 0;
    this.registryAllocated = false;
    this.resolved.clear();
  }

  private entryOfFile(file: string): ComboEntry | undefined {
    this.allocateRegistry();
    const target = file.toLowerCase();
    return [...this.entries.values()].find((e) => e.file.toLowerCase() === target);
  }

  /**
   * Leaves out each fallback cast on the other side than the combo (a self Spirit Armor standing in
   * for an enemy Beltyn's Burning Blood): it can't be cast with the others. Combos are built around
   * their own spells: no search for a better fallback. checkTargets warns about each.
   */
  private dropOtherSide(
    combo: SpellCombo,
    mod: SpellbookModName,
    resolved: SpellReference[],
  ): Resolution {
    const sided = combo.spells.filter((spell) => !spell.anySide);
    if (!sided.length) return { spells: resolved, dropped: [] };
    const self = this.spellIsSelf(combo, sided[0]);
    const dropped: string[] = [];
    const spells = resolved.filter((spell, i) => {
      const original = combo.spells[i];
      if (spell.anySide || isAvailableInMod(original, mod)) return true;
      if (this.spellIsSelf(combo, spell) === self) return true;
      dropped.push(
        `left out ${spell.file}, the fallback of ${original.file}: ` +
          `cast on ${self ? "enemies" : "self"}, unlike the combo's spells`,
      );
      return false;
    });
    return { spells, dropped };
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
        const spells = this.spellsFor(combo, mod);
        if (spells) this.allocate(combo, spells);
      }
    }
  }

  private allocate(combo: SpellCombo, spells: SpellReference[]): ComboEntry {
    const key = [combo.key, ...spells.map((s) => s.file.toUpperCase())].join("|");
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { combo, spells, file: this.nextName() };
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
    if (!isContingency(combo)) return [this.castingSpell(combo, spells, file, this.isSelf(combo))];
    if (!wrapper || !combo.condition)
      throw new Error(`Spell combo ${combo.key}: not a contingency`);
    const target = combo.target ?? "self";
    const setUp = this.spell(combo, file, {
      type: ItemAbilityTypeEnum.Magical,
      target: ItemAbilityTargetEnum.Caster,
      effects: [
        // a recast (after rest) replaces a still pending contingency instead of adding a second one
        removeContingency(file),
        {
          opcode: EffectTypeEnum.CastSpellOnCondition,
          target: EffectTargetEnum.Self,
          conditionTarget: CONTINGENCY_TARGETS[target],
          condition: CONTINGENCY_CONDITIONS[combo.condition],
          // stays until its condition fires
          timing: EffectTimingEnum.InstantPermanentUntilDeath,
          resource: wrapper,
        },
      ],
    });
    // the engine keeps the trigger after it fires: removed here, or it would fire again
    const removal = removeContingency(file);
    return [setUp, this.castingSpell(combo, spells, wrapper, target === "self", [removal])];
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
    first: Effect[] = [],
  ): Spell {
    const effects: Effect[] = [
      ...first,
      ...spells.map((s) => ({
        opcode: EffectTypeEnum.CastSpell as const,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        resource: s.file,
      })),
    ];
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

const spellComboService = new SpellComboService();
export default spellComboService;

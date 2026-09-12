import { GLOBAL_CONFIG } from "../../config/generate";
import { getAllFnpSpells } from "../../config/spells/fnp-spell-names";
import { SPELL_GROUPS } from "../../config/spells/spell-group";
import { SpellGroupName } from "../../config/spells/spell-group-name";
import { getAllSpells, SpellReference } from "../../config/spells/spell-names";
import { Spellbooks } from "../../config/spellbooks/spellbook";
import { SpellBookName } from "../../config/spellbooks/spellbook-name";
import { MemorizedSpell } from "../model/creature/data";
import { StringReference } from "../model/final/stringref";
import {
  ClericSpellTable,
  MageSpellTable,
  WisdomBonusSpellTable,
} from "../model/game-data/spell-level";
import { Effect } from "../model/spell-item/effect";
import {
  EffectIDSFileEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  SpellTypeEnum,
} from "../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import { PartialProjectile } from "../model/spell-item/projectile";
import {
  PartialSpell,
  PartialSpellHeader,
  Spell,
  SpellHeader,
} from "../model/spell-item/spell-item";
import { SpellBookSpells } from "../model/spell-item/spellbook";
import { State } from "../state";
import effectService from "./effects/effect.service";
import logService from "./log.service";
import translationService from "./translation.service";
import utils from "./utils/utils.service";

class SpellService {
  getSpell(spell: PartialSpell, file: string): Spell {
    // headers/effectFiles are pulled out only to exclude them from the `...others` spread below
    // (each is built up separately below via addHeader()/the effectFiles loop); the destructured
    // names go unused.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { headers, effectFiles, ...others } = spell;
    const result: Spell = {
      file,
      doc: spell.doc ?? "both",
      level: spell.level ?? 1,
      type: spell.type ?? SpellTypeEnum.Innate,
      effects: [],
      headers: [],
      effectFiles: [],
      projectiles: [],
      groups: [],
      ...others,
    };
    for (const effectFile of spell.effectFiles ?? []) {
      result.effectFiles.push({
        ...effectService.getEffect(effectFile),
        file: effectFile.file ?? file,
      });
    }
    for (const header of spell.headers ?? []) {
      this.addHeader(header, result, file);
    }
    if (result.icon && /\d{3}$/.test(result.icon)) {
      result.icon = `${result.icon}C`;
    }
    // result.type/result.level are typed as always-set (defaulted above), but the `...others`
    // spread that follows those defaults re-copies the caller's raw `type`/`level` - including an
    // explicit `undefined` - back over them. See spell.service.test.ts's "forces type back to
    // Innate when explicitly undefined and there's no copyFrom" and the equivalent level test.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison
    if (result.type === undefined && !result.copyFrom) result.type = SpellTypeEnum.Innate;
    result.deleteHeaders ??= false;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison
    if (result.level === undefined && !result.copyFrom) result.level = 1;
    result.effects = this.getEffects(result.effects, result, file);
    if (result.ability?.spell) {
      result.ability.spell.resource = file;
      result.ability.name ??= spell.name;
    }
    State.spells.push(result);
    return result;
  }

  getGroupRessources(name: SpellGroupName): string[] {
    const group = SPELL_GROUPS.find((g) => g.name === name);
    if (!group) throw new Error(`Group ${name} is not defined !`);
    return group.spells ?? [];
  }

  private addHeader(header: PartialSpellHeader, spell: Spell, file: string): void {
    const result: SpellHeader = { ...header, effects: header.effects ?? [] };
    // type is required by SpellHeader, but defended anyway - see spell.service.test.ts's
    // "throws when a header has no type", which bypasses the type with `{} as any`.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!result.type) throw new Error(`Header type is required!`);
    if (!result.icon && spell.icon && /\d{3}$/.test(spell.icon)) {
      result.icon = `${spell.icon}B`;
    }
    result.range ??= 0;
    result.speed ??= 0;
    result.minLevel ??= 0;
    result.location ??= ItemAbilityLocationEnum.Ability;
    result.target ??= ItemAbilityTargetEnum.LivingActor;
    if (spell.options?.addRacialResistances !== false) this.addRacialResistances(result, spell);
    if (typeof result.projectile === "object") {
      this.addProjectile(spell, result, result.projectile);
    }
    result.effects = this.getEffects(result.effects, spell, file);
    spell.headers.push(result);
  }

  private addRacialResistances(header: SpellHeader, spell: Spell): void {
    if (
      header.effects.some((e) =>
        [EffectTypeEnum.CharmCreature, EffectTypeEnum.Sleep, EffectTypeEnum.Sleep20HP].includes(
          e.opcode,
        ),
      )
    ) {
      this.useEffectFile(header, spell, [
        { file: EffectIDSFileEnum.RACE, entry: "ELF", probability: 90 },
        { file: EffectIDSFileEnum.RACE, entry: "HALF_ELF", probability: 30 },
      ]);
    }
  }

  useEffectFile(
    header: SpellHeader,
    spell: Spell,
    entries: { file: EffectIDSFileEnum; entry: string; probability: number }[],
  ): void {
    const effects: Effect[] = [];
    for (const entry of entries) {
      effects.push({
        opcode: EffectTypeEnum.UseEFFFile,
        idsFile: entry.file,
        idsEntry: entry.entry,
        probability1: entry.probability,
        timing: EffectTimingEnum.InstantLimited,
        duration: 1,
        resource: spell.file,
      });
    }
    header.effects.unshift(...this.getEffects(effects, spell, spell.file));
    this.addProtectionFromSpellEffect(spell);
  }

  private addProtectionFromSpellEffect(spell: Spell) {
    this.addEffectFile(spell, {
      opcode: EffectTypeEnum.ProtectionFromSpell,
      resource: spell.file,
      timing: EffectTimingEnum.InstantPermanentUntilDeath,
    });
  }

  private addEffectFile(spell: Spell, effect: Effect) {
    if (!spell.effectFiles.some((e) => e.file === spell.file)) {
      logService.log(`adding effect file ${spell.file} for spell ${spell.name}`);
      spell.effectFiles.push({
        file: spell.file,
        ...effectService.getEffect(effect),
      });
    }
  }

  private addProjectile(spell: Spell, header: SpellHeader, projectile: PartialProjectile) {
    if (!spell.projectiles.some((p) => p.file === spell.file)) {
      logService.log(
        `adding projectile ${spell.file} for spell ${translationService.fromOptional(spell.name)}`,
      );
      spell.projectiles.push({ file: spell.file, ...projectile });
      header.projectile = spell.file;
    }
  }

  private getEffects(effects: Effect[], spell: Spell, file: string): Effect[] {
    const results = effectService.getEffects(effects, { file });
    let needEffectFile = false;
    for (const effect of results) {
      if (
        [
          EffectTypeEnum.ProtectionFromResource,
          EffectTypeEnum.ProtectionFromResourceAndMessage,
          EffectTypeEnum.ProtectionFromSpell,
          EffectTypeEnum.RemoveEffectsByResource,
          EffectTypeEnum.UseEFFFile,
        ].includes(effect.opcode) &&
        !effect.resource
      ) {
        needEffectFile = needEffectFile || effect.opcode === EffectTypeEnum.UseEFFFile;
        effect.resource = spell.file;
      }
    }
    if (needEffectFile) {
      this.addProtectionFromSpellEffect(spell);
    }
    return results;
  }

  getSpellName(file: string): string | null {
    const spell = State.spells.find((s) => s.file === file);
    if (!spell?.name) return this.getExistingSpellName(file);
    return translationService.from(spell.name);
  }

  private getExistingSpellName(file: string): string | null {
    const spells = this.getAllSpellNames();
    const spell = spells.find((s) => s.file === file);
    if (!spell) return null;
    return translationService.from(spell.name);
  }

  getSpellInfo(resource: string): SpellReference {
    const spells = getAllSpells();
    const spell = spells.find((s) => s.file === resource);
    if (!spell) throw new Error(`spell ${resource} not found!`);
    return spell;
  }

  getAllSpellNames(): { file: string; name: StringReference }[] {
    const spells = [...getAllSpells(), ...getAllFnpSpells()];
    return spells.flatMap((spell) => (spell.name ? [{ file: spell.file, name: spell.name }] : []));
  }

  /**
   * Builds a memorized spell list for a caster from a named Spellbooks entry, sized by
   * ClericSpellTable/MageSpellTable (plus WisdomBonusSpellTable for clerics). Bonus spells only
   * apply to levels the caster table already grants at least one spell for, per 2e rules.
   */
  createSpellbook(params: {
    name: SpellBookName;
    casterLevel: number;
    type: "mage" | "cleric";
    wisdom?: number;
  }): MemorizedSpell[] {
    // SpellBookName only has one variant today, which makes this comparison look tautological to
    // eslint - but the union is expected to grow as more spellbooks are added.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const book = Spellbooks.find((b) => b.name === params.name);
    if (!book) throw new Error(`Spellbook ${params.name} is not defined!`);
    const table = params.type === "cleric" ? ClericSpellTable : MageSpellTable;
    const levelEntry = table.find((t) => t.level === params.casterLevel) ?? table.at(-1);
    if (!levelEntry) throw new Error(`No spell table entry for caster level ${params.casterLevel}!`);
    const wisdom = params.wisdom;
    const wisdomBonusRow =
      params.type === "cleric" && wisdom !== undefined
        ? [...WisdomBonusSpellTable].reverse().find((w) => w.wisdom <= wisdom)
        : undefined;

    const memorized: MemorizedSpell[] = [];
    for (const spellCount of levelEntry.spells) {
      const bonus = wisdomBonusRow?.bonusSpells.find((b) => b.level === spellCount.level)?.count ?? 0;
      const slots = spellCount.count + bonus;
      const bookLevel = book.spells.find((s) => s.level === spellCount.level);
      if (!bookLevel) {
        throw new Error(`Spellbook ${params.name} has no spells defined for level ${spellCount.level}!`);
      }
      memorized.push(...this.pickSpellsForLevel(bookLevel, slots));
    }
    return memorized;
  }

  private pickSpellsForLevel(spells: SpellBookSpells, slots: number): MemorizedSpell[] {
    if (slots <= 0) return [];
    const additionnals = GLOBAL_CONFIG.randomizeSpellbookAdditionals
      ? utils.shuffleArray(spells.additionnals)
      : spells.additionnals;
    const picks = [...spells.base, ...additionnals].slice(0, slots);
    let repeatIndex = 0;
    while (picks.length < slots && spells.repeat.length > 0) {
      picks.push(spells.repeat[repeatIndex % spells.repeat.length]);
      repeatIndex++;
    }

    const counts = new Map<string, number>();
    for (const spell of picks) {
      counts.set(spell.file, (counts.get(spell.file) ?? 0) + 1);
    }
    return [...counts.entries()].map(([file, memorizedCount]) => ({ file, memorizedCount }));
  }
}

const spellService = new SpellService();
export default spellService;

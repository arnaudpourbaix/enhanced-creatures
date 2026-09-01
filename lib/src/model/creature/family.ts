import { MonsterEnum, MonsterFamilyEnum } from "../../../creatures/monster";
import { TranslationKey } from "../../../translations/i18n";
import translationService from "../../services/translation.service";
import { Projectile } from "../spell-item/projectile";
import { Item, Spell } from "../spell-item/spell-item";
import { AbstractCreature } from "./abstract-creature";
import { Creature, CreatureAutoGenerate, CreatureNewFile } from "./creature";
import { InputMainCreatureData } from "./data-input";
import { CreatureFile, Game } from "./game";
import abilityService from "../../services/baf/ability.service";
import logService from "../../services/log.service";
import monsterFilesService from "../../services/monster-files.service";

/**
 * Collapse raw per-row creature file entries into one entry per (uppercased) name,
 * preserving first-seen order. The effective `game` for a name is `undefined` (both
 * games) when any entry for that name is `undefined`, or when the entries together
 * cover both `bg1` and `bg2`; otherwise it is the single `Game` value present.
 */
export function collapseFilesByGame(files: CreatureFile[]): CreatureFile[] {
  // Map iteration preserves insertion order, so first-seen name order is kept.
  const byName = new Map<string, Set<Game | undefined>>();
  for (const f of files) {
    const games = byName.get(f.name) ?? new Set<Game | undefined>();
    games.add(f.game);
    byName.set(f.name, games);
  }
  return [...byName].map(([name, games]) => {
    const coversBothGames = games.has("bg1") && games.has("bg2");
    const game =
      games.has(undefined) || coversBothGames ? undefined : [...games][0];
    return { name, game };
  });
}

export interface Family {
  id: number;
  items: Item[];
  projectiles: Projectile[];
  creatures: Creature[];
  spells: Spell[];
}

export abstract class CreatureFamily<T extends Creature>
  extends AbstractCreature
  implements Family
{
  fileType: "m" | "f" = "f";
  creatures: T[];
  logging = false;

  constructor(id: MonsterFamilyEnum) {
    super(id);
    this.creatures = [];
  }

  abstract createCreature(id: MonsterEnum): T;

  create(p: {
    name: TranslationKey;
    monster: MonsterEnum;
    files?: (string | CreatureFile)[];
    notEnforceFiles?: string[];
    newFiles?: CreatureNewFile[];
    data: InputMainCreatureData;
    autoGenerate?: CreatureAutoGenerate;
  }): T {
    logService.header(`Creating ${translationService.from(p.name)}...`);
    const cre = this.createCreature(p.monster);
    cre.name = p.name;
    cre.family = this.id;
    cre.files = this.resolveFiles(p.monster, p.files);
    this.warnUnvalidatedFiles(p.monster);
    cre.newFiles = p.newFiles ?? [];
    cre.notEnforceFiles = (p.notEnforceFiles ?? []).map((f) => f.toUpperCase());
    cre.setData(p.data);
    cre.logging = this.logging;
    if (p.autoGenerate) {
      cre.autoGenerate = { ...cre.autoGenerate, ...p.autoGenerate };
      logService.log(`autogenerate: ${JSON.stringify(cre.autoGenerate)}`);
    }
    this.creatures.push(cre);
    return cre;
  }

  createFrom(p: {
    name: TranslationKey;
    from: T;
    monster: MonsterEnum;
    files?: (string | CreatureFile)[];
    notEnforceFiles?: string[];
    newFiles?: CreatureNewFile[];
  }): T {
    logService.header(
      `Creating ${translationService.from(p.name)} from ${translationService.from(
        p.from.name,
      )}...`,
    );
    const cre = structuredClone(p.from);
    Object.setPrototypeOf(cre, p.from);
    Object.setPrototypeOf(cre.data.movement, p.from.data.movement);
    cre.id = p.monster;
    cre.name = p.name;
    cre.files = this.resolveFiles(p.monster, p.files);
    this.warnUnvalidatedFiles(p.monster);
    cre.newFiles = p.newFiles ?? [];
    cre.notEnforceFiles = (p.notEnforceFiles ?? []).map((f) => f.toUpperCase());
    cre.data.hp = undefined;
    cre.data.thac0 = undefined;
    cre.data.saveBreath = undefined;
    cre.data.saveDeath = undefined;
    cre.data.savePolymorph = undefined;
    cre.data.saveSpell = undefined;
    cre.data.saveWand = undefined;
    cre.items = [];
    cre.spells = [];
    cre.effectFiles = [];
    cre.projectiles = [];
    cre.adjustments = [];
    cre.valid = undefined;
    if (p.from.attack.dualWielding) cre.data.apr++;
    this.creatures.push(cre);
    return cre;
  }

  private resolveFiles(
    monster: MonsterEnum,
    backupFiles: (string | CreatureFile)[] = [],
  ): CreatureFile[] {
    const raw: CreatureFile[] = [
      ...monsterFilesService.getFiles(monster),
      ...backupFiles.map((f) => (typeof f === "string" ? { name: f } : f)),
    ].map((f) => ({ name: f.name.toUpperCase(), game: f.game }));
    return collapseFilesByGame(raw);
  }

  // creatures.csv's "summon" column is the source of truth for which files are summon variants.
  // Files already flagged summon:true by a hand-written setAdjustments() entry are left alone;
  // every other CSV-confirmed file gets a minimal synthetic adjustment appended so it still gets
  // the summon behavior script and xpv=0 patch - even if it's also covered by an earlier,
  // data-only hand-written entry (e.g. one that sets level1 alongside it). Adjustments apply as
  // separate, sequential PATCH_IF blocks, and this one is appended after the hand-written entries
  // build() already pushed, so its xpv=0 always wins for that file without disturbing the other
  // fields the hand-written entry set.
  private applyCsvSummonFiles(creature: T): void {
    const knownFiles = new Set(
      creature.adjustments
        .filter((a) => a.summon)
        .flatMap((a) => a.files.map((f) => f.toUpperCase())),
    );
    const csvSummonFiles = collapseFilesByGame(
      monsterFilesService
        .getSummonFiles(creature.id)
        .map((f) => ({ name: f.name.toUpperCase(), game: f.game })),
    ).filter((f) => !knownFiles.has(f.name));
    if (csvSummonFiles.length) {
      // Carry the collapsed `game`: a resref that's a summon in only one game (e.g. CATLIOWP -
      // a summoned lion in bg1, Joolon's ally lion in bg2) must get the summon script + xpv=0
      // only in that game. weiduCreatureService.patchScripts + handleAdjustment gate it per game.
      creature.setAdjustments(
        csvSummonFiles.map((f) => ({ files: [f.name], summon: true, game: f.game })),
      );
    }
  }

  private warnUnvalidatedFiles(monster: MonsterEnum): void {
    const files = monsterFilesService.getUnvalidatedFiles(monster);
    if (files.length) {
      const labels = files.map((f) => (f.game ? `${f.name} (${f.game})` : f.name));
      logService.warn(
        `${MonsterEnum[monster]} has unvalidated creatures.csv guesses, needs review: ${labels.join(", ")}`,
      );
    }
  }

  addCreature(build: () => T) {
    const countBefore = this.creatures.length;
    let creature: T | undefined;
    try {
      creature = build();
      this.applyCsvSummonFiles(creature);
      creature.validate(this.id);
    } catch (e: unknown) {
      // If the builder throws after calling create()/createFrom() (which already pushed the
      // creature onto this.creatures) but before returning, the `creature = build()` assignment
      // above never completes - fall back to the just-pushed creature so it can still be found
      // and invalidated. This relies on the undocumented invariant that a builder creates at
      // most one creature per addCreature() call - `.at(-1)` would be wrong otherwise.
      creature ??= this.creatures.length > countBefore ? this.creatures.at(-1) : undefined;
      const message = e instanceof Error ? e.message : String(e);
      const label = creature ? translationService.from(creature.name) : "creature";
      logService.error(`Failed to build ${label}: ${message}`);
      if (e instanceof Error && e.stack) logService.log(e.stack);
      if (creature) creature.valid = false;
    }
  }

  creature(id: MonsterEnum): T {
    // s.id is typed as plain `number` (AbstractCreature.id is shared with CreatureFamily's own
    // MonsterFamilyEnum-typed id, so it can't be narrowed to MonsterEnum at the base class) -
    // widen id to number for the comparison rather than loosen a shared field. no-unnecessary-
    // type-assertion disagrees the cast changes anything (enums structurally widen to number for
    // comparison), but removing it brings back no-unsafe-enum-comparison - the two rules
    // conflict here, so this one loses.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const creature = this.creatures.find((s) => s.id === (id as number));
    if (!creature) throw new Error(`No creature found with id ${id}`);
    return creature;
  }

  preset(name: string) {
    return {
      preset: name,
    };
  }

  minorSequencer(presets: string[] & { length: 2 }) {
    return abilityService.getMinorSequencer(presets);
  }

  sequencer(presets: string[] & { length: 3 }) {
    return abilityService.getSequencer(presets);
  }

  override item(id: number): Item {
    try {
      return super.item(id);
    } catch (e) {
      let item: Item | undefined;
      for (const creature of this.creatures) {
        item = creature.items.find((s) => s.id === id);
        if (item) return item;
      }
      throw e;
    }
  }

  override spell(id: number): Spell {
    try {
      return super.spell(id);
    } catch (e) {
      let spell: Spell | undefined;
      for (const creature of this.creatures) {
        spell = creature.spells.find((s) => s.id === id);
        if (spell) return spell;
      }
      throw e;
    }
  }

  override projectile(id: number): Projectile {
    try {
      return super.projectile(id);
    } catch (e) {
      let proj: Projectile | undefined;
      for (const creature of this.creatures) {
        proj = creature.projectiles.find((s) => s.id === id);
        if (proj) return proj;
      }
      throw e;
    }
  }
}

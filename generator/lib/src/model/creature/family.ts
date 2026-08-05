import { MonsterEnum, MonsterFamilyEnum } from "../../../creatures/monster";
import { TranslationKey } from "../../../translations/i18n";
import translationService from "../../services/translation.service";
import { Projectile } from "../spell-item/projectile";
import { Item, Spell } from "../spell-item/spell-item";
import { AbstractCreature } from "./abstract-creature";
import { Creature, CreatureAutoGenerate, CreatureNewFile } from "./creature";
import { InputMainCreatureData } from "./data-input";
import abilityService from "../../services/baf/ability.service";
import logService from "../../services/log.service";
import monsterFilesService from "../../services/monster-files.service";

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
    files?: string[];
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
    files?: string[];
    notEnforceFiles?: string[];
    newFiles?: CreatureNewFile[];
  }): T {
    const cre = structuredClone(p.from);
    Object.setPrototypeOf(cre, p.from);
    Object.setPrototypeOf(cre.data.movement, p.from.data.movement);
    cre.id = p.monster;
    cre.name = p.name;
    cre.files = this.resolveFiles(p.monster, p.files);
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
    logService.header(
      `Creating ${translationService.from(cre.name)} from ${translationService.from(
        p.from.name,
      )}...`,
    );
    this.creatures.push(cre);
    return cre;
  }

  private resolveFiles(monster: MonsterEnum, backupFiles: string[] = []): string[] {
    return [
      ...new Set([...monsterFilesService.getFiles(monster), ...backupFiles].map((f) => f.toUpperCase())),
    ];
  }

  addCreature(creature: T) {
    creature.validate(this.id);
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

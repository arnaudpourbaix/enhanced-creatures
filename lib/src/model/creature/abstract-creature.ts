import effectService from "../../services/effects/effect.service";
import itemService from "../../services/item.service";
import spellService from "../../services/spell.service";
import {
  getItemFilename,
  getProjectileFilename,
  getSpellFilename,
} from "../../services/utils/misc.func";
import { BaseEffect } from "../spell-item/effect";
import {
  EffectCastSpellTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
} from "../spell-item/effect.enums";
import { EffectTypeEnum } from "../spell-item/effect.type";
import { PartialProjectile, Projectile } from "../spell-item/projectile";
import {
  Item,
  PartialItem,
  PartialSpell,
  PartialWeapon,
  Spell,
  Weapon,
  WeaponCastSpell,
} from "../spell-item/spell-item";
import { WithRequired } from "../utility-types";
import { RawCreatureAbility } from "./ability";

export abstract class AbstractCreature {
  id: number;
  items: Item[];
  spells: Spell[];
  projectiles: Projectile[];
  abstract fileType: "m" | "f";

  constructor(id: number) {
    this.id = id;
    this.items = [];
    this.spells = [];
    this.projectiles = [];
  }

  item(id: number): Item {
    const item = this.items.find((s) => s.id === id);
    if (!item) throw new Error(`No item found with id ${id}`);
    return item;
  }

  traitItem(): Item {
    const item = this.items.find((s) => s.trait);
    if (!item) throw new Error(`No trait item found`);
    return item;
  }

  spell(id: number | string): Spell {
    const spell = this.spells.find((s) => (typeof id === "string" ? s.file === id : s.id === id));
    if (!spell) throw new Error(`No spell found with id ${id}`);
    return spell;
  }

  projectile(id: number): Projectile {
    const proj = this.projectiles.find((s) => s.id === id);
    if (!proj) throw new Error(`No projectile found with id ${id}`);
    return proj;
  }

  ability(id: number): RawCreatureAbility {
    const spell = this.spell(id);
    if (!spell.ability) throw new Error(`No ability found for spell id ${id}`);
    return spell.ability;
  }

  addProjectile(projectile: PartialProjectile, file?: string): Projectile {
    file ??= getProjectileFilename(this.projectiles.length, this.id, this.fileType);
    const result: Projectile = { ...projectile, file };
    this.projectiles.push(result);
    return result;
  }

  addSpell(spell: PartialSpell, file?: string): Spell {
    if (spell.id !== undefined && this.spells.some((s) => s.id === spell.id)) {
      throw new Error(`Spell id ${spell.id} already defined`);
    }
    file ??= getSpellFilename(this.spells.length, this.id, this.fileType);
    const result = spellService.getSpell(spell, file);
    this.spells.push(result);
    return result;
  }

  addItem(item: PartialItem, file?: string): Item {
    if (item.id !== undefined && this.items.some((i) => i.id === item.id)) {
      throw new Error(`Item id ${item.id} already defined`);
    }
    file ??= getItemFilename(this.items.length, this.id, this.fileType);
    const result = itemService.getItem(item, file);
    this.items.push(result);
    return result;
  }

  addWeapon({ weapon, castSpells }: { weapon: PartialWeapon; castSpells?: WeaponCastSpell[] }) {
    const result = this.addItem(weapon) as Weapon;
    if (castSpells) {
      for (const castSpell of castSpells) {
        this.attachSpellToWeapon(result, castSpell);
      }
    }
    return result;
  }

  protected attachSpellToWeapon(weapon: Weapon, cast: WeaponCastSpell) {
    const spell =
      typeof cast.spell === "string" ? this.spell(cast.spell) : this.addSpell(cast.spell);
    spell.doc = cast.doc ?? false;
    const baseEffect: WithRequired<Omit<BaseEffect, "opcode">, "resource"> = {
      resource: spell.file,
      probability1: cast.probability1,
      probability2: cast.probability2,
      saveTypes: cast.saveTypes,
      saveBonus: cast.saveBonus,
    };
    if (cast.delay) {
      baseEffect.timing = EffectTimingEnum.DelayPermanent;
      baseEffect.duration = cast.delay;
    }
    weapon.header.effects.push(
      effectService.getEffect({
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        ...baseEffect,
      }),
    );
    if (cast.remove) {
      weapon.header.effects.push(
        effectService.getEffect({
          opcode: EffectTypeEnum.RemoveSpell,
          target: EffectTargetEnum.Self,
          ...baseEffect,
        }),
      );
    }
  }
}

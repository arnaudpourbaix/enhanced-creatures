import { EquippedItem, ItemSlot, WEAPON_SLOTS } from "../model/creature/item";
import {
  AbilityDamageTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ProficiencyTypeEnum,
} from "../model/spell-item/effect.enums";
import { PartialProjectile } from "../model/spell-item/projectile";
import { Item, ItemHeader, PartialItem, PartialItemHeader } from "../model/spell-item/spell-item";
import { State } from "../state";
import effectService from "./effects/effect.service";
import logService from "./log.service";
import translationService from "./translation.service";

class ItemService {
  getItem(item: PartialItem, file: string): Item {
    const result: Item = {
      file,
      id: item.id,
      doc: item.doc ?? true,
      copyFrom: item.copyFrom,
      stringRef: item.stringRef,
      description: item.description,
      immunities: item.immunities ?? [],
      enchantment: item.enchantment,
      animation: item.animation,
      category: item.category,
      proficiency: item.proficiency,
      icon: item.icon,
      flags: item.flags,
      effects: item.effects ?? [],
      equippedSlot: item.equippedSlot ?? [],
      projectiles: [],
      trait: false,
    };
    result.equippedSlot = this.getItemSlots(result.equippedSlot);
    result.effects = effectService.getEffects(result.effects, {
      file,
      base: {
        target: EffectTargetEnum.Self,
        timing: EffectTimingEnum.InstantWhileEquipped,
      },
    });
    if (item.header) this.setHeader(result, item.header, file);
    State.items.push(result);
    return result;
  }

  setHeader(result: Item, header: PartialItemHeader, file: string): Item {
    result.header = { effects: [], ...header };
    result.header.diceSize ??= 0;
    result.header.diceThrown ??= 0;
    result.header.speed ??= 0;
    if (result.header.location === undefined && !result.copyFrom)
      result.header.location = ItemAbilityLocationEnum.Weapon;
    if (result.header.target === undefined && !result.copyFrom)
      result.header.target = ItemAbilityTargetEnum.LivingActor;
    if (result.header.damageType === undefined && !result.copyFrom)
      result.header.damageType = AbilityDamageTypeEnum.None;
    result.effects = effectService.getEffects(result.effects, { file });
    // header.effects is typed as always-set after the `{ effects: [], ...header }` spread above,
    // but callers can (and do, e.g. Spider.createJaws) pass an object literal with an explicit
    // `effects: undefined`, which overwrites the [] default at runtime despite the static type.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    result.header.effects = effectService.getEffects(result.header.effects ?? [], {
      file,
    });
    if (typeof header.projectile === "object") {
      this.addProjectile(result, result.header, header.projectile);
    }
    return result;
  }

  private addProjectile(item: Item, header: ItemHeader, projectile: PartialProjectile) {
    if (!item.projectiles.some((p) => p.file === item.file)) {
      logService.log(
        `adding projectile ${
          item.file
        } for item ${translationService.fromOptional(item.stringRef)}`,
      );
      item.projectiles.push({ file: item.file, ...projectile });
      header.projectile = item.file;
    }
  }

  getItemSlots(slot: ItemSlot | ItemSlot[] | undefined): ItemSlot[] {
    const results: ItemSlot[] = Array.isArray(slot) ? slot : [];
    if (typeof slot === "string") results.push(slot);
    return results;
  }

  isSlotIncluded(itemSlots: EquippedItem[], includedSlot: ItemSlot | ItemSlot[]): boolean {
    if (Array.isArray(includedSlot)) return false;
    const list = itemSlots.map((i) => this.getItemSlots(i.slot)).flat(1);
    return list.includes(includedSlot);
  }

  isEquippedWeapon(item: EquippedItem): boolean {
    const slots = Array.isArray(item.slot) ? item.slot : [item.slot];
    return slots.length > 0 && slots.every((s) => WEAPON_SLOTS.map((w) => w.slot).includes(s));
  }

  /**
   * The "main hand" weapon for attack-count purposes: the first equipped weapon not in the
   * SHIELD (offhand) slot - the offhand always gets a fixed +1 attack regardless of proficiency
   * (see creatureService.checkDualWielding), so only the main hand's proficiency rank feeds any
   * proficiency-based attack bonus.
   */
  getMainHandWeaponProficiency(equipped: EquippedItem[]): ProficiencyTypeEnum | undefined {
    const mainHand = equipped.find(
      (item) => this.isEquippedWeapon(item) && !this.isSlotIncluded([item], "SHIELD"),
    );
    if (!mainHand) return undefined;
    return State.items.find((i) => i.file === mainHand.file)?.proficiency;
  }
}

const itemService = new ItemService();
export default itemService;

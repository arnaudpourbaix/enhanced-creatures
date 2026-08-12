import figureSet from "figures";
import { Creature } from "../model/creature/creature";
import { EnchantmentTable } from "../model/game-data/enchantement";
import { CreatureSizeTable } from "../model/game-data/sizes";
import { ItemFlagEnum } from "../model/spell-item/effect.enums";
import { Weapon } from "../model/spell-item/spell-item";
import logService from "./log.service";

class WeaponService {
  checkWeapon(creature: Creature, weapon: Weapon, level?: number) {
    this.checkWeaponSpeed(weapon);
    this.checkEnchantment(creature, weapon, level);
    this.checkRange(creature, weapon);
  }

  checkWeaponSpeed(weapon: Weapon) {
    if (!weapon.header.speed) {
      weapon.header.speed = 3;
      logService.warn(`default speed of ${weapon.header.speed} from weapon ${weapon.file}.`);
    }
  }

  checkEnchantment(creature: Creature, weapon: Weapon, level: number = creature.data.level1.pnpValue) {
    if (weapon.enchantment !== undefined || !creature.autoGenerate.enchantment) {
      return;
    }
    const item = EnchantmentTable.find(
      (e) =>
        level > e.level ||
        (level == e.level && !!creature.data.bonusHp && creature.data.bonusHp >= e.bonusHp),
    );
    if (!item) {
      throw new Error(`enchantment not found in table: ${level}/${creature.data.bonusHp ?? 0}`);
    }
    if (item.enchant === 0) return;
    logService.log(`${figureSet.arrowRight} ${weapon.file} enchant: ${item.enchant}`);
    weapon.enchantment = item.enchant;
    if (item.enchant && !weapon.flags?.includes(ItemFlagEnum.Magical)) {
      weapon.flags = weapon.flags ?? [];
      weapon.flags.push(ItemFlagEnum.Magical);
    }
  }

  checkRange(creature: Creature, weapon: Weapon) {
    if (
      weapon.header.projectile !== undefined ||
      weapon.header.range !== undefined ||
      !creature.autoGenerate.meleeRange
    ) {
      return;
    }
    const range = CreatureSizeTable.find((c) => c.size === creature.data.size);
    if (range) {
      logService.log(`${figureSet.arrowRight} Melee range: ${range.attackRange}`);
      weapon.header.range = range.attackRange;
    }
  }
}

const weaponService = new WeaponService();
export default weaponService;

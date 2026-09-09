import figureSet from "figures";
import { Creature } from "../model/creature/creature";
import { EnchantmentTable } from "../model/game-data/enchantement";
import { CreatureSizeTable, getCreatureSize } from "../model/game-data/sizes";
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
      logService.info(`default speed of ${weapon.header.speed} from weapon ${weapon.file}.`);
    }
  }

  checkEnchantment(
    creature: Creature,
    weapon: Weapon,
    level: number = creature.data.level1.pnpValue,
  ) {
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
    const size = getCreatureSize(creature.data.size.value);
    const longReach = creature.data.size.long ? size.reach.long : 0;
    const tallReach = creature.data.size.tall ? size.reach.tall : 0;
    // reach are extracted for MM and are in feet.
    // In game range is supposed to be in feet too, but the results are weird.
    // Dividing by 3 seems to produce a more realistic value.
    const reach = Math.round(Math.max(longReach, tallReach) / 3);
    if (reach) logService.log(`${figureSet.arrowRight} Melee range: ${reach}`);
    weapon.header.range = reach;
  }
}

const weaponService = new WeaponService();
export default weaponService;

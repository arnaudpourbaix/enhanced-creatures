import figureSet from "figures";
import { PLAYER_CONFIG } from "../../config/player-config";
import { Creature } from "../model/creature/creature";
import { CreatureData } from "../model/creature/data";
import { ConstitutionTable } from "../model/game-data/constitution";
import { SizeBonusHitPointTable } from "../model/game-data/hp";
import { CreatureSize } from "../model/game-data/sizes";
import { ClassIdentifier, PLAYER_CLASS_IDENTIFIERS } from "../model/ids/class";
import { ImmunityName } from "../model/final/immunity";
import creatureTypeHooksService from "./creature-type-hooks.service";
import creatureTypeService from "./creature-type.service";
import logService from "./log.service";

class HitPointService {
  getHitPoints(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    parent?: CreatureData;
  }): number {
    // an adjustment's own types (a zombie ankheg is undead): their die and constitution rule
    const added = p.parent
      ? creatureTypeService.getAddedTypes(p.creature, p.data.immunities ?? [])
      : [];
    let level = p.data.level1?.pnpValue;
    if (!level && !p.parent)
      throw new Error(`Can't calculate hit points because level1 is unknown`);
    // an adjustment keeps its base's hit points, unless its types change how they're rolled
    if (!level && p.parent && this.rollsOtherwise(p.creature, added)) {
      level = p.parent.level1?.pnpValue;
    }
    if (!level) return 0;
    const constitutionBonus = this.getConstitutionBonus({ ...p, level, added });
    const hitPointBonus = this.getHitPointBonus({ ...p, level });
    const specialBonus = this.getSpecialBonus({ ...p, level });
    const hitDice = this.getHitDiceSize(p.creature, added) + (p.data.bonusHpPerHitDie ?? 0);
    const baseHP = level * hitDice;
    const log = `${figureSet.arrowRight} Level: ${level}, HD: ${hitDice}, hit points: ${baseHP} (base) ${constitutionBonus.log}${hitPointBonus.log}${specialBonus.log}`;
    const value = baseHP + constitutionBonus.value + hitPointBonus.value + specialBonus.value;
    logService.log(`${log} = ${value}`);
    return value;
  }

  private getConstitutionBonus(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    level: number;
    parent?: CreatureData;
    added: ImmunityName[];
  }): { value: number; log: string } {
    const constitution = p.data.constitution ?? p.parent?.constitution ?? 10;
    const constitutionHp = ConstitutionTable.find((t) => t.con === constitution);
    if (!constitutionHp) {
      throw new Error(`constitution not found in table: ${constitution}`);
    }
    const isPlayerClass = PLAYER_CLASS_IDENTIFIERS.includes(
      p.data.class ?? p.parent?.class ?? "NO_CLASS",
    );
    const hpPerLevel =
      PLAYER_CONFIG.constitutionAffectHitPoint &&
      !isPlayerClass &&
      !creatureTypeHooksService.hasNoConstitutionHp(p.creature, p.added)
        ? constitutionHp.warriorHp
        : 0;
    const value = p.level * hpPerLevel;
    const log = value > 0 ? `+${value} (con) ` : "";
    return { value, log };
  }

  /**
   * The IE engine silently re-applies the constitution HP bonus for any creature whose class is
   * a real PC class - getConstitutionBonus above deliberately excludes it there so the generated
   * .cre file doesn't end up double-counting it in-game (confirmed in-game: a chieftain ogre mage
   * variant reclassed as FIGHTER_MAGE shows up with the bonus even though it's absent from the
   * generated hp). Documentation reads that raw generated hp, so it must add this bonus back to
   * display the HP players actually see.
   */
  getDisplayHitPointBonus(p: {
    class?: ClassIdentifier;
    constitution?: number;
    level: number;
  }): number {
    if (!PLAYER_CLASS_IDENTIFIERS.includes(p.class ?? "NO_CLASS")) return 0;
    const constitutionHp = ConstitutionTable.find((t) => t.con === (p.constitution ?? 10));
    return constitutionHp ? p.level * constitutionHp.warriorHp : 0;
  }

  private getSpecialBonus(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    level: number;
    parent?: CreatureData;
  }): { value: number; log: string } {
    const value = p.data.specialBonusHp ?? 0;
    const log = value > 0 ? `+${value} (special)` : "";
    return { value, log };
  }

  /**
   * This is the bonus eventually mentioned after HD (2e edition).
   * For example, a creature can have 8HD+2, bonus is +2
   */
  private getHitPointBonus(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    level: number;
    parent?: CreatureData;
  }): { value: number; log: string } {
    const sizeBonus = this.getSizeBonus(p);
    if (sizeBonus.value) return sizeBonus;
    const value = p.data.bonusHp ?? p.parent?.bonusHp ?? 0;
    const log = value > 0 ? `+${value} (bonus)` : "";
    return { value, log };
  }

  /**
   * Some creatures can have a hp bonus due to their size (3e edition).
   */
  private getSizeBonus(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    level: number;
    parent?: CreatureData;
  }): { value: number; log: string } {
    const size: CreatureSize = p.data.size?.value ?? p.parent?.size?.value ?? "Tiny";
    const item = SizeBonusHitPointTable.find(
      (c) => p.creature.data.immunities.includes(c.type) && c.size === size,
    );
    if (!item) {
      return { value: 0, log: "" };
    }
    const log = item.hp > 0 ? `+${item.hp} (size)` : "";
    return { value: item.hp, log };
  }

  /** The largest die among the creature's types (see lib/creatures/types/), else d8. */
  private getHitDiceSize(creature: Creature, added: ImmunityName[] = []): number {
    return creatureTypeHooksService.getHitDie(creature, added) ?? 8;
  }

  /** Types an adjustment adds that change the die or the constitution bonus of its base. */
  private rollsOtherwise(creature: Creature, added: ImmunityName[]): boolean {
    if (!added.length) return false;
    return (
      this.getHitDiceSize(creature, added) !== this.getHitDiceSize(creature) ||
      creatureTypeHooksService.hasNoConstitutionHp(creature, added) !==
        creatureTypeHooksService.hasNoConstitutionHp(creature)
    );
  }
}

const hitPointService = new HitPointService();
export default hitPointService;

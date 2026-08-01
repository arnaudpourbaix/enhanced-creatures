import figureSet from "figures";
import { GLOBAL_CONFIG } from "../../config/generate";
import { Creature } from "../model/creature/creature";
import { CreatureData } from "../model/creature/data";
import { ConstitutionTable } from "../model/game-data/constitution";
import { HitDiceTable, SizeBonusHitPointTable } from "../model/game-data/hp";
import { CreatureSize } from "../model/game-data/sizes";
import { PLAYER_CLASS_IDENTIFIERS } from "../model/ids/class";
import logService from "./log.service";

class HitPointService {
  getHitPoints(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    parent?: CreatureData;
  }): number {
    const level = p.data.level1?.pnpValue;
    if (!level && !p.parent)
      throw new Error(`Can't calculate hit points because level1 is unknown`);
    else if (!level) return 0;
    const constitutionBonus = this.getConstitutionBonus({ ...p, level });
    const hitPointBonus = this.getHitPointBonus({ ...p, level });
    const specialBonus = this.getSpecialBonus({ ...p, level });
    const hitDice = this.getHitDiceSize(p.creature);
    const baseHP = level * hitDice;
    const log = `${figureSet.arrowRight} Level: ${level}, hit points: ${baseHP} (base) ${constitutionBonus.log}${hitPointBonus.log}${specialBonus.log}`;
    const value = baseHP + constitutionBonus.value + hitPointBonus.value + specialBonus.value;
    logService.log(`${log} = ${value}`);
    return value;
  }

  private getConstitutionBonus(p: {
    data: Partial<CreatureData>;
    creature: Creature;
    level: number;
    parent?: CreatureData;
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
      GLOBAL_CONFIG.constitutionAffectHitPoint && !isPlayerClass ? constitutionHp.warriorHp : 0;
    const value = p.level * hpPerLevel;
    const log = value > 0 ? `+${value} (con) ` : "";
    return { value, log };
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
    const size: CreatureSize = p.data.size ?? p.parent?.size ?? "Tiny";
    const item = SizeBonusHitPointTable.find(
      (c) => p.creature.data.immunities.includes(c.type) && c.size === size,
    );
    if (!item) {
      return { value: 0, log: "" };
    }
    const log = item.hp > 0 ? `+${item.hp} (size)` : "";
    return { value: item.hp, log };
  }

  private getHitDiceSize(creature: Creature): number {
    let result = 8;
    const item = HitDiceTable.find(
      (e) =>
        this.matchesFamily(e, creature) ||
        this.matchesMonster(e, creature) ||
        this.matchesImmunityType(e, creature),
    );
    if (item) result = item.hd;
    return result;
  }

  private matchesFamily(entry: (typeof HitDiceTable)[number], creature: Creature): boolean {
    return "familyId" in entry && entry.familyId === creature.family;
  }

  private matchesMonster(entry: (typeof HitDiceTable)[number], creature: Creature): boolean {
    // creature.id is typed as plain `number` (AbstractCreature.id is shared with
    // CreatureFamily's own MonsterFamilyEnum-typed id) - widen monsterId to match.
    // no-unnecessary-type-assertion disagrees the cast changes anything, but removing it
    // brings back no-unsafe-enum-comparison - see family.ts's creature() for the same fix.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return "monsterId" in entry && (entry.monsterId as number | undefined) === creature.id;
  }

  private matchesImmunityType(entry: (typeof HitDiceTable)[number], creature: Creature): boolean {
    return "type" in entry && !!entry.type && creature.data.immunities.includes(entry.type);
  }
}

const hitPointService = new HitPointService();
export default hitPointService;

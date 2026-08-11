import figureSet from "figures";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import { State } from "../../state";
import { Creature } from "../../model/creature/creature";
import { EquippedItem } from "../../model/creature/item";
import utils from "../utils/utils.service";
import itemService from "../item.service";
import logService from "../log.service";
import { CreatureAdjustment } from "../../model/creature/adjustment";
import { CreatureData } from "../../model/creature/data";

class ImmunityService {
  handleImmunities(creature: Creature): void {
    this.checkImmunities(creature.data, creature);
    for (const a of creature.adjustments) {
      // data is required by the type, but defended anyway (adjustments can omit it - see
      // weidu-creature.service.test.ts's "skips adjustments with neither data nor summon")
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (a.data?.immunities.length) {
        this.checkImmunities(a.data, creature);
      }
    }
  }

  getOverrides(immunity: ImmunityName, adjustments: CreatureAdjustment[]): string[] {
    return adjustments.reduce<string[]>((acc, a) => {
      const immunities = this.getImmunities(a.data.immunities);
      if (immunities.some((i) => i.overrides.includes(immunity))) {
        acc.push(...a.files);
      }
      return acc;
    }, []);
  }

  private getImmunities(names: ImmunityName[]): ImmunityConfig[] {
    return names.map((n) => {
      const immunity = State.immunities.find((i) => i.name === n);
      if (!immunity) throw new Error(`Immunity ${n} not found !`);
      return immunity;
    });
  }

  private checkImmunities(data: CreatureData, creature: Creature): void {
    for (const name of data.immunities) {
      const immunity = State.immunities.find((i) => i.name === name);
      if (!immunity) throw new Error(`Immunity ${name} not found !`);
      if (immunity.itemSlot) {
        this.checkImmunity(immunity.itemSlot, immunity, data, creature);
      }
    }
  }

  private checkImmunity(
    itemSlot: EquippedItem,
    immunity: ImmunityConfig,
    data: CreatureData,
    creature: Creature,
  ): void {
    const hasCriticalHitImmunity = utils.hasCriticalHitImmunity(immunity);
    const hasHelmet = itemService.isSlotIncluded(
      [...data.items.equipped, ...creature.data.items.equipped],
      "HELMET",
    );
    if (hasCriticalHitImmunity && itemSlot.slot !== "HELMET" && !hasHelmet) {
      logService.log(
        `${figureSet.arrowRight} ${immunity.name} needs a helmet to cover immunity from critical hits. Adding a helmet to cover it.`,
      );
      data.immunities.push("criticalHit");
      creature.autoImmunities.push("criticalHit");
    }
    const overwrittingItem = creature.items.find((i) => i.copyFrom === immunity.name);
    const overwrittingSlot = itemService.isSlotIncluded(
      [...data.items.equipped, ...creature.data.items.equipped],
      itemSlot.slot,
    );
    if (overwrittingItem)
      logService.log(
        `${figureSet.arrowRight} skipping ${itemSlot.file} because ${overwrittingItem.file} overwrites it`,
      );
    else if (overwrittingSlot)
      logService.log(
        `${figureSet.arrowRight} skipping ${immunity.name} (${itemSlot.file}) because slot ${
          Array.isArray(itemSlot.slot) ? itemSlot.slot.join(",") : itemSlot.slot
        } is already assigned`,
      );
    else
      data.items.equipped.push({
        file: itemSlot.file,
        slot: itemSlot.slot,
      });
  }
}

const immunityService = new ImmunityService();
export default immunityService;

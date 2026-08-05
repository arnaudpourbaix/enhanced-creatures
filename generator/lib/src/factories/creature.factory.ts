import figureSet from "figures";
import { MonsterEnum, MonsterFamilyEnum } from "../../creatures/monster";
import { CreatureAdjustment, PartialCreatureAdjustment } from "../model/creature/adjustment";
import {
  BEHAVIOR_DEFAULT,
  CreatureBehavior,
  PartialCreatureBehavior,
} from "../model/creature/behavior";
import { Creature } from "../model/creature/creature";
import {
  CREATURE_DATA_FIELDS,
  CreatureData,
  CreatureDataEffects,
  CreatureDataItems,
  CreatureDataProficiencies,
  CreatureDataScript,
  CreatureDataSpells,
  MainCreatureData,
} from "../model/creature/data";
import { InputCreatureData } from "../model/creature/data-input";
import { ItemSlot } from "../model/creature/item";
import { ImmunityName } from "../model/final/immunity";
import { Item } from "../model/spell-item/spell-item";
import abilityOrderService from "../services/baf/ability-order.service";
import abilityService from "../services/baf/ability.service";
import creatureService from "../services/creature.service";
import descriptionService from "../services/doc/description.service";
import immunityService from "../services/effects/immunity.service";
import logService from "../services/log.service";
import translationService from "../services/translation.service";
import { State } from "../state";

class CreatureFactory {
  setData(cre: Creature, data: InputCreatureData) {
    this.checkValidation(cre);
    cre.data = this.getData(cre.data, data, false) as MainCreatureData;
  }

  getData(
    data: CreatureData | undefined,
    input: InputCreatureData,
    isAdjustment: boolean,
  ): CreatureData {
    data ??= this.createEmptyData();
    if (!isAdjustment) {
      data.spells.removeKnown = true;
      data.spells.removeMemorized = true;
      data.effects.remove = true;
    }
    for (const field of CREATURE_DATA_FIELDS) {
      if (field.setter && input[field.key] !== undefined) {
        field.setter(data, input[field.key]);
      }
      if (!field.setter && field.key in input && input[field.key] !== undefined) {
        (data as unknown as Record<string, unknown>)[field.key] = input[field.key];
      }
    }
    return data;
  }

  createEmptyData(): CreatureData {
    const data: CreatureData = {
      script: new CreatureDataScript(),
      proficiencies: [] as CreatureDataProficiencies,
      immunities: [] as ImmunityName[],
      items: new CreatureDataItems(),
      spells: new CreatureDataSpells(),
      effects: new CreatureDataEffects(),
    };
    return data;
  }

  setAdjustments(cre: Creature, adjustments: PartialCreatureAdjustment[]) {
    this.checkValidation(cre);
    for (const adjustment of adjustments) {
      const result: CreatureAdjustment = {
        ...adjustment,
        files: adjustment.files.map((f) => f.toUpperCase()),
        noWeapon: adjustment.noWeapon ?? false,
        summon: adjustment.summon ?? false,
        scriptName: adjustment.scriptName ?? false,
        data: adjustment.data
          ? this.getData(undefined, adjustment.data, true)
          : this.createEmptyData(),
      };
      cre.adjustments.push(result);
    }
  }

  equipItem(cre: Creature, item: Item, slot?: ItemSlot[]): void {
    this.checkValidation(cre);
    slot ??= item.equippedSlot;
    // equippedSlot is required by Item, but defended anyway - see creature.factory.test.ts's
    // "throws when no slot is given and the item has no equippedSlot either".
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!slot) throw new Error(`No slot defined for ${item.stringRef ?? "unknown"}`);
    const equippedItem = cre.data.items.equipped.find(
      (e) => slot.length === 1 && e.slot[0] === slot[0],
    );
    const duplicate = cre.items.find((i) => i.file === equippedItem?.file);
    if (equippedItem && duplicate) {
      const equippedItemSlot = Array.isArray(equippedItem.slot)
        ? equippedItem.slot.join(",")
        : equippedItem.slot;
      logService.warn(
        `Slot ${equippedItemSlot} is already attributed to ${duplicate.stringRef ?? "unknown"}.`,
      );
    }
    cre.data.items.equipped.push({
      file: item.file,
      slot,
    });
  }

  setBehavior(cre: Creature, behavior: PartialCreatureBehavior) {
    this.checkValidation(cre);
    // behavior is a definite-assignment field (always set by the time a Creature is used), but
    // this is the method that does that first assignment - cre.behavior is genuinely undefined
    // here on a creature that hasn't had setBehavior called yet.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const current: CreatureBehavior = cre.behavior ?? structuredClone(BEHAVIOR_DEFAULT);
    // these four fields are pulled out only to exclude them from the `...others` spread below
    // (each is merged in separately via its own push()); the destructured names go unused.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { abilities, customCodes, additionalCodes, dialog, ...others } = behavior;
    cre.behavior = {
      ...current,
      ...others,
    };
    if (abilities && !Array.isArray(abilities)) {
      cre.pendingAbilityEntries = abilities.entries;
    } else {
      cre.behavior.abilities.push(...abilityService.getAbilities(abilities));
    }
    cre.behavior.customCodes.push(...abilityService.getCustomCodes(behavior.customCodes));
    cre.behavior.additionalCodes.push(...(behavior.additionalCodes ?? []));
    cre.behavior.dialog.push(...(behavior.dialog ?? []));
  }

  resolveAbilities(cre: Creature): void {
    cre.behavior.abilities.push(...abilityService.getAbilities(abilityOrderService.resolve(cre)));
  }

  checkValidation(creature: Creature) {
    if (creature.valid !== undefined)
      throw new Error(
        `Creature ${translationService.from(creature.name)} has already been validated`,
      );
  }

  validate(creature: Creature, family: MonsterFamilyEnum) {
    let valid = true;
    if (State.creatures.some((c) => c.id === creature.id)) {
      throw new Error(`Monster '${MonsterEnum[creature.id]}' already declared`);
    }
    if (creature.family !== family) {
      logService.warn(`Family doesn't match: ${creature.family} <-> ${family}`);
      valid = false;
    }
    if (!creature.files.length) {
      logService.warn(`No files defined`);
      valid = false;
    }
    const existingFiles = creature.files.filter((f) =>
      State.creatures.some((c) => c.files.includes(f)),
    );
    if (existingFiles.length) {
      logService.warn(
        `${
          figureSet.warning
        } Those files are already declared in other creatures: ${existingFiles.join(", ")}`,
      );
      valid = false;
    }
    // attack/behavior are definite-assignment fields, but validate() is the fallback for a
    // creature that never explicitly called setAttack()/setBehavior() - genuinely unset here.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!creature.attack) {
      logService.warn(`No attack defined, using defaults`);
      creature.setAttack({});
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!creature.behavior) {
      logService.warn(`No behavior defined, using defaults`);
      this.setBehavior(creature, {});
    }
    if (valid) State.creatures.push(creature);
    creatureService.check(creature);
    this.resolveAbilities(creature);
    creatureService.checkSpellAbilities(creature);
    creatureService.checkDuplicateAbilities(creature);
    immunityService.handleImmunities(creature);
    creatureService.checkWeapons(creature);
    descriptionService.generateCreatureSpells(creature.spells);
    descriptionService.generateCreatureItems(creature.items);
    creature.valid = valid;
  }
}

const creatureFactory = new CreatureFactory();
export default creatureFactory;

import atWillService from "../services/at-will.service";
import figureSet from "figures";
import { MonsterEnum } from "../../creatures/monster";
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
import { gamesOverlap } from "../model/creature/game";
import { ItemSlot } from "../model/creature/item";
import { ImmunityName } from "../model/final/immunity";
import { Item } from "../model/spell-item/spell-item";
import abilityOrderService from "../services/baf/ability-order.service";
import abilityService from "../services/baf/ability.service";
import scriptPlanService from "../services/baf/script-plan.service";
import scriptViewService, { HandWrittenBehavior } from "../services/baf/script-view.service";
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
        field.setter(data, input[field.key], isAdjustment);
      }
      if (!field.setter && field.key in input && input[field.key] !== undefined) {
        (data as unknown as Record<string, unknown>)[field.key] = input[field.key];
      }
    }
    // Not a CREATURE_DATA_FIELDS entry (it never reaches CRE files), so copied by hand.
    if (input.xpAbilities !== undefined) data.xpAbilities = [...input.xpAbilities];
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
    this.appendAdjustments(cre, adjustments);
  }

  /**
   * Appends adjustments without the validation check: for generated entries added once the
   * creature is validated (e.g. ExperienceService's XP patches, which need resolved abilities).
   */
  appendAdjustments(cre: Creature, adjustments: PartialCreatureAdjustment[]) {
    for (const adjustment of adjustments) {
      const result: CreatureAdjustment = {
        ...adjustment,
        files: adjustment.files.map((f) => f.toUpperCase()),
        game: adjustment.game,
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
      // one script per creature: its entries are declared once, in its own code
      if (cre.pendingAbilityEntries) {
        throw new Error(
          `Creature ${translationService.from(cre.name)}: ability entries are already declared, declare them all at once`,
        );
      }
      cre.pendingAbilityEntries = abilities.entries;
    } else {
      cre.behavior.abilities.push(...abilityService.getAbilities(abilities));
    }
    cre.behavior.customCodes.push(...abilityService.getCustomCodes(behavior.customCodes));
    cre.behavior.additionalCodes.push(...(behavior.additionalCodes ?? []));
    cre.behavior.dialog.push(...(behavior.dialog ?? []));
  }

  resolveAbilities(cre: Creature): void {
    cre.handWrittenAbilities = [...cre.behavior.abilities];
    // first, while the creature's abilities are only its hand-written ones (see resolveCovered)
    cre.behavior.coveredAbilities = abilityService.getAbilities(
      abilityOrderService.resolveCovered(cre),
    );
    cre.behavior.abilities.push(...abilityService.getAbilities(abilityOrderService.resolve(cre)));
  }

  /**
   * A variant with spells of its own gets its own script, resolved apart (see ScriptViewService):
   * the hand-written behavior is kept before the creature's own resolution, which then covers
   * every variant's abilities. Undefined when every file runs the base script.
   */
  private takeHandWritten(creature: Creature): HandWrittenBehavior | undefined {
    if (!scriptPlanService.hasScriptedVariant(creature)) return undefined;
    const handWritten = scriptViewService.snapshot(creature);
    scriptViewService.addVariantBehaviors(creature);
    return handWritten;
  }

  private planScripts(creature: Creature, handWritten: HandWrittenBehavior | undefined): void {
    creature.scripts = scriptPlanService.plan(creature);
    for (const script of creature.scripts) {
      if (handWritten) script.view = scriptViewService.build(creature, script, handWritten);
      const lines = scriptViewService.describe(script.view);
      if (!lines.length) continue;
      const variant = script.variant ? ` (${script.variant.label})` : "";
      logService.log(`script ${script.name}${variant}:`);
      for (const line of lines) logService.log(`    ${line}`);
    }
  }

  checkValidation(creature: Creature) {
    if (creature.valid !== undefined)
      throw new Error(
        `Creature ${translationService.from(creature.name)} has already been validated`,
      );
  }

  validate(creature: Creature) {
    let valid = true;
    if (State.creatures.some((c) => c.id === creature.id)) {
      throw new Error(`Monster '${MonsterEnum[creature.id]}' already declared`);
    }
    const hasFiles = creature.files.length > 0;
    if (!hasFiles) {
      logService.info(`No creature files yet (no validated creatures.csv row), not generated`);
    }
    const existingFiles = creature.files.filter((f) =>
      State.creatures.some((c) =>
        c.files.some((known) => known.name === f.name && gamesOverlap(known.game, f.game)),
      ),
    );
    if (existingFiles.length) {
      logService.warn(
        `${figureSet.warning} Those files are already declared in other creatures: ${existingFiles
          .map((f) => (f.game ? `${f.name} (${f.game})` : f.name))
          .join(", ")}`,
      );
      valid = false;
    }
    // attack/behavior are definite-assignment fields, but validate() is the fallback for a
    // creature that never explicitly called setAttack()/setBehavior() - genuinely unset here.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!creature.attack) {
      logService.info(`No attack defined, using defaults`);
      creature.setAttack({});
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!creature.behavior) {
      logService.info(`No behavior defined, using defaults`);
      this.setBehavior(creature, {});
    }
    if (valid && hasFiles) State.creatures.push(creature);
    creatureService.check(creature);
    creatureService.checkAdjustmentSpells(creature);
    creatureService.checkSpellRoles(creature);
    const handWritten = this.takeHandWritten(creature);
    this.resolveAbilities(creature);
    atWillService.checkDuplicates(creature);
    atWillService.applyCooldowns(creature);
    this.planScripts(creature, handWritten);
    creatureService.checkSpellAbilities(creature);
    creatureService.checkDuplicateAbilities(creature);
    const dialogValid = creatureService.checkDialog(creature);
    const adjustmentFilesValid = creatureService.checkAdjustmentFiles(creature);
    immunityService.handleImmunities(creature);
    creatureService.checkWeapons(creature);
    creatureService.checkAgainstCsv(creature);
    descriptionService.generateCreatureSpells(creature.spells);
    descriptionService.generateCreatureItems(creature.items);
    const otherwiseValid = valid && dialogValid && adjustmentFilesValid;
    creature.valid = otherwiseValid && hasFiles;
    creature.noFiles = otherwiseValid && !hasFiles;
    if (!otherwiseValid) {
      logService.warn(`${translationService.from(creature.name)} is not valid, please fix it !`);
    }
  }
}

const creatureFactory = new CreatureFactory();
export default creatureFactory;

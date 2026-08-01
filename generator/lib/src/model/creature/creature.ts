import { MonsterItemIconEnum } from "../../../config/item";
import { MonsterEnum, MonsterFamilyEnum } from "../../../creatures/monster";
import { TranslationKey } from "../../../translations/i18n";
import creatureFactory from "../../factories/creature.factory";
import targetService from "../../services/baf/target.service";
import grabService from "../../services/effects/grab.service";
import translationService from "../../services/translation.service";
import logService from "../../services/log.service";
import utils from "../../services/utils/utils.service";
import { ImmunityName } from "../final/immunity";
import { StringReference } from "../final/stringref";
import { ClassIdentifier } from "../ids/class";
import { Effect, EffectFile } from "../spell-item/effect";
import { EffectTargetEnum, EffectTimingEnum, ItemCategoryEnum } from "../spell-item/effect.enums";
import {
  Item,
  PartialItem,
  PartialSpell,
  PartialWeapon,
  Spell,
  WeaponCastSpell,
} from "../spell-item/spell-item";
import { AbstractCreature } from "./abstract-creature";
import { CreatureAdjustment, PartialCreatureAdjustment } from "./adjustment";
import { CreatureAttack, CreatureAttackAction, PartialCreatureAttack } from "./attack";
import { CreatureBehavior, PartialCreatureBehavior } from "./behavior";
import { CreatureData, MainCreatureData } from "./data";
import { InputCreatureData } from "./data-input";
import { CreatureGrabConfig } from "./grab";
import { ItemSlot, JEWEL_SLOTS } from "./item";
import { AbilityEntry } from "./ability";

export interface BaseCreature {
  files: string[];
  data: CreatureData;
}

export class Creature extends AbstractCreature implements BaseCreature {
  fileType: "m" | "f" = "m";
  /**
   * Will produce usefull WEIDU logs (false by default)
   */
  logging!: boolean;
  name!: TranslationKey;
  family!: MonsterFamilyEnum;
  data!: MainCreatureData;
  behavior!: CreatureBehavior;
  attack!: CreatureAttack;
  files: string[] = [];
  newFiles: CreatureNewFile[] = [];

  /**
   * For these files, keep existing creature values if they are better
   */
  notEnforceFiles: string[] = [];
  adjustments: CreatureAdjustment[] = [];
  effectFiles: EffectFile[] = [];

  /**
   * Immunity names pushed onto data.immunities purely to satisfy an engine restriction (e.g.
   * critical-hit immunity requiring a helmet slot) rather than being authored on the creature.
   * Documentation generation excludes these since the granting trait already covers them.
   */
  autoImmunities: ImmunityName[] = [];

  /**
   * Auto-generate some creature data (true by default)
   */
  autoGenerate: CreatureAutoGenerate = {
    thac0: true,
    hitPoints: true,
    enchantment: true,
    meleeRange: true,
  };
  valid?: boolean;
  pendingAbilityEntries?: AbilityEntry[];

  // Not actually useless: narrows the base class's plain `number` id parameter to MonsterEnum,
  // so `new Creature(id)` only accepts valid monster ids.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(id: MonsterEnum) {
    super(id);
  }

  setData(data: InputCreatureData) {
    creatureFactory.setData(this, data);
  }

  setBehavior(behavior: PartialCreatureBehavior) {
    creatureFactory.setBehavior(this, behavior);
  }

  setAttack(attack: PartialCreatureAttack) {
    const defaultAction: CreatureAttackAction = {
      disableInterrupt: false,
      responseWeight: 100,
    };
    const actions: CreatureAttackAction[] = (attack.actions ?? []).map((a) => ({
      responseWeight: a.responseWeight ?? defaultAction.responseWeight,
      disableInterrupt: a.disableInterrupt ?? defaultAction.disableInterrupt,
      weaponSlot: a.weaponSlot,
    }));
    this.attack = {
      actions: actions.length ? actions : [defaultAction],
      melee: attack.melee ?? true,
      ranged: attack.ranged ?? false,
      dualWielding: false,
      targetPriorities: targetService.getTargetPriorities(this, attack),
      targetStatusWeaponSlot: attack.targetStatusWeaponSlot ?? [],
      defaultWeaponSlot: attack.defaultWeaponSlot,
      selectWeapons: attack.selectWeapons ?? [],
    };
  }

  setAdjustments(adjustments: PartialCreatureAdjustment[]) {
    creatureFactory.setAdjustments(this, adjustments);
  }

  seeInvisible() {
    return utils.hasImmunity(this.data.immunities, "seeInvisible");
  }

  override addSpell(spell: PartialSpell): Spell {
    const result = super.addSpell(spell);
    if (spell.memorizedCount !== undefined) {
      this.data.spells.memorized.push({
        file: result.file,
        memorizedCount: spell.memorizedCount,
      });
    }
    return result;
  }

  override addItem(item: PartialItem): Item {
    const result = super.addItem(item);
    if (!item.equippedSlot) return result;
    const equippedSlot = item.equippedSlot;
    const itemInSlot = this.data.items.equipped.findIndex(
      (i) => i.slot.length === 1 && i.slot[0] === equippedSlot[0],
    );
    if (itemInSlot !== -1) {
      logService.log(`replacing item in slot ${item.equippedSlot[0]}`);
      this.data.items.equipped.splice(itemInSlot, 1);
    }

    this.data.items.equipped.push({
      file: result.file,
      slot: item.equippedSlot,
    });
    return result;
  }

  equipItem(item: Item, slot?: ItemSlot[]): void {
    creatureFactory.equipItem(this, item, slot);
  }

  memorizeSpell(file: string, memorizedCount: number) {
    this.data.spells.memorized.push({ file, memorizedCount });
  }

  override addWeapon({
    weapon,
    grab,
    castSpells,
  }: {
    weapon: PartialWeapon;
    grab?: CreatureGrabConfig;
    castSpells?: WeaponCastSpell[];
  }) {
    const result = super.addWeapon({ weapon, castSpells });
    if (grab) grabService.attachGrabToWeapon(this, result, grab);
    return result;
  }

  addTrait(payload: {
    id?: number;
    description?: StringReference;
    immunities?: ImmunityName[];
    effects?: Effect[];
    equippedSlot?: ItemSlot;
  }): Item {
    const stringRef = translationService.addCustomTranslation([
      `${translationService.from(this.name)} ${translationService.from("common.creatureTraits")}`,
    ]);
    const item = this.addItem({
      stringRef,
      id: payload.id,
      description: payload.description,
      effects: (payload.effects ?? []).map((e) => ({
        ...e,
        timing: EffectTimingEnum.InstantWhileEquipped,
        target: EffectTargetEnum.Self,
      })),
      immunities: payload.immunities,
      equippedSlot: payload.equippedSlot ? [payload.equippedSlot] : JEWEL_SLOTS,
      category: ItemCategoryEnum.Rings,
      icon: MonsterItemIconEnum.Traits,
    });
    item.trait = true;
    return item;
  }

  validate(family: MonsterFamilyEnum) {
    creatureFactory.validate(this, family);
  }
}

export interface CreatureNewFile {
  files: string[];
  copyFromExisting?: string;
  copyFrom?: string;
  stringRef?: StringReference;
}

export interface CreatureAutoGenerate {
  thac0?: boolean;
  hitPoints?: boolean;
  savingThrows?: {
    level: number;
    classe?: ClassIdentifier;
    bonus?: {
      saveDeath?: number;
      saveWand?: number;
      savePolymorph?: number;
      saveBreath?: number;
      saveSpell?: number;
    };
  };
  enchantment?: boolean;
  meleeRange?: boolean;
}

import { MonsterItemIconEnum } from "../../../config/item";
import { MonsterEnum } from "../../../creatures/monster";
import { EntryEnum } from "../../../creatures/entry";
import { TranslationKey } from "../../../translations/i18n";
import creatureFactory from "../../factories/creature.factory";
import targetService from "../../services/baf/target.service";
import grabService from "../../services/effects/grab.service";
import translationService from "../../services/translation.service";
import logService from "../../services/log.service";
import { ResourceScope } from "../../services/utils/misc.func";
import utils from "../../services/utils/utils.service";
import { ImmunityName } from "../final/immunity";
import { StringReference } from "../final/stringref";
import { ClassIdentifier } from "../ids/class";
import { Effect, EffectFile } from "../spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ItemCategoryEnum,
  PnPPoisonType,
} from "../spell-item/effect.enums";
import {
  Item,
  PartialItem,
  PartialSpell,
  PartialWeapon,
  Spell,
  Weapon,
  WeaponCastSpell,
} from "../spell-item/spell-item";
import { NATURAL_WEAPONS, NaturalWeaponKind } from "../../../config/natural-weapons";
import poisonService from "../../services/effects/poison.service";
import variantFactory from "../../factories/variant.factory";
import type { TurnUndeadType } from "../../../creatures/types/turn-level";
import { AbstractCreature } from "./abstract-creature";
import { CreatureAdjustment, PartialCreatureAdjustment } from "./adjustment";
import type { Variant, VariantInput } from "./variant";
import { CreatureAttack, CreatureAttackAction, PartialCreatureAttack } from "./attack";
import { CreatureBehavior, PartialCreatureBehavior } from "./behavior";
import { CreatureData, MainCreatureData } from "./data";
import { CreatureFile } from "./game";
import { InputCreatureData } from "./data-input";
import { CreatureGrabConfig } from "./grab";
import { ItemSlot, JEWEL_SLOTS } from "./item";
import { AbilityEntry } from "./ability";
import { State } from "../../state";

export interface NaturalWeaponOptions {
  /** Default: the kind's shared name (NATURAL_WEAPONS). */
  stringRef?: StringReference;
  diceThrown: number;
  diceSize: number;
  speed: number;
  /** Default "WEAPON1"; null = not equipped. */
  slot?: ItemSlot | null;
  id?: number;
  icon?: string;
  damageType?: AbilityDamageTypeEnum;
  damageBonus?: number;
  effects?: Effect[];
  range?: number;
  projectile?: string;
  animationSwing?: { overhand: number; backhand: number; thrust: number };
  immunities?: ImmunityName[];
  doc?: boolean;
  castSpells?: WeaponCastSpell[];
  poison?: { poisonType: PnPPoisonType; saveBonus?: number };
  grab?: CreatureGrabConfig;
}

// Drops undefined-valued keys: an explicit undefined can override a default in itemService.getItem.
function definedOnly<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export interface BaseCreature {
  data: CreatureData;
}

export class Creature extends AbstractCreature implements BaseCreature {
  fileType: ResourceScope = "m";
  /**
   * Will produce usefull WEIDU logs (false by default)
   */
  logging!: boolean;
  name!: TranslationKey;
  /**
   * Monster entry this creature is a version of (docs grouping), set by the CreatureEntry that
   * built it.
   */
  entry?: EntryEnum;
  /**
   * Mod-relative folder its generated files go to (`lib/pnp-monster/<entry>`), set by the
   * CreatureEntry that built it (see utils.getCreatureFolder).
   */
  folder?: string;
  data!: MainCreatureData;
  behavior!: CreatureBehavior;
  attack!: CreatureAttack;
  files: CreatureFile[] = [];

  /** Just the file names, for the many call sites that don't care about game scoping. */
  get fileNames(): string[] {
    return this.files.map((f) => f.name);
  }
  newFiles: CreatureNewFile[] = [];

  /**
   * For these files, keep existing creature values if they are better
   */
  notEnforceFiles: string[] = [];
  adjustments: CreatureAdjustment[] = [];
  /** Root variants declared on this creature (sub-variants live under `Variant.children`). */
  variants: Variant[] = [];
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
  /**
   * Set by validate() when the creature has no file yet (no validated creatures.csv row), but is
   * otherwise valid. It still has `valid` false - nothing to generate or document - but it is
   * work waiting on csv validation, not a bug.
   */
  noFiles?: boolean;
  pendingAbilityEntries?: AbilityEntry[];
  /** Undead (or made undead by an adjustment): PnP "turned as" row, when harder to turn than its Hit Dice. */
  turnAs?: TurnUndeadType;

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

  /**
   * Declare a named stat profile ("greater ghast", "lacedon", ...) shared by a set of existing
   * creature files. Sugar over {@link setAdjustments}: expands to ordered adjustment entries, so
   * WeiDU generation and the doc adjustment cards are unchanged. See {@link VariantInput}.
   *
   * `parent` is passed by {@link Variant.variant} when deriving a sub-variant; call that instead
   * of passing it here directly.
   */
  variant(label: string, input: VariantInput, parent?: Variant): Variant {
    return variantFactory.add(this, label, input, parent);
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
    if (!item.equippedSlot?.length) return result;
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

  /**
   * Adds a natural weapon (jaws, claws, fists...): kind defaults from NATURAL_WEAPONS, everything
   * creature-specific from the options. Only defined options are set, so item defaults still apply.
   */
  addNaturalWeapon(kind: NaturalWeaponKind, o: NaturalWeaponOptions): Weapon {
    const defaults = NATURAL_WEAPONS[kind];
    const slot = o.slot === undefined ? "WEAPON1" : o.slot;
    const castSpells = [
      ...(o.poison ? [poisonService.getSpell(o.poison)] : []),
      ...(o.castSpells ?? []),
    ];
    return this.addWeapon({
      weapon: definedOnly<PartialWeapon>({
        id: o.id,
        stringRef: o.stringRef ?? defaults.name,
        icon: o.icon ?? defaults.icon,
        equippedSlot: slot === null ? [] : [slot],
        immunities: o.immunities,
        doc: o.doc,
        header: definedOnly<PartialWeapon["header"]>({
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: o.diceThrown,
          diceSize: o.diceSize,
          damageBonus: o.damageBonus,
          damageType: o.damageType ?? defaults.damageType,
          speed: o.speed,
          range: o.range,
          projectile: o.projectile,
          animationSwing: o.animationSwing,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: o.effects,
        }),
      }),
      grab: o.grab,
      castSpells,
    });
  }

  addTrait(payload: {
    description?: StringReference;
    immunities?: ImmunityName[];
    effects?: Effect[];
    equippedSlot?: ItemSlot;
  }): Item {
    const stringRef = translationService.addCustomTranslation([
      `${translationService.from(this.name)} ${translationService.from("common.creatureTraits")}`,
    ]);
    const traitItem = this.items.find((s) => s.trait);
    if (traitItem) throw new Error("Already has a trait defined");
    const traitIndex = this.data.items.equipped.findIndex((e) => {
      const i = State.items.find((i) => i.file === e.file);
      return !!i && i.trait;
    });
    if (traitIndex !== -1) {
      logService.warn(`Override existing trait: ${this.data.items.equipped[traitIndex].file}`);
      this.data.items.equipped.splice(traitIndex, 1);
    }
    const item = this.addItem({
      stringRef,
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

  validate() {
    creatureFactory.validate(this);
  }
}

export interface CreatureNewFile {
  files: string[];
  copyFromExisting?: string;
  copyFrom?: string;
  stringRef?: StringReference;
}

export interface CreatureAutoGenerateSavingThrows {
  level?: number;
  classe?: ClassIdentifier;
  bonus?: {
    saveDeath?: number;
    saveWand?: number;
    savePolymorph?: number;
    saveBreath?: number;
    saveSpell?: number;
  };
}

export interface CreatureAutoGenerateThac0 {
  /** Nominal level/Hit Dice for the THAC0 table lookup, in place of level1's pnpValue. */
  level?: number;
}

export interface CreatureAutoGenerate {
  thac0?: boolean | CreatureAutoGenerateThac0;
  hitPoints?: boolean;
  savingThrows?: CreatureAutoGenerateSavingThrows;
  enchantment?: boolean;
  meleeRange?: boolean;
}

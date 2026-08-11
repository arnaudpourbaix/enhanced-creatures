import { GRAB_IMMUNE_CREATURES, HUGE_CREATURES, LARGE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureGrabConfig, GRAB_DEFAULT_CONFIG } from "../../model/creature/grab";
import { CreatureSizeTable } from "../../model/game-data/sizes";
import { Effect, IdsEffect } from "../../model/spell-item/effect";
import {
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Spell, Weapon } from "../../model/spell-item/spell-item";
import creatureService from "../creature.service";
import logService from "../log.service";
import spellService from "../spell.service";
import translationService from "../translation.service";
import { getSpellFilename } from "../utils/misc.func";
import effectService from "./effect.service";

class GrabService {
  attachGrabToWeapon(creature: Creature, weapon: Weapon, grab: CreatureGrabConfig) {
    const spell = this.createGrabSpell(creature, grab);
    this.updateWeapon(creature, grab, weapon, spell);
  }

  private createGrabSpell(creature: Creature, grab: CreatureGrabConfig): Spell {
    const file = getSpellFilename(creature.spells.length + 1, creature.id);
    const effectFile = effectService.getEffect({
      opcode: EffectTypeEnum.ProtectionFromSpell,
      resource: file,
      duration: 1,
    });
    creature.effectFiles.push({ ...effectFile, file });
    grab.rounds ??= GRAB_DEFAULT_CONFIG.rounds;
    const description = translationService.interpolate("spell.grab.description", {
      duration: grab.rounds,
    });
    const spell = spellService.getSpell(
      {
        name: GRAB_DEFAULT_CONFIG.grabStringRef,
        description: translationService.addCustomTranslation([description]),
        doc: false,
        headers: [
          {
            type: ItemAbilityTypeEnum.Melee,
            target: ItemAbilityTargetEnum.LivingActor,
            range: 5,
            effects: this.getGrabbedEffects(creature, grab, file),
          },
        ],
      },
      file,
    );
    creature.spells.push(spell);
    return spell;
  }

  private updateWeapon(
    creature: Creature,
    grab: CreatureGrabConfig,
    weapon: Weapon,
    spell: Spell,
  ): void {
    const strModifier = creatureService.getStrengthBonus(creature.data).hit;
    const sizeEntry = CreatureSizeTable.find((s) => s.size === creature.data.size);
    if (!sizeEntry) throw new Error(`Size ${creature.data.size} is not defined !`);
    const sizeModifier = sizeEntry.grabModifier;
    const calculatedSaveBonus =
      (strModifier + sizeModifier + (grab.onlyGrabProneTarget ? 4 : 0)) * -1;
    const saveBonus = grab.saveBonus ?? calculatedSaveBonus;
    const effect = effectService.getEffect({
      saveBonus,
      opcode: EffectTypeEnum.CastSpell,
      type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
      probability1: grab.probability ?? GRAB_DEFAULT_CONFIG.probability,
      // ?? (not a truthy check): SaveTypeEnum.Spell is 0, a real save type, not "unset".
      saveTypes: [grab.saveType ?? GRAB_DEFAULT_CONFIG.saveType],
      resource: spell.file,
    });
    weapon.header.effects.push(effect);
  }

  private getGrabbedEffects(creature: Creature, grab: CreatureGrabConfig, file: string): Effect[] {
    const duration = (grab.rounds ?? GRAB_DEFAULT_CONFIG.rounds) * 6;
    const grabEffects: Effect[] = [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: GRAB_DEFAULT_CONFIG.grabbedState,
        duration,
      },
      {
        opcode: EffectTypeEnum.DisplayString,
        stringRef: GRAB_DEFAULT_CONFIG.grabbedStringRef,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
      },
      {
        opcode: EffectTypeEnum.MovementRateBonus2,
        type: EffectModifierTypeEnum.Set,
        value: 0,
        duration,
      },
      {
        opcode: EffectTypeEnum.DexterityBonus,
        value: 8, // Grabbed creature loose AC from their dexterity bonus
        type: EffectStatisticModifierEnum.Set,
        duration,
      },
      {
        opcode: EffectTypeEnum.ArmorClassBonus,
        bonusTo: EffectBonusToEnum.AllWeapons,
        value: -4, // Opponents get +4 bonus on their attack rolls against grabbed target
        duration,
      },
      {
        opcode: EffectTypeEnum.Thac0Bonus,
        type: EffectModifierTypeEnum.Increment,
        value: -4,
        duration,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.Entangled,
        duration,
      },
      {
        opcode: EffectTypeEnum.PlaySound,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        resource: GRAB_DEFAULT_CONFIG.startSound,
      },
      {
        opcode: EffectTypeEnum.PlaySound,
        timing: EffectTimingEnum.DelayPermanent,
        resource: GRAB_DEFAULT_CONFIG.endSound,
        duration,
      },
      {
        opcode: EffectTypeEnum.PlayVisualEffect,
        playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
        resource: GRAB_DEFAULT_CONFIG.visualEffect,
        duration,
      },
      {
        opcode: EffectTypeEnum.ProtectionFromSpell,
        resource: file,
        duration,
      },
    ];
    const immunityEffects = this.getGrabImmuneEffects(creature, file);
    return [...immunityEffects, ...grabEffects];
  }

  private getGrabImmuneEffects(creature: Creature, file: string): Effect[] {
    const list = [...GRAB_IMMUNE_CREATURES];
    // size is required by MainCreatureData, but defended anyway - see the "warns when the
    // creature has no size" test, which calls this directly with size unset.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!creature.data.size) {
      logService.warn(`Creature size is needed to add grab immunities!`);
    } else {
      if (["Huge", "Large"].includes(creature.data.size)) {
        list.push(...HUGE_CREATURES);
      }
      if (creature.data.size === "Large") {
        list.push(...LARGE_CREATURES);
      }
    }
    const rawEffects: IdsEffect[] = list.map((i) => ({
      opcode: EffectTypeEnum.UseEFFFile,
      idsFile: i[0],
      idsEntry: i[1],
      duration: 1,
      target: EffectTargetEnum.PresetTarget,
      resource: file,
    }));
    return effectService.getEffects(rawEffects);
  }
}

const grabService = new GrabService();
export default grabService;

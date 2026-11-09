import { GRAB_IMMUNE_CREATURES, HUGE_CREATURES, LARGE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureGrabConfig, GRAB_DEFAULT_CONFIG } from "../../model/creature/grab";
import { getCreatureSize } from "../../model/game-data/sizes";
import { Durations } from "../../model/game-data/durations";
import { Effect, IdsEffect } from "../../model/spell-item/effect";
import {
  AttackModifierTypeEnum,
  CastSpellOnConditionTargetEnum,
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
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { PartialSpell, Spell, Weapon } from "../../model/spell-item/spell-item";
import creatureService from "../creature.service";
import logService from "../log.service";
import spellService from "../spell.service";
import translationService from "../translation.service";
import { TranslationKey } from "../../../translations/i18n";
import { getSpellFilename } from "../utils/misc.func";
import effectService from "./effect.service";

/** How far from a dying grabber its victims are released: 10 feet, well over its reach. */
const RELEASE_RADIUS = 180;

/**
 * Seconds a round's hold outlasts the next check: the check and the hold it casts take a moment to
 * land, and the victim must not walk free in between (in-game test). A victim who saves stays
 * held that much longer.
 */
const HOLD_OVERLAP = 1;

interface GrabSave {
  saveTypes: SaveTypeEnum[];
  saveBonus: number;
}

/**
 * Grab, held one round at a time: a spell's identical saves are rolled once, so a save every round
 * needs a new spell application every round.
 * - check (the weapon's hit casts it, then the hold every round): the save, then the hold. A
 *   success frees the victim: the hold isn't renewed and its effects run out. A grab on
 *   probability only skips it the first round: the hit casts the hold.
 * - hold (no save): removes the previous round's hold, then holds the victim a round (plus a
 *   short overlap), deals the grip's damage, and casts the check at the victim one round later.
 *   The grabber (the hold's original caster) can't move, nor attack when the grip deals the
 *   damage. Another hit while held just gives another check, which renews the round on a failure.
 * - release: the grabber's death contingency removes the hold, and its pending check, from the
 *   creatures around it.
 */
class GrabService {
  attachGrabToWeapon(creature: Creature, weapon: Weapon, grab: CreatureGrabConfig) {
    grab.trigger ??= "both";
    weapon.grab = true;
    const save = this.getSave(creature, grab);
    // the spells reference each other: their files are known before they are built
    const [check, hold, release] = [1, 2, 3].map((i) =>
      getSpellFilename(creature.spells.length + i, creature.id),
    );
    const onHit = grab.trigger === "probability" ? hold : check;
    this.addSpell(creature, check, this.getCheckSpell(grab, hold, save, onHit === check));
    this.addSpell(creature, hold, this.getHoldSpell(creature, grab, check, onHit === hold));
    this.addSpell(creature, release, this.getReleaseSpell(hold));
    weapon.header.effects.push(
      effectService.getEffect({
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        probability1: grab.trigger === "save" ? 100 : (grab.probability ?? 100),
        resource: onHit,
      }),
    );
    creature.addTraitEffects([
      {
        opcode: EffectTypeEnum.CastSpellOnCondition,
        conditionTarget: CastSpellOnConditionTargetEnum.Myself,
        condition: "Die()",
        special: 2,
        timing: EffectTimingEnum.InstantWhileEquipped,
        target: EffectTargetEnum.Self,
        resource: release,
      },
    ]);
  }

  /** The victim's save vs. the grabber's Strength and size (harder for a prone victim). */
  private getSave(creature: Creature, grab: CreatureGrabConfig): GrabSave {
    const strModifier = creatureService.getStrengthBonus(creature.data).hit;
    const sizeModifier = getCreatureSize(creature.data.size.value).grabModifier;
    const calculated = -(strModifier + sizeModifier + (grab.onlyGrabProneTarget ? 4 : 0));
    return {
      saveTypes: [grab.saveType ?? GRAB_DEFAULT_CONFIG.saveType],
      saveBonus: grab.saveBonus ?? calculated,
    };
  }

  private addSpell(creature: Creature, file: string, spell: PartialSpell): Spell {
    const result = spellService.getSpell(spell, file);
    creature.spells.push(result);
    return result;
  }

  /** What the weapon's hit casts: the grab's attack form, described to the player. */
  private onHitSpell(grab: CreatureGrabConfig): Partial<PartialSpell> {
    return {
      description: this.getDescription(grab),
      // a body's attack form, never a spell (user)
      xpAbility: "specialAttack",
    };
  }

  /** The grab's effects, the grip's damage, and what the grabber can still do while it holds. */
  private getDescription(grab: CreatureGrabConfig): number {
    const lines = [translationService.from("spell.grab.description")];
    const damage = grab.damagePerRound;
    let grabber: TranslationKey = "spell.grab.grabber";
    if (damage) {
      lines.push(translationService.interpolate("spell.grab.damage", { damage: diceText(damage) }));
      grabber = grab.freeHand ? "spell.grab.grabberFreeHand" : "spell.grab.grabberNoAttack";
    }
    lines.push(translationService.from(grabber));
    return translationService.addCustomTranslation(lines);
  }

  /** The round's save: failed, the victim is held one more round. */
  private getCheckSpell(
    grab: CreatureGrabConfig,
    hold: string,
    save: GrabSave,
    onHit: boolean,
  ): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabStringRef,
      doc: false,
      ...(onHit ? this.onHitSpell(grab) : {}),
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.CastSpell,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              resource: hold,
              ...save,
            },
          ],
        },
      ],
    };
  }

  private getHoldSpell(
    creature: Creature,
    grab: CreatureGrabConfig,
    check: string,
    onHit: boolean,
  ): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabbedStringRef,
      doc: false,
      ...(onHit ? this.onHitSpell(grab) : {}),
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 5,
          effects: this.getHoldEffects(creature, grab, check),
        },
      ],
    };
  }

  private getHoldEffects(creature: Creature, grab: CreatureGrabConfig, check: string): Effect[] {
    // outlasts the next check, so a failed save renews the hold before it runs out
    const duration = Durations.round + HOLD_OVERLAP;
    const victim: Effect[] = [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: GRAB_DEFAULT_CONFIG.grabbedState,
        duration,
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
        type: EffectStatisticModifierEnum.Increment,
        value: -4,
        duration,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.Entangled,
        duration,
      },
      {
        opcode: EffectTypeEnum.PlayVisualEffect,
        playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
        resource: GRAB_DEFAULT_CONFIG.visualEffect,
        duration,
      },
    ];
    if (grab.damagePerRound) {
      victim.push({
        opcode: EffectTypeEnum.Damage,
        timing: EffectTimingEnum.InstantPermanent,
        type: grab.damagePerRound.type,
        amount: grab.damagePerRound.amount,
        diceSize: grab.damagePerRound.diceSize,
        diceThrown: grab.damagePerRound.diceThrown,
      });
    }
    // the grabber holds on: it stays where it is, and the grip is its attack when it deals damage
    // (unless it grips with one hand and strikes with another)
    const grabber: Effect[] = [
      {
        opcode: EffectTypeEnum.SetExtendedSpellState,
        state: GRAB_DEFAULT_CONFIG.grabbingState,
        duration,
      },
      {
        opcode: EffectTypeEnum.MovementRateBonus2,
        type: EffectModifierTypeEnum.Set,
        value: 0,
        duration,
      },
      ...(grab.damagePerRound && !grab.freeHand
        ? [
            {
              opcode: EffectTypeEnum.ModifyAttacksPerRound,
              type: AttackModifierTypeEnum.Set,
              value: 0,
              duration,
            } satisfies Effect,
          ]
        : []),
    ];
    for (const effect of grabber) effect.target = EffectTargetEnum.OriginalCaster;
    const effects: Effect[] = [
      // first, so the previous round's hold doesn't stack with this one
      {
        opcode: EffectTypeEnum.RemoveEffectsByResource,
        type: RemoveEffectsByResourceTypeEnum.Default,
      },
      ...this.getGrabImmuneEffects(creature),
      {
        opcode: EffectTypeEnum.DisplayString,
        stringRef: GRAB_DEFAULT_CONFIG.grabbedStringRef,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
      },
      {
        opcode: EffectTypeEnum.PlaySound,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        resource: GRAB_DEFAULT_CONFIG.startSound,
      },
      ...victim,
      ...grabber,
      {
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        timing: EffectTimingEnum.DelayPermanent,
        resource: check,
        duration: Durations.round,
      },
    ];
    return effects;
  }

  /** The grabber's death frees its victims: their hold and its pending check are removed. */
  private getReleaseSpell(hold: string): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabStringRef,
      doc: false,
      // its grab's release, nothing of its own
      xpAbility: null,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          target: ItemAbilityTargetEnum.Caster,
          range: 1,
          projectile: {
            copyFromFile: "INAREA",
            name: "Grab release",
            areaEffectInfo: {
              triggerRadius: RELEASE_RADIUS,
              areaOfEffect: RELEASE_RADIUS,
            },
          },
          effects: [
            {
              opcode: EffectTypeEnum.RemoveEffectsByResource,
              type: RemoveEffectsByResourceTypeEnum.Default,
              resource: hold,
            },
          ],
        },
      ],
    };
  }

  /**
   * Creatures the grabber can't hold (too big, incorporeal...): protected from the hold before
   * its effects apply. The hold's file is the effect's own resource.
   */
  private getGrabImmuneEffects(creature: Creature): Effect[] {
    const list = [...GRAB_IMMUNE_CREATURES];
    // size is required by MainCreatureData, but defended anyway - see the "warns when the
    // creature has no size" test, which calls this directly with size unset.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!creature.data.size) {
      logService.warn(`Creature size is needed to add grab immunities!`);
    } else {
      if (["Huge", "Large"].includes(creature.data.size.value)) {
        list.push(...HUGE_CREATURES);
      }
      if (creature.data.size.value === "Large") {
        list.push(...LARGE_CREATURES);
      }
    }
    const rawEffects: IdsEffect[] = list.map((i) => ({
      opcode: EffectTypeEnum.UseEFFFile,
      idsFile: i[0],
      idsEntry: i[1],
      duration: 1,
      target: EffectTargetEnum.PresetTarget,
    }));
    return effectService.getEffects(rawEffects);
  }
}

const grabService = new GrabService();
export default grabService;

/** "2d8", "2d8+3" or "5": the grip's damage. */
function diceText(damage: { diceThrown?: number; diceSize?: number; amount?: number }): string {
  const dice =
    damage.diceThrown && damage.diceSize ? `${damage.diceThrown}d${damage.diceSize}` : "";
  if (!damage.amount) return dice;
  return dice ? `${dice}+${damage.amount}` : `${damage.amount}`;
}

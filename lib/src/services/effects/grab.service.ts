import { GRAB_IMMUNE_CREATURES, HUGE_CREATURES, LARGE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureGrabConfig, GRAB_DEFAULT_CONFIG, GripDamage } from "../../model/creature/grab";
import { getCreatureSize } from "../../model/game-data/sizes";
import { Durations } from "../../model/game-data/durations";
import { Effect } from "../../model/spell-item/effect";
import {
  AttackModifierTypeEnum,
  CastSpellOnConditionTargetEnum,
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectDamageTypeEnum,
  EffectIDSFileEnum,
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
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../model/spell-item/spell-protection";
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
 * - check (the weapon's hit casts it, then the hold every round): the save, then the grip's
 *   damage and the hold. A success frees the victim unharmed: the hold isn't renewed and its
 *   effects run out. A grab on probability only skips it the first round: the hit casts the
 *   hold, so the grip deals its damage from the next round (the hit deals the weapon's own).
 *   Creatures immune to the hold still take the grip's damage from a check the hit casts.
 * - hold (no save, none on a held victim, whom every attack hits): removes the previous round's
 *   hold, then holds the victim a round (plus a
 *   short overlap), casts the grip at the grabber (the hold's original caster), and casts the
 *   check at the victim one round later. Another hit while held just gives another check, which
 *   renews the round on a failure.
 * - grip (the grabber's side of the round): it can't move, nor attack when the grip deals the
 *   damage. Its own spell, so a kill can end it alone.
 * - release: the grabber's death contingency removes the hold, and its pending check, from the
 *   creatures around it.
 * - let go: the grabber's kill contingency removes its own grip, so it moves and attacks again
 *   at once when it kills its victim. Both contingencies are in its trait: a contingency renewed
 *   every round (in the hold) is refused while the previous one lasts (strref 24154, in game).
 */
class GrabService {
  attachGrabToWeapon(creature: Creature, weapon: Weapon, grab: CreatureGrabConfig) {
    grab.trigger ??= "both";
    weapon.grab = true;
    const save = this.getSave(creature, grab);
    const damage = this.getGripDamage(creature, grab);
    // the spells reference each other: their files are known before they are built
    const [check, hold, release, grip, letGo, seize] = [1, 2, 3, 4, 5, 6].map((i) =>
      getSpellFilename(creature.spells.length + i, creature.id),
    );
    const files = { check, grip };
    const onHit = grab.trigger === "probability" ? hold : check;
    this.addSpell(creature, check, this.getCheckSpell(grab, damage, hold, save, onHit === check));
    this.addSpell(creature, hold, this.getHoldSpell(creature, grab, damage, files, onHit === hold));
    this.addSpell(creature, release, this.getAreaRemovalSpell(hold));
    this.addSpell(creature, grip, this.getGripSpell(grab, damage.length > 0));
    this.addSpell(creature, letGo, this.getLetGoSpell(grip));
    const probability1 = grab.trigger === "save" ? 100 : (grab.probability ?? 100);
    // the grab's spells are nameless: the hit that seizes says it once, the renewed rounds don't.
    // Only when the hit holds at once (a check's save could still fail it); cast before the hold,
    // on the same roll, so a victim seized by this hit isn't grabbed yet
    if (onHit === hold) {
      this.addSpell(creature, seize, this.getSeizeSpell(creature));
      weapon.header.effects.push(
        effectService.getEffect({
          opcode: EffectTypeEnum.CastSpell,
          type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
          resource: seize,
          probability1,
        }),
      );
    }
    weapon.header.effects.push(
      effectService.getEffect({
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        resource: onHit,
        probability1,
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
      {
        opcode: EffectTypeEnum.CastSpellOnCondition,
        conditionTarget: CastSpellOnConditionTargetEnum.Myself,
        condition: "Killed([ANYONE])",
        timing: EffectTimingEnum.InstantWhileEquipped,
        target: EffectTargetEnum.Self,
        resource: letGo,
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

  /** The grip's damage, the grabber's Strength bonus added to the first one if asked. */
  private getGripDamage(creature: Creature, grab: CreatureGrabConfig): GripDamage[] {
    const list = [grab.damagePerRound ?? []].flat().map((d) => ({ ...d }));
    if (grab.addStrengthBonus && list.length > 0) {
      const bonus = creatureService.getStrengthBonus(creature.data).damage;
      list[0].amount = (list[0].amount ?? 0) + bonus;
    }
    return list;
  }

  private addSpell(creature: Creature, file: string, spell: PartialSpell): Spell {
    const result = spellService.getSpell(spell, file);
    creature.spells.push(result);
    return result;
  }

  /** What the weapon's hit casts: the grab's attack form, described to the player. */
  private onHitSpell(grab: CreatureGrabConfig, damage: GripDamage[]): Partial<PartialSpell> {
    return {
      description: this.getDescription(grab, damage),
      // a body's attack form, never a spell (user)
      xpAbility: "specialAttack",
    };
  }

  /** The grab's effects, the grip's damage, and what the grabber can still do while it holds. */
  private getDescription(grab: CreatureGrabConfig, damage: GripDamage[]): number {
    const lines = [translationService.from("spell.grab.description")];
    let grabber: TranslationKey = "spell.grab.grabber";
    if (damage.length > 0) {
      const key: TranslationKey =
        grab.trigger === "probability" ? "spell.grab.damageNextRound" : "spell.grab.damage";
      lines.push(
        translationService.interpolate(key, { damage: damage.map(damageText).join(" + ") }),
      );
      grabber = grab.freeHand ? "spell.grab.grabberFreeHand" : "spell.grab.grabberNoAttack";
    }
    lines.push(translationService.from(grabber));
    return translationService.addCustomTranslation(lines);
  }

  /**
   * The round's save: failed, the grip deals its damage and the victim is held one more round.
   * The damage shares the hold's save, so both roll once.
   */
  private getCheckSpell(
    grab: CreatureGrabConfig,
    damage: GripDamage[],
    hold: string,
    save: GrabSave,
    onHit: boolean,
  ): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabStringRef,
      doc: false,
      // a grab's spells are cast every round: none writes its name in the combat log
      hideName: true,
      ...(onHit ? this.onHitSpell(grab, damage) : {}),
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
            ...damage.map(
              (d): Effect => ({
                opcode: EffectTypeEnum.Damage,
                timing: EffectTimingEnum.InstantPermanent,
                type: d.type,
                amount: d.amount,
                diceSize: d.diceSize,
                diceThrown: d.diceThrown,
                ...save,
              }),
            ),
          ],
        },
      ],
    };
  }

  private getHoldSpell(
    creature: Creature,
    grab: CreatureGrabConfig,
    damage: GripDamage[],
    files: { check: string; grip: string },
    onHit: boolean,
  ): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabbedStringRef,
      doc: false,
      hideName: true,
      ...(onHit ? this.onHitSpell(grab, damage) : {}),
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 5,
          effects: this.getHoldEffects(creature, files),
        },
      ],
    };
  }

  private getHoldEffects(
    creature: Creature,
    files: { check: string; grip: string },
  ): Effect[] {
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
    const effects: Effect[] = [
      // first, so the previous round's hold doesn't stack with this one
      {
        opcode: EffectTypeEnum.RemoveEffectsByResource,
        type: RemoveEffectsByResourceTypeEnum.Default,
      },
      ...this.getHoldSkipEffects(creature),
      {
        opcode: EffectTypeEnum.PlaySound,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        resource: GRAB_DEFAULT_CONFIG.startSound,
      },
      ...victim,
      // cast at the victim, never straight at the grabber: the protections above only guard the
      // victim, so a grip aimed at the grabber would still bind it to a victim never held
      {
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        resource: files.grip,
      },
      {
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        timing: EffectTimingEnum.DelayPermanent,
        resource: files.check,
        duration: Durations.round,
      },
    ];
    return effects;
  }

  /**
   * The grabber's side of a round: it holds on, staying where it is, and the grip is its attack
   * when it deals damage (unless it grips with one hand and strikes with another). Lasts as long
   * as the round's hold.
   */
  private getGripSpell(grab: CreatureGrabConfig, damaging: boolean): PartialSpell {
    const duration = Durations.round + HOLD_OVERLAP;
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
      ...(damaging && !grab.freeHand
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
    return {
      name: GRAB_DEFAULT_CONFIG.grabStringRef,
      doc: false,
      hideName: true,
      // the grab's own effects, nothing of its own
      xpAbility: null,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 5,
          effects: [
            // first, so the previous round's grip doesn't stack with this one
            {
              opcode: EffectTypeEnum.RemoveEffectsByResource,
              type: RemoveEffectsByResourceTypeEnum.Default,
            } satisfies Effect,
            ...grabber,
            // cast at the victim (see the hold): every effect lands on the grabber, its caster
          ].map((e): Effect => ({ ...e, target: EffectTargetEnum.OriginalCaster })),
        },
      ],
    };
  }

  /**
   * Says "Grabbed" when the hit seizes its victim: never on a victim the hold skips (immune or
   * held), nor on one already grabbed (a hit while it holds just renews the round).
   */
  private getSeizeSpell(creature: Creature): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabbedStringRef,
      doc: false,
      hideName: true,
      // the grab's message, nothing of its own
      xpAbility: null,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.LivingActor,
          range: 5,
          effects: [
            ...this.getHoldSkipEffects(creature),
            {
              opcode: EffectTypeEnum.ProtectionFromResource,
              type: { stat: SpellProtectionStat.Splstate, relation: SpellProtectionRelation.Equal },
              value: GRAB_DEFAULT_CONFIG.grabbedState,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: GRAB_DEFAULT_CONFIG.grabbedStringRef,
            },
          ],
        },
      ],
    };
  }

  /** The grabber's kill frees it: its grip is removed (a victim still alive renews it). */
  private getLetGoSpell(grip: string): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabStringRef,
      doc: false,
      hideName: true,
      // its grab's release, nothing of its own
      xpAbility: null,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.Caster,
          range: 1,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveEffectsByResource,
              type: RemoveEffectsByResourceTypeEnum.Default,
              resource: grip,
            },
          ],
        },
      ],
    };
  }

  /**
   * The grabber's death frees its victims: their hold and its pending check are removed from the
   * creatures around it.
   */
  private getAreaRemovalSpell(resource: string): PartialSpell {
    return {
      name: GRAB_DEFAULT_CONFIG.grabStringRef,
      // what the grabber's trait says of its death contingency
      description: "spell.grab.release",
      doc: false,
      hideName: true,
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
              resource,
            },
          ],
        },
      ],
    };
  }

  /** The victims the hold skips: protected from the spell itself before its effects apply. */
  private getHoldSkipEffects(creature: Creature): Effect[] {
    return [
      ...this.getGrabImmuneEffects(creature),
      // a held victim is helpless: every attack hits it, no need to grab it (and the grip's damage
      // would come with a save the hit doesn't have)
      {
        opcode: EffectTypeEnum.ProtectionFromResource,
        type: "HELD",
        duration: 1,
      },
      // killed by the hit that grabs: its damage lands first, and the kill's let go runs before the
      // hold, whose grip would then bind the grabber to a corpse (in game)
      {
        opcode: EffectTypeEnum.ProtectionFromResource,
        type: { stat: SpellProtectionStat.State, relation: SpellProtectionRelation.BinaryMatch },
        value: "STATE_DEAD",
        duration: 1,
      },
    ];
  }

  /**
   * Creatures the grabber can't hold (too big, incorporeal...): protected from the hold (the
   * effect's own spell) before its effects apply, by race or class.
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
    return list.map(([file, entry]) => ({
      opcode: EffectTypeEnum.ProtectionFromResource,
      type: {
        stat: file === EffectIDSFileEnum.CLASS ? SpellProtectionStat.Class : SpellProtectionStat.Race,
        relation: SpellProtectionRelation.Equal,
      },
      value: entry,
      duration: 1,
    }));
  }
}

const grabService = new GrabService();
export default grabService;

/** "2d8 crushing", "3d6+1 crushing" or "5 acid": one of the grip's damages. */
function damageText(damage: GripDamage): string {
  const dice =
    damage.diceThrown && damage.diceSize ? `${damage.diceThrown}d${damage.diceSize}` : "";
  const amount = damage.amount ?? 0;
  let value = dice || `${amount}`;
  if (dice && amount) value += amount > 0 ? `+${amount}` : `${amount}`;
  return `${value} ${EffectDamageTypeEnum[damage.type].toLowerCase()}`;
}

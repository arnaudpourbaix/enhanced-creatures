import { SPELL_STATES } from "../../../config/common";
import { TranslationKey } from "../../../translations/i18n";
import { DamageEffect } from "../spell-item/effect";
import { SaveTypeEnum } from "../spell-item/effect.enums";

interface GrabSharedConfig {
  /**
   * Probability for triggering on hit
   */
  probability: number;

  /**
   * The victim's save: on the hit unless `trigger` is "probability" (a success avoids the grab),
   * and every round with `escape` "save" (a success frees it)
   */
  saveType: SaveTypeEnum;
  saveBonus: number;
}

export type GripDamage = Omit<DamageEffect, "opcode">;

export interface GrabGlobalConfig extends GrabSharedConfig {
  grabbedState: string;
  grabbingState: string;
  grabStringRef: TranslationKey;
  grabbedStringRef: TranslationKey;
  startSound: string;
  visualEffect: string;
}

export interface CreatureGrabConfig extends Partial<GrabSharedConfig> {
  /**
   * Grabbing a prone target adds -4 to saving throws
   */
  onlyGrabProneTarget?: boolean;

  /**
   * Grab trigger (default to both):
   * - probability only (no save)
   * - save only
   * - both
   */
  trigger?: "probability" | "save" | "both";

  /**
   * How the victim breaks free (default "none"):
   * - "save": a save every round, a success frees it
   * - "strength": a Strength check every round, d20 at or under its Strength frees it
   * - "none": never, the grip ends only when the grabber dies or kills it
   */
  escape?: "save" | "strength" | "none";

  /**
   * Damage per round dealt by the grip itself (one entry per damage type), every round the
   * victim stays held (fails its save or Strength check, if it escapes by one): the grabber then makes no attack while it holds (its attacks per
   * round are set to 0). The check deals it, so a grab held at once on a hit (`trigger`
   * "probability") deals it from the next round only: the hit deals the weapon's own damage.
   */
  damagePerRound?: GripDamage | GripDamage[];

  /**
   * The grabber's Strength damage bonus adds to the grip's first damage, like a weapon with
   * the AddStrengthBonus flag
   */
  addStrengthBonus?: boolean;

  /**
   * The grip takes one hand only: the grabber keeps its attacks while the grip deals its damage
   * (a huge ettin revenant grips with one hand and strikes with the club in the other)
   */
  freeHand?: boolean;

  /**
   * The grip steals life: the grabber heals as much as each round's grip damage (vampiric wolf)
   */
  lifeDrain?: boolean;

  /**
   * The grip holds the victim's weapon arm: it can not attack (its attacks per round are set to
   * 0) nor cast a wizard or priest spell (no gesture) while held. Innate abilities stay
   */
  victimNoAttack?: boolean;

  /**
   * The grab seizes a limb (an arm, a leg), not the whole body: it reaches a victim one size
   * bigger than the grabber. Otherwise only a victim its own size or smaller.
   */
  limb?: boolean;
}

/**
 * Grab attack:
 * A character's opponent's AC against a touch attack does not include any armor bonus, shield bonus, or natural armor bonus
 * d20 + Base Attack Bonus + Strenth Modifier + *Special Size Modifier*
 *
 * You lose your Dexterity Bonus to AC against opponents you are not grappling. That is to say, you keep it against the one you are grappling.
 * You are unable to move unlesss you succeed an opposed grapple check
 * You may attack your grappled opponent with an unarmed strike, natural or light weapon, at a -4 modifier to the attack.
 * You may cast a spell when grappled or pinned, providing the cast time is 1 standard action or less.
 * You may damage your opponent without the use of an actual attack by succeeding an opposed grapple check. This special attack deals damage equal to an unarmed strike, and functions the same way, including negatives to strike lethally and Monk class abilities.
 * You may escape from being grappled by succeeding an opposed grapple check.
 * You can move at half your speed (bringing the entire brawl with you, no matter how big) by succeeding an opposed grapple check. This requires a standard action, and you must beat each opponent.
 * You can hold your opponent immobile by pinning them. This is done by using an attack to enact an opposed grapple check.
 * If an opponent is holding a light weapon, you can turn that sumbitch around on them and shank them with it by making an attack roll with the weapon at a -4 penalty. They retain the weapon, but part of it will be in their liver.
 *
 */
export const GRAB_DEFAULT_CONFIG: GrabGlobalConfig = {
  probability: 100,
  grabbedState: SPELL_STATES.grabbed,
  grabbingState: SPELL_STATES.grabbing,
  saveType: SaveTypeEnum.ParalyzePoisonDeath,
  saveBonus: 99, // will be calculated
  grabStringRef: "spell.grab.grab",
  grabbedStringRef: "spell.grab.grabbed",
  startSound: "CRE_P01",
  visualEffect: "rr#cnstr",
};

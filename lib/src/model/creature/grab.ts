import { SPELL_STATES } from "../../../config/common";
import { TranslationKey } from "../../../translations/i18n";
import { DamageEffect } from "../spell-item/effect";
import { EffectDamageTypeEnum, SaveTypeEnum } from "../spell-item/effect.enums";

interface GrabSharedConfig {
  /**
   * Probability for triggering on hit
   */
  probability: number;

  saveType: SaveTypeEnum;
  saveBonus: number;

  /**
   * Grab duration in rounds
   */
  rounds: number;
}

export interface GrabGlobalConfig extends GrabSharedConfig {
  grabbedState: string;
  grabbingState: string;
  grabStringRef: TranslationKey;
  grabbedStringRef: TranslationKey;
  startSound: string;
  endSound: string;
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
   * Damage per round
   */
  damagePerRound?: Omit<DamageEffect, "opcode">;
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
  rounds: 2,
  saveType: SaveTypeEnum.ParalyzePoisonDeath,
  saveBonus: 99, // will be calculated
  grabStringRef: "spell.grab.grab",
  grabbedStringRef: "spell.grab.grabbed",
  startSound: "CRE_P01",
  endSound: "EFF_M22A",
  visualEffect: "rr#cnstr",
};

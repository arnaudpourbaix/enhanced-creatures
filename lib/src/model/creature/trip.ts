import { SPELL_STATES } from "../../../config/common";
import { TranslationKey } from "../../../translations/i18n";
import { Durations } from "../game-data/durations";
import { PortraitIconEnum, SaveTypeEnum } from "../spell-item/effect.enums";

export interface CreatureTripConfig {
  /** The victim's save: a success keeps it standing (default vs. paralysis) */
  saveType?: SaveTypeEnum;
  saveBonus?: number;
  /** No save: every hit trips */
  noSave?: boolean;
}

export interface TripGlobalConfig {
  proneState: string;
  saveType: SaveTypeEnum;
  /**
   * Seconds a tripped victim stays prone: a round, for the attackers' next attacks (a grab on a
   * fallen victim, as a vampiric wolf's)
   */
  duration: number;
  /** The victim's portrait icon while it's prone (Sleep's) */
  portraitIcon: PortraitIconEnum;
  tripStringRef: TranslationKey;
  proneStringRef: TranslationKey;
}

/**
 * Trip: the hit knocks the victim down unless it saves. Prone, it can't move and is easier to hit,
 * but still acts (unlike a sleeper). A creature bigger than the attacker can't be tripped.
 */
export const TRIP_DEFAULT_CONFIG: TripGlobalConfig = {
  proneState: SPELL_STATES.prone,
  saveType: SaveTypeEnum.ParalyzePoisonDeath,
  duration: Durations.round,
  portraitIcon: PortraitIconEnum.Sleep,
  tripStringRef: "spell.trip.trip",
  proneStringRef: "spell.trip.prone",
};

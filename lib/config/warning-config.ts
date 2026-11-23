// Which optional generator warnings are logged: the ones about choices made on purpose, worth
// reviewing now and then but not on every run.

export interface WarningConfig {
  /**
   * A combo's spell whose fallback (under a mod lacking the spell) is cast on the other side than
   * the combo is silently left out of it: log each one left out.
   */
  comboFallbacks: boolean;
}

export const WARNING_CONFIG: WarningConfig = {
  comboFallbacks: false,
};

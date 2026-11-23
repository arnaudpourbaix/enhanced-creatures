// Which optional generator warnings are logged: the ones about choices made on purpose, worth
// reviewing now and then but not on every run.

export interface WarningConfig {
  /**
   * A combo's spell whose fallback (under a mod lacking the spell) is cast on the other side than
   * the combo is silently left out of it: log each one left out.
   */
  comboFallbacks: boolean;
  /**
   * A monster's creatures.csv rows mapped to it by guess, not validated yet (see
   * MonsterFilesService.getUnvalidatedFiles): log them, and the log section of a monster having
   * only those (no validated file).
   */
  unvalidatedCreatures: boolean;
  /**
   * A creature copy (createFrom) adding its own trait, which replaces the trait it inherited: log
   * the replaced trait item.
   */
  traitOverrides: boolean;
}

export const WARNING_CONFIG: WarningConfig = {
  comboFallbacks: false,
  unvalidatedCreatures: false,
  traitOverrides: false,
};

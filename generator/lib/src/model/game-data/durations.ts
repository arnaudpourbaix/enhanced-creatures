export const Durations = {
  // 1 turn = 10 rounds
  // 1 game hour = 5 turns
  // 1 game day = 120 turns
  // note: effects are not entirely applied on their full-time during a rest, it's about 500s of triggers during a rest
  round: 6,
  turn: 60,
  hour: 300,
  minute: 5,
  /**
   * 8 hours, which is equal to a rest
   */
  eightHours: 2400,
  day: 7200,
} as const;

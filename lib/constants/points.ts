import type { MatchRound } from '@/types/database'

export const POINTS_SYSTEM = {
  groupStage: {
    correct1st: 5,
    correct2nd: 5,
  },
  // Knockout: base points for correct winner
  knockout: {
    round_of_32: 10,
    round_of_16: 15,
    quarter_finals: 20,
    semi_finals: 50,
    final: 100,
  },
  // Agnostic choices points
  agnostic: {
    champion: 15,
    goleador: 10,
  },
  // Knockout: tie breaker prediction bonus
  tieBreaker: 3,
} as const

export const ROUND_POINTS: Record<MatchRound, number> = {
  group: 5,
  round_of_32: 10,
  round_of_16: 15,
  quarter_finals: 20,
  semi_finals: 50,
  final: 100,
}

// ── New Scoring System: Result Bets ──────────────────────────────────
// Sign accuracy (1/X/2): 3 pts if correct
// Approximation: max(0, 4 + bonusGoals + bonusDiff - d1 - d2)

export const SIGN_POINTS = 3

/**
 * Calculate points for a single match score prediction using the new formula:
 *
 * 1. Sign points: +3 if the predicted sign (home win / draw / away win) matches
 * 2. Extra points: max(0, 4 + bonusGoals + bonusDiff - d1 - d2)
 *    - bonusGoals = max(0, totalActualGoals - 5)
 *    - bonusDiff  = max(0, abs(actualDiff) - 3)
 *    - d1 = |predHome - actualHome| + |predAway - actualAway|
 *    - d2 = |predDiff - actualDiff|
 */
export function calculateMatchPoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): { signPoints: number; extraPoints: number; total: number } {
  // Sign check
  const predSign = Math.sign(predHome - predAway)
  const actualSign = Math.sign(actualHome - actualAway)
  const signPoints = predSign === actualSign ? SIGN_POINTS : 0

  // Approximation points
  const totalActualGoals = actualHome + actualAway
  const actualDiff = actualHome - actualAway
  const predDiff = predHome - predAway

  const bonusGoals = Math.max(0, totalActualGoals - 5)
  const bonusDiff = Math.max(0, Math.abs(actualDiff) - 3)
  const d1 = Math.abs(predHome - actualHome) + Math.abs(predAway - actualAway)
  const d2 = Math.abs(predDiff - actualDiff)

  const extraPoints = Math.max(0, 4 + bonusGoals + bonusDiff - d1 - d2)

  return {
    signPoints,
    extraPoints,
    total: signPoints + extraPoints,
  }
}

// ── Team Bets: Derived from knockout bracket ─────────────────────────
// Points awarded when a predicted winner actually advances to the next round.

export const TEAM_BET_POINTS: Record<string, number> = {
  round_of_32: 5,       // Win R32 → team reaches R16 → 5 pts
  round_of_16: 10,      // Win R16 → team reaches QF → 10 pts
  quarter_finals: 15,   // Win QF → team reaches SF → 15 pts
  semi_finals: 25,      // Win SF → team reaches Final → 25 pts
  final: 50,            // Win Final → Tournament Winner → 50 pts
}

// Maps a round to the next round the winner advances to
export const NEXT_ROUND: Record<string, string> = {
  round_of_32: 'round_of_16',
  round_of_16: 'quarter_finals',
  quarter_finals: 'semi_finals',
  semi_finals: 'final',
  final: 'winner',  // special: tournament winner
}

// ── Legacy exports (kept for compatibility) ──────────────────────────

/** @deprecated Use calculateMatchPoints() instead */
export const SCORE_POINTS = {
  exactScore: 3,
  correctDifference: 2,
  correctWinner: 1,
  incorrect: 0,
} as const

/** @deprecated Use calculateMatchPoints() instead */
export const SCORE_BONUS = {
  exactScore: 3,
  correctWinner: 1,
} as const

export const ROUND_LABELS: Record<MatchRound, string> = {
  group: 'Fase de Grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarter_finals: 'Cuartos de Final',
  semi_finals: 'Semifinales',
  final: 'Gran Final',
}

export const MAX_POSSIBLE_POINTS =
  // Groups: 12 groups × 2 teams × 5pts
  12 * 2 * 5 +
  // Round of 32: 16 matches × 10pts
  16 * 10 +
  // Round of 16: 8 matches × 15pts
  8 * 15 +
  // Quarter Finals: 4 matches × 20pts
  4 * 20 +
  // Semi Finals: 2 matches × 50pts
  2 * 50 +
  // Final: 100pts
  100 +
  // Champion and Goleador agnostic choices: 15pts + 10pts
  15 +
  10

// ── Knockout Round Deadlines ─────────────────────────────────────────
// All times are UTC. Spain uses CEST (UTC+2) in summer. Peru uses PET (UTC-5) year-round.

// Group Stage & score predictions close: Tuesday Jun 24 at 23:59 local (21:59 UTC)
export const GROUP_STAGE_DEADLINE = new Date('2026-06-24T21:59:00Z')

// Champion closes: Monday Jun 23 at 23:59 local (21:59 UTC)
export const CHAMPION_DEADLINE = new Date('2026-06-23T21:59:00Z')

// Goleador closes: Monday Jun 23 at 23:59 local (21:59 UTC)
export const GOLEADOR_DEADLINE = new Date('2026-06-23T21:59:00Z')

// Keep for backward compatibility if needed
export const CHAMPION_GOLEADOR_DEADLINE = CHAMPION_DEADLINE

// First Matchday (Jornada 1) score prediction closes: Jun 12 at 20:55 local (18:55 UTC)
export const FIRST_JORNADA_DEADLINE = new Date('2026-06-12T18:55:00Z')

// Round of 32:  Jun 28 at 20:55 Spain (18:55 UTC / 13:55 Peru) — matches #73–88
export const ROUND_OF_32_DEADLINE = new Date('2026-06-28T18:55:00Z')

// Round of 16:  Jul  4 at 18:55 Spain (16:55 UTC / 11:55 Peru) — matches #89–96
export const ROUND_OF_16_DEADLINE = new Date('2026-07-04T16:55:00Z')

// Quarter Finals: Jul 9 at 21:55 Spain (19:55 UTC / 14:55 Peru) — matches #97–100
export const QUARTER_FINALS_DEADLINE = new Date('2026-07-09T19:55:00Z')

// Semi Finals: Jul 14 at 20:55 Spain (18:55 UTC / 13:55 Peru) — matches #101–102
export const SEMI_FINALS_DEADLINE = new Date('2026-07-14T18:55:00Z')

// Final: Jul 19 at 20:55 Spain (18:55 UTC / 13:55 Peru) — match #103
export const FINAL_DEADLINE = new Date('2026-07-19T18:55:00Z')

// Lookup map: round_id → deadline Date
export const KNOCKOUT_DEADLINES: Record<string, Date> = {
  round_of_32:    ROUND_OF_32_DEADLINE,
  round_of_16:    ROUND_OF_16_DEADLINE,
  quarter_finals: QUARTER_FINALS_DEADLINE,
  semi_finals:    SEMI_FINALS_DEADLINE,
  final:          FINAL_DEADLINE,
}

// Display labels (Spain / Peru) shown in warning badges and banners
export const KNOCKOUT_DEADLINE_LABELS: Record<string, { date: string; spain: string; peru: string }> = {
  round_of_32:    { date: '28 Jun', spain: '20:55h', peru: '13:55h' },
  round_of_16:    { date: '4 Jul',  spain: '18:55h', peru: '11:55h' },
  quarter_finals: { date: '9 Jul',  spain: '21:55h', peru: '14:55h' },
  semi_finals:    { date: '14 Jul', spain: '20:55h', peru: '13:55h' },
  final:          { date: '19 Jul', spain: '20:55h', peru: '13:55h' },
}

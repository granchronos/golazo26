import type { MatchRound } from '@/types/database'

export const POINTS_SYSTEM = {
  groupStage: {
    correct1st: 5,
    correct2nd: 5,
  },
  // Knockout: base points for correct winner, bonus for exact score
  knockout: {
    exactScore: 3,   // bonus for predicting exact score
    correctWinner: 1, // base for picking the right winner
  },
  round_of_32: { winner: 10 },
  round_of_16: { winner: 15 },
  quarter_finals: { winner: 20 },
  semi_finals: { winner: 50 },
  final: { winner: 100 },
} as const

export const ROUND_POINTS: Record<MatchRound, number> = {
  group: 5,
  round_of_32: 10,
  round_of_16: 15,
  quarter_finals: 20,
  semi_finals: 50,
  final: 100,
}

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
  100

// WC 2026 opening match: Jun 11 — México vs Sudáfrica at 15:00 ET (19:00 UTC)
export const GROUP_STAGE_DEADLINE = new Date('2026-06-11T18:50:00Z') // 10 min before kickoff UTC

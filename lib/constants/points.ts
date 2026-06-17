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
} as const

export const ROUND_POINTS: Record<MatchRound, number> = {
  group: 5,
  round_of_32: 10,
  round_of_16: 15,
  quarter_finals: 20,
  semi_finals: 50,
  final: 100,
}

// Points for score prediction results
export const SCORE_POINTS = {
  exactScore: 3,
  correctDifference: 2,
  correctWinner: 1,
  incorrect: 0,
} as const

// Deprecated: keeping compatibility if imported elsewhere
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

// Deadlines:
// Group Stage & overall winner/goleador closes: Jun 18 at 15:00 local (13:00 UTC)
export const GROUP_STAGE_DEADLINE = new Date('2026-06-18T13:00:00Z')
export const CHAMPION_GOLEADOR_DEADLINE = new Date('2026-06-18T13:00:00Z')

// First Matchday (Jornada 1) score prediction closes: Jun 12 at 20:55 local (18:55 UTC)
export const FIRST_JORNADA_DEADLINE = new Date('2026-06-12T18:55:00Z')

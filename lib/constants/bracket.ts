import type { GroupLetter } from '@/types/database'

// Defines the source of each team slot in every knockout match.
// '1st'/'2nd' → derived from group predictions.
// '3rd_pool' → pick any non-qualified team from those groups.
// 'winner'   → derived from the picked winner of a previous knockout match.

export type SlotSource =
  | { kind: '1st'; group: GroupLetter }
  | { kind: '2nd'; group: GroupLetter }
  | { kind: '3rd_pool'; groups: [GroupLetter, GroupLetter] }
  | { kind: 'winner'; matchNumber: number }

export interface BracketSlot {
  source: SlotSource
  label: string
}

export interface BracketMatchDef {
  matchNumber: number
  matchDate: string
  home: BracketSlot
  away: BracketSlot
}

// ─── Round of 32 ────────────────────────────────────────────────────
export const R32_BRACKET: BracketMatchDef[] = [
  { matchNumber: 73, matchDate: '2026-06-29T20:00:00Z', home: { source: { kind: '1st', group: 'A' }, label: '1° Grupo A' }, away: { source: { kind: '2nd', group: 'B' }, label: '2° Grupo B' } },
  { matchNumber: 74, matchDate: '2026-06-29T23:00:00Z', home: { source: { kind: '1st', group: 'C' }, label: '1° Grupo C' }, away: { source: { kind: '2nd', group: 'D' }, label: '2° Grupo D' } },
  { matchNumber: 75, matchDate: '2026-06-30T20:00:00Z', home: { source: { kind: '1st', group: 'E' }, label: '1° Grupo E' }, away: { source: { kind: '2nd', group: 'F' }, label: '2° Grupo F' } },
  { matchNumber: 76, matchDate: '2026-06-30T23:00:00Z', home: { source: { kind: '1st', group: 'G' }, label: '1° Grupo G' }, away: { source: { kind: '2nd', group: 'H' }, label: '2° Grupo H' } },
  { matchNumber: 77, matchDate: '2026-07-01T20:00:00Z', home: { source: { kind: '1st', group: 'I' }, label: '1° Grupo I' }, away: { source: { kind: '2nd', group: 'J' }, label: '2° Grupo J' } },
  { matchNumber: 78, matchDate: '2026-07-01T23:00:00Z', home: { source: { kind: '1st', group: 'K' }, label: '1° Grupo K' }, away: { source: { kind: '2nd', group: 'L' }, label: '2° Grupo L' } },
  { matchNumber: 79, matchDate: '2026-07-02T20:00:00Z', home: { source: { kind: '2nd', group: 'A' }, label: '2° Grupo A' }, away: { source: { kind: '1st', group: 'B' }, label: '1° Grupo B' } },
  { matchNumber: 80, matchDate: '2026-07-02T23:00:00Z', home: { source: { kind: '2nd', group: 'C' }, label: '2° Grupo C' }, away: { source: { kind: '1st', group: 'D' }, label: '1° Grupo D' } },
  { matchNumber: 81, matchDate: '2026-07-03T20:00:00Z', home: { source: { kind: '2nd', group: 'E' }, label: '2° Grupo E' }, away: { source: { kind: '1st', group: 'F' }, label: '1° Grupo F' } },
  { matchNumber: 82, matchDate: '2026-07-03T23:00:00Z', home: { source: { kind: '2nd', group: 'G' }, label: '2° Grupo G' }, away: { source: { kind: '1st', group: 'H' }, label: '1° Grupo H' } },
  { matchNumber: 83, matchDate: '2026-07-04T20:00:00Z', home: { source: { kind: '2nd', group: 'I' }, label: '2° Grupo I' }, away: { source: { kind: '1st', group: 'J' }, label: '1° Grupo J' } },
  { matchNumber: 84, matchDate: '2026-07-04T23:00:00Z', home: { source: { kind: '2nd', group: 'K' }, label: '2° Grupo K' }, away: { source: { kind: '1st', group: 'L' }, label: '1° Grupo L' } },
  // 3rd-place pool matches – pick any non-qualified team from the 2 groups
  { matchNumber: 85, matchDate: '2026-07-05T20:00:00Z', home: { source: { kind: '3rd_pool', groups: ['A', 'B'] }, label: 'Mejor 3° Grupos A/B' }, away: { source: { kind: '3rd_pool', groups: ['C', 'D'] }, label: 'Mejor 3° Grupos C/D' } },
  { matchNumber: 86, matchDate: '2026-07-05T23:00:00Z', home: { source: { kind: '3rd_pool', groups: ['E', 'F'] }, label: 'Mejor 3° Grupos E/F' }, away: { source: { kind: '3rd_pool', groups: ['G', 'H'] }, label: 'Mejor 3° Grupos G/H' } },
  { matchNumber: 87, matchDate: '2026-07-06T20:00:00Z', home: { source: { kind: '3rd_pool', groups: ['I', 'J'] }, label: 'Mejor 3° Grupos I/J' }, away: { source: { kind: '3rd_pool', groups: ['K', 'L'] }, label: 'Mejor 3° Grupos K/L' } },
  { matchNumber: 88, matchDate: '2026-07-06T23:00:00Z', home: { source: { kind: '3rd_pool', groups: ['A', 'C'] }, label: 'Mejor 3° Grupos A/C' }, away: { source: { kind: '3rd_pool', groups: ['B', 'D'] }, label: 'Mejor 3° Grupos B/D' } },
]

// ─── Round of 16 (Octavos) ───────────────────────────────────────────
export const R16_BRACKET: BracketMatchDef[] = [
  { matchNumber: 89, matchDate: '2026-07-08T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 73 }, label: 'Ganador P73' }, away: { source: { kind: 'winner', matchNumber: 74 }, label: 'Ganador P74' } },
  { matchNumber: 90, matchDate: '2026-07-08T23:00:00Z', home: { source: { kind: 'winner', matchNumber: 75 }, label: 'Ganador P75' }, away: { source: { kind: 'winner', matchNumber: 76 }, label: 'Ganador P76' } },
  { matchNumber: 91, matchDate: '2026-07-09T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 77 }, label: 'Ganador P77' }, away: { source: { kind: 'winner', matchNumber: 78 }, label: 'Ganador P78' } },
  { matchNumber: 92, matchDate: '2026-07-09T23:00:00Z', home: { source: { kind: 'winner', matchNumber: 79 }, label: 'Ganador P79' }, away: { source: { kind: 'winner', matchNumber: 80 }, label: 'Ganador P80' } },
  { matchNumber: 93, matchDate: '2026-07-10T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 81 }, label: 'Ganador P81' }, away: { source: { kind: 'winner', matchNumber: 82 }, label: 'Ganador P82' } },
  { matchNumber: 94, matchDate: '2026-07-10T23:00:00Z', home: { source: { kind: 'winner', matchNumber: 83 }, label: 'Ganador P83' }, away: { source: { kind: 'winner', matchNumber: 84 }, label: 'Ganador P84' } },
  { matchNumber: 95, matchDate: '2026-07-11T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 85 }, label: 'Ganador P85' }, away: { source: { kind: 'winner', matchNumber: 86 }, label: 'Ganador P86' } },
  { matchNumber: 96, matchDate: '2026-07-11T23:00:00Z', home: { source: { kind: 'winner', matchNumber: 87 }, label: 'Ganador P87' }, away: { source: { kind: 'winner', matchNumber: 88 }, label: 'Ganador P88' } },
]

// ─── Quarter Finals (Cuartos) ────────────────────────────────────────
export const QF_BRACKET: BracketMatchDef[] = [
  { matchNumber: 97, matchDate: '2026-07-14T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 89 }, label: 'Ganador P89' }, away: { source: { kind: 'winner', matchNumber: 90 }, label: 'Ganador P90' } },
  { matchNumber: 98, matchDate: '2026-07-14T23:00:00Z', home: { source: { kind: 'winner', matchNumber: 91 }, label: 'Ganador P91' }, away: { source: { kind: 'winner', matchNumber: 92 }, label: 'Ganador P92' } },
  { matchNumber: 99, matchDate: '2026-07-15T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 93 }, label: 'Ganador P93' }, away: { source: { kind: 'winner', matchNumber: 94 }, label: 'Ganador P94' } },
  { matchNumber: 100, matchDate: '2026-07-15T23:00:00Z', home: { source: { kind: 'winner', matchNumber: 95 }, label: 'Ganador P95' }, away: { source: { kind: 'winner', matchNumber: 96 }, label: 'Ganador P96' } },
]

// ─── Semi Finals ─────────────────────────────────────────────────────
export const SF_BRACKET: BracketMatchDef[] = [
  { matchNumber: 101, matchDate: '2026-07-14T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 97 }, label: 'Ganador P97' }, away: { source: { kind: 'winner', matchNumber: 98 }, label: 'Ganador P98' } },
  { matchNumber: 102, matchDate: '2026-07-15T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 99 }, label: 'Ganador P99' }, away: { source: { kind: 'winner', matchNumber: 100 }, label: 'Ganador P100' } },
]

// ─── Final ───────────────────────────────────────────────────────────
export const FINAL_BRACKET: BracketMatchDef[] = [
  { matchNumber: 103, matchDate: '2026-07-19T20:00:00Z', home: { source: { kind: 'winner', matchNumber: 101 }, label: 'Ganador P101' }, away: { source: { kind: 'winner', matchNumber: 102 }, label: 'Ganador P102' } },
]

export const ALL_BRACKET_MATCHES: BracketMatchDef[] = [
  ...R32_BRACKET,
  ...R16_BRACKET,
  ...QF_BRACKET,
  ...SF_BRACKET,
  ...FINAL_BRACKET,
]

export const BRACKET_ROUNDS = [
  { id: 'round_of_32' as const, label: 'Ronda de 32', points: 10, matches: R32_BRACKET },
  { id: 'round_of_16' as const, label: 'Octavos de Final', points: 15, matches: R16_BRACKET },
  { id: 'quarter_finals' as const, label: 'Cuartos de Final', points: 20, matches: QF_BRACKET },
  { id: 'semi_finals' as const, label: 'Semifinales', points: 50, matches: SF_BRACKET },
  { id: 'final' as const, label: 'Gran Final 🏆', points: 100, matches: FINAL_BRACKET },
]

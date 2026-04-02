export interface FixtureMatch {
  match_number: number
  round: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final'
  group_letter?: string
  home_team_id: string | null
  away_team_id: string | null
  match_date: string // ISO UTC
  venue: string
  city: string
}

// All 72 group stage matches — official FIFA schedule
// Times converted from Eastern Time (ET = UTC-4) to UTC
export const GROUP_STAGE_MATCHES: FixtureMatch[] = [
  // ── MATCHDAY 1 ──────────────────────────────────────────

  // Jun 11 — Group A
  { match_number: 1, round: 'group', group_letter: 'A', home_team_id: 'mex', away_team_id: 'rsa', match_date: '2026-06-11T19:00:00Z', venue: 'Estadio Azteca', city: 'Ciudad de México' },
  { match_number: 2, round: 'group', group_letter: 'A', home_team_id: 'kor', away_team_id: 'cze', match_date: '2026-06-12T02:00:00Z', venue: 'Estadio Akron', city: 'Guadalajara' },

  // Jun 12 — Group B
  { match_number: 3, round: 'group', group_letter: 'B', home_team_id: 'can', away_team_id: 'bih', match_date: '2026-06-12T19:00:00Z', venue: 'BMO Field', city: 'Toronto' },
  // Jun 13 — Group B
  { match_number: 4, round: 'group', group_letter: 'B', home_team_id: 'qat', away_team_id: 'sui', match_date: '2026-06-13T19:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },

  // Jun 13 — Group C
  { match_number: 5, round: 'group', group_letter: 'C', home_team_id: 'bra', away_team_id: 'mar', match_date: '2026-06-13T22:00:00Z', venue: 'MetLife Stadium', city: 'Nueva York' },
  { match_number: 6, round: 'group', group_letter: 'C', home_team_id: 'hai', away_team_id: 'sco', match_date: '2026-06-14T01:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },

  // Jun 12 — Group D
  { match_number: 7, round: 'group', group_letter: 'D', home_team_id: 'usa', away_team_id: 'pry', match_date: '2026-06-13T01:00:00Z', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  // Jun 13 — Group D
  { match_number: 8, round: 'group', group_letter: 'D', home_team_id: 'aus', away_team_id: 'tur', match_date: '2026-06-13T04:00:00Z', venue: 'BC Place', city: 'Vancouver' },

  // Jun 14 — Group E
  { match_number: 9, round: 'group', group_letter: 'E', home_team_id: 'ger', away_team_id: 'cuw', match_date: '2026-06-14T17:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { match_number: 10, round: 'group', group_letter: 'E', home_team_id: 'civ', away_team_id: 'ecu', match_date: '2026-06-14T23:00:00Z', venue: 'Lincoln Financial Field', city: 'Filadelfia' },

  // Jun 14 — Group F
  { match_number: 11, round: 'group', group_letter: 'F', home_team_id: 'ned', away_team_id: 'jpn', match_date: '2026-06-14T20:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { match_number: 12, round: 'group', group_letter: 'F', home_team_id: 'swe', away_team_id: 'tun', match_date: '2026-06-15T02:00:00Z', venue: 'Estadio BBVA', city: 'Monterrey' },

  // Jun 15 — Group G
  { match_number: 13, round: 'group', group_letter: 'G', home_team_id: 'bel', away_team_id: 'egy', match_date: '2026-06-15T19:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { match_number: 14, round: 'group', group_letter: 'G', home_team_id: 'irn', away_team_id: 'nzl', match_date: '2026-06-16T01:00:00Z', venue: 'SoFi Stadium', city: 'Los Ángeles' },

  // Jun 15 — Group H
  { match_number: 15, round: 'group', group_letter: 'H', home_team_id: 'esp', away_team_id: 'cpv', match_date: '2026-06-15T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { match_number: 16, round: 'group', group_letter: 'H', home_team_id: 'ksa', away_team_id: 'uru', match_date: '2026-06-15T22:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },

  // Jun 16 — Group I
  { match_number: 17, round: 'group', group_letter: 'I', home_team_id: 'fra', away_team_id: 'sen', match_date: '2026-06-16T19:00:00Z', venue: 'MetLife Stadium', city: 'Nueva York' },
  { match_number: 18, round: 'group', group_letter: 'I', home_team_id: 'irq', away_team_id: 'nor', match_date: '2026-06-16T22:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },

  // Jun 16 — Group J
  { match_number: 19, round: 'group', group_letter: 'J', home_team_id: 'arg', away_team_id: 'alg', match_date: '2026-06-17T01:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { match_number: 20, round: 'group', group_letter: 'J', home_team_id: 'aut', away_team_id: 'jor', match_date: '2026-06-17T04:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },

  // Jun 17 — Group K
  { match_number: 21, round: 'group', group_letter: 'K', home_team_id: 'por', away_team_id: 'cod', match_date: '2026-06-17T17:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { match_number: 22, round: 'group', group_letter: 'K', home_team_id: 'uzb', away_team_id: 'col', match_date: '2026-06-18T02:00:00Z', venue: 'Estadio Azteca', city: 'Ciudad de México' },

  // Jun 17 — Group L
  { match_number: 23, round: 'group', group_letter: 'L', home_team_id: 'eng', away_team_id: 'cro', match_date: '2026-06-17T20:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { match_number: 24, round: 'group', group_letter: 'L', home_team_id: 'gha', away_team_id: 'pan', match_date: '2026-06-17T23:00:00Z', venue: 'BMO Field', city: 'Toronto' },

  // ── MATCHDAY 2 ──────────────────────────────────────────

  // Jun 18 — Group A
  { match_number: 25, round: 'group', group_letter: 'A', home_team_id: 'cze', away_team_id: 'rsa', match_date: '2026-06-18T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { match_number: 26, round: 'group', group_letter: 'A', home_team_id: 'mex', away_team_id: 'kor', match_date: '2026-06-19T01:00:00Z', venue: 'Estadio Akron', city: 'Guadalajara' },

  // Jun 18 — Group B
  { match_number: 27, round: 'group', group_letter: 'B', home_team_id: 'sui', away_team_id: 'bih', match_date: '2026-06-18T19:00:00Z', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { match_number: 28, round: 'group', group_letter: 'B', home_team_id: 'can', away_team_id: 'qat', match_date: '2026-06-18T22:00:00Z', venue: 'BC Place', city: 'Vancouver' },

  // Jun 19 — Group C
  { match_number: 29, round: 'group', group_letter: 'C', home_team_id: 'sco', away_team_id: 'mar', match_date: '2026-06-19T22:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { match_number: 30, round: 'group', group_letter: 'C', home_team_id: 'bra', away_team_id: 'hai', match_date: '2026-06-20T01:00:00Z', venue: 'Lincoln Financial Field', city: 'Filadelfia' },

  // Jun 19 — Group D
  { match_number: 31, round: 'group', group_letter: 'D', home_team_id: 'usa', away_team_id: 'aus', match_date: '2026-06-19T19:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { match_number: 32, round: 'group', group_letter: 'D', home_team_id: 'tur', away_team_id: 'pry', match_date: '2026-06-20T04:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },

  // Jun 20 — Group E
  { match_number: 33, round: 'group', group_letter: 'E', home_team_id: 'ger', away_team_id: 'civ', match_date: '2026-06-20T20:00:00Z', venue: 'BMO Field', city: 'Toronto' },
  { match_number: 34, round: 'group', group_letter: 'E', home_team_id: 'ecu', away_team_id: 'cuw', match_date: '2026-06-21T02:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },

  // Jun 20 — Group F
  { match_number: 35, round: 'group', group_letter: 'F', home_team_id: 'ned', away_team_id: 'swe', match_date: '2026-06-20T17:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { match_number: 36, round: 'group', group_letter: 'F', home_team_id: 'tun', away_team_id: 'jpn', match_date: '2026-06-21T04:00:00Z', venue: 'Estadio BBVA', city: 'Monterrey' },

  // Jun 21 — Group G
  { match_number: 37, round: 'group', group_letter: 'G', home_team_id: 'bel', away_team_id: 'irn', match_date: '2026-06-21T19:00:00Z', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { match_number: 38, round: 'group', group_letter: 'G', home_team_id: 'nzl', away_team_id: 'egy', match_date: '2026-06-22T01:00:00Z', venue: 'BC Place', city: 'Vancouver' },

  // Jun 21 — Group H
  { match_number: 39, round: 'group', group_letter: 'H', home_team_id: 'esp', away_team_id: 'ksa', match_date: '2026-06-21T16:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },
  { match_number: 40, round: 'group', group_letter: 'H', home_team_id: 'uru', away_team_id: 'cpv', match_date: '2026-06-21T22:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },

  // Jun 22 — Group I
  { match_number: 41, round: 'group', group_letter: 'I', home_team_id: 'fra', away_team_id: 'irq', match_date: '2026-06-22T21:00:00Z', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { match_number: 42, round: 'group', group_letter: 'I', home_team_id: 'nor', away_team_id: 'sen', match_date: '2026-06-23T00:00:00Z', venue: 'MetLife Stadium', city: 'Nueva York' },

  // Jun 22 — Group J
  { match_number: 43, round: 'group', group_letter: 'J', home_team_id: 'arg', away_team_id: 'aut', match_date: '2026-06-22T17:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { match_number: 44, round: 'group', group_letter: 'J', home_team_id: 'jor', away_team_id: 'alg', match_date: '2026-06-23T03:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },

  // Jun 23 — Group K
  { match_number: 45, round: 'group', group_letter: 'K', home_team_id: 'por', away_team_id: 'uzb', match_date: '2026-06-23T17:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { match_number: 46, round: 'group', group_letter: 'K', home_team_id: 'col', away_team_id: 'cod', match_date: '2026-06-24T02:00:00Z', venue: 'Estadio Akron', city: 'Guadalajara' },

  // Jun 23 — Group L
  { match_number: 47, round: 'group', group_letter: 'L', home_team_id: 'eng', away_team_id: 'gha', match_date: '2026-06-23T20:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { match_number: 48, round: 'group', group_letter: 'L', home_team_id: 'pan', away_team_id: 'cro', match_date: '2026-06-23T23:00:00Z', venue: 'BMO Field', city: 'Toronto' },

  // ── MATCHDAY 3 ──────────────────────────────────────────

  // Jun 24 — Group A
  { match_number: 49, round: 'group', group_letter: 'A', home_team_id: 'cze', away_team_id: 'mex', match_date: '2026-06-25T01:00:00Z', venue: 'Estadio Azteca', city: 'Ciudad de México' },
  { match_number: 50, round: 'group', group_letter: 'A', home_team_id: 'rsa', away_team_id: 'kor', match_date: '2026-06-25T01:00:00Z', venue: 'Estadio BBVA', city: 'Monterrey' },

  // Jun 24 — Group B
  { match_number: 51, round: 'group', group_letter: 'B', home_team_id: 'sui', away_team_id: 'can', match_date: '2026-06-24T19:00:00Z', venue: 'BC Place', city: 'Vancouver' },
  { match_number: 52, round: 'group', group_letter: 'B', home_team_id: 'bih', away_team_id: 'qat', match_date: '2026-06-24T19:00:00Z', venue: 'Lumen Field', city: 'Seattle' },

  // Jun 24 — Group C
  { match_number: 53, round: 'group', group_letter: 'C', home_team_id: 'bra', away_team_id: 'sco', match_date: '2026-06-24T22:00:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },
  { match_number: 54, round: 'group', group_letter: 'C', home_team_id: 'mar', away_team_id: 'hai', match_date: '2026-06-24T22:00:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },

  // Jun 25 — Group D
  { match_number: 55, round: 'group', group_letter: 'D', home_team_id: 'tur', away_team_id: 'usa', match_date: '2026-06-26T02:00:00Z', venue: 'SoFi Stadium', city: 'Los Ángeles' },
  { match_number: 56, round: 'group', group_letter: 'D', home_team_id: 'pry', away_team_id: 'aus', match_date: '2026-06-26T02:00:00Z', venue: 'Levi\'s Stadium', city: 'San Francisco' },

  // Jun 25 — Group E
  { match_number: 57, round: 'group', group_letter: 'E', home_team_id: 'cuw', away_team_id: 'civ', match_date: '2026-06-25T20:00:00Z', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
  { match_number: 58, round: 'group', group_letter: 'E', home_team_id: 'ecu', away_team_id: 'ger', match_date: '2026-06-25T20:00:00Z', venue: 'MetLife Stadium', city: 'Nueva York' },

  // Jun 25 — Group F
  { match_number: 59, round: 'group', group_letter: 'F', home_team_id: 'jpn', away_team_id: 'swe', match_date: '2026-06-25T23:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  { match_number: 60, round: 'group', group_letter: 'F', home_team_id: 'tun', away_team_id: 'ned', match_date: '2026-06-25T23:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },

  // Jun 26 — Group G
  { match_number: 61, round: 'group', group_letter: 'G', home_team_id: 'egy', away_team_id: 'irn', match_date: '2026-06-27T03:00:00Z', venue: 'Lumen Field', city: 'Seattle' },
  { match_number: 62, round: 'group', group_letter: 'G', home_team_id: 'nzl', away_team_id: 'bel', match_date: '2026-06-27T03:00:00Z', venue: 'BC Place', city: 'Vancouver' },

  // Jun 26 — Group H
  { match_number: 63, round: 'group', group_letter: 'H', home_team_id: 'cpv', away_team_id: 'ksa', match_date: '2026-06-27T00:00:00Z', venue: 'NRG Stadium', city: 'Houston' },
  { match_number: 64, round: 'group', group_letter: 'H', home_team_id: 'uru', away_team_id: 'esp', match_date: '2026-06-27T00:00:00Z', venue: 'Estadio Akron', city: 'Guadalajara' },

  // Jun 26 — Group I
  { match_number: 65, round: 'group', group_letter: 'I', home_team_id: 'nor', away_team_id: 'fra', match_date: '2026-06-26T19:00:00Z', venue: 'Gillette Stadium', city: 'Boston' },
  { match_number: 66, round: 'group', group_letter: 'I', home_team_id: 'sen', away_team_id: 'irq', match_date: '2026-06-26T19:00:00Z', venue: 'BMO Field', city: 'Toronto' },

  // Jun 27 — Group J
  { match_number: 67, round: 'group', group_letter: 'J', home_team_id: 'alg', away_team_id: 'aut', match_date: '2026-06-28T02:00:00Z', venue: 'Arrowhead Stadium', city: 'Kansas City' },
  { match_number: 68, round: 'group', group_letter: 'J', home_team_id: 'jor', away_team_id: 'arg', match_date: '2026-06-28T02:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },

  // Jun 27 — Group K
  { match_number: 69, round: 'group', group_letter: 'K', home_team_id: 'col', away_team_id: 'por', match_date: '2026-06-27T23:30:00Z', venue: 'Hard Rock Stadium', city: 'Miami' },
  { match_number: 70, round: 'group', group_letter: 'K', home_team_id: 'cod', away_team_id: 'uzb', match_date: '2026-06-27T23:30:00Z', venue: 'Mercedes-Benz Stadium', city: 'Atlanta' },

  // Jun 27 — Group L
  { match_number: 71, round: 'group', group_letter: 'L', home_team_id: 'pan', away_team_id: 'eng', match_date: '2026-06-27T21:00:00Z', venue: 'MetLife Stadium', city: 'Nueva York' },
  { match_number: 72, round: 'group', group_letter: 'L', home_team_id: 'cro', away_team_id: 'gha', match_date: '2026-06-27T21:00:00Z', venue: 'Lincoln Financial Field', city: 'Filadelfia' },
]

// Knockout stage (teams TBD, dates from FIFA schedule)
export const KNOCKOUT_MATCHES: FixtureMatch[] = [
  // Round of 32 (16 matches) — Jun 29 – Jul 2
  ...Array.from({ length: 16 }, (_, i) => ({
    match_number: 73 + i,
    round: 'round_of_32' as const,
    home_team_id: null,
    away_team_id: null,
    match_date: `2026-06-${29 + Math.floor(i / 4)}T${(18 + (i % 4) * 3).toString().padStart(2, '0')}:00:00Z`,
    venue: 'TBD',
    city: 'TBD',
  })),
  // Round of 16 (8 matches) — Jul 5–8
  ...Array.from({ length: 8 }, (_, i) => ({
    match_number: 89 + i,
    round: 'round_of_16' as const,
    home_team_id: null,
    away_team_id: null,
    match_date: `2026-07-0${5 + Math.floor(i / 2)}T${i % 2 === 0 ? '20' : '00'}:00:00Z`,
    venue: 'TBD',
    city: 'TBD',
  })),
  // Quarter Finals (4 matches) — Jul 11–12
  ...Array.from({ length: 4 }, (_, i) => ({
    match_number: 97 + i,
    round: 'quarter_finals' as const,
    home_team_id: null,
    away_team_id: null,
    match_date: `2026-07-${11 + Math.floor(i / 2)}T${i % 2 === 0 ? '20' : '00'}:00:00Z`,
    venue: 'TBD',
    city: 'TBD',
  })),
  // Semi Finals (2 matches)
  { match_number: 101, round: 'semi_finals', home_team_id: null, away_team_id: null, match_date: '2026-07-14T20:00:00Z', venue: 'MetLife Stadium', city: 'Nueva York' },
  { match_number: 102, round: 'semi_finals', home_team_id: null, away_team_id: null, match_date: '2026-07-15T20:00:00Z', venue: 'AT&T Stadium', city: 'Dallas' },
  // Final
  { match_number: 103, round: 'final', home_team_id: null, away_team_id: null, match_date: '2026-07-19T20:00:00Z', venue: 'MetLife Stadium', city: 'Nueva York' },
]

export const ALL_MATCHES = [...GROUP_STAGE_MATCHES, ...KNOCKOUT_MATCHES]

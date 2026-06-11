import type { Confederation, GroupLetter } from '@/types/database'

export interface TeamData {
  id: string
  name: string
  code: string
  flag_emoji: string
  /** ISO 3166-1 alpha-2 code for flag image */
  flag_code: string
  confederation: Confederation
  group_letter: GroupLetter
  /** FIFA World Ranking (June 2026) */
  fifa_ranking: number
}

export const TEAMS: TeamData[] = [
  // GROUP A — México, Sudáfrica, Corea del Sur, República Checa
  { id: 'mex', name: 'México', code: 'MEX', flag_emoji: '🇲🇽', flag_code: 'mx', confederation: 'CONCACAF', group_letter: 'A', fifa_ranking: 15 },
  { id: 'rsa', name: 'Sudáfrica', code: 'RSA', flag_emoji: '🇿🇦', flag_code: 'za', confederation: 'CAF', group_letter: 'A', fifa_ranking: 59 },
  { id: 'kor', name: 'Corea del Sur', code: 'KOR', flag_emoji: '🇰🇷', flag_code: 'kr', confederation: 'AFC', group_letter: 'A', fifa_ranking: 23 },
  { id: 'cze', name: 'República Checa', code: 'CZE', flag_emoji: '🇨🇿', flag_code: 'cz', confederation: 'UEFA', group_letter: 'A', fifa_ranking: 36 },

  // GROUP B — Canadá, Bosnia y Herzegovina, Catar, Suiza
  { id: 'can', name: 'Canadá', code: 'CAN', flag_emoji: '🇨🇦', flag_code: 'ca', confederation: 'CONCACAF', group_letter: 'B', fifa_ranking: 35 },
  { id: 'bih', name: 'Bosnia y Herzegovina', code: 'BIH', flag_emoji: '🇧🇦', flag_code: 'ba', confederation: 'UEFA', group_letter: 'B', fifa_ranking: 62 },
  { id: 'qat', name: 'Catar', code: 'QAT', flag_emoji: '🇶🇦', flag_code: 'qa', confederation: 'AFC', group_letter: 'B', fifa_ranking: 42 },
  { id: 'sui', name: 'Suiza', code: 'SUI', flag_emoji: '🇨🇭', flag_code: 'ch', confederation: 'UEFA', group_letter: 'B', fifa_ranking: 19 },

  // GROUP C — Brasil, Marruecos, Haití, Escocia
  { id: 'bra', name: 'Brasil', code: 'BRA', flag_emoji: '🇧🇷', flag_code: 'br', confederation: 'CONMEBOL', group_letter: 'C', fifa_ranking: 6 },
  { id: 'mar', name: 'Marruecos', code: 'MAR', flag_emoji: '🇲🇦', flag_code: 'ma', confederation: 'CAF', group_letter: 'C', fifa_ranking: 7 },
  { id: 'hai', name: 'Haití', code: 'HAI', flag_emoji: '🇭🇹', flag_code: 'ht', confederation: 'CONCACAF', group_letter: 'C', fifa_ranking: 87 },
  { id: 'sco', name: 'Escocia', code: 'SCO', flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flag_code: 'gb-sct', confederation: 'UEFA', group_letter: 'C', fifa_ranking: 47 },

  // GROUP D — Estados Unidos, Paraguay, Australia, Turquía
  { id: 'usa', name: 'Estados Unidos', code: 'USA', flag_emoji: '🇺🇸', flag_code: 'us', confederation: 'CONCACAF', group_letter: 'D', fifa_ranking: 16 },
  { id: 'pry', name: 'Paraguay', code: 'PRY', flag_emoji: '🇵🇾', flag_code: 'py', confederation: 'CONMEBOL', group_letter: 'D', fifa_ranking: 52 },
  { id: 'aus', name: 'Australia', code: 'AUS', flag_emoji: '🇦🇺', flag_code: 'au', confederation: 'AFC', group_letter: 'D', fifa_ranking: 25 },
  { id: 'tur', name: 'Turquía', code: 'TUR', flag_emoji: '🇹🇷', flag_code: 'tr', confederation: 'UEFA', group_letter: 'D', fifa_ranking: 26 },

  // GROUP E — Alemania, Curazao, Costa de Marfil, Ecuador
  { id: 'ger', name: 'Alemania', code: 'GER', flag_emoji: '🇩🇪', flag_code: 'de', confederation: 'UEFA', group_letter: 'E', fifa_ranking: 10 },
  { id: 'cuw', name: 'Curazao', code: 'CUW', flag_emoji: '🇨🇼', flag_code: 'cw', confederation: 'CONCACAF', group_letter: 'E', fifa_ranking: 85 },
  { id: 'civ', name: 'Costa de Marfil', code: 'CIV', flag_emoji: '🇨🇮', flag_code: 'ci', confederation: 'CAF', group_letter: 'E', fifa_ranking: 39 },
  { id: 'ecu', name: 'Ecuador', code: 'ECU', flag_emoji: '🇪🇨', flag_code: 'ec', confederation: 'CONMEBOL', group_letter: 'E', fifa_ranking: 33 },

  // GROUP F — Países Bajos, Japón, Suecia, Túnez
  { id: 'ned', name: 'Países Bajos', code: 'NED', flag_emoji: '🇳🇱', flag_code: 'nl', confederation: 'UEFA', group_letter: 'F', fifa_ranking: 8 },
  { id: 'jpn', name: 'Japón', code: 'JPN', flag_emoji: '🇯🇵', flag_code: 'jp', confederation: 'AFC', group_letter: 'F', fifa_ranking: 18 },
  { id: 'swe', name: 'Suecia', code: 'SWE', flag_emoji: '🇸🇪', flag_code: 'se', confederation: 'UEFA', group_letter: 'F', fifa_ranking: 41 },
  { id: 'tun', name: 'Túnez', code: 'TUN', flag_emoji: '🇹🇳', flag_code: 'tn', confederation: 'CAF', group_letter: 'F', fifa_ranking: 37 },

  // GROUP G — Bélgica, Egipto, Irán, Nueva Zelanda
  { id: 'bel', name: 'Bélgica', code: 'BEL', flag_emoji: '🇧🇪', flag_code: 'be', confederation: 'UEFA', group_letter: 'G', fifa_ranking: 9 },
  { id: 'egy', name: 'Egipto', code: 'EGY', flag_emoji: '🇪🇬', flag_code: 'eg', confederation: 'CAF', group_letter: 'G', fifa_ranking: 32 },
  { id: 'irn', name: 'Irán', code: 'IRN', flag_emoji: '🇮🇷', flag_code: 'ir', confederation: 'AFC', group_letter: 'G', fifa_ranking: 22 },
  { id: 'nzl', name: 'Nueva Zelanda', code: 'NZL', flag_emoji: '🇳🇿', flag_code: 'nz', confederation: 'OFC', group_letter: 'G', fifa_ranking: 93 },

  // GROUP H — España, Cabo Verde, Arabia Saudí, Uruguay
  { id: 'esp', name: 'España', code: 'ESP', flag_emoji: '🇪🇸', flag_code: 'es', confederation: 'UEFA', group_letter: 'H', fifa_ranking: 2 },
  { id: 'cpv', name: 'Cabo Verde', code: 'CPV', flag_emoji: '🇨🇻', flag_code: 'cv', confederation: 'CAF', group_letter: 'H', fifa_ranking: 73 },
  { id: 'ksa', name: 'Arabia Saudí', code: 'KSA', flag_emoji: '🇸🇦', flag_code: 'sa', confederation: 'AFC', group_letter: 'H', fifa_ranking: 56 },
  { id: 'uru', name: 'Uruguay', code: 'URU', flag_emoji: '🇺🇾', flag_code: 'uy', confederation: 'CONMEBOL', group_letter: 'H', fifa_ranking: 17 },

  // GROUP I — Francia, Senegal, Irak, Noruega
  { id: 'fra', name: 'Francia', code: 'FRA', flag_emoji: '🇫🇷', flag_code: 'fr', confederation: 'UEFA', group_letter: 'I', fifa_ranking: 3 },
  { id: 'sen', name: 'Senegal', code: 'SEN', flag_emoji: '🇸🇳', flag_code: 'sn', confederation: 'CAF', group_letter: 'I', fifa_ranking: 14 },
  { id: 'irq', name: 'Irak', code: 'IRQ', flag_emoji: '🇮🇶', flag_code: 'iq', confederation: 'AFC', group_letter: 'I', fifa_ranking: 63 },
  { id: 'nor', name: 'Noruega', code: 'NOR', flag_emoji: '🇳🇴', flag_code: 'no', confederation: 'UEFA', group_letter: 'I', fifa_ranking: 45 },

  // GROUP J — Argentina, Argelia, Austria, Jordania
  { id: 'arg', name: 'Argentina', code: 'ARG', flag_emoji: '🇦🇷', flag_code: 'ar', confederation: 'CONMEBOL', group_letter: 'J', fifa_ranking: 1 },
  { id: 'alg', name: 'Argelia', code: 'ALG', flag_emoji: '🇩🇿', flag_code: 'dz', confederation: 'CAF', group_letter: 'J', fifa_ranking: 34 },
  { id: 'aut', name: 'Austria', code: 'AUT', flag_emoji: '🇦🇹', flag_code: 'at', confederation: 'UEFA', group_letter: 'J', fifa_ranking: 24 },
  { id: 'jor', name: 'Jordania', code: 'JOR', flag_emoji: '🇯🇴', flag_code: 'jo', confederation: 'AFC', group_letter: 'J', fifa_ranking: 70 },

  // GROUP K — Portugal, RD del Congo, Uzbekistán, Colombia
  { id: 'por', name: 'Portugal', code: 'POR', flag_emoji: '🇵🇹', flag_code: 'pt', confederation: 'UEFA', group_letter: 'K', fifa_ranking: 5 },
  { id: 'cod', name: 'RD del Congo', code: 'COD', flag_emoji: '🇨🇩', flag_code: 'cd', confederation: 'CAF', group_letter: 'K', fifa_ranking: 54 },
  { id: 'uzb', name: 'Uzbekistán', code: 'UZB', flag_emoji: '🇺🇿', flag_code: 'uz', confederation: 'AFC', group_letter: 'K', fifa_ranking: 61 },
  { id: 'col', name: 'Colombia', code: 'COL', flag_emoji: '🇨🇴', flag_code: 'co', confederation: 'CONMEBOL', group_letter: 'K', fifa_ranking: 13 },

  // GROUP L — Inglaterra, Croacia, Ghana, Panamá
  { id: 'eng', name: 'Inglaterra', code: 'ENG', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flag_code: 'gb-eng', confederation: 'UEFA', group_letter: 'L', fifa_ranking: 4 },
  { id: 'cro', name: 'Croacia', code: 'CRO', flag_emoji: '🇭🇷', flag_code: 'hr', confederation: 'UEFA', group_letter: 'L', fifa_ranking: 11 },
  { id: 'gha', name: 'Ghana', code: 'GHA', flag_emoji: '🇬🇭', flag_code: 'gh', confederation: 'CAF', group_letter: 'L', fifa_ranking: 46 },
  { id: 'pan', name: 'Panamá', code: 'PAN', flag_emoji: '🇵🇦', flag_code: 'pa', confederation: 'CONCACAF', group_letter: 'L', fifa_ranking: 48 },
]

export const TEAMS_BY_GROUP = TEAMS.reduce(
  (acc, team) => {
    if (!acc[team.group_letter]) acc[team.group_letter] = []
    acc[team.group_letter].push(team)
    return acc
  },
  {} as Record<GroupLetter, TeamData[]>
)

export const TEAMS_BY_ID = TEAMS.reduce(
  (acc, team) => {
    acc[team.id] = team
    return acc
  },
  {} as Record<string, TeamData>
)

export const GROUP_LETTERS: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export const CONFEDERATION_COLORS: Record<Confederation, string> = {
  UEFA: '#003DA5',
  CONMEBOL: '#009B3A',
  CONCACAF: '#EF3340',
  CAF: '#C60C30',
  AFC: '#FF4500',
  OFC: '#00AACC',
}

// ── World Cup Historical Data ──────────────────────────────────────

export interface WCHistoryEntry {
  /** Number of World Cup titles */
  titles: number
  /** Best achievement if no titles */
  best?: 'Final' | 'Semi' | 'Cuartos' | 'Octavos' | 'Grupos' | 'Debut'
  /** Year of best achievement (most recent occurrence) */
  bestYear?: number
}

export const WC_HISTORY: Record<string, WCHistoryEntry> = {
  // Champions
  bra: { titles: 5 },
  ger: { titles: 4 },
  arg: { titles: 3 },
  fra: { titles: 2 },
  uru: { titles: 2 },
  eng: { titles: 1 },
  esp: { titles: 1 },
  // Runners-up (never won)
  ned: { titles: 0, best: 'Final', bestYear: 2010 },
  cro: { titles: 0, best: 'Final', bestYear: 2018 },
  cze: { titles: 0, best: 'Final', bestYear: 1962 }, // as Czechoslovakia
  swe: { titles: 0, best: 'Final', bestYear: 1958 },
  // Semi-finalists
  tur: { titles: 0, best: 'Semi', bestYear: 2002 },
  kor: { titles: 0, best: 'Semi', bestYear: 2002 },
  bel: { titles: 0, best: 'Semi', bestYear: 2018 },
  mar: { titles: 0, best: 'Semi', bestYear: 2022 },
  por: { titles: 0, best: 'Semi', bestYear: 2006 },
  aut: { titles: 0, best: 'Semi', bestYear: 1954 },
  usa: { titles: 0, best: 'Semi', bestYear: 1930 },
  // Quarter-finalists
  mex: { titles: 0, best: 'Cuartos', bestYear: 1986 },
  pry: { titles: 0, best: 'Cuartos', bestYear: 2010 },
  col: { titles: 0, best: 'Cuartos', bestYear: 2014 },
  sui: { titles: 0, best: 'Cuartos', bestYear: 1954 },
  sen: { titles: 0, best: 'Cuartos', bestYear: 2002 },
  gha: { titles: 0, best: 'Cuartos', bestYear: 2010 },
  // Round of 16
  jpn: { titles: 0, best: 'Octavos', bestYear: 2022 },
  aus: { titles: 0, best: 'Octavos', bestYear: 2022 },
  ecu: { titles: 0, best: 'Octavos', bestYear: 2006 },
  alg: { titles: 0, best: 'Octavos', bestYear: 2014 },
  ksa: { titles: 0, best: 'Octavos', bestYear: 1994 },
  nor: { titles: 0, best: 'Octavos', bestYear: 1998 },
  // Group stage
  rsa: { titles: 0, best: 'Grupos', bestYear: 2010 },
  can: { titles: 0, best: 'Grupos', bestYear: 2022 },
  bih: { titles: 0, best: 'Grupos', bestYear: 2014 },
  qat: { titles: 0, best: 'Grupos', bestYear: 2022 },
  hai: { titles: 0, best: 'Grupos', bestYear: 1974 },
  sco: { titles: 0, best: 'Grupos', bestYear: 1998 },
  tun: { titles: 0, best: 'Grupos', bestYear: 2022 },
  egy: { titles: 0, best: 'Grupos', bestYear: 1990 },
  irn: { titles: 0, best: 'Grupos', bestYear: 2022 },
  nzl: { titles: 0, best: 'Grupos', bestYear: 2010 },
  irq: { titles: 0, best: 'Grupos', bestYear: 1986 },
  civ: { titles: 0, best: 'Grupos', bestYear: 2014 },
  cod: { titles: 0, best: 'Grupos', bestYear: 1974 },
  pan: { titles: 0, best: 'Grupos', bestYear: 2018 },
  // Debut (first World Cup ever)
  cuw: { titles: 0, best: 'Debut' },
  cpv: { titles: 0, best: 'Debut' },
  uzb: { titles: 0, best: 'Debut' },
  jor: { titles: 0, best: 'Debut' },
}

// ── Odds calculator based on FIFA rankings with exact overrides ──

const ODDS_OVERRIDES: Record<string, string> = {
  'mex-rsa': '1.47 / 4.11 / 6.79',
  'kor-cze': '2.63 / 3.17 / 2.68',
  'can-bih': '1.78 / 3.64 / 4.33',
  'usa-pry': '1.96 / 3.44 / 3.69',
  'qat-sui': '10.42 / 5.33 / 1.28',
  'bra-mar': '1.59 / 3.89 / 5.43',
  'hai-sco': '7.12 / 4.52 / 1.41',
  'aus-tur': '4.27 / 3.54 / 1.82',
  'ger-cuw': '1.03 / 15.0 / 43.67',
  'ned-jpn': '1.98 / 3.54 / 3.54',
  'civ-ecu': '3.23 / 3.02 / 2.33',
}

export function getOddsForTeams(homeId: string, awayId: string): string {
  const key1 = `${homeId}-${awayId}`
  if (ODDS_OVERRIDES[key1]) return ODDS_OVERRIDES[key1]
  
  const key2 = `${awayId}-${homeId}`
  if (ODDS_OVERRIDES[key2]) {
    const parts = ODDS_OVERRIDES[key2].split(' / ')
    return `${parts[2]} / ${parts[1]} / ${parts[0]}`
  }

  const homeTeam = TEAMS_BY_ID[homeId]
  const awayTeam = TEAMS_BY_ID[awayId]

  if (!homeTeam || !awayTeam) {
    return '2.50 / 3.10 / 2.70'
  }

  const homeRank = homeTeam.fifa_ranking
  const awayRank = awayTeam.fifa_ranking

  const rankDiff = awayRank - homeRank // Positive means home is better
  
  let pHome = 0.38 + (rankDiff / 150)
  let pDraw = 0.28 - (Math.abs(rankDiff) / 400)
  let pAway = 0.34 - (rankDiff / 150)
  
  // Bound probabilities
  pHome = Math.max(0.02, Math.min(0.95, pHome))
  pDraw = Math.max(0.05, Math.min(0.35, pDraw))
  pAway = Math.max(0.02, Math.min(0.95, pAway))
  
  // Normalize
  const sum = pHome + pDraw + pAway
  pHome /= sum
  pDraw /= sum
  pAway /= sum
  
  const oHome = 1 / pHome
  const oDraw = 1 / pDraw
  const oAway = 1 / pAway
  
  return `${oHome.toFixed(2)} / ${oDraw.toFixed(2)} / ${oAway.toFixed(2)}`
}

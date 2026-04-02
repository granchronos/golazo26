import type { Confederation, GroupLetter } from '@/types/database'

export interface TeamData {
  id: string
  name: string
  code: string
  flag_emoji: string
  confederation: Confederation
  group_letter: GroupLetter
}

export const TEAMS: TeamData[] = [
  // GROUP A — México, Sudáfrica, Corea del Sur, República Checa
  { id: 'mex', name: 'México', code: 'MEX', flag_emoji: '🇲🇽', confederation: 'CONCACAF', group_letter: 'A' },
  { id: 'rsa', name: 'Sudáfrica', code: 'RSA', flag_emoji: '🇿🇦', confederation: 'CAF', group_letter: 'A' },
  { id: 'kor', name: 'Corea del Sur', code: 'KOR', flag_emoji: '🇰🇷', confederation: 'AFC', group_letter: 'A' },
  { id: 'cze', name: 'República Checa', code: 'CZE', flag_emoji: '🇨🇿', confederation: 'UEFA', group_letter: 'A' },

  // GROUP B — Canadá, Bosnia y Herzegovina, Catar, Suiza
  { id: 'can', name: 'Canadá', code: 'CAN', flag_emoji: '🇨🇦', confederation: 'CONCACAF', group_letter: 'B' },
  { id: 'bih', name: 'Bosnia y Herzegovina', code: 'BIH', flag_emoji: '🇧🇦', confederation: 'UEFA', group_letter: 'B' },
  { id: 'qat', name: 'Catar', code: 'QAT', flag_emoji: '🇶🇦', confederation: 'AFC', group_letter: 'B' },
  { id: 'sui', name: 'Suiza', code: 'SUI', flag_emoji: '🇨🇭', confederation: 'UEFA', group_letter: 'B' },

  // GROUP C — Brasil, Marruecos, Haití, Escocia
  { id: 'bra', name: 'Brasil', code: 'BRA', flag_emoji: '🇧🇷', confederation: 'CONMEBOL', group_letter: 'C' },
  { id: 'mar', name: 'Marruecos', code: 'MAR', flag_emoji: '🇲🇦', confederation: 'CAF', group_letter: 'C' },
  { id: 'hai', name: 'Haití', code: 'HAI', flag_emoji: '🇭🇹', confederation: 'CONCACAF', group_letter: 'C' },
  { id: 'sco', name: 'Escocia', code: 'SCO', flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', group_letter: 'C' },

  // GROUP D — Estados Unidos, Paraguay, Australia, Turquía
  { id: 'usa', name: 'Estados Unidos', code: 'USA', flag_emoji: '🇺🇸', confederation: 'CONCACAF', group_letter: 'D' },
  { id: 'pry', name: 'Paraguay', code: 'PRY', flag_emoji: '🇵🇾', confederation: 'CONMEBOL', group_letter: 'D' },
  { id: 'aus', name: 'Australia', code: 'AUS', flag_emoji: '🇦🇺', confederation: 'AFC', group_letter: 'D' },
  { id: 'tur', name: 'Turquía', code: 'TUR', flag_emoji: '🇹🇷', confederation: 'UEFA', group_letter: 'D' },

  // GROUP E — Alemania, Curazao, Costa de Marfil, Ecuador
  { id: 'ger', name: 'Alemania', code: 'GER', flag_emoji: '🇩🇪', confederation: 'UEFA', group_letter: 'E' },
  { id: 'cuw', name: 'Curazao', code: 'CUW', flag_emoji: '🇨🇼', confederation: 'CONCACAF', group_letter: 'E' },
  { id: 'civ', name: 'Costa de Marfil', code: 'CIV', flag_emoji: '🇨🇮', confederation: 'CAF', group_letter: 'E' },
  { id: 'ecu', name: 'Ecuador', code: 'ECU', flag_emoji: '🇪🇨', confederation: 'CONMEBOL', group_letter: 'E' },

  // GROUP F — Países Bajos, Japón, Suecia, Túnez
  { id: 'ned', name: 'Países Bajos', code: 'NED', flag_emoji: '🇳🇱', confederation: 'UEFA', group_letter: 'F' },
  { id: 'jpn', name: 'Japón', code: 'JPN', flag_emoji: '🇯🇵', confederation: 'AFC', group_letter: 'F' },
  { id: 'swe', name: 'Suecia', code: 'SWE', flag_emoji: '🇸🇪', confederation: 'UEFA', group_letter: 'F' },
  { id: 'tun', name: 'Túnez', code: 'TUN', flag_emoji: '🇹🇳', confederation: 'CAF', group_letter: 'F' },

  // GROUP G — Bélgica, Egipto, Irán, Nueva Zelanda
  { id: 'bel', name: 'Bélgica', code: 'BEL', flag_emoji: '🇧🇪', confederation: 'UEFA', group_letter: 'G' },
  { id: 'egy', name: 'Egipto', code: 'EGY', flag_emoji: '🇪🇬', confederation: 'CAF', group_letter: 'G' },
  { id: 'irn', name: 'Irán', code: 'IRN', flag_emoji: '🇮🇷', confederation: 'AFC', group_letter: 'G' },
  { id: 'nzl', name: 'Nueva Zelanda', code: 'NZL', flag_emoji: '🇳🇿', confederation: 'OFC', group_letter: 'G' },

  // GROUP H — España, Cabo Verde, Arabia Saudí, Uruguay
  { id: 'esp', name: 'España', code: 'ESP', flag_emoji: '🇪🇸', confederation: 'UEFA', group_letter: 'H' },
  { id: 'cpv', name: 'Cabo Verde', code: 'CPV', flag_emoji: '🇨🇻', confederation: 'CAF', group_letter: 'H' },
  { id: 'ksa', name: 'Arabia Saudí', code: 'KSA', flag_emoji: '🇸🇦', confederation: 'AFC', group_letter: 'H' },
  { id: 'uru', name: 'Uruguay', code: 'URU', flag_emoji: '🇺🇾', confederation: 'CONMEBOL', group_letter: 'H' },

  // GROUP I — Francia, Senegal, Irak, Noruega
  { id: 'fra', name: 'Francia', code: 'FRA', flag_emoji: '🇫🇷', confederation: 'UEFA', group_letter: 'I' },
  { id: 'sen', name: 'Senegal', code: 'SEN', flag_emoji: '🇸🇳', confederation: 'CAF', group_letter: 'I' },
  { id: 'irq', name: 'Irak', code: 'IRQ', flag_emoji: '🇮🇶', confederation: 'AFC', group_letter: 'I' },
  { id: 'nor', name: 'Noruega', code: 'NOR', flag_emoji: '🇳🇴', confederation: 'UEFA', group_letter: 'I' },

  // GROUP J — Argentina, Argelia, Austria, Jordania
  { id: 'arg', name: 'Argentina', code: 'ARG', flag_emoji: '🇦🇷', confederation: 'CONMEBOL', group_letter: 'J' },
  { id: 'alg', name: 'Argelia', code: 'ALG', flag_emoji: '🇩🇿', confederation: 'CAF', group_letter: 'J' },
  { id: 'aut', name: 'Austria', code: 'AUT', flag_emoji: '🇦🇹', confederation: 'UEFA', group_letter: 'J' },
  { id: 'jor', name: 'Jordania', code: 'JOR', flag_emoji: '🇯🇴', confederation: 'AFC', group_letter: 'J' },

  // GROUP K — Portugal, RD del Congo, Uzbekistán, Colombia
  { id: 'por', name: 'Portugal', code: 'POR', flag_emoji: '🇵🇹', confederation: 'UEFA', group_letter: 'K' },
  { id: 'cod', name: 'RD del Congo', code: 'COD', flag_emoji: '🇨🇩', confederation: 'CAF', group_letter: 'K' },
  { id: 'uzb', name: 'Uzbekistán', code: 'UZB', flag_emoji: '🇺🇿', confederation: 'AFC', group_letter: 'K' },
  { id: 'col', name: 'Colombia', code: 'COL', flag_emoji: '🇨🇴', confederation: 'CONMEBOL', group_letter: 'K' },

  // GROUP L — Inglaterra, Croacia, Ghana, Panamá
  { id: 'eng', name: 'Inglaterra', code: 'ENG', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', group_letter: 'L' },
  { id: 'cro', name: 'Croacia', code: 'CRO', flag_emoji: '🇭🇷', confederation: 'UEFA', group_letter: 'L' },
  { id: 'gha', name: 'Ghana', code: 'GHA', flag_emoji: '🇬🇭', confederation: 'CAF', group_letter: 'L' },
  { id: 'pan', name: 'Panamá', code: 'PAN', flag_emoji: '🇵🇦', confederation: 'CONCACAF', group_letter: 'L' },
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

'use client'

import { Trophy } from 'lucide-react'

/**
 * FotMob-style "Seasons" list showing past World Cup winners + runners-up.
 */

interface Season {
  year: number
  host: string
  winner: { name: string; flag: string }
  runnerUp: { name: string; flag: string }
}

const WC_SEASONS: Season[] = [
  { year: 2022, host: 'Catar', winner: { name: 'Argentina', flag: '🇦🇷' }, runnerUp: { name: 'Francia', flag: '🇫🇷' } },
  { year: 2018, host: 'Rusia', winner: { name: 'Francia', flag: '🇫🇷' }, runnerUp: { name: 'Croacia', flag: '🇭🇷' } },
  { year: 2014, host: 'Brasil', winner: { name: 'Alemania', flag: '🇩🇪' }, runnerUp: { name: 'Argentina', flag: '🇦🇷' } },
  { year: 2010, host: 'Sudáfrica', winner: { name: 'España', flag: '🇪🇸' }, runnerUp: { name: 'Países Bajos', flag: '🇳🇱' } },
  { year: 2006, host: 'Alemania', winner: { name: 'Italia', flag: '🇮🇹' }, runnerUp: { name: 'Francia', flag: '🇫🇷' } },
  { year: 2002, host: 'Corea/Japón', winner: { name: 'Brasil', flag: '🇧🇷' }, runnerUp: { name: 'Alemania', flag: '🇩🇪' } },
  { year: 1998, host: 'Francia', winner: { name: 'Francia', flag: '🇫🇷' }, runnerUp: { name: 'Brasil', flag: '🇧🇷' } },
  { year: 1994, host: 'EE.UU.', winner: { name: 'Brasil', flag: '🇧🇷' }, runnerUp: { name: 'Italia', flag: '🇮🇹' } },
  { year: 1990, host: 'Italia', winner: { name: 'Alemania', flag: '🇩🇪' }, runnerUp: { name: 'Argentina', flag: '🇦🇷' } },
  { year: 1986, host: 'México', winner: { name: 'Argentina', flag: '🇦🇷' }, runnerUp: { name: 'Alemania', flag: '🇩🇪' } },
  { year: 1982, host: 'España', winner: { name: 'Italia', flag: '🇮🇹' }, runnerUp: { name: 'Alemania', flag: '🇩🇪' } },
  { year: 1978, host: 'Argentina', winner: { name: 'Argentina', flag: '🇦🇷' }, runnerUp: { name: 'Países Bajos', flag: '🇳🇱' } },
  { year: 1974, host: 'Alemania', winner: { name: 'Alemania', flag: '🇩🇪' }, runnerUp: { name: 'Países Bajos', flag: '🇳🇱' } },
  { year: 1970, host: 'México', winner: { name: 'Brasil', flag: '🇧🇷' }, runnerUp: { name: 'Italia', flag: '🇮🇹' } },
  { year: 1966, host: 'Inglaterra', winner: { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, runnerUp: { name: 'Alemania', flag: '🇩🇪' } },
  { year: 1962, host: 'Chile', winner: { name: 'Brasil', flag: '🇧🇷' }, runnerUp: { name: 'Checoslov.', flag: '🇨🇿' } },
  { year: 1958, host: 'Suecia', winner: { name: 'Brasil', flag: '🇧🇷' }, runnerUp: { name: 'Suecia', flag: '🇸🇪' } },
  { year: 1954, host: 'Suiza', winner: { name: 'Alemania', flag: '🇩🇪' }, runnerUp: { name: 'Hungría', flag: '🇭🇺' } },
  { year: 1950, host: 'Brasil', winner: { name: 'Uruguay', flag: '🇺🇾' }, runnerUp: { name: 'Brasil', flag: '🇧🇷' } },
  { year: 1938, host: 'Francia', winner: { name: 'Italia', flag: '🇮🇹' }, runnerUp: { name: 'Hungría', flag: '🇭🇺' } },
  { year: 1934, host: 'Italia', winner: { name: 'Italia', flag: '🇮🇹' }, runnerUp: { name: 'Checoslov.', flag: '🇨🇿' } },
  { year: 1930, host: 'Uruguay', winner: { name: 'Uruguay', flag: '🇺🇾' }, runnerUp: { name: 'Argentina', flag: '🇦🇷' } },
]

export function WCHistory() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
        <Trophy size={14} className="text-[#C9A84C]" />
        <span className="font-display text-sm dark:text-white">Historia</span>
        <span className="text-[10px] font-mono text-gray-400 ml-auto">22 ediciones</span>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-white/[0.04] max-h-[420px] overflow-y-auto scrollbar-hide">
        {WC_SEASONS.map((s) => (
          <div key={s.year} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
            {/* Year + host */}
            <div className="w-20 flex-shrink-0">
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-white">{s.year}</span>
              <p className="text-[9px] font-body text-gray-400 leading-tight truncate">{s.host}</p>
            </div>

            {/* Winner */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sm leading-none">{s.winner.flag}</span>
              <span className="text-xs font-body font-semibold text-gray-800 dark:text-gray-200 truncate">
                {s.winner.name}
              </span>
              <span className="text-[7px] font-bold text-[#C9A84C] leading-none">★</span>
            </div>

            {/* Runner-up */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sm leading-none">{s.runnerUp.flag}</span>
              <span className="text-xs font-body text-gray-500 dark:text-gray-400 truncate">
                {s.runnerUp.name}
              </span>
              <span className="text-[7px] text-gray-300 dark:text-gray-600 leading-none">2°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

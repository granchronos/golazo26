'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Crown, AlertCircle } from 'lucide-react'

interface ThirdPlacedTeam {
  group: string
  position: number
  team: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export function ThirdPlacedRanking() {
  const [teams, setTeams] = useState<ThirdPlacedTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchRanking() {
      try {
        const res = await fetch('/api/standings/thirds')
        const data = await res.json()
        if (data.success) {
          setTeams(data.data)
          setIsLive(false) // Fase de grupos terminada
        } else {
          setError(true)
        }
      } catch (err) {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRanking()
  }, [])

  if (error) return null

  return (
    <div className="glass-card flex flex-col h-full relative overflow-hidden group">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#C9A84C]" />
          <h2 className="font-display text-lg dark:text-white leading-none">Mejores Terceros</h2>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <span className="text-xs font-body text-gray-500 dark:text-gray-400">
            {isLive ? 'En vivo' : 'Final'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative z-10 p-2 sm:p-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
            <p className="text-sm font-body">No hay datos disponibles</p>
          </div>
        ) : (
          <div className="w-full text-sm font-body">
            <div className="flex text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1">
              <div className="w-6 text-center">#</div>
              <div className="flex-1">Equipo</div>
              <div className="w-8 text-center" title="Partidos Jugados">PJ</div>
              <div className="w-8 text-center" title="Diferencia de Goles">DG</div>
              <div className="w-8 text-center font-bold" title="Puntos">Pts</div>
            </div>
            
            <div className="space-y-1 mt-1">
              {teams.map((team, index) => {
                const isQualified = index < 8
                return (
                  <div key={team.team.id} className="relative">
                    {/* Qualification line cutoff after the 8th team */}
                    {index === 8 && (
                      <div className="flex items-center my-2">
                        <div className="h-px bg-red-500/50 flex-1"></div>
                        <span className="px-2 text-[10px] uppercase tracking-wider text-red-500/80 font-bold">
                          Corte de Clasificación
                        </span>
                        <div className="h-px bg-red-500/50 flex-1"></div>
                      </div>
                    )}
                    
                    <div
                      className={`flex items-center px-2 py-1.5 rounded-lg transition-colors ${
                        isQualified
                          ? 'hover:bg-white/5 bg-transparent'
                          : 'opacity-50 hover:opacity-100 hover:bg-white/5 bg-transparent grayscale'
                      }`}
                    >
                      <div className={`w-6 text-center text-xs font-bold ${isQualified ? 'text-white' : 'text-gray-500'}`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2 overflow-hidden">
                        {team.team.crest && (
                          <div className="relative w-5 h-5 flex-shrink-0">
                            <Image
                              src={team.team.crest}
                              alt={team.team.name}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <span className="truncate dark:text-white font-medium">
                          {team.team.shortName}
                        </span>
                        <span className="text-[10px] text-gray-500 hidden sm:inline-block">
                          ({team.group.replace('Group ', '')})
                        </span>
                      </div>
                      
                      <div className="w-8 text-center text-gray-500 dark:text-gray-400">
                        {team.playedGames}
                      </div>
                      <div className="w-8 text-center text-gray-500 dark:text-gray-400">
                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                      </div>
                      <div className={`w-8 text-center font-bold ${isQualified ? 'text-[#C9A84C]' : 'text-gray-500'}`}>
                        {team.points}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import { Users, Crown, ChevronRight } from 'lucide-react'
import { CreateRoomModal } from '@/components/groups/CreateRoomModal'
import { JoinRoomForm } from '@/components/groups/JoinRoomForm'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { GROUP_STAGE_DEADLINE } from '@/lib/constants/points'
import type { Room, Profile } from '@/types/database'

export default async function HomePage() {
  const [supabase, admin] = await Promise.all([createClient(), createAdminClient()])
  const { data: { user } } = await supabase.auth.getUser()

  // Parallel fetch: profile, memberships, matches
  const [{ data: profile }, { data: memberships }, { data: rawMatches }] = await Promise.all([
    admin.from('profiles').select('name').eq('user_id', user!.id).single(),
    admin.from('room_members').select(`
      room_id,
      rooms!inner(id, name, description, code, admin_id, created_at)
    `).eq('user_id', user!.id),
    admin.from('matches').select('status, round, home_team_id, away_team_id, home_score, away_score').order('match_number', { ascending: true }),
  ])

  const rooms = memberships?.map((m) => m.rooms as unknown as Room) || []
  const matches = (rawMatches || []) as { status: 'scheduled' | 'live' | 'finished' | 'postponed'; round: string; home_team_id: string | null; away_team_id: string | null; home_score: number | null; away_score: number | null }[]

  // Fetch room rankings: for each room, get members + scores + profiles
  const roomRankings = []
  for (const room of rooms) {
    const { data: roomMembers } = await admin.from('room_members').select('user_id').eq('room_id', room.id)
    const memberIds = (roomMembers || []).map((m) => m.user_id)
    if (memberIds.length === 0) continue

    const [{ data: profiles }, { data: scores }] = await Promise.all([
      admin.from('profiles').select('user_id, name').in('user_id', memberIds),
      admin.from('scores').select('user_id, total_points').eq('room_id', room.id).in('user_id', memberIds),
    ])

    const profilesMap = new Map((profiles || []).map((p) => [p.user_id, p.name]))
    const scoresMap = new Map((scores || []).map((s) => [s.user_id, s.total_points]))

    roomRankings.push({
      roomId: room.id,
      roomName: room.name,
      members: memberIds.map((uid) => ({
        userId: uid,
        name: profilesMap.get(uid) || 'Anónimo',
        points: scoresMap.get(uid) ?? 0,
        isMe: uid === user!.id,
      })),
    })
  }

  // Countdown to first match
  const now = new Date()
  const deadline = new Date(GROUP_STAGE_DEADLINE)
  const diff = deadline.getTime() - now.getTime()
  const countdown = diff > 0 ? {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
  } : null

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 font-body mb-1">Copa Mundial FIFA 2026</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl dark:text-white">
          Hola, <span className="gradient-text">{profile?.name?.split(' ')[0]}</span>
        </h1>
      </div>

      {rooms.length === 0 ? (
        /* Empty state — no rooms yet */
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 text-center">
            <Users size={36} className="mx-auto mb-4 text-gray-300 dark:text-white/10" />
            <h2 className="font-display text-xl dark:text-white mb-2">¡Bienvenido!</h2>
            <p className="text-sm font-body text-gray-400 max-w-sm mx-auto mb-6">
              Crea una sala para jugar con amigos o únete a una existente con un código de invitación.
              Dentro de la sala podrás hacer tus apuestas y ver el ranking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CreateRoomModal />
            <JoinRoomForm />
          </div>
        </div>
      ) : (
        /* User has rooms — show dashboard + rooms */
        <div className="space-y-6">
          {/* Dashboard */}
          <Dashboard
            userName={profile?.name ?? 'Usuario'}
            currentUserId={user!.id}
            roomRankings={roomRankings}
            matches={matches}
            countdown={countdown}
          />

          {/* Room list */}
          <div>
            <h2 className="font-display text-lg dark:text-white mb-3">Mis Salas</h2>
            <StaggerContainer className="space-y-2">
              {rooms.map((room) => (
                <StaggerItem key={room.id}>
                  <Link href={`/groups/${room.id}`} className="block">
                    <div className="glass-card px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-3 hover:border-gray-300 dark:hover:border-white/20 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {room.admin_id === user!.id && (
                            <Crown size={12} className="text-[#C9A84C] flex-shrink-0" />
                          )}
                          <h3 className="text-sm font-body font-semibold dark:text-white truncate">{room.name}</h3>
                        </div>
                        {room.description && (
                          <p className="text-xs font-body text-gray-400 truncate">{room.description}</p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          {/* Compact create/join */}
          <div className="grid grid-cols-2 gap-2">
            <CreateRoomModal variant="compact" />
            <JoinRoomForm variant="compact" />
          </div>
        </div>
      )}
    </PageTransition>
  )
}

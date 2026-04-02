import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import { Users, Crown, ChevronRight, Plus, KeyRound } from 'lucide-react'
import { CreateRoomModal } from '@/components/groups/CreateRoomModal'
import { JoinRoomForm } from '@/components/groups/JoinRoomForm'
import type { Room } from '@/types/database'

export default async function HomePage() {
  const [supabase, admin] = await Promise.all([createClient(), createAdminClient()])
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    admin.from('profiles').select('name').eq('user_id', user!.id).single(),
    admin.from('room_members').select(`
      room_id,
      rooms!inner(id, name, description, code, admin_id, created_at)
    `).eq('user_id', user!.id),
  ])

  const rooms = memberships?.map((m) => m.rooms as unknown as Room) || []

  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-body mb-1">Copa Mundial FIFA 2026</p>
        <h1 className="font-display text-4xl md:text-5xl dark:text-white">
          Hola, <span className="gradient-text">{profile?.name?.split(' ')[0]}</span>
        </h1>
      </div>

      {rooms.length === 0 ? (
        /* Empty state — no rooms yet */
        <div className="space-y-6">
          <div className="glass-card p-8 text-center">
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
        /* User has rooms */
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CreateRoomModal />
            <JoinRoomForm />
          </div>

          {/* Room list */}
          <div>
            <h2 className="font-display text-lg dark:text-white mb-3">Mis Salas</h2>
            <StaggerContainer className="space-y-2">
              {rooms.map((room) => (
                <StaggerItem key={room.id}>
                  <Link href={`/groups/${room.id}`} className="block">
                    <div className="glass-card px-4 py-3.5 flex items-center gap-3 hover:border-gray-300 dark:hover:border-white/20 transition-colors group">
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
        </div>
      )}
    </PageTransition>
  )
}

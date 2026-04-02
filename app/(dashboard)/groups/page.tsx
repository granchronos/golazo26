import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import { CreateRoomModal } from '@/components/groups/CreateRoomModal'
import { JoinRoomForm } from '@/components/groups/JoinRoomForm'
import { Users, Crown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { Room } from '@/types/database'

export const metadata = { title: 'Mis Salas' }

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = await createAdminClient()
  const { data: memberships } = await admin
    .from('room_members')
    .select(`
      room_id,
      rooms!inner(id, name, description, code, admin_id, created_at)
    `)
    .eq('user_id', user!.id)

  const rooms = memberships?.map((m) => m.rooms as unknown as Room) || []

  return (
    <PageTransition>
      <div className="mb-6">
        <p className="text-sm text-gray-400 font-body mb-1">Compite con amigos</p>
        <h1 className="font-display text-3xl md:text-4xl dark:text-white">Salas</h1>
      </div>

      {rooms.length === 0 ? (
        <>
          {/* No rooms — big create/join */}
          <div className="glass-card text-center py-16 mb-6">
            <Users size={32} className="mx-auto mb-3 text-gray-200 dark:text-white/10" />
            <p className="text-sm font-body text-gray-400">Aún no tienes salas</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 font-body mt-1">Crea una o únete con un código</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CreateRoomModal />
            <JoinRoomForm />
          </div>
        </>
      ) : (
        <>
          {/* Room list first */}
          <StaggerContainer className="space-y-2 mb-6">
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
                      <span className="text-[10px] font-mono text-gray-400 tracking-wider">{room.code}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0"
                    />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Compact create/join */}
          <div className="grid grid-cols-2 gap-2">
            <CreateRoomModal variant="compact" />
            <JoinRoomForm variant="compact" />
          </div>
        </>
      )}
    </PageTransition>
  )
}

'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface RealtimeRoomProps {
  roomId: string
  currentUserId: string
}

export function RealtimeRoom({ roomId, currentUserId }: RealtimeRoomProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('room-members-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_members',
        },
        async (payload) => {
          // Filter client-side instead of using Supabase filter
          if (payload.new.room_id !== roomId) return
          if (payload.new.user_id === currentUserId) return

          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', payload.new.user_id)
            .single()
          const name = profile?.name || 'Alguien'
          toast.success(`${name} se unió a la sala`, { duration: 4000 })
          router.refresh()
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error for room_members')
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, currentUserId, router])

  return null
}

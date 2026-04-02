import { notFound, redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageTransition } from '@/components/animations/PageTransition'
import { GroupRoom } from '@/components/groups/GroupRoom'
import { GROUP_LETTERS } from '@/lib/constants/teams'
import type { Room, Profile, Match, GroupLetter, GroupPrediction } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = await createAdminClient()

  // Parallel fetch: room + membership check
  const [{ data: room }, { data: membership }] = await Promise.all([
    admin.from('rooms').select('*').eq('id', id).single(),
    admin.from('room_members').select('id').eq('room_id', id).eq('user_id', user.id).single(),
  ])

  if (!room) notFound()
  if (!membership) redirect('/groups')

  // Parallel fetch: members + all group predictions + all knockout predictions + all matches
  const [{ data: rawMembers, error: membersError }, { data: allGroupPreds }, { data: allKnockoutPreds }, { data: rawMatches }] = await Promise.all([
    admin.from('room_members').select('user_id, joined_at').eq('room_id', id),
    admin.from('group_predictions').select('*').eq('room_id', id),
    admin.from('predictions').select('user_id, match_id, predicted_winner_id, predicted_home_score, predicted_away_score, matches!inner(match_number)').eq('room_id', id),
    admin.from('matches').select('*').order('match_number', { ascending: true }),
  ])

  if (membersError) {
    console.error('Error fetching room_members:', membersError)
  }

  // Fetch profiles separately to avoid implicit join issues
  const memberUserIds = (rawMembers || []).map((m) => m.user_id)
  const [{ data: profiles }, { data: allScores }] = await Promise.all([
    memberUserIds.length > 0
      ? admin.from('profiles').select('id, user_id, name, avatar_url, created_at, updated_at').in('user_id', memberUserIds)
      : { data: [] as Profile[], error: null },
    memberUserIds.length > 0
      ? admin.from('scores').select('user_id, total_points').eq('room_id', id).in('user_id', memberUserIds)
      : { data: [] as { user_id: string; total_points: number }[], error: null },
  ])

  const profilesMap = new Map((profiles || []).map((p) => [p.user_id, p as Profile]))
  const scoresMap = new Map((allScores || []).map((s) => [s.user_id, s.total_points]))

  const members = (rawMembers || []).map((m) => ({
    user_id: m.user_id,
    profile: profilesMap.get(m.user_id) ?? { id: '', user_id: m.user_id, name: 'Anónimo', avatar_url: null, created_at: '', updated_at: '' } as Profile,
    total_points: scoresMap.get(m.user_id) ?? 0,
  }))

  // Current user's group predictions
  const groupPredictions = GROUP_LETTERS.reduce((acc, letter) => {
    acc[letter] = (allGroupPreds || []).find((p) => p.user_id === user.id && p.group_letter === letter) || null
    return acc
  }, {} as Record<GroupLetter, GroupPrediction | null>)

  // Current user's knockout predictions: matchNumber → predictedWinnerId
  const knockoutPredictions: Record<number, string> = {}
  for (const p of (allKnockoutPreds || []).filter((p) => p.user_id === user.id)) {
    const matchNumber = (p.matches as unknown as { match_number: number })?.match_number
    if (matchNumber) knockoutPredictions[matchNumber] = p.predicted_winner_id
  }

  // Current user's score predictions: matchNumber → { home, away }
  const scorePredictions: Record<number, { home: number; away: number }> = {}
  for (const p of (allKnockoutPreds || []).filter((pp) => pp.user_id === user.id)) {
    const matchNumber = (p.matches as unknown as { match_number: number })?.match_number
    if (matchNumber && p.predicted_home_score != null && p.predicted_away_score != null) {
      scorePredictions[matchNumber] = { home: p.predicted_home_score, away: p.predicted_away_score }
    }
  }

  // All members' predictions for BetSummary + ComparisonView
  const allMembersPredictions = memberUserIds.map((uid) => {
    const profile = members.find((m) => m.user_id === uid)?.profile
    const memberGroupPreds = GROUP_LETTERS.reduce((acc, letter) => {
      acc[letter] = (allGroupPreds || []).find((p) => p.user_id === uid && p.group_letter === letter) || null
      return acc
    }, {} as Record<GroupLetter, GroupPrediction | null>)

    const memberKnockoutPreds: Record<number, string> = {}
    for (const p of (allKnockoutPreds || []).filter((pp) => pp.user_id === uid)) {
      const matchNumber = (p.matches as unknown as { match_number: number })?.match_number
      if (matchNumber) memberKnockoutPreds[matchNumber] = p.predicted_winner_id
    }

    return {
      userId: uid,
      name: profile?.name || 'Anónimo',
      groupPredictions: memberGroupPreds,
      knockoutPredictions: memberKnockoutPreds,
    }
  })

  return (
    <PageTransition>
      <GroupRoom
        room={room as Room}
        members={members}
        groupPredictions={groupPredictions}
        knockoutPredictions={knockoutPredictions}
        scorePredictions={scorePredictions}
        matches={(rawMatches || []) as Match[]}
        currentUserId={user.id}
        allMembersPredictions={allMembersPredictions}
      />
    </PageTransition>
  )
}

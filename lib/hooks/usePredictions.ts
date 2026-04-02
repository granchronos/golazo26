'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GroupPrediction, Prediction } from '@/types/database'
import type { GroupLetter } from '@/types/database'

export function useGroupPredictions(userId: string | null) {
  const [predictions, setPredictions] = useState<Record<GroupLetter, GroupPrediction | null>>(
    {} as Record<GroupLetter, GroupPrediction | null>
  )
  const [loading, setLoading] = useState(true)

  const fetchPredictions = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('group_predictions')
      .select('*')
      .eq('user_id', userId)

    const map = (data || []).reduce((acc, pred) => {
      acc[pred.group_letter as GroupLetter] = pred
      return acc
    }, {} as Record<GroupLetter, GroupPrediction | null>)
    setPredictions(map)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  return { predictions, loading, refetch: fetchPredictions }
}

export function useMatchPredictions(userId: string | null) {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => {
        const map = (data || []).reduce((acc, pred) => {
          acc[pred.match_id] = pred
          return acc
        }, {} as Record<string, Prediction>)
        setPredictions(map)
        setLoading(false)
      })
  }, [userId])

  return { predictions, loading }
}

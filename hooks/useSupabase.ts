'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { sampleSize, uniq } from 'lodash'

import { TQuestion } from '@/app/types'
import { normalizeQuestionRow } from '@/lib/utils'
import { buildGameRecord, PlayerStatsUpdate, StatIncrements } from '@/lib/gameRecord'
import { usePopStore } from '@/app/state'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl!, supabaseKey!)

export function useSupabase() {
  const {
    gameId,
    players,
    selectedCategories,
    amountQuestions,
    showQuestions,
    answeredQuestions,
  } = usePopStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const postQuestionsToSupabase = useCallback(
    async (questions: TQuestion[]): Promise<{ data: TQuestion[] | null; skipped: number }> => {
      setLoading(true)
      setError(null)
      try {
        const ids = questions.map((q) => q.id)
        const { data: existing } = await supabase.from('population_questions').select('id').in('id', ids)
        console.log('🚀 ~ useSupabase ~ existing:', existing)
        const existingIds = new Set((existing ?? []).map((e: { id: string }) => e.id))
        const newQuestions = questions.filter((q) => !existingIds.has(q.id))
        const skipped = questions.length - newQuestions.length

        if (newQuestions.length === 0) {
          return { data: [], skipped }
        }

        const { data, error } = await supabase.from('population_questions').insert(newQuestions).select()
        console.log('🚀 ~ useSupabase ~ data:', data)
        if (error) throw error

        return { data, skipped }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        return { data: null, skipped: 0 }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const fetchQuestionsByCategory = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('population_questions')
        .select('id, question')
        .eq('category', category)
        .limit(200)
      if (error) throw error
      return (data ?? []) as Pick<TQuestion, 'id' | 'question'>[]
    } catch {
      return []
    }
  }, [])

  const fetchQuestionsByCategories = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (categories: string[], _limit: number): Promise<TQuestion[]> => {
      // Fetch the full matching set (rows come back clustered by category) so the
      // caller's sampleSize can spread evenly across the selected categories.
      const { data, error } = await supabase
        .from('population_questions')
        .select('*')
        .in('category', categories)
        .limit(5000)
      if (error) {
        console.error('[fetchQuestionsByCategories] Supabase error:', error)
        throw error
      }
      return (data ?? []).map(normalizeQuestionRow)
    },
    [],
  )

  const fetchGamesFromSupabase = useCallback(async (playerId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('population_games')
        .select('*')
        .filter('players', 'cs', `[{"id":"${playerId}"}]`)

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const postGameToSupabase = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { game, statsUpdates } = buildGameRecord({
      gameId: gameId!,
      players,
      selectedCategories,
      amountQuestions,
      showQuestions,
      answeredQuestions,
    })

    try {
      const { data: gameData, error: gameError } = await supabase.from('population_games').insert(game)
      if (gameError) throw gameError

      const updatePromises = statsUpdates.map(async ({ id, profileSeed, increments }) => {
        try {
          await ensurePlayerPreferences(profileSeed)
          await incrementPlayerStats(id, increments)
        } catch (error) {
          console.error('Failed to update player stats:', error)
        }
      })

      await Promise.all(updatePromises)

      return gameData
    } catch (err) {
      console.error('Error in postGameToSupabase:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      return null
    } finally {
      setLoading(false)
    }
  }, [
    amountQuestions,
    answeredQuestions,
    gameId,
    players,
    selectedCategories,
    showQuestions,
  ])

  const fetchPlayerPreferences = useCallback(async (playerId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('population_user_preferences')
        .select('*')
        .eq('id', playerId)
        .single()

      if (error) throw error

      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePlayerPreferences = useCallback(
    async (playerId: string, color: string, icon: string, displayName: string) => {
      setLoading(true)
      setError(null)
      try {
        const { data: existingPlayer, error: fetchError } = await supabase
          .from('population_user_preferences')
          .select('*')
          .eq('id', playerId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

        let result
        if (existingPlayer) {
          result = await supabase
            .from('population_user_preferences')
            .update({ preferred_color: color, icon, display_name: displayName })
            .eq('id', playerId)
        } else {
          result = await supabase.from('population_user_preferences').insert({
            id: playerId,
            preferred_color: color,
            icon,
            display_name: displayName,
          })
        }

        if (result.error) throw result.error
        return result.data
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const fetchGamesForPlayer = useCallback(async (playerId: string) => {
    setLoading(true)
    setError(null)
    try {
      if (!playerId) throw new Error('No playerId provided')

      const { data, error } = await supabase
        .from('population_games')
        .select('*')
        .filter('players', 'cs', `[{"id":"${playerId}"}]`)

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUniqueCategories = useCallback(async (count?: number) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('population_questions').select('category')

      if (error) throw error
      const uniqueCategories = uniq(data.map((item: any) => item.category))

      if (!count) {
        return uniqueCategories
      }

      return sampleSize(uniqueCategories, count)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))

      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getHighscores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('population_user_preferences').select('*')

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error in getHighscores:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reportQuestion = useCallback(async (question: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: existingReport, error: fetchError } = await supabase
        .from('population_reported_questions')
        .select('*')
        .eq('question', question)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingReport) {
        const { error: updateError } = await supabase
          .from('population_reported_questions')
          .update({
            report_count: existingReport.report_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReport.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('population_reported_questions').insert({
          question: question,
        })

        if (insertError) throw insertError
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  const getReportedQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('population_reported_questions')
        .select('*')
        .order('report_count', { ascending: false })

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    postQuestionsToSupabase,
    fetchQuestionsByCategory,
    fetchQuestionsByCategories,
    fetchGamesFromSupabase,
    postGameToSupabase,
    fetchPlayerPreferences,
    updatePlayerPreferences,
    fetchGamesForPlayer,
    fetchUniqueCategories,
    getHighscores,
    reportQuestion,
    getReportedQuestions,
  }
}

// increment_columns only UPDATEs, so a signed-in player who never saved
// preferences would get no stats. Create the row first; an existing row
// (and its chosen name/sticker) is left untouched.
async function ensurePlayerPreferences(seed: PlayerStatsUpdate['profileSeed']) {
  const { error } = await supabase
    .from('population_user_preferences')
    .upsert(seed, { onConflict: 'id', ignoreDuplicates: true })

  if (error) throw error
}

async function incrementPlayerStats(playerId: string, increments: StatIncrements) {
  const { data, error } = await supabase.rpc('increment_columns', {
    table_name: 'population_user_preferences',
    id_column: 'id',
    id_value: playerId,
    increments: increments,
  })

  if (error) {
    console.error('Error incrementing player stats:', error)
    throw error
  }

  return data
}

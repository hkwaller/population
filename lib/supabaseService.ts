import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getGameById = async (gameId: string) => {
  const { data, error } = await supabase
    .from('population_played_games')
    .select('*')
    .eq('game_id', gameId)
    .single()

  if (error) {
    console.error('Error fetching game:', error)
    return null
  }
  return data
}

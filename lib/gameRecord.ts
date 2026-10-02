import { maxBy } from 'lodash'

import { TPlayer, TQuestion } from '@/app/types'
import { MAX_SCORE } from '@/lib/utils'

// Signed-in players join with their Clerk user id (`user_...`); guests get a
// `makeId()` room slug. Only Clerk ids have a population.user_preferences row,
// a /profile page and an account to delete, so only they get stats.
export const isClerkUserId = (id: string | undefined | null): id is string =>
  typeof id === 'string' && id.startsWith('user_')

export type StatIncrements = {
  games_played: number
  overall_score: number
  bullseyes: number
  total_questions_answered: number
  multiplayer_games: number
  wins: number
}

export type PlayerStatsUpdate = {
  id: string
  // Inserted only when the player has no preferences row yet (increment_stats
  // is UPDATE-only, so the row must exist before the stats can land).
  profileSeed: { id: string; display_name: string; preferred_color?: string; icon: string }
  increments: StatIncrements
}

export function buildGameRecord({
  gameId,
  players,
  selectedCategories,
  amountQuestions,
  showQuestions,
  answeredQuestions,
  finishedAt = new Date(),
}: {
  gameId: string
  players: TPlayer[]
  selectedCategories: string[]
  amountQuestions: number
  showQuestions: boolean
  answeredQuestions: TQuestion[]
  finishedAt?: Date
}) {
  const isMultiplayerGame = players.length > 1

  // Player ids are stored as-is: /profile looks games up by Clerk id and
  // population.delete_identity matches players[].id / winner.id against it.
  const decoratedPlayers = players.map((player) => {
    const answers = player.answers ?? []
    const score = answers.reduce((acc, answer) => acc + answer.score, 0)

    return {
      ...player,
      score,
      bullseyes: answers.filter((answer) => answer.score >= MAX_SCORE).length,
      gameAverage: score / amountQuestions,
    }
  })

  const winner = maxBy(decoratedPlayers, 'score')!

  const game = {
    gameId,
    finished_at: finishedAt.toISOString(),
    categories: selectedCategories,
    amountQuestions,
    players: decoratedPlayers,
    showQuestions,
    questions: answeredQuestions,
    winner,
  }

  const statsUpdates: PlayerStatsUpdate[] = decoratedPlayers
    .filter((player) => isClerkUserId(player.id))
    .map((player) => ({
      id: player.id,
      profileSeed: {
        id: player.id,
        display_name: player.name,
        preferred_color: player.color,
        icon: player.icon,
      },
      increments: {
        games_played: 1,
        overall_score: player.score,
        bullseyes: player.bullseyes,
        total_questions_answered: (player.answers ?? []).length,
        multiplayer_games: isMultiplayerGame ? 1 : 0,
        wins: isMultiplayerGame && player.id === winner.id ? 1 : 0,
      },
    }))

  return { game, statsUpdates }
}

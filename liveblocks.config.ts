import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import { LiveObject } from '@liveblocks/client'

import type { TPlayer, TQuestion, CommandType } from './app/types'
import type { AnswerModes } from './lib/utils'

// Liveblocks storage requires JSON-serializable types.
// `players` uses `any[]` because TPlayer.icon has symbol indices from the icons array type.
export type GameState = {
  command: CommandType
  boss: string | undefined
  currentQuestion: TQuestion | undefined
  answeredQuestions: TQuestion[]
  skippedQuestions: TQuestion[]
  questions: TQuestion[]
  amountQuestions: number
  showQuestions: boolean
  answerModes: AnswerModes
  selectedCategories: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  players: any[]
  endedAt: string | undefined
}

export type GameStorage = {
  game: LiveObject<GameState>
}

export type Presence = {
  playerId: string | null
}

export type UserMeta = {
  id: string
  info: {
    name: string
    isAnonymous: boolean
  }
}

const client = createClient({
  authEndpoint: '/api/liveblocks-auth',
})

export const {
  RoomProvider,
  useStorage,
  useMutation,
  useStatus,
  useOthers,
  useSelf,
  useMyPresence,
  useUpdateMyPresence,
  useRoom,
} = createRoomContext<Presence, GameStorage, UserMeta>(client)

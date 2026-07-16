'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { LiveObject } from '@liveblocks/client'

import { RoomProvider } from '@/liveblocks.config'
import type { CommandType } from '@/app/types'

if (typeof window !== 'undefined') {
  // posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  //   api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  //   person_profiles: 'identified_only',
  // })
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  // return <PostHogProvider client={posthog}>{children}</PostHogProvider>
  return children
}

export function GameRoomProvider({
  gameId,
  children,
}: {
  gameId: string
  children: React.ReactNode
}) {
  return (
    <RoomProvider
      id={gameId}
      initialPresence={{ playerId: null }}
      initialStorage={{
        game: new LiveObject({
          command: 'idle' as CommandType,
          boss: undefined,
          currentQuestion: undefined,
          answeredQuestions: [],
          skippedQuestions: [],
          questions: [],
          amountQuestions: 10,
          showQuestions: false,
          answerModes: {},
          selectedCategories: [],
          players: [],
          endedAt: undefined,
        }),
      }}
    >
      {children}
    </RoomProvider>
  )
}

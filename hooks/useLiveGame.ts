import { useEffect } from 'react'

import { useIshStore } from '@/app/state'
import { Command, CommandType } from '@/app/types'
import { useStorage } from '@/liveblocks.config'
import { useNext } from './game/useNext'
import { useAnswer } from './game/useAnswer'
import { useBoss } from './game/useBoss'
import { useEnd } from './game/useEnd'
import { useJoin } from './game/useJoin'
import { useRematch } from './game/useRematch'
import { useRemove } from './game/useRemove'
import { useReplace } from './game/useReplace'
import { useReveal } from './game/useReveal'
import { useSetup } from './game/useSetup'
import { useShow } from './game/useShow'
import { useStart } from './game/useStart'

export const useLiveGame = (gameId?: string) => {
  const { updateGame } = useIshStore()

  const gameStorage = useStorage((root) => root.game)

  useEffect(() => {
    if (!gameStorage) return

    updateGame({
      currentQuestion: gameStorage.currentQuestion!,
      answeredQuestions: gameStorage.answeredQuestions,
      skippedQuestions: gameStorage.skippedQuestions,
      amountQuestions: gameStorage.amountQuestions,
      capAnswers: gameStorage.capAnswers,
      hideQuestions: gameStorage.hideQuestions,
      showQuestions: gameStorage.showQuestions,
      selectedCategories: gameStorage.selectedCategories,
      customQuestions: gameStorage.customQuestions,
      customQuestionsAnswered: gameStorage.customQuestionsAnswered,
      customQuestionCategory: gameStorage.customQuestionCategory,
      players: gameStorage.players as any,
      gameId: gameId,
      command: gameStorage.command,
      endedAt: gameStorage.endedAt,
      boss: gameStorage.boss,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStorage])

  const { answer } = useAnswer()
  const { boss } = useBoss()
  const { end } = useEnd()
  const { join } = useJoin()
  const { next } = useNext()
  const { rematch } = useRematch()
  const { remove } = useRemove()
  const { replace } = useReplace()
  const { reveal } = useReveal()
  const { setup } = useSetup()
  const { show } = useShow()
  const { start } = useStart()

  const commandHandlers: {
    [K in Command['type']]: (payload?: any) => Promise<void> | void
  } = {
    answer,
    boss,
    end,
    join,
    next,
    rematch,
    remove,
    replace,
    reveal,
    setup,
    show,
    start,
    idle: () => {},
  }

  const sendCommand = async (commandOrType: Command | CommandType, payload?: any) => {
    let type: CommandType
    let resolvedPayload: any

    if (typeof commandOrType === 'string') {
      type = commandOrType
      resolvedPayload = payload
    } else {
      type = commandOrType.type
      resolvedPayload = 'payload' in commandOrType ? (commandOrType as any).payload : undefined
    }

    const handler = commandHandlers[type]
    if (handler) {
      await handler(resolvedPayload)
    }
  }

  return sendCommand
}

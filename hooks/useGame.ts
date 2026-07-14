/**
 * useGame — unified hook that replaces the dual usePopStore + useLiveGame pattern.
 *
 * Design C: single boundary hook.
 *
 * Source-of-truth split:
 *   Liveblocks (room-shared):  command, currentQuestion, players, boss,
 *                              answeredQuestions, skippedQuestions, endedAt
 *   Zustand (device-local):    selectedCategories, amountQuestions, capAnswers,
 *                              hideQuestions, showQuestions, me, preferences
 *   Derived (no store):        showQuestionResultModal
 *
 * The previous useLiveGame synced ALL Liveblocks fields including
 * selectedCategories: [] (initial storage value), wiping the user's
 * category selections on every room join. This hook intentionally
 * does NOT sync those Zustand-owned fields from Liveblocks.
 */

import { useEffect, useMemo } from 'react'

import { usePopStore } from '@/app/state'
import { Command, CommandType } from '@/app/types'
import { useStorage } from '@/liveblocks.config'

import { useAnswer } from './game/useAnswer'
import { useBoss } from './game/useBoss'
import { useEnd } from './game/useEnd'
import { useJoin } from './game/useJoin'
import { useNext } from './game/useNext'
import { useRematch } from './game/useRematch'
import { useRemove } from './game/useRemove'
import { useReplace } from './game/useReplace'
import { useReveal } from './game/useReveal'
import { useSetup } from './game/useSetup'
import { useShow } from './game/useShow'
import { useStart } from './game/useStart'

export const useGame = (gameId?: string) => {
  const zustand = usePopStore()
  const gameStorage = useStorage((root) => root.game)

  // ── Selective sync: only Liveblocks-authoritative fields ──────────────────
  // selectedCategories, amountQuestions, capAnswers, hideQuestions,
  // showQuestions are Zustand-owned and must NOT be overwritten from
  // Liveblocks initial storage.
  useEffect(() => {
    if (!gameStorage) return

    const patch: Parameters<typeof zustand.updateGame>[0] = {
      command: gameStorage.command,
      currentQuestion: gameStorage.currentQuestion!,
      players: gameStorage.players as any,
      boss: gameStorage.boss,
      answeredQuestions: gameStorage.answeredQuestions,
      skippedQuestions: gameStorage.skippedQuestions,
      questions: gameStorage.questions as any,
      endedAt: gameStorage.endedAt,
      gameId: gameId,
    }

    // Sync amountQuestions from Liveblocks once game has started.
    // Excluded during 'idle' so the host's slider selection on new-game is not overwritten.
    if (gameStorage.command !== 'idle') {
      patch.amountQuestions = gameStorage.amountQuestions
    }

    zustand.updateGame(patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStorage])

  // ── Command handlers ───────────────────────────────────────────────────────
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

  // ── send — polymorphic, accepts string shorthand or Command object ─────────
  const send = async (commandOrType: Command | CommandType, payload?: any) => {
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

  // ── Derived state ──────────────────────────────────────────────────────────
  const showQuestionResultModal = useMemo(() => {
    if (!zustand.players.length || !zustand.currentQuestion) return false
    return zustand.players.every((player) =>
      player.answers.some((a: any) => a.questionId === zustand.currentQuestion?.id),
    )
  }, [zustand.players, zustand.currentQuestion])

  // Keep Zustand store in sync so components that read directly from usePopStore
  // (e.g. QuestionResultModal) see the correct derived value without needing
  // each page to manage their own useEffect for this.
  useEffect(() => {
    zustand.updateGame({ showQuestionResultModal })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuestionResultModal])

  // ── Merged game object ─────────────────────────────────────────────────────
  const game = {
    // Liveblocks-owned (synced above)
    command: zustand.command,
    currentQuestion: zustand.currentQuestion,
    players: zustand.players,
    boss: zustand.boss,
    answeredQuestions: zustand.answeredQuestions,
    skippedQuestions: zustand.skippedQuestions,
    endedAt: zustand.endedAt,
    // Zustand-owned (never overwritten by Liveblocks)
    selectedCategories: zustand.selectedCategories,
    amountQuestions: zustand.amountQuestions,
    capAnswers: zustand.capAnswers,
    hideQuestions: zustand.hideQuestions,
    showQuestions: zustand.showQuestions,
    me: zustand.me,
    preferences: zustand.preferences,
    gameId: zustand.gameId,
    playingOnSameDevice: zustand.playingOnSameDevice,
    gameStartedAt: zustand.gameStartedAt,
    // Derived
    showQuestionResultModal,
  }

  // ── Convenience methods promoted to the top level ─────────────────────────
  const closeModals = zustand.closeModals
  const resetGame = zustand.resetGame
  const updateGame = zustand.updateGame
  const setLocalJoinInfo = zustand.setLocalJoinInfo

  // ── escape hatch for rare cases that still need raw store access ───────────
  const escape = {
    zustand,
  }

  return { game, send, closeModals, resetGame, updateGame, setLocalJoinInfo, escape }
}

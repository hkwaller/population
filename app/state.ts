/** See docs/state-store.md for a high-level overview of this store. */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { sample, uniq, uniqBy } from 'lodash'

import { AnswerValue, Command, CommandType, Difficulty, TPlayer, TPreferences, TQuestion } from './types'
import { AnswerModes } from '@/lib/utils'
import { scoreGuess } from '@/lib/geo/score'
import { dateKeyUTC } from '@/lib/daily'

export type State = {
  addOrRemoveCategory: (category: string) => void
  addPlayer: (player: Omit<TPlayer, 'score' | 'answers'>) => void
  amountQuestions: number
  answeredQuestions: TQuestion[]
  answerQuestion: (
    id: string,
    answer: AnswerValue,
    questionId: string,
    elapsedMs?: number,
  ) => void
  boss?: string
  closeModals: () => void
  command: Command | CommandType
  currentQuestion: TQuestion
  endedAt?: string
  gameId?: string
  gameStartedAt?: string
  me?: Omit<TPlayer, 'answers' | 'score'>
  nextQuestion: (options?: { replace?: boolean }) => TQuestion | null
  players: TPlayer[]
  playingOnSameDevice: boolean
  preferences: TPreferences
  questions: TQuestion[]
  replaceQuestion: () => TQuestion
  resetGame: () => void
  selectedCategories: string[]
  /** Difficulty filter for question selection; 'all' = no filter. */
  selectedDifficulty: Difficulty | 'all'
  setLocalJoinInfo: ({
    player,
    gameId,
  }: {
    player: Omit<TPlayer, 'answers' | 'score'>
    gameId: string
  }) => void
  showQuestionResultModal: boolean
  /** Show the question text on player screens too. When false, questions are on the host screen only. */
  showQuestions: boolean
  /**
   * Per-category answer mode. Categories in INPUT_CAPABLE_CATEGORIES can be set
   * to 'input' (autocomplete typing) instead of the default multiple-choice.
   * Absent key = multiple choice.
   */
  answerModes: AnswerModes
  showScoreModal: boolean
  skippedQuestions: TQuestion[]
  /**
   * Questions already shown on this device today (per-day, resets at UTC
   * midnight). Lets successive rounds on the same host avoid repeats. Persisted
   * and intentionally NOT cleared by resetGame.
   */
  seenQuestions: { date: string; ids: string[] }
  /** Record question ids as shown; resets the set when the UTC day rolls over. */
  markQuestionsSeen: (ids: string[]) => void
  /** Ids shown today (empty once the day rolls over). */
  getSeenQuestionIds: () => string[]
  updateGame: (gameState: Partial<State>) => void
}

const initialState = {
  amountQuestions: 10,
  command: 'start',
  questions: [],
  players: [],
  showQuestions: false,
  answerModes: {},
  currentQuestion: undefined,
  answeredQuestions: [],
  selectedCategories: [],
  selectedDifficulty: 'all',
  playingOnSameDevice: false,
  skippedQuestions: [],
  showScoreModal: false,
  showQuestionResultModal: false,
  boss: undefined,
  me: undefined,
  gameStartedAt: undefined,
}

export const usePopStore = create<State>()(
  persist(
    (set, get) => ({
      amountQuestions: 10,
      questions: [],
      players: [],
      showQuestions: false,
      answerModes: {},
      boss: '',
      // @ts-ignore
      currentQuestion: undefined,
      command: 'start',
      answeredQuestions: [],
      selectedCategories: [],
      selectedDifficulty: 'all',
      playingOnSameDevice: false,
      showScoreModal: false,
      showQuestionResultModal: false,
      skippedQuestions: [],
      seenQuestions: { date: '', ids: [] },
      markQuestionsSeen: (ids: string[]) => {
        const today = dateKeyUTC(new Date())
        const current = get().seenQuestions
        const base = current.date === today ? current.ids : []
        set({ seenQuestions: { date: today, ids: uniq([...base, ...ids.filter(Boolean)]) } })
      },
      getSeenQuestionIds: () => {
        const today = dateKeyUTC(new Date())
        const current = get().seenQuestions
        return current.date === today ? current.ids : []
      },
      updateGame: (gameState: Partial<State>) => set((state) => ({ ...state, ...gameState })),
      addOrRemoveCategory: (category: string) => {
        if (get().selectedCategories.includes(category)) {
          set({ selectedCategories: get().selectedCategories.filter((c) => c !== category) })
        } else {
          set({ selectedCategories: [...get().selectedCategories, category] })
        }
      },
      setLocalJoinInfo: ({ player, gameId }) =>
        set({ me: player, gameStartedAt: new Date().toISOString(), gameId: gameId }),
      resetGame: () => set({ ...(initialState as any) }),
      answerQuestion: (id: string, answer: AnswerValue, questionId: string, elapsedMs?: number) => {
        const updatedPlayers = get().players.map((player) => {
          if (player.id === id) {
            if (!get().currentQuestion) return player
            const score = scoreGuess(get().currentQuestion, answer, elapsedMs)
            const existingAnswerIndex = player.answers.findIndex((a) => a.questionId === questionId)
            if (existingAnswerIndex !== -1) {
              player.answers[existingAnswerIndex] = {
                ...player.answers[existingAnswerIndex],
                answer: answer,
                score: score,
              }
            } else {
              player.answers.push({
                answer: answer,
                questionId: questionId,
                score: score,
              })
            }
          }
          return player
        })
        const allPlayersAnswered = updatedPlayers.every((player) =>
          player.answers.some((answer) => answer.questionId === questionId),
        )
        set({
          players: updatedPlayers,
          showQuestionResultModal: allPlayersAnswered,
        })
      },
      nextQuestion: (options?: { replace?: boolean }) => {
        const replace = options?.replace ?? false

        const excludedIds = new Set([
          ...get().answeredQuestions.filter(Boolean).map((q) => q.id),
          ...get().skippedQuestions.filter(Boolean).map((q) => q.id),
          ...(get().currentQuestion ? [get().currentQuestion!.id] : []),
        ])
        const pool = uniqBy(get().questions.filter(Boolean), 'id')
        const remaining = pool.filter((q) => !excludedIds.has(q.id))

        const question = sample(remaining) ?? null

        return question
      },
      replaceQuestion: () => {
        const question = get().nextQuestion({ replace: true })

        set({
          currentQuestion: question ?? undefined,
          players: get().players.map((player) => {
            return {
              ...player,
              answers: player.answers.filter((a) => a.questionId !== question?.id),
            }
          }),
        })

        return question!
      },
      addPlayer: (player): void => {
        set((state) => ({
          players: [
            ...state.players,
            { ...player, score: 0, answers: [], localPlayer: player.localPlayer || false },
          ],
        }))
      },
      closeModals: () => {
        set({ showQuestionResultModal: false, showScoreModal: false })
      },
    }),
    {
      name: 'population-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

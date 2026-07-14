/** See docs/state-store.md for a high-level overview of this store. */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { sample, uniqBy } from 'lodash'

import { AnswerValue, Command, CommandType, TPlayer, TPreferences, TQuestion } from './types'
import { scoreGuess } from '@/lib/geo/score'

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
  capAnswers: boolean
  closeModals: () => void
  hideQuestions: boolean
  command: Command | CommandType
  currentQuestion: TQuestion
  customQuestionCategory: string
  customQuestions?: TQuestion[]
  customQuestionsAnswered: TQuestion[]
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
  setLocalJoinInfo: ({
    player,
    gameId,
  }: {
    player: Omit<TPlayer, 'answers' | 'score'>
    gameId: string
  }) => void
  showQuestionResultModal: boolean
  showQuestions: boolean
  showScoreModal: boolean
  skippedQuestions: TQuestion[]
  updateGame: (gameState: Partial<State>) => void
}

const initialState = {
  amountQuestions: 10,
  command: 'start',
  questions: [],
  players: [],
  capAnswers: false,
  showQuestions: false,
  hideQuestions: false,
  currentQuestion: undefined,
  customQuestionsAnswered: [],
  answeredQuestions: [],
  selectedCategories: [],
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
      capAnswers: false,
      showQuestions: false,
      hideQuestions: false,
      boss: '',
      // @ts-ignore
      currentQuestion: undefined,
      command: 'start',
      answeredQuestions: [],
      selectedCategories: [],
      playingOnSameDevice: false,
      showScoreModal: false,
      showQuestionResultModal: false,
      skippedQuestions: [],
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

        if ((get().customQuestions?.length ?? 0) > 0) {
          const currentQuestionIndex =
            get().customQuestions!.findIndex(
              (question) => question.id === get().currentQuestion?.id,
            ) ?? -1

          const nextQuestion = get().customQuestions?.[currentQuestionIndex + 1]!

          return nextQuestion
        }

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

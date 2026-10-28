import type {
  AnswerPayload,
  AnswerValue,
  CommandType,
  JoinPayload,
  TPlayer,
  TQuestion,
} from '../app/types'
import type { AnswerModes } from './utils'
import { scoreGuess } from './geo/score'

export type GameState = {
  command: CommandType
  boss?: string
  hostId?: string
  owners: Record<string, string>
  currentQuestion?: TQuestion
  answeredQuestions: TQuestion[]
  skippedQuestions: TQuestion[]
  questions: TQuestion[]
  amountQuestions: number
  showQuestions: boolean
  confidenceMode: boolean
  answerModes: AnswerModes
  selectedCategories: string[]
  players: TPlayer[]
  endedAt?: string
  hostAdFree: boolean
}
export const initialRoom = (): GameState => ({
  command: 'idle',
  owners: {},
  answeredQuestions: [],
  skippedQuestions: [],
  questions: [],
  amountQuestions: 10,
  showQuestions: false,
  confidenceMode: false,
  answerModes: {},
  selectedCategories: [],
  players: [],
  hostAdFree: false,
})
type Config = Pick<
  GameState,
  | 'amountQuestions'
  | 'showQuestions'
  | 'confidenceMode'
  | 'answerModes'
  | 'selectedCategories'
  | 'hostAdFree'
>
export type Action =
  | { type: 'setup'; config: Config }
  | { type: 'start' | 'rematch'; config: Config; questions: TQuestion[] }
  | { type: 'join'; player: JoinPayload }
  | { type: 'answer'; payload: AnswerPayload }
  | { type: 'boss'; id?: string }
  | { type: 'remove'; id: string }
  | { type: 'next' | 'replace' | 'reveal' | 'show' | 'end'; questionId: string }
export type RoomMessage = { type: 'state'; state: GameState; online: string[]; ack?: string }
const record = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown, max = 120): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const strings = (v: unknown, max = 100): v is string[] =>
  Array.isArray(v) && v.length <= max && v.every((x) => typeof x === 'string' && x.length <= 200)
function config(v: unknown): Config | null {
  if (!record(v)) return null
  const modes: AnswerModes = {}
  if (record(v.answerModes))
    for (const [k, val] of Object.entries(v.answerModes)) {
      if (text(k) && k !== '__proto__' && (val === 'choice' || val === 'input')) modes[k] = val
    }
  return {
    amountQuestions: finite(v.amountQuestions)
      ? Math.max(1, Math.min(20, Math.floor(v.amountQuestions)))
      : 10,
    showQuestions: v.showQuestions === true,
    confidenceMode: v.confidenceMode === true,
    hostAdFree: v.hostAdFree === true,
    answerModes: modes,
    selectedCategories: strings(v.selectedCategories) ? v.selectedCategories : [],
  }
}
function answerValue(v: unknown): v is AnswerValue {
  return (
    finite(v) ||
    (typeof v === 'string' && v.length <= 500) ||
    strings(v) ||
    (record(v) &&
      ((finite(v.lat) && Math.abs(v.lat) <= 90 && finite(v.lng) && Math.abs(v.lng) <= 180) ||
        (strings(v.path) && strings(v.wrong))))
  )
}
function question(v: unknown): v is TQuestion {
  if (!record(v) || !text(v.id) || !text(v.category) || !text(v.question, 2000)) return false
  switch (v.type) {
    case 'slider':
      return (
        finite(v.answer) &&
        finite(v.lower_bound) &&
        finite(v.upper_bound) &&
        v.upper_bound > v.lower_bound
      )
    case 'map':
      return record(v.answer) && finite(v.answer.lat) && finite(v.answer.lng)
    case 'choice':
    case 'odd-one-out':
      return strings(v.options) && typeof v.answer === 'string'
    case 'rank':
      return (
        strings(v.answer) &&
        Array.isArray(v.items) &&
        v.items.length <= 100 &&
        v.items.every((x: unknown) => record(x) && text(x.label) && finite(x.value)) &&
        ['asc', 'desc'].includes(v.order)
      )
    case 'higher-lower':
      return (
        record(v.left) &&
        record(v.right) &&
        text(v.left.label) &&
        text(v.right.label) &&
        finite(v.left.value) &&
        finite(v.right.value) &&
        ['left', 'right'].includes(v.answer)
      )
    case 'build-up':
      return (
        strings(v.clues) && text(v.answer) && (v.acceptable === undefined || strings(v.acceptable))
      )
    case 'route':
      return text(v.from) && text(v.to) && finite(v.maxSteps) && finite(v.optimalSteps)
    default:
      return false
  }
}
/** Only these fields cross the untrusted socket boundary. */
export function parseAction(v: unknown): Action | null {
  if (!record(v)) return null
  switch (v.type) {
    case 'setup': {
      const c = config(v.config)
      return c ? { type: 'setup', config: c } : null
    }
    case 'start':
    case 'rematch': {
      const c = config(v.config)
      if (
        !c ||
        !Array.isArray(v.questions) ||
        !v.questions.length ||
        v.questions.length > 200 ||
        !v.questions.every(question)
      )
        return null
      return { type: v.type, config: c, questions: v.questions }
    }
    case 'join': {
      const p = v.player
      if (
        !record(p) ||
        !text(p.id) ||
        ['__proto__', 'constructor', 'prototype'].includes(p.id) ||
        !text(p.name, 40)
      )
        return null
      return {
        type: 'join',
        player: {
          id: p.id,
          name: p.name.trim() || 'Player',
          localPlayer: p.localPlayer === true,
          color: text(p.color) ? p.color : 'coral',
          icon: text(p.icon) ? p.icon : 'Globe',
        },
      }
    }
    case 'answer': {
      const p = v.payload
      if (!record(p) || !text(p.id) || !text(p.questionId) || !answerValue(p.answer)) return null
      return {
        type: 'answer',
        payload: {
          id: p.id,
          questionId: p.questionId,
          answer: p.answer,
          elapsedMs: finite(p.elapsedMs) ? Math.max(0, p.elapsedMs) : undefined,
          confidence: finite(p.confidence) ? Math.max(0, p.confidence) : undefined,
          cluesUsed: finite(p.cluesUsed) ? Math.max(1, Math.floor(p.cluesUsed)) : undefined,
        },
      }
    }
    case 'boss':
      return v.id === undefined || text(v.id) ? { type: 'boss', id: v.id } : null
    case 'remove':
      return text(v.id) ? { type: 'remove', id: v.id } : null
    case 'next':
    case 'replace':
    case 'reveal':
    case 'show':
    case 'end':
      return text(v.questionId) ? { type: v.type, questionId: v.questionId } : null
    default:
      return null
  }
}
export function applyAction(
  s: GameState,
  me: string,
  online: Set<string>,
  a: Action,
  random = Math.random,
): GameState {
  const host = s.hostId === me || (!!s.boss && s.owners[s.boss] === me)
  if (a.type === 'setup') {
    if (s.hostId && !host) return s
    // A repeated setup must never erase players or a running game.
    if (s.hostId) return s
    return { ...initialRoom(), ...a.config, hostId: me }
  }
  if (a.type === 'join') {
    if (!s.hostId || s.command === 'end' || s.players.some((p) => p.id === a.player.id)) return s
    if (Object.values(s.owners).includes(me) || (!host && a.player.localPlayer)) return s
    if (a.player.id.startsWith('user_') && a.player.id !== me) return s
    const p = a.player
    return {
      ...s,
      owners: { ...s.owners, [p.id]: me },
      players: [
        ...s.players,
        {
          ...p,
          localPlayer: host && p.localPlayer,
          icon: p.icon ?? 'Globe',
          answers: [],
          score: 0,
        },
      ],
    }
  }
  if (a.type === 'answer') {
    const p = a.payload,
      q = s.currentQuestion
    if (
      !q ||
      s.command === 'end' ||
      s.command === 'idle' ||
      s.command === 'reveal' ||
      s.owners[p.id] !== me ||
      p.questionId !== q.id
    )
      return s
    const player = s.players.find((x) => x.id === p.id)
    if (!player || player.answers.some((x) => x.questionId === q.id)) return s
    const valid =
      q.type === 'slider'
        ? finite(p.answer)
        : q.type === 'map'
        ? record(p.answer) && 'lat' in p.answer
        : q.type === 'rank'
        ? Array.isArray(p.answer)
        : q.type === 'route'
        ? record(p.answer) && 'path' in p.answer
        : typeof p.answer === 'string'
    if (!valid) return s
    const confidence = s.confidenceMode ? p.confidence : undefined
    const score = scoreGuess(q, p.answer, p.elapsedMs, { confidence, cluesUsed: p.cluesUsed })
    if (!Number.isFinite(score)) return s
    return {
      ...s,
      players: s.players.map((x) =>
        x.id !== p.id
          ? x
          : {
              ...x,
              answers: [...x.answers, { questionId: q.id, answer: p.answer, score, confidence }],
            },
      ),
    }
  }
  if (!host) return s
  if (a.type === 'boss') {
    if (a.id && !s.players.some((p) => p.id === a.id)) return s
    return a.id === s.boss ? s : { ...s, boss: a.id }
  }
  if (a.type === 'remove') {
    if (!s.players.some((p) => p.id === a.id)) return s
    const owners = { ...s.owners }
    delete owners[a.id]
    return {
      ...s,
      owners,
      players: s.players.filter((p) => p.id !== a.id),
      boss: s.boss === a.id ? undefined : s.boss,
    }
  }
  if (a.type === 'start' || a.type === 'rematch') {
    if (!s.players.length || (a.type === 'start' ? s.command !== 'idle' : s.command !== 'end'))
      return s
    const questions = a.questions.filter((q, i, all) => all.findIndex((x) => x.id === q.id) === i)
    return {
      ...s,
      ...a.config,
      command: a.type,
      questions,
      currentQuestion: questions[0],
      answeredQuestions: [],
      skippedQuestions: [],
      endedAt: undefined,
      players: s.players.map((p) => ({ ...p, answers: [], score: 0 })),
    }
  }
  if (!('questionId' in a)) return s
  if (
    !s.currentQuestion ||
    s.command === 'idle' ||
    s.command === 'end' ||
    a.questionId !== s.currentQuestion.id
  )
    return s
  if (a.type === 'reveal' || a.type === 'show') return { ...s, command: a.type }
  if (a.type === 'end')
    return {
      ...s,
      command: 'end',
      endedAt: new Date().toISOString(),
      answeredQuestions: [...s.answeredQuestions, s.currentQuestion],
      players: s.players.map((p) => ({
        ...p,
        score: p.answers.reduce((sum, x) => sum + x.score, 0),
      })),
    }
  const excluded = new Set(
    [...s.answeredQuestions, ...s.skippedQuestions, s.currentQuestion].map((q) => q.id),
  )
  const pool = s.questions.filter((q) => !excluded.has(q.id))
  if (!pool.length) return s
  const currentQuestion = pool[Math.floor(random() * pool.length)]
  return {
    ...s,
    command: a.type,
    currentQuestion,
    answeredQuestions:
      a.type === 'next' ? [...s.answeredQuestions, s.currentQuestion] : s.answeredQuestions,
    skippedQuestions:
      a.type === 'replace' ? [...s.skippedQuestions, s.currentQuestion] : s.skippedQuestions,
  }
}

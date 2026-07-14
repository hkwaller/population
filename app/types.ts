import { icons } from './icons'

export type LatLng = { lat: number; lng: number }

/**
 * A player's raw guess: a number (slider), a chosen option string (choice), a
 * point (map), or an ordered list of labels (rank).
 */
export type AnswerValue = number | string | LatLng | string[]

/** How a question's stimulus is presented. Defaults to plain text when omitted. */
export type PromptSpec =
  | { kind: 'text'; text: string }
  | { kind: 'flag'; code: string } // ISO cca2/cca3 → flag asset
  | { kind: 'outline'; code: string } // render country silhouette from geometry
  | { kind: 'borders'; codes: string[] } // "which country borders these?"

export type QuestionType = 'slider' | 'choice' | 'map' | 'rank'

/** Difficulty bucket derived from country "fame" (Wikipedia pageviews). */
export type Difficulty = 'easy' | 'medium' | 'hard'

type QuestionBase = {
  id: string
  category: string
  /** Human-readable question text (also used for a11y and text prompts). */
  question: string
  /** Optional rich stimulus; when omitted the UI falls back to `question` text. */
  prompt?: PromptSpec
  /** 0..1 difficulty from country fame; higher = more obscure. Optional (AI/custom questions omit it). */
  difficulty?: number
  /** Coarse difficulty bucket for filtering/labelling. */
  tier?: Difficulty
}

export type SliderQuestion = QuestionBase & {
  type: 'slider'
  answer: number
  lower_bound: number
  upper_bound: number
  unit?: string
}

export type ChoiceQuestion = QuestionBase & {
  type: 'choice'
  options: string[]
  answer: string
}

export type MapQuestion = QuestionBase & {
  type: 'map'
  answer: LatLng
  /** Distance (km) at which score reaches 0. Defaults to MAP_FALLOFF_KM. */
  falloffKm?: number
  /**
   * Numeric ISO country code (ccn3) of the target. Used to point-in-polygon test a
   * guess against the country's real borders — land anywhere inside = full marks.
   */
  ccn3?: string
}

/** One orderable item in a rank question, carrying the metric it's sorted by. */
export type RankItem = { label: string; value: number }

export type RankQuestion = QuestionBase & {
  type: 'rank'
  /** Items in their presented (shuffled) order. */
  items: RankItem[]
  /** Correct ordering of the item labels ('desc' = largest value first). */
  answer: string[]
  order: 'asc' | 'desc'
  /** Display unit for the metric (e.g. "people"). */
  unit?: string
}

export type TQuestion = SliderQuestion | ChoiceQuestion | MapQuestion | RankQuestion

type Answer = {
  answer: AnswerValue
  score: number
  questionId: string
}

export type TPlayer = {
  name: string
  score: number
  answers: Answer[]
  id: string
  color?: string
  localPlayer?: boolean
  icon: string
  overall_score?: number
  bullseyes?: number
  games_played?: number
  multiPlayerGames?: number
  wins?: number
  game_average?: number
  display_name?: string
  preferred_color?: string
}

export type AnswerPayload = {
  id: string // player id
  answer: AnswerValue
  questionId: string
  /** ms from question shown to answer locked; drives the choice speed bonus. */
  elapsedMs?: number
}

export type BossPayload = any // Refine later if structure is known

export type JoinPayload = {
  id: string
  name: string
  color?: string
  icon?: string
  localPlayer: boolean
  gameId?: string
}

export type RemovePayload = string // player ID

export type StartPayload = Partial<TGame> // Refine later if more specific

export type CommandType =
  | 'answer'
  | 'boss'
  | 'end'
  | 'idle'
  | 'join'
  | 'next'
  | 'rematch'
  | 'remove'
  | 'replace'
  | 'reveal'
  | 'setup'
  | 'show'
  | 'start'

export type Command =
  | { type: 'answer'; payload: AnswerPayload }
  | { type: 'boss'; payload: BossPayload }
  | { type: 'end' }
  | { type: 'idle' }
  | { type: 'join'; payload: JoinPayload }
  | { type: 'next' }
  | { type: 'rematch' }
  | { type: 'remove'; payload: RemovePayload }
  | { type: 'replace' }
  | { type: 'reveal' }
  | { type: 'setup' }
  | { type: 'show' }
  | { type: 'start'; payload: StartPayload }

export type TGame = {
  id?: string
  gameId: string
  finished_at: string
  created_at: string
  winner: TPlayer
  players: TPlayer[]
  categories: string | string[]
  amountQuestions: number
  capAnswers: boolean
  showQuestions: boolean
  questions: TQuestion[]
}

export type TPreferences = {
  preferred_color: string
  icon: string
  display_name: string
}

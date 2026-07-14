'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sampleSize, uniq } from 'lodash'
import { motion } from 'motion/react'
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react'

import { usePopStore } from '../../state'
import { generateQuestions, formatAnswerValue } from '@/lib/utils'
import { useSupabase } from '@/hooks/useSupabase'
import { useGame } from '@/hooks/useGame'
import { GameRoomProvider } from '@/app/providers'
import { TQuestion } from '@/app/types'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopHeader, PopAuth } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { POP } from '@/app/components/pop/theme'

const LOADING_MESSAGES = [
  'Consulting the trivia oracle…',
  'Brewing up brain teasers…',
  'Summoning obscure knowledge…',
  'Crafting devious questions…',
  'Almost ready…',
]

function GenerateContent({ params }: { params: { gameId: string } }) {
  const { updateGame, amountQuestions, customQuestionsAnswered } = usePopStore()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [generatedQuestions, setGeneratedQuestions] = useState<TQuestion[]>([])
  const [msgIndex, setMsgIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()
  const { fetchUniqueCategories, postQuestionsToSupabase } = useSupabase()
  const { send } = useGame(params.gameId)

  useEffect(() => {
    async function getCategories() {
      const unique = await fetchUniqueCategories()
      setCategories(unique.filter(Boolean))
    }
    getCategories()
  }, [fetchUniqueCategories])

  useEffect(() => {
    if (isLoading) {
      setMsgIndex(0)
      intervalRef.current = setInterval(() => setMsgIndex((p) => (p + 1) % LOADING_MESSAGES.length), 1800)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLoading])

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setIsLoading(true)
    setStatus('idle')
    setErrorMessage('')
    setGeneratedQuestions([])
    try {
      const data = await generateQuestions(prompt, amountQuestions, customQuestionsAnswered)
      if (data.error) {
        setErrorMessage(data.error)
        setStatus('error')
        return
      }
      await postQuestionsToSupabase(data.questions)
      setGeneratedQuestions(data.questions)
      setStatus('success')
      updateGame({
        customQuestions: data.questions,
        customQuestionCategory: data.category,
        customQuestionsAnswered: [],
        currentQuestion: data.questions[0],
        amountQuestions: data.questions.length,
      })
    } catch (e) {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const exampleCategories = useMemo(() => sampleSize(uniq(categories), 6), [categories])

  return (
    <PopShell bg={POP.grape}>
      <PopHeader logoTextColor={POP.grape} right={<PopAuth tone="light" />} />

      <div className="mx-auto max-w-3xl px-5 pb-24 pt-6 md:pt-10">
        <h1
          className="text-center font-black tracking-[-0.02em] text-white"
          style={{ fontSize: 'clamp(48px, 9vw, 72px)', rotate: '-1.5deg' }}
        >
          Make it personal
        </h1>
        <p className="mt-4 text-center text-xl font-bold text-white/80">
          Pick a topic and we&apos;ll spin up {amountQuestions} number-answer questions.
        </p>

        {/* Input pill */}
        <div className="mt-10 flex items-center gap-2 rounded-pill bg-white p-2 pl-6">
          <input
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              if (status !== 'idle') setStatus('idle')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="90s pop music, ancient Rome, Taylor Swift…"
            className="min-w-0 flex-1 bg-transparent text-xl font-black text-pop-ink outline-none placeholder:text-[rgba(23,18,20,0.35)]"
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="flex shrink-0 items-center gap-2 rounded-pill bg-pop-ink px-6 py-3.5 text-lg font-black text-white disabled:opacity-40"
          >
            <Sparkles size={20} /> Generate
          </button>
        </div>

        {/* Example categories */}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {exampleCategories.map((c, i) =>
            c ? (
              <button
                key={i}
                onClick={() => setPrompt(c)}
                className="rounded-pill border-2 border-white px-4 py-2 text-sm font-black text-white"
              >
                {c}
              </button>
            ) : null,
          )}
        </div>

        {status === 'error' && (
          <div className="mt-8 rounded-2xl px-5 py-4 text-center text-lg font-black text-white" style={{ background: POP.coral }}>
            {errorMessage || 'Generation failed. Try again.'}
          </div>
        )}

        {/* Cards / loading ghosts */}
        <div className="mt-8 flex flex-col gap-4">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[28px] bg-white/30 px-6 py-8" />
            ))}

          {!isLoading &&
            generatedQuestions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: i % 2 ? 0.8 : -0.8 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between gap-4 rounded-[28px] bg-white px-6 py-5 shadow-pop"
              >
                <p className="text-[21px] font-extrabold text-pop-ink">{q.question}</p>
                <span
                  className="shrink-0 rounded-pill border-2 border-pop-ink px-4 py-1.5 text-lg font-black text-pop-ink"
                  style={{ background: POP.sunshine }}
                >
                  ans: {formatAnswerValue(q.answer)}
                </span>
              </motion.div>
            ))}
        </div>

        {isLoading && (
          <p className="mt-6 text-center text-lg font-bold text-white/80">{LOADING_MESSAGES[msgIndex]}</p>
        )}

        {status === 'success' && generatedQuestions.length > 0 && (
          <div className="mt-10 flex justify-center">
            <PopButton
              variant="secondary"
              size="lg"
              rotate={-1}
              onClick={() => {
                updateGame({ players: [], selectedCategories: [] })
                send('setup')
                router.push(`/setup/${params.gameId}`)
              }}
            >
              Use these {generatedQuestions.length} <ArrowRight size={24} />
            </PopButton>
          </div>
        )}
      </div>
    </PopShell>
  )
}

export default function Generate({ params }: { params: Promise<{ gameId: string }> }) {
  const resolvedParams = React.use(params)
  return (
    <GameRoomProvider gameId={resolvedParams.gameId}>
      <GenerateContent params={resolvedParams} />
    </GameRoomProvider>
  )
}

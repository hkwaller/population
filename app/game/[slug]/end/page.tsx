'use client'

import React, { createElement, useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import { icons } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

import { QuestionResult } from '@/app/components/QuestionResult'
import { useGame } from '@/hooks/useGame'
import { GameRoomProvider } from '@/app/providers'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopHeader, PopAuth } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { POP, stickerFill } from '@/app/components/pop/theme'

const EndPageContent = ({ slug }: { slug: string }) => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { game, send } = useGame(slug)
  const { players, answeredQuestions, command, boss, me } = game
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (command === 'rematch') {
      if (!me || me.localPlayer) router.push(`/game/${slug}`)
      else router.push(`/game/${slug}/${me.id}`)
    }
  }, [command, slug, me, router])

  // Highest total wins (closest / correct + fastest across the game).
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winner = sorted[0]
  const canRematch = boss === me?.id || !me

  return (
    <PopShell bg={POP.grape}>
      {size.width > 0 && (
        <Confetti width={size.width} height={size.height} recycle={false} numberOfPieces={400} />
      )}
      <PopHeader logoTextColor={POP.grape} right={<PopAuth tone="light" />} />

      <div className="mx-auto max-w-4xl px-5 pb-24 pt-6 text-center md:pt-10">
        <motion.h1
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="pop-textshadow font-black leading-[0.9] tracking-[-0.02em] text-white"
          style={{ fontSize: 'clamp(64px, 14vw, 130px)' }}
        >
          {winner?.name ?? 'Someone'} wins!
        </motion.h1>

        {winner && (
          <span
            className="mt-6 inline-block rounded-pill border-4 border-white px-6 py-3 text-xl font-black text-pop-ink"
            style={{ background: POP.sunshine }}
          >
            {winner.score} points · highest score
          </span>
        )}

        {/* Ranking cards, staggered downward */}
        <div className="mt-14 flex flex-wrap items-start justify-center gap-5">
          {sorted.map((player, index) => {
            const Icon = icons[player.icon as keyof typeof icons]
            return (
              <motion.div
                key={player.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.08 }}
                className="flex w-[200px] flex-col items-center gap-2 rounded-[28px] bg-white p-5 shadow-pop-card"
                style={{ marginTop: [0, 40, 70, 95][index] ?? 110 }}
              >
                <span className="text-3xl font-black" style={{ color: POP.grape }}>
                  #{index + 1}
                </span>
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-pop-ink"
                  style={{ background: stickerFill(player.color) }}
                >
                  {Icon && createElement(Icon, { size: 30, className: 'text-pop-ink' })}
                </div>
                <span className="text-2xl font-black text-pop-ink">{player.name}</span>
                <span className="text-lg font-bold text-pop-ink/60">{player.score} pts</span>
              </motion.div>
            )
          })}
        </div>

        {/* CTAs */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          {canRematch && (
            <PopButton
              variant="secondary"
              size="lg"
              rotate={-1}
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                await send('rematch')
                setLoading(false)
              }}
            >
              {loading ? 'Loading…' : 'Rematch!'}
            </PopButton>
          )}
          <PopButton variant="ghostLight" size="lg" rotate={1} onClick={() => setShowBreakdown((s) => !s)}>
            {showBreakdown ? 'Hide breakdown' : 'Round by round'}
          </PopButton>
        </div>

        {/* Breakdown */}
        {showBreakdown && (
          <div className="mt-12 flex flex-col gap-8">
            {answeredQuestions.map((question, qIndex) => {
              const hasAnswers = players.some((p) => p.answers.find((a) => a.questionId === question.id))
              if (!hasAnswers) return null
              const sortedForQ = [...players].sort((a, b) => {
                const aA = a.answers.find((ans) => ans.questionId === question.id)
                const bA = b.answers.find((ans) => ans.questionId === question.id)
                return (bA?.score || 0) - (aA?.score || 0)
              })
              return <QuestionResult key={question.id} players={sortedForQ} question={question} index={qIndex} />
            })}
          </div>
        )}
      </div>
    </PopShell>
  )
}

export default function EndPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  return (
    <GameRoomProvider gameId={slug}>
      <EndPageContent slug={slug} />
    </GameRoomProvider>
  )
}

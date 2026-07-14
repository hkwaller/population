'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Confetti from 'react-confetti'
import CountUp from 'react-countup'
import { ArrowRight, ListEnd } from 'lucide-react'

import { useIshStore } from '../state'
import { PlayerResult } from './PlayerResult'
import { useSupabase } from '@/hooks/useSupabase'
import { asSlider, formatAnswerValue } from '@/lib/utils'
import { Command, CommandType } from '../types'
import { PopButton } from './pop/PopButton'
import { POP } from './pop/theme'

type SendFn = (commandOrType: Command | CommandType, payload?: any) => Promise<void> | void

// Full-screen reveal takeover (replaces the old modal). Sunshine background.
export default function QuestionResultModal({
  canEndGame,
  send,
}: {
  canEndGame: boolean
  send?: SendFn
}) {
  const { currentQuestion, updateGame, players, boss, me, showQuestionResultModal } = useIshStore()
  const { postGameToSupabase } = useSupabase()
  const [isEnding, setIsEnding] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const isBoss = boss === me?.id
  const showControls = isBoss || (players.filter((p) => p.localPlayer).length === 0 && !me)

  const ranked = players
    .map((player) => ({
      player,
      answer: player.answers.find((a) => a.questionId === currentQuestion?.id),
    }))
    .filter(({ answer }) => answer !== undefined)
    // Highest score is best (closest / correct + fastest), so rank descending.
    .sort((a, b) => (b.answer?.score || 0) - (a.answer?.score || 0))

  return (
    <AnimatePresence>
      {showQuestionResultModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pop-scroll fixed inset-0 z-50 overflow-y-auto"
          style={{ background: POP.sunshine }}
        >
          {size.width > 0 && (
            <Confetti width={size.width} height={size.height} recycle={false} numberOfPieces={280} />
          )}

          <div className="mx-auto flex min-h-full max-w-4xl flex-col items-center px-5 py-12 text-center">
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="rounded-pill bg-pop-ink px-6 py-3 text-xl font-black text-white md:text-2xl"
            >
              The answer was…
            </motion.span>

            <motion.div
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.15 }}
              className="mt-8 w-full max-w-2xl rounded-[48px] bg-white px-6 py-10 shadow-pop-card"
            >
              <span
                className="block font-black leading-none tracking-[-0.03em]"
                style={{ color: POP.coral, fontSize: 'clamp(80px, 20vw, 180px)' }}
              >
                {asSlider(currentQuestion) ? (
                  <CountUp end={asSlider(currentQuestion)!.answer} duration={0.7} separator="," />
                ) : (
                  formatAnswerValue(currentQuestion?.answer)
                )}
              </span>
              <p className="mt-4 text-lg font-bold text-pop-ink/60 md:text-xl">
                {currentQuestion?.question}
              </p>
            </motion.div>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              {ranked.map(({ player, answer }, index) => (
                <PlayerResult
                  key={player.id}
                  index={index}
                  player={player}
                  score={answer?.score || 0}
                  answer={answer?.answer}
                  isClosest={index === 0}
                />
              ))}
            </div>

            {showControls && (
              <div className="mt-12">
                {canEndGame ? (
                  <PopButton
                    variant="primary"
                    size="lg"
                    rotate={-1}
                    disabled={isEnding}
                    onClick={async () => {
                      setIsEnding(true)
                      postGameToSupabase()
                      await send?.('end')
                    }}
                  >
                    {isEnding ? 'Ending…' : <>See the results <ListEnd size={24} /></>}
                  </PopButton>
                ) : (
                  <PopButton variant="primary" size="lg" rotate={-1} onClick={() => send?.('next')}>
                    Next question <ArrowRight size={24} />
                  </PopButton>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Confetti from 'react-confetti'
import CountUp from 'react-countup'
import { ArrowRight, ListEnd } from 'lucide-react'

import { usePopStore } from '../state'
import { PlayerResult } from './PlayerResult'
import { useSupabase } from '@/hooks/useSupabase'
import { asSlider, formatAnswerValue } from '@/lib/utils'
import { AnswerValue, Command, CommandType, LatLng, TQuestion } from '../types'
import { DockButton } from './pop/Dock'
import { POP, stickerFill } from './pop/theme'
import { WorldMap, type MapPin } from './geo/WorldMap'
import { RankReveal } from './geo/RankReveal'
import { HigherLower } from './geo/HigherLower'
import { RouteReveal } from './geo/RouteReveal'
import { byName } from '@/lib/geo/countries'
import { AdsterraBanner } from './AdsterraBanner'

type SendFn = (commandOrType: Command | CommandType, payload?: any) => Promise<void> | void

// Full-screen reveal takeover (replaces the old modal). Sunshine background.
export default function QuestionResultModal({
  canEndGame,
  send,
  adsSuppressed = false,
}: {
  canEndGame: boolean
  send?: SendFn
  /** Hide the ad banner (local user is ad-free, or the host is - see useInGameAdsSuppressed). */
  adsSuppressed?: boolean
}) {
  const { currentQuestion, updateGame, players, boss, me, showQuestionResultModal } = usePopStore()
  const { postGameToSupabase } = useSupabase()
  const [isEnding, setIsEnding] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Freeze the question we're revealing. When the host taps "Next", the store's
  // currentQuestion advances immediately while this modal is still fading out via
  // AnimatePresence - without freezing, the exit animation would re-render with
  // the *next* question and flash its answer (e.g. the country name of the flag
  // that's about to appear). We only update this while the reveal is showing.
  const [revealed, setRevealed] = useState(currentQuestion)
  useEffect(() => {
    if (showQuestionResultModal && currentQuestion) setRevealed(currentQuestion)
  }, [showQuestionResultModal, currentQuestion])

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const isBoss = boss === me?.id
  const showControls = isBoss || (players.filter((p) => p.localPlayer).length === 0 && !me)

  // Size the big answer to fit the card - long numbers (populations, areas)
  // would otherwise overflow horizontally.
  const answerText = asSlider(revealed)
    ? asSlider(revealed)!.answer.toLocaleString()
    : revealed && 'answer' in revealed
      ? formatAnswerValue((revealed as { answer?: AnswerValue }).answer)
      : ''
  const answerFontSize = `min(${Math.floor(640 / Math.max(answerText.length, 3))}px, 16vw)`

  const ranked = players
    .map((player) => ({
      player,
      answer: player.answers.find((a) => a.questionId === revealed?.id),
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
            <Confetti
              width={size.width}
              height={size.height}
              recycle={false}
              numberOfPieces={280}
            />
          )}

          <div className="mx-auto flex min-h-full max-w-4xl flex-col items-center px-5 pt-12 pb-32 text-center">
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
              {revealed?.type === 'map' ? (
                <div className="overflow-hidden rounded-[24px] border-4 border-pop-ink">
                  <WorldMap
                    answer={revealed.answer}
                    pins={
                      ranked
                        .map(({ player, answer }) =>
                          answer && typeof answer.answer === 'object'
                            ? { point: answer.answer as LatLng, color: stickerFill(player.color) }
                            : null,
                        )
                        .filter(Boolean) as MapPin[]
                    }
                    interactive={false}
                  />
                </div>
              ) : revealed?.type === 'rank' ? (
                <RankReveal question={revealed} />
              ) : revealed?.type === 'route' ? (
                <RouteReveal question={revealed} />
              ) : revealed?.type === 'higher-lower' ? (
                <HigherLower question={revealed} reveal />
              ) : revealed?.type === 'odd-one-out' ? (
                <div className="flex flex-col items-center gap-3">
                  <span
                    className="block font-black leading-none tracking-[-0.03em]"
                    style={{
                      color: POP.coral,
                      fontSize: `min(${Math.floor(640 / Math.max(revealed.answer.length, 3))}px, 12vw)`,
                    }}
                  >
                    {revealed.answer}
                  </span>
                  <p className="text-base font-bold text-pop-ink/70 md:text-lg">
                    The odd one out - the others {revealed.sharedProperty}.
                  </p>
                </div>
              ) : revealed?.type === 'build-up' ? (
                <div className="flex flex-col items-center gap-3">
                  <span
                    className="block font-black leading-none tracking-[-0.03em]"
                    style={{
                      color: POP.coral,
                      fontSize: `min(${Math.floor(640 / Math.max(revealed.answer.length, 3))}px, 12vw)`,
                    }}
                  >
                    {revealed.answer}
                  </span>
                  <ul className="mt-2 flex flex-col gap-1 text-left">
                    {revealed.clues.map((clue, i) => (
                      <li key={i} className="text-sm font-bold text-pop-ink/60 md:text-base">
                        <span className="mr-1 text-pop-ink/30">{i + 1}.</span>
                        {clue}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <span
                  className="block font-black leading-none tracking-[-0.03em]"
                  style={{ color: POP.coral, fontSize: answerFontSize, whiteSpace: 'nowrap' }}
                >
                  {asSlider(revealed) ? (
                    <CountUp end={asSlider(revealed)!.answer} duration={0.7} separator="," />
                  ) : (
                    formatAnswerValue(revealed?.answer)
                  )}
                </span>
              )}
              <p className="mt-4 text-lg font-bold text-pop-ink/60 md:text-xl">
                {revealed?.question}
              </p>
              {revealed && <PopulationCompare question={revealed} />}
            </motion.div>

            <div className="mt-12 flex flex-wrap justify-center gap-5">
              {ranked.map(({ player, answer }, index) => (
                <PlayerResult
                  key={player.id}
                  index={index}
                  player={player}
                  score={answer?.score || 0}
                  answer={answer?.answer}
                  question={revealed}
                  isClosest={index === 0}
                />
              ))}
            </div>

            {!adsSuppressed && (
              <div className="mt-12 w-full">
                <AdsterraBanner />
              </div>
            )}
          </div>

          {/* Pinned control so the host never has to scroll past the player
              results + ad to advance. Mirrors the in-game Dock, on the reveal's
              own z-50 layer. */}
          {showControls && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.2 }}
              className="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center px-4"
            >
              <div className="pointer-events-auto flex items-center gap-2 rounded-pill border-[3px] border-white bg-pop-ink/95 p-2 shadow-pop-card backdrop-blur">
                {canEndGame ? (
                  <DockButton
                    onClick={async () => {
                      setIsEnding(true)
                      postGameToSupabase()
                      await send?.('end')
                    }}
                    label={isEnding ? 'Ending…' : 'See the results'}
                    tone="primary"
                    disabled={isEnding}
                  >
                    <ListEnd size={18} strokeWidth={2.75} />
                  </DockButton>
                ) : (
                  <DockButton onClick={() => send?.('next')} label="Next question" tone="primary">
                    <ArrowRight size={18} strokeWidth={2.75} />
                  </DockButton>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * For "which has the larger population?" choice questions, list every option with
 * its actual population (answer highlighted) so players learn the real numbers,
 * not just which name was right. No-op for any other question.
 */
function PopulationCompare({ question }: { question: TQuestion }) {
  if (question.type !== 'choice' || question.category !== 'which-bigger') return null
  const rows = question.options
    .map((name) => {
      const pop = byName.get(name)?.population
      return pop != null ? { name, pop } : null
    })
    .filter(Boolean) as { name: string; pop: number }[]
  if (rows.length < 2) return null
  rows.sort((a, b) => b.pop - a.pop)

  return (
    <div className="mt-6 flex flex-col gap-2">
      {rows.map(({ name, pop }) => {
        const isAnswer = name === question.answer
        return (
          <div
            key={name}
            className="flex items-center justify-between rounded-pill border-2 border-pop-ink px-4 py-2.5 text-left"
            style={{ background: isAnswer ? POP.mint : '#fff' }}
          >
            <span className="text-base font-black text-pop-ink md:text-lg">{name}</span>
            <span className="text-base font-black tabular-nums text-pop-ink md:text-lg">
              {pop.toLocaleString('en-US')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

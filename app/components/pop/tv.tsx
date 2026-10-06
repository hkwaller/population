'use client'

import { createElement, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { icons } from 'lucide-react'

import { usePopStore } from '@/app/state'
import { POP, stickerFill } from './theme'

/**
 * The TV view (`?view=tv`) is laid out on a 1280×720 stage and zoomed to fill
 * the screen, so a 1080p TV gets everything at 1.5× instead of a phone-sized
 * column in the middle. `height` is the screen height in stage pixels, for a
 * full-height layout (a TV can't scroll).
 */
const STAGE = { width: 1280, height: 720 }

export function useTvStage(tv: boolean): { zoom: number; height: number } | null {
  const [stage, setStage] = useState<{ zoom: number; height: number } | null>(null)
  useEffect(() => {
    if (!tv) return
    const update = () => {
      const zoom = Math.max(
        1,
        Math.min(window.innerWidth / STAGE.width, window.innerHeight / STAGE.height),
      )
      setStage({ zoom, height: window.innerHeight / zoom })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [tv])
  return tv ? stage : null
}

/** TV sidebar: everyone ranked by score, re-sorting with a slide as points land. */
export function TvScoreboard() {
  const { players, currentQuestion, command } = usePopStore()

  // Same rule as the player stickers: this round's points count once revealed.
  const rows = players
    .map((p) => ({
      player: p,
      locked: p.answers?.some((a) => a.questionId === currentQuestion?.id),
      score: (p.answers ?? []).reduce(
        (acc, a) =>
          a.questionId === currentQuestion?.id && command !== 'show' ? acc : acc + (a.score || 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)

  return (
    <ol className="flex w-full flex-col gap-2.5">
      {rows.map(({ player, locked, score }, i) => {
        const Icon = icons[player.icon as keyof typeof icons]
        return (
          <motion.li
            key={player.id}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex items-center gap-3 rounded-[22px] border-[3px] border-white bg-white/95 py-2 pl-3 pr-4 shadow-pop"
          >
            <span className="w-7 text-center text-xl font-black text-pop-ink/40">{i + 1}</span>
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-pop-ink"
              style={{ background: stickerFill(player.color) }}
            >
              {Icon &&
                createElement(Icon, { size: 22, strokeWidth: 2.5, className: 'text-pop-ink' })}
            </span>
            <span className="min-w-0 flex-1 truncate text-xl font-black text-pop-ink">
              {player.name}
            </span>
            {locked && command !== 'show' && (
              <span
                className="rounded-pill px-2 py-0.5 text-xs font-black text-white"
                style={{ background: POP.mint }}
              >
                ✓
              </span>
            )}
            <span className="text-2xl font-black tabular-nums text-pop-ink">{score}</span>
          </motion.li>
        )
      })}
    </ol>
  )
}

'use client'

import React, { createElement, useEffect, useState } from 'react'
import { icons } from 'lucide-react'
import { motion } from 'motion/react'

import { useSupabase } from '@/hooks/useSupabase'
import { TPlayer } from '../types'
import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { POP, stickerFill } from '../components/pop/theme'

type SortOption = 'overall' | 'perGame' | 'bullseyes'

const TABS: { id: SortOption; label: string }[] = [
  { id: 'overall', label: 'Lowest scores' },
  { id: 'perGame', label: 'Points per game' },
  { id: 'bullseyes', label: 'Most bullseyes' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function Highscores() {
  const [sortOption, setSortOption] = useState<SortOption>('overall')
  const { getHighscores } = useSupabase()
  const [highScores, setHighScores] = useState<TPlayer[]>([])

  useEffect(() => {
    async function fetch() {
      const data = await getHighscores()
      setHighScores(data as any)
    }
    fetch()
  }, [getHighscores])

  const scoreFor = (player: TPlayer) => {
    if (sortOption === 'overall') return `${player.overall_score ?? 0} pts`
    if (sortOption === 'perGame')
      return `${((player.overall_score || 0) / (player.games_played || 1)).toFixed(1)} /game`
    return `${player.bullseyes ?? 0} 🎯`
  }

  return (
    <PopShell bg={POP.paper}>
      <PopHeader logoTextColor={POP.coral} right={<PopAuth tone="dark" />} />

      <div className="mx-auto max-w-3xl px-5 pb-24 pt-6 md:pt-10">
        <h1
          className="text-center font-black tracking-[-0.02em] text-pop-ink"
          style={{ fontSize: 'clamp(48px, 9vw, 72px)', rotate: '-1.5deg' }}
        >
          Hall of fame
        </h1>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {TABS.map((tab) => {
            const active = sortOption === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSortOption(tab.id)}
                className={`rounded-pill px-5 py-2.5 text-lg font-black ${
                  active ? 'bg-pop-ink text-white' : 'bg-white text-pop-ink shadow-pop-sm'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Rows */}
        <div className="mt-10 flex flex-col gap-4">
          {highScores.map((player, index) => {
            const Icon = icons[player.icon as keyof typeof icons]
            const isFirst = index === 0
            return (
              <motion.div
                key={player.id ?? index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="mx-auto flex w-full max-w-[820px] items-center gap-4 rounded-[28px] bg-white px-5 py-4 shadow-pop"
                style={{
                  rotate: index % 2 === 0 ? '-1deg' : '1deg',
                  background: isFirst ? POP.sunshine : '#fff',
                  border: isFirst ? '4px solid #171214' : undefined,
                }}
              >
                <span className="w-9 shrink-0 text-center text-2xl font-black text-pop-ink/40">
                  {MEDALS[index] ?? index + 1}
                </span>
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-pop-ink"
                  style={{ background: stickerFill(player.preferred_color) }}
                >
                  {Icon && createElement(Icon, { size: 24, className: 'text-pop-ink' })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[28px] font-black leading-tight text-pop-ink">
                    {player.display_name}
                  </div>
                  <div className="text-sm font-bold text-pop-ink/55">{player.games_played} games</div>
                </div>
                <span className="shrink-0 rounded-pill bg-pop-ink px-4 py-2 text-lg font-black text-white">
                  {scoreFor(player)}
                </span>
              </motion.div>
            )
          })}
          {highScores.length === 0 && (
            <p className="text-center text-xl font-bold text-pop-ink/50">No scores yet — go make history.</p>
          )}
        </div>
      </div>
    </PopShell>
  )
}

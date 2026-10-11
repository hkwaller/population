'use client'

import { createElement } from 'react'
import { motion } from 'motion/react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import CountUp from 'react-countup'
import { icons, Check } from 'lucide-react'

import { usePopStore } from '../state'
import { TPlayer, Command, CommandType } from '../types'
import { stickerFill, POP } from './pop/theme'

type SendFn = (commandOrType: Command | CommandType, payload?: any) => Promise<void> | void

export const Player = ({
  id,
  name,
  icon,
  color,
  index,
  showScore = false,
  setBoss,
  send,
}: {
  id: string
  index?: number
  showScore?: boolean
  setBoss?: () => void
  send?: SendFn
} & Omit<TPlayer, 'answers' | 'score'>) => {
  const { boss, currentQuestion, command } = usePopStore()

  const answers = usePopStore((state) => state.players.find((p) => p.id === id))?.answers
  const hasAnsweredCurrentQuestion = answers?.some((a) => a.questionId === currentQuestion?.id)
  const isHost = id === boss

  const score = answers?.reduce((acc, cur) => {
    if (cur.questionId === currentQuestion?.id) {
      return command === 'show' ? acc + cur.score : acc
    }
    return acc + cur.score
  }, 0)

  const Icon = icons[icon as keyof typeof icons]
  // In-game a sticker dims until its player has locked in.
  const dim = showScore && !hasAnsweredCurrentQuestion

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setBoss?.()}
          className="relative inline-flex min-w-[128px] cursor-pointer flex-col items-center gap-1 rounded-sticker border-4 border-white px-5 py-4 shadow-pop"
          style={{ background: stickerFill(color), opacity: dim ? 0.55 : 1 }}
        >
          {isHost && (
            <span
              className="absolute -right-3 -top-3 rounded-pill bg-pop-ink px-2.5 py-1 text-xs font-black"
              style={{ color: POP.sunshine }}
            >
              HOST
            </span>
          )}

          <div className="flex items-center gap-2">
            {Icon && createElement(Icon, { size: 26, strokeWidth: 2.5, className: 'text-pop-ink' })}
            <span className="text-2xl font-black text-pop-ink">{name}</span>
          </div>

          {showScore && (
            <CountUp
              start={0}
              end={score || 0}
              className="text-3xl font-black text-pop-ink"
              duration={0.5 * ((index || 0) + 1)}
              separator=""
            />
          )}

          {hasAnsweredCurrentQuestion && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="inline-flex items-center gap-1 absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-pill border-[3px] border-white px-2.5 py-0.5 text-[11px] font-black text-pop-ink"
              style={{ background: POP.mint }}
            >
              <Check size={12} aria-hidden /> LOCKED
            </motion.span>
          )}
        </motion.button>
      </ContextMenuTrigger>
      <ContextMenuContent className="rounded-2xl border-2 border-pop-ink">
        <ContextMenuItem className="cursor-pointer font-bold" onClick={() => send?.('remove', id)}>
          Remove
        </ContextMenuItem>
        <ContextMenuItem className="cursor-pointer font-bold" onClick={() => send?.('boss', id)}>
          Make host
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

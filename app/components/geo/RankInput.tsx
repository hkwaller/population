'use client'

import { useEffect, useRef, useState } from 'react'
import { Reorder } from 'motion/react'
import { GripVertical } from 'lucide-react'

import type { RankQuestion } from '@/app/types'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'

/**
 * Drag-to-reorder input for a rank question. Every player arranges the items into
 * their guessed order and commits with "Lock it in". Reports the ordered labels
 * (top = position 1) plus elapsedMs. Resets when the question changes.
 */
export function RankInput({
  question,
  onAnswer,
  disabled = false,
}: {
  question: RankQuestion
  onAnswer: (value: string[], elapsedMs: number) => void
  disabled?: boolean
}) {
  const [order, setOrder] = useState<string[]>(() => question.items.map((i) => i.label))
  const startedAt = useRef<number>(0)

  // Reset the order when the question changes (pure derived-state during render).
  const [prevId, setPrevId] = useState(question.id)
  if (question.id !== prevId) {
    setPrevId(question.id)
    setOrder(question.items.map((i) => i.label))
  }

  // Start the answer timer on mount and whenever the question changes.
  useEffect(() => {
    startedAt.current = performance.now()
  }, [question.id])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-base font-bold text-pop-ink/60">
        Drag into order - most populous at the top
      </p>
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex flex-col gap-2.5">
        {order.map((label, i) => (
          <Reorder.Item
            key={label}
            value={label}
            dragListener={!disabled}
            whileDrag={{ scale: 1.03, boxShadow: '0 10px 0 rgba(0,0,0,0.18)' }}
            className={`flex touch-none items-center gap-3 rounded-pill border-4 border-pop-ink bg-white px-4 py-3.5 shadow-pop-btn ${
              disabled ? '' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <span
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-base font-black text-white"
              style={{ background: POP.ink }}
            >
              {i + 1}
            </span>
            <span className="text-lg font-black text-pop-ink">{label}</span>
            <GripVertical size={22} className="ml-auto flex-none text-pop-ink/35" />
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <PopButton
        variant="primary"
        size="lg"
        disabled={disabled}
        onClick={() => onAnswer(order, Math.round(performance.now() - startedAt.current))}
      >
        Lock it in
      </PopButton>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Delete } from 'lucide-react'

import { usePopStore } from '../state'
import { asSlider, formatCompactNumber } from '@/lib/utils'
import { PopButton } from './pop/PopButton'
import { POP } from './pop/theme'

type AnswerInputModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (answer: number) => void
}

// "Type it instead" keypad - spring-in card with a big coral display + 3×4 pad.
export const AnswerInputModal: React.FC<AnswerInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { currentQuestion } = usePopStore()
  const [raw, setRaw] = useState('')
  const [negative, setNegative] = useState(false)

  const slider = asSlider(currentQuestion)
  const lower = slider?.lower_bound ?? 0
  const upper = slider?.upper_bound ?? 100
  const clamp = (val: number) => Math.min(upper, Math.max(lower, val))

  const numeric = raw === '' ? undefined : (negative ? -1 : 1) * Number(raw)
  const display = raw === '' ? '0' : `${negative ? '-' : ''}${raw}`

  const press = (key: string) => {
    if (key === 'del') {
      setRaw((r) => r.slice(0, -1))
    } else if (key === 'sign') {
      setNegative((n) => !n)
    } else {
      setRaw((r) => (r.length >= 9 ? r : r === '0' ? key : r + key))
    }
  }

  const submit = () => {
    if (numeric === undefined) return
    onSubmit(clamp(numeric))
    setRaw('')
    setNegative(false)
    onClose()
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'sign', '0', 'del']

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(23,18,20,0.55)' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[44px] bg-white p-7"
            style={{ boxShadow: '0 14px 0 rgba(0,0,0,0.18)' }}
          >
            <h2 className="mb-4 text-center text-3xl font-black text-pop-ink">Type it instead</h2>

            <div
              className="mb-5 rounded-3xl border-4 border-pop-ink px-4 py-4 text-center"
              style={{ background: POP.paper }}
            >
              <span className="block text-6xl font-black leading-none" style={{ color: POP.coral }}>
                {display}
              </span>
              <span className="mt-1 block text-sm font-bold text-[rgba(23,18,20,0.5)]">
                {upper >= 1_000_000
                  ? `${formatCompactNumber(lower)} – ${formatCompactNumber(upper)}`
                  : `${lower.toLocaleString()} – ${upper.toLocaleString()}`}
              </span>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2.5">
              {keys.map((k) => {
                const isDel = k === 'del'
                const isSign = k === 'sign'
                const bg = isDel ? POP.bubblegum : isSign ? POP.sunshine : POP.paper
                return (
                  <motion.button
                    key={k}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => press(k)}
                    className="flex h-[64px] items-center justify-center rounded-[22px] text-3xl font-black text-pop-ink shadow-pop-sm"
                    style={{ background: bg }}
                  >
                    {isDel ? <Delete size={26} /> : isSign ? '±' : k}
                  </motion.button>
                )
              })}
            </div>

            <PopButton variant="primary" size="md" className="w-full" onClick={submit}>
              That&apos;s my guess
            </PopButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

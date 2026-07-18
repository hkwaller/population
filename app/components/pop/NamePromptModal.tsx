'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, X } from 'lucide-react'

import { POP } from './theme'
import { PopButton } from './PopButton'

/**
 * Asks a signed-in player for a display name before they join a game. Shown from
 * the setup screen when we don't yet have a `display_name` in their saved
 * preferences, so we never drop them in as the anonymous "Player" fallback.
 *
 * `initialName` seeds the field with the best guess we have (their Clerk name);
 * `onSave` receives the trimmed value and persists it. The Save button stays
 * disabled while empty or saving.
 */
export function NamePromptModal({
  isOpen,
  initialName = '',
  saving = false,
  onSave,
  onClose,
}: {
  isOpen: boolean
  initialName?: string
  saving?: boolean
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reseed + focus each time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setValue(initialName)
      // Wait for the enter animation before grabbing focus.
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [isOpen, initialName])

  const trimmed = value.trim()
  const canSave = trimmed.length > 0 && !saving

  const submit = () => {
    if (canSave) onSave(trimmed)
  }

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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[36px] bg-pop-paper p-6 md:p-8"
            style={{ boxShadow: '0 16px 0 rgba(0,0,0,0.2)' }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black leading-none text-pop-ink">What&apos;s your name?</h2>
                <p className="mt-2 text-[15px] font-bold leading-snug text-pop-ink/60">
                  This is how you&apos;ll show up on the stickers and the leaderboard.
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pop-ink text-white shadow-pop-sm"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              maxLength={15}
              placeholder="your name"
              className="w-full rounded-pill px-5 py-3.5 text-xl font-extrabold text-pop-ink outline-none focus:ring-4 focus:ring-pop-ink"
              style={{ background: POP.paper }}
            />

            <div className="mt-6 flex justify-end">
              <PopButton variant="primary" size="md" disabled={!canSave} onClick={submit}>
                {saving ? (
                  'Saving…'
                ) : (
                  <>
                    Save &amp; join <Check size={22} strokeWidth={3} />
                  </>
                )}
              </PopButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

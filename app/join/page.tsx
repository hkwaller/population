'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, CircleAlert } from 'lucide-react'

import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { POP } from '../components/pop/theme'

export default function JoinEntryPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const slug = code.trim()
    if (!slug) {
      setError(true)
      return
    }
    router.push(`/join/${encodeURIComponent(slug)}`)
  }

  return (
    <PopShell bg={POP.ink} chips chipsOpacity={0.9}>
      <PopHeader logoTextColor={POP.ink} right={<PopAuth tone="light" />} />

      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <h1
          className="font-black leading-[0.9] tracking-[-0.03em] text-white"
          style={{ fontSize: 'clamp(56px, 12vw, 84px)' }}
        >
          Got a code?
        </h1>
        <p className="mt-4 text-xl font-bold text-white/70">
          Punch in the code your host is showing on the big screen.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 w-full">
          <div
            className="flex items-center gap-2 rounded-pill bg-white p-2 pl-6"
            style={error ? { boxShadow: `0 0 0 5px ${POP.coral}` } : undefined}
          >
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(false)
              }}
              placeholder="sleepy-fox-42"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-2xl font-black text-pop-ink outline-none placeholder:text-[rgba(23,18,20,0.35)] md:text-[40px]"
            />
            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ y: 4 }}
              className="flex shrink-0 items-center gap-2 rounded-pill px-6 py-4 text-xl font-black text-white md:text-2xl"
              style={{ background: POP.coral }}
            >
              Join <ArrowRight size={24} />
            </motion.button>
          </div>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="mt-5 inline-flex items-center gap-2 rounded-pill px-5 py-3 text-lg font-black text-white"
              style={{ background: POP.coral }}
            >
              <CircleAlert size={20} /> Hmm, no party at that code. Typo maybe?
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PopShell>
  )
}

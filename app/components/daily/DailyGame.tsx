'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import type { TQuestion } from '@/app/types'
import { usePopStore } from '@/app/state'
import { MAX_SCORE } from '@/lib/utils'
import { dateKeyUTC } from '@/lib/daily'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopLogo } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { POP } from '@/app/components/pop/theme'
import { DailyRound, type Attempt } from '@/app/components/daily/DailyRound'
import { deviceStorage, setDailyReminder, shareText as shareResult } from '@/lib/native'
import { useHomeHref, useIsNativeApp } from '@/hooks/useNative'

const STORE_KEY = 'population-daily'

type SavedPlay = { total: number; buckets: string; streak: number }

function bucket(score: number): string {
  if (score >= 850) return '🟩'
  if (score >= 550) return '🟨'
  if (score > 0) return '🟧'
  return '⬛'
}

export function DailyGame({ questions, dateKey }: { questions: TQuestion[]; dateKey: string }) {
  const maxTotal = questions.length * MAX_SCORE

  const [saved, setSaved] = useState<SavedPlay | null>(null)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)

  // If the player already did today's quiz, jump straight to their result.
  // This reads localStorage *after* mount on purpose: doing it during render
  // (or via a lazy initializer) would diverge from the server HTML and cause a
  // hydration mismatch, so the setState-in-effect here is intentional.
  useEffect(() => {
    try {
      const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      const play = store.plays?.[dateKey]
      if (play) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe restore from localStorage
        setSaved({ total: play.total, buckets: play.buckets, streak: store.streak ?? 1 })
        setAlreadyPlayed(true)
      }
    } catch {
      /* ignore malformed storage */
    }
  }, [dateKey])

  const finish = (finalAttempts: Attempt[]) => {
    const total = finalAttempts.reduce((s, a) => s + a.score, 0)
    const buckets = finalAttempts.map((a) => bucket(a.score)).join('')
    let streak = 1
    try {
      const store = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      const yesterday = dateKeyUTC(new Date(Date.now() - 86_400_000))
      streak = store.lastDate === yesterday ? (store.streak ?? 0) + 1 : 1
      const next = {
        lastDate: dateKey,
        streak,
        plays: { ...(store.plays ?? {}), [dateKey]: { total, buckets } },
      }
      deviceStorage.setItem(STORE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setSaved({ total, buckets, streak })
  }

  if (saved) {
    return <Results saved={saved} maxTotal={maxTotal} dateKey={dateKey} alreadyPlayed={alreadyPlayed} />
  }

  return (
    <DailyRound
      questions={questions}
      label="Daily"
      logo={<PopLogo textColor={POP.cobalt} />}
      onFinish={finish}
    />
  )
}

function Results({
  saved,
  maxTotal,
  dateKey,
  alreadyPlayed,
}: {
  saved: SavedPlay
  maxTotal: number
  dateKey: string
  alreadyPlayed: boolean
}) {
  const [copied, setCopied] = useState(false)
  const home = useHomeHref()
  const shareText = `Population ${dateKey}\n${saved.buckets}\n${saved.total.toLocaleString()}/${maxTotal.toLocaleString()} pts`

  // Share sheet in the app (and Web Share where the browser has it), else the clipboard.
  const share = async () => {
    if ((await shareResult(shareText)) !== 'copied') return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isNative = useIsNativeApp()
  const reminderOn = usePopStore((s) => s.dailyReminder)
  const updateGame = usePopStore((s) => s.updateGame)
  const toggleReminder = async () => {
    const on = await setDailyReminder(!reminderOn, {
      title: 'A new daily puzzle is out',
      body: 'Eight fresh questions about the world. Keep your streak going!',
    })
    updateGame({ dailyReminder: on })
  }

  return (
    <PopShell bg={POP.sunshine}>
      <header className="flex items-center justify-between px-5 pt-5">
        <PopLogo textColor={POP.sunshine} />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-5 pb-16 pt-10 text-center">
        <motion.h1
          initial={{ scale: 0, rotate: -6 }}
          animate={{ scale: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="pop-textshadow-sm text-5xl font-black text-pop-ink"
        >
          {alreadyPlayed ? 'Already played!' : 'Nice one!'}
        </motion.h1>

        <div className="w-full rounded-card bg-white p-7 shadow-pop-card">
          <div className="text-6xl font-black text-pop-ink">
            {saved.total.toLocaleString()}
          </div>
          <div className="text-lg font-bold text-pop-ink/60">of {maxTotal.toLocaleString()} points</div>
          <div className="my-5 text-3xl tracking-widest">{saved.buckets}</div>
          <div
            className="inline-block rounded-pill px-5 py-2 text-lg font-black text-white"
            style={{ background: POP.coral }}
          >
            🔥 {saved.streak}-day streak
          </div>
        </div>

        <PopButton variant="primary" size="lg" className="w-full" onClick={share}>
          {copied ? 'Copied! ✓' : 'Share result'}
        </PopButton>
        {isNative && (
          <PopButton variant="secondary" size="lg" className="w-full" onClick={toggleReminder}>
            {reminderOn ? 'Daily reminder on ✓' : 'Remind me tomorrow'}
          </PopButton>
        )}
        <PopButton href={home} variant="secondary" size="lg" className="w-full">
          Home
        </PopButton>
        <p className="text-base font-bold text-pop-ink/60">A fresh set drops every day. Come back tomorrow!</p>
      </main>
    </PopShell>
  )
}

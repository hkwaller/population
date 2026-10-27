'use client'

import { useEffect, useRef, useState } from 'react'

import { CHOICE_GRACE_MS, CHOICE_TIME_LIMIT_MS, MAX_SCORE, timedChoicePoints } from '@/lib/utils'
import { POP } from '../pop/theme'

/** The points bar holds at 50%; the separate clock keeps running to the deadline. */
export function SpeedBonusMeter({
  startedAt,
  active,
  onExpire,
}: {
  startedAt: number
  active: boolean
  onExpire: () => void
}) {
  const [elapsed, setElapsed] = useState(0)
  const expireRef = useRef(onExpire)
  useEffect(() => {
    expireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!active || startedAt < 0) return
    const update = () => setElapsed(Math.max(0, performance.now() - startedAt))
    update()
    // Only this small display ticks; the answer controls do not re-render with it.
    const interval = window.setInterval(update, 50)
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval)
      setElapsed(CHOICE_TIME_LIMIT_MS)
      expireRef.current()
    }, Math.max(0, CHOICE_TIME_LIMIT_MS - (performance.now() - startedAt)))
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [startedAt, active])

  const points = timedChoicePoints(elapsed)
  const seconds = Math.max(0, Math.ceil((CHOICE_TIME_LIMIT_MS - elapsed) / 1000))
  const grace = Math.max(0, Math.ceil((CHOICE_GRACE_MS - elapsed) / 1000))

  return (
    <div className="mb-5 select-none rounded-card bg-white p-4 text-pop-ink">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-2xl font-black tabular-nums sm:text-3xl">
          {points.toLocaleString('en-US')} <span className="text-base">pts</span>
        </span>
        <span role="timer" aria-label="Time remaining" className="text-lg font-black tabular-nums">
          {seconds > 0 ? `${seconds}s left` : 'Time’s up'}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Points for a correct answer"
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        aria-valuenow={points}
        className="h-7 w-full overflow-hidden rounded-pill border-2 border-pop-ink bg-pop-ink/10"
      >
        <div
          className="h-full origin-left motion-safe:transition-transform motion-safe:duration-75 motion-safe:ease-linear"
          style={{ transform: `scaleX(${points / MAX_SCORE})`, background: POP.mint }}
        />
      </div>
      <p className="mt-2 text-sm font-bold">
        {seconds === 0
          ? 'No answer in time · 0 points'
          : grace > 0
          ? `Full points for ${grace}s · for a correct answer`
          : 'For a correct answer · 500 minimum until time’s up'}
      </p>
    </div>
  )
}

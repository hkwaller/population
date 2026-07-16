'use client'

import { useEffect, useState } from 'react'

import { CHOICE_SPEED_BONUS, CHOICE_TIME_LIMIT_MS } from '@/lib/utils'
import { POP } from '../pop/theme'

/**
 * Draining bonus meter for time-scored `choice` questions. It shows the speed
 * bonus (+CHOICE_SPEED_BONUS) shrinking to 0 over CHOICE_TIME_LIMIT_MS - honest
 * to the scoring: answering late still earns the base points, you just forfeit
 * the bonus. NOT a deadline; the bar hitting empty doesn't end the question.
 *
 * `startedAt` is a performance.now() timestamp captured when the question was
 * shown. When `active` goes false (answer locked) the bar freezes where it is.
 */
export function SpeedBonusMeter({
  startedAt,
  active,
}: {
  startedAt: number
  active: boolean
}) {
  const [fraction, setFraction] = useState(1)

  useEffect(() => {
    if (!active) return
    let raf = 0
    const tick = () => {
      const elapsed = performance.now() - startedAt
      const f = Math.max(0, 1 - elapsed / CHOICE_TIME_LIMIT_MS)
      setFraction(f)
      if (f > 0) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [startedAt, active])

  const points = Math.round(CHOICE_SPEED_BONUS * fraction)
  // Green while there's plenty of bonus left, warming to coral as it drains.
  const fill = fraction > 0.5 ? POP.mint : fraction > 0.2 ? POP.sunshine : POP.coral

  return (
    <div className="mb-3 select-none">
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="text-sm font-black uppercase tracking-wide text-pop-ink/60">
          Speed bonus
        </span>
        <span className="text-sm font-black tabular-nums text-pop-ink/80">
          {points > 0 ? `+${points}` : 'no bonus'}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-pill border-2 border-pop-ink bg-white">
        <div
          className="h-full rounded-pill"
          style={{ width: `${fraction * 100}%`, background: fill }}
        />
      </div>
    </div>
  )
}

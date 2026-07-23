'use client'

import { Fragment } from 'react'
import { ChevronRight, X } from 'lucide-react'

import type { AnswerValue } from '@/app/types'
import { byCca3 } from '@/lib/geo/countries'
import { asRouteAnswer } from '@/lib/utils'
import { POP } from '../pop/theme'

const name = (cca3: string) => byCca3.get(cca3)?.name ?? cca3

/** A single country flag (by cca3) with its name underneath and a coloured ring. */
export function RouteFlag({
  cca3,
  size = 52,
  ring = POP.ink,
  dim = false,
  onRemove,
}: {
  cca3: string
  size?: number
  ring?: string
  /** Render muted (used for wrong attempts). */
  dim?: boolean
  onRemove?: () => void
}) {
  const cca2 = byCca3.get(cca3)?.cca2
  const label = name(cca3)
  return (
    <div className="relative flex flex-none flex-col items-center gap-1" style={{ opacity: dim ? 0.55 : 1 }}>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-pop-ink text-white"
        >
          <X size={11} strokeWidth={4} />
        </button>
      )}
      {cca2 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/flags/${cca2.toLowerCase()}.svg`}
          alt={label}
          className="rounded-md object-cover"
          style={{
            width: size,
            height: Math.round(size * 0.68),
            border: `3px solid ${ring}`,
            boxSizing: 'border-box',
            filter: dim ? 'grayscale(0.5)' : undefined,
          }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-md px-2 text-[11px] font-black text-pop-ink"
          style={{ width: size, height: Math.round(size * 0.68), border: `3px solid ${ring}` }}
        >
          {label.slice(0, 3).toUpperCase()}
        </span>
      )}
      <span className="max-w-[80px] text-center text-[11px] font-black leading-tight text-pop-ink">
        {label}
      </span>
    </div>
  )
}

/**
 * The player's connected path as a horizontal row of flags: start (green) → hops
 * (ochre) → destination (terracotta, once reached). Until the destination is
 * reached it's shown as a dashed "goal" flag at the end. You enter a country by
 * name, then see its flag - so you either already knew it or learn it here. The
 * last hop is removable (backtrack one step) when `onUndo` is provided.
 */
export function RoutePathFlags({
  path,
  to,
  size = 52,
  onUndo,
}: {
  path: string[]
  to: string
  size?: number
  onUndo?: () => void
}) {
  const reached = path[path.length - 1] === to
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-1.5 gap-y-3">
      {path.map((cca3, i) => {
        const isStart = i === 0
        const isLast = i === path.length - 1
        const isDest = isLast && reached
        const ring = isStart ? POP.mint : isDest ? POP.coral : POP.sunshine
        return (
          <Fragment key={`${cca3}-${i}`}>
            {i > 0 && (
              <ChevronRight size={18} strokeWidth={3} className="mt-4 flex-none text-pop-ink/40" />
            )}
            <RouteFlag
              cca3={cca3}
              size={size}
              ring={ring}
              onRemove={onUndo && isLast && !isStart ? onUndo : undefined}
            />
          </Fragment>
        )
      })}

      {/* Goal marker while the destination hasn't been reached yet. */}
      {!reached && (
        <>
          <ChevronRight size={18} strokeWidth={3} className="mt-4 flex-none text-pop-ink/25" />
          <RouteFlag cca3={to} size={size} ring={POP.coral} dim />
        </>
      )}
    </div>
  )
}

/** Wrong (impossible) hops the player attempted, shown muted with a red ring. */
export function RouteWrongFlags({ wrong, size = 34 }: { wrong: string[]; size?: number }) {
  if (wrong.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-black uppercase tracking-wide text-pop-coral">
        Wrong hops · −{100 * wrong.length}
      </span>
      <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-2">
        {wrong.map((cca3, i) => (
          <RouteFlag key={`${cca3}-${i}`} cca3={cca3} size={size} ring={POP.coral} dim />
        ))}
      </div>
    </div>
  )
}

/**
 * A player's route attempt for the result card: the connected path they walked as
 * a flag chain, with any impossible hops they tried listed underneath.
 */
export function RouteGuessFlags({ answer }: { answer: AnswerValue }) {
  const { path, wrong } = asRouteAnswer(answer)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-start justify-center gap-x-1 gap-y-2">
        {path.map((cca3, i) => (
          <Fragment key={`${cca3}-${i}`}>
            {i > 0 && (
              <ChevronRight size={15} strokeWidth={3.5} className="mt-3 flex-none" color={POP.mint} />
            )}
            <RouteFlag cca3={cca3} size={28} />
          </Fragment>
        ))}
      </div>
      <RouteWrongFlags wrong={wrong} size={24} />
    </div>
  )
}

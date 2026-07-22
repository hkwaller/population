'use client'

import { Fragment } from 'react'
import { ChevronRight, X } from 'lucide-react'

import { byCca3 } from '@/lib/geo/countries'
import { areAdjacent } from '@/lib/geo/adjacency'
import { POP } from '../pop/theme'

const name = (cca3: string) => byCca3.get(cca3)?.name ?? cca3

/** A single country flag (by cca3) with its name underneath and a coloured ring. */
function RouteFlag({
  cca3,
  size = 52,
  ring = POP.ink,
  onRemove,
}: {
  cca3: string
  size?: number
  ring?: string
  onRemove?: () => void
}) {
  const cca2 = byCca3.get(cca3)?.cca2
  const label = name(cca3)
  return (
    <div className="relative flex flex-none flex-col items-center gap-1">
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
          }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-md px-2 text-[11px] font-black text-pop-ink"
          style={{
            width: size,
            height: Math.round(size * 0.68),
            border: `3px solid ${ring}`,
          }}
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
 * The player's proposed trip as a horizontal row of flags: start → hops → end.
 * Start/end are colour-coded (green/terracotta) to match the map; intermediate hops
 * are ochre and removable when `onRemove` is provided. You enter a country by name,
 * then see its flag - so you either already knew it or learn it here.
 */
export function RouteChainFlags({
  chain,
  from,
  to,
  size = 52,
  onRemove,
}: {
  chain: string[]
  from: string
  to: string
  size?: number
  /** Called with the index within the intermediate hops (0-based) to remove. */
  onRemove?: (hopIndex: number) => void
}) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-1.5 gap-y-3">
      {chain.map((cca3, i) => {
        const isStart = i === 0
        const isEnd = i === chain.length - 1
        const ring = isStart ? POP.mint : isEnd ? POP.coral : POP.sunshine
        // Intermediate hops are removable; endpoints are fixed.
        const removable = onRemove && !isStart && !isEnd
        return (
          <Fragment key={`${cca3}-${i}`}>
            {i > 0 && (
              <ChevronRight
                size={18}
                strokeWidth={3}
                className="mt-4 flex-none text-pop-ink/40"
              />
            )}
            <RouteFlag
              cca3={cca3}
              size={size}
              ring={ring}
              onRemove={removable ? () => onRemove!(i - 1) : undefined}
            />
          </Fragment>
        )
      })}
    </div>
  )
}

/**
 * A player's attempted route as flags only, for the result card. Each connector
 * turns red when that hop is broken (the two countries don't share a border), so
 * you can see exactly where the chain fell apart.
 */
export function RouteGuessFlags({ chain, size = 34 }: { chain: string[]; size?: number }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-1 gap-y-2">
      {chain.map((cca3, i) => {
        const broken = i > 0 && !areAdjacent(chain[i - 1], cca3)
        return (
          <Fragment key={`${cca3}-${i}`}>
            {i > 0 && (
              <ChevronRight
                size={15}
                strokeWidth={3.5}
                className="mt-3 flex-none"
                color={broken ? POP.coral : POP.mint}
              />
            )}
            <RouteFlag cca3={cca3} size={size} />
          </Fragment>
        )
      })}
    </div>
  )
}

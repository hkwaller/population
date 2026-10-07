'use client'

import { useEffect, useState } from 'react'

import { byCca3 } from '@/lib/geo/countries'

/** Pre-projected silhouette from scripts/build-country-outlines.mjs. */
type Outline = { w: number; h: number; d: string }

const cache = new Map<string, Promise<Outline>>()

function loadOutline(key: string) {
  let p = cache.get(key)
  if (!p) {
    p = fetch(`/geo/outlines/${key}.json`).then((r) => {
      if (!r.ok) throw new Error(`outline ${key}: ${r.status}`)
      return r.json() as Promise<Outline>
    })
    p.catch(() => cache.delete(key)) // allow retry on transient failure
    cache.set(key, p)
  }
  return p
}

/**
 * A country silhouette, auto-fit to the box. Uses the high-detail per-country
 * outlines (10m data, home landmass only, globe-style projection) rather than
 * the 110m world geometry the map draws from.
 */
export function CountryOutline({
  code,
  size = 260,
  fill = '#2F5E4E',
  className,
}: {
  code: string // cca3
  size?: number
  fill?: string
  className?: string
}) {
  const ccn3 = byCca3.get(code)?.ccn3
  const key = ccn3 ? String(parseInt(ccn3, 10)) : null
  const [outline, setOutline] = useState<Outline | null>(null)
  const [failed, setFailed] = useState(!key)

  // Reset to the loading state when the target country changes (during render,
  // not synchronously inside the effect). The async results below still set
  // state from the .then/.catch callbacks, which is allowed.
  const [loadedKey, setLoadedKey] = useState(key)
  if (key !== loadedKey) {
    setLoadedKey(key)
    setOutline(null)
    setFailed(!key)
  }

  useEffect(() => {
    if (!key) return
    let alive = true
    loadOutline(key)
      .then((o) => alive && setOutline(o))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [key])

  // Square box with 8% padding around the longer side, outline centred.
  const span = outline ? Math.max(outline.w, outline.h) / 0.84 : 1
  const viewBox = outline
    ? `${(outline.w - span) / 2} ${(outline.h - span) / 2} ${span} ${span}`
    : `0 0 ${size} ${size}`

  if (failed) {
    // Geometry unavailable (tiny states) - caller should avoid outline questions
    // for these, but fail gracefully just in case.
    return (
      <div
        className={className}
        style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}
      >
        <span className="text-sm font-bold text-pop-ink/40">shape unavailable</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl md:text-4xl font-bold text-pop-ink">What country is this?</h1>
      <svg
        viewBox={viewBox}
        width={size}
        height={size}
        className={className}
        role="img"
        aria-label="Country outline"
      >
        {outline && (
          <path
            d={outline.d}
            fill={fill}
            fillRule="evenodd"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  )
}

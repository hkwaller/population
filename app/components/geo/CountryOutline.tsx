'use client'

import { useEffect, useMemo, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'

import { byCca3 } from '@/lib/geo/countries'
import { loadCountryGeometry, type CountryFeature } from '@/lib/geo/geometry'

/** A country silhouette drawn from world-atlas geometry, auto-fit to the box. */
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
  const [feature, setFeature] = useState<CountryFeature | null>(null)
  const [failed, setFailed] = useState(false)
  const ccn3 = byCca3.get(code)?.ccn3

  // Reset to the loading state when the target country changes (during render,
  // not synchronously inside the effect). The async results below still set
  // state from the .then/.catch callbacks, which is allowed.
  const [loadedCcn3, setLoadedCcn3] = useState(ccn3)
  if (ccn3 !== loadedCcn3) {
    setLoadedCcn3(ccn3)
    setFeature(null)
    setFailed(false)
  }

  useEffect(() => {
    let alive = true
    loadCountryGeometry()
      .then(({ byCcn3 }) => {
        if (!alive) return
        const f = ccn3 ? byCcn3.get(String(parseInt(ccn3, 10))) ?? null : null
        if (f) setFeature(f)
        else setFailed(true)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [ccn3])

  const d = useMemo(() => {
    if (!feature) return null
    const pad = size * 0.08
    const projection = geoMercator().fitExtent(
      [
        [pad, pad],
        [size - pad, size - pad],
      ],
      feature,
    )
    return geoPath(projection)(feature)
  }, [feature, size])

  if (failed) {
    // Geometry unavailable (tiny states) — caller should avoid outline questions
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
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Country outline"
    >
      {d && <path d={d} fill={fill} stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} strokeLinejoin="round" />}
    </svg>
  )
}

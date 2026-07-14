'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'

import { loadCountryGeometry, type CountryFeature } from '@/lib/geo/geometry'
import type { LatLng } from '@/app/types'
import { haversineKm } from '@/lib/utils'

const VBW = 800
const VBH = 411

export type MapPin = { point: LatLng; color: string; label?: string }

/**
 * World map rendered with a Natural Earth projection. In interactive mode a
 * tap drops a pin and reports the lat/lng via onPick. In reveal mode it shows
 * the true location, each player's guess, and the distance line to `value`.
 */
export function WorldMap({
  value,
  onPick,
  answer,
  pins = [],
  interactive = true,
  className,
}: {
  value?: LatLng | null
  onPick?: (p: LatLng) => void
  answer?: LatLng | null
  pins?: MapPin[]
  interactive?: boolean
  className?: string
}) {
  const [features, setFeatures] = useState<CountryFeature[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let alive = true
    loadCountryGeometry().then(({ collection }) => {
      if (alive) setFeatures(collection.features)
    })
    return () => {
      alive = false
    }
  }, [])

  const projection: GeoProjection = useMemo(
    () => geoNaturalEarth1().fitSize([VBW, VBH], { type: 'Sphere' }),
    [],
  )
  const path = useMemo(() => geoPath(projection), [projection])
  const project = (p: LatLng) => projection([p.lng, p.lat]) ?? undefined

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onPick || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * VBW
    const y = ((e.clientY - rect.top) / rect.height) * VBH
    const inv = projection.invert?.([x, y])
    if (inv) onPick({ lat: inv[1], lng: inv[0] })
  }

  const guessXY = value ? project(value) : undefined
  const answerXY = answer ? project(answer) : undefined

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VBW} ${VBH}`}
      className={className}
      onClick={handleClick}
      style={{ width: '100%', height: 'auto', cursor: interactive ? 'crosshair' : 'default', touchAction: 'manipulation' }}
      role="img"
      aria-label="World map"
    >
      <path d={path({ type: 'Sphere' }) ?? ''} fill="#BFE3E8" />
      {features.map((f, i) => (
        <path
          key={i}
          d={path(f) ?? ''}
          fill="#E7D9BC"
          stroke="#B9A47E"
          strokeWidth={0.5}
        />
      ))}

      {/* distance line from the reveal guess to the true point */}
      {guessXY && answerXY && (
        <line
          x1={guessXY[0]}
          y1={guessXY[1]}
          x2={answerXY[0]}
          y2={answerXY[1]}
          stroke="#211812"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
      )}

      {/* other players' guesses (reveal) */}
      {pins.map((pin, i) => {
        const xy = project(pin.point)
        if (!xy) return null
        return <circle key={i} cx={xy[0]} cy={xy[1]} r={5} fill={pin.color} stroke="#fff" strokeWidth={1.5} />
      })}

      {/* the current guess */}
      {guessXY && (
        <circle cx={guessXY[0]} cy={guessXY[1]} r={7} fill="#C96F4A" stroke="#fff" strokeWidth={2} />
      )}

      {/* the true location (reveal) */}
      {answerXY && (
        <g>
          <circle cx={answerXY[0]} cy={answerXY[1]} r={7} fill="#2F5E4E" stroke="#fff" strokeWidth={2} />
          <circle cx={answerXY[0]} cy={answerXY[1]} r={12} fill="none" stroke="#2F5E4E" strokeWidth={2} />
        </g>
      )}
    </svg>
  )
}

/** Distance in km between a guess and the answer, or null if no guess yet. */
export function mapDistanceKm(guess?: LatLng | null, answer?: LatLng | null) {
  if (!guess || !answer) return null
  return Math.round(haversineKm(guess, answer))
}

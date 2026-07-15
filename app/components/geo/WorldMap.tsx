'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'

import { loadCountryGeometry, type CountryFeature } from '@/lib/geo/geometry'
import type { LatLng } from '@/app/types'
import { haversineKm } from '@/lib/utils'

const VBW = 800
const VBH = 411
const ASPECT = VBH / VBW
const MIN_W = VBW / 16 // deepest zoom

type View = { x: number; y: number; w: number; h: number }
const FULL: View = { x: 0, y: 0, w: VBW, h: VBH }

export type MapPin = { point: LatLng; color: string; label?: string }

/**
 * World map (Natural Earth projection) with pan + zoom (wheel, drag, buttons,
 * touch). In interactive mode a tap drops a pin and reports lat/lng via onPick.
 * In reveal mode it auto-fits the view to the bounding box of the true location
 * and every guess so nearby pins are legible instead of stacked.
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
  const [view, setView] = useState<View>(FULL)
  const svgRef = useRef<SVGSVGElement>(null)

  const projection: GeoProjection = useMemo(
    () => geoNaturalEarth1().fitSize([VBW, VBH], { type: 'Sphere' }),
    [],
  )
  const path = useMemo(() => geoPath(projection), [projection])
  const project = useCallback(
    (p: LatLng): [number, number] | undefined => projection([p.lng, p.lat]) ?? undefined,
    [projection],
  )

  useEffect(() => {
    let alive = true
    loadCountryGeometry().then(({ collection }) => {
      if (alive) setFeatures(collection.features)
    })
    return () => {
      alive = false
    }
  }, [])

  const clampView = useCallback((v: View): View => {
    const w = Math.min(VBW, Math.max(MIN_W, v.w))
    const h = w * ASPECT
    const x = Math.min(VBW - w, Math.max(0, v.x))
    const y = Math.min(VBH - h, Math.max(0, v.y))
    return { x, y, w, h }
  }, [])

  // Reveal: fit the view to the answer + all guesses (with padding and a sensible
  // minimum zoom) so pins that are close together become distinguishable.
  const fitToPins = useCallback((): View => {
    const points = [
      ...(answer ? [answer] : []),
      ...(value ? [value] : []),
      ...pins.map((p) => p.point),
    ]
      .map(project)
      .filter(Boolean) as [number, number][]
    if (points.length === 0) return FULL
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    // width that contains the spread (respecting aspect) + 60% padding, but never
    // more zoomed-in than 1/5 of the world so there's always context.
    let w = Math.max(maxX - minX, (maxY - minY) / ASPECT) * 1.6
    w = Math.max(w, VBW / 5)
    return clampView({ x: cx - w / 2, y: cy - (w * ASPECT) / 2, w, h: w * ASPECT })
  }, [answer, value, pins, project, clampView])

  const isReveal = !!answer
  // Key off the actual coordinates (a stable string) rather than object identity —
  // callers pass fresh literals each render, which would otherwise loop forever.
  const fitKey = isReveal
    ? JSON.stringify([answer, value ?? null, pins.map((p) => p.point)])
    : 'full'
  useEffect(() => {
    setView(isReveal ? fitToPins() : FULL)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  // Wheel zoom toward the cursor (native listener so we can preventDefault).
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const fx = (e.clientX - rect.left) / rect.width
      const fy = (e.clientY - rect.top) / rect.height
      setView((prev) => {
        const ax = prev.x + fx * prev.w
        const ay = prev.y + fy * prev.h
        const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
        const w = Math.min(VBW, Math.max(MIN_W, prev.w * factor))
        const h = w * ASPECT
        return clampView({ x: ax - fx * w, y: ay - fy * h, w, h })
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clampView])

  // Panning: in pin-placing mode a single drag would fight with dropping a pin, so
  // panning needs an explicit gesture — hold Space (desktop) or use two fingers
  // (touch). When there's no pin to place (reveal mode), a plain drag just pans.
  const [spaceHeld, setSpaceHeld] = useState(false)
  const hovering = useRef(false)
  useEffect(() => {
    const isSpace = (e: KeyboardEvent) => e.code === 'Space' || e.key === ' '
    const down = (e: KeyboardEvent) => {
      if (!isSpace(e)) return
      setSpaceHeld(true)
      if (hovering.current) e.preventDefault() // don't scroll the page while panning
    }
    const up = (e: KeyboardEvent) => {
      if (isSpace(e)) setSpaceHeld(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; midX: number; midY: number } | null>(null)
  const drag = useRef<{ id: number; lastX: number; lastY: number; moved: boolean; multi: boolean } | null>(null)

  // Two-finger gesture: zoom by the change in finger spread, pan by the midpoint drift.
  const twoFingerMove = () => {
    const pts = [...pointers.current.values()]
    if (pts.length < 2 || !svgRef.current) return
    const [p1, p2] = pts
    const rect = svgRef.current.getBoundingClientRect()
    const midX = (p1.x + p2.x) / 2
    const midY = (p1.y + p2.y) / 2
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1
    const prev = pinch.current
    if (!prev) {
      pinch.current = { dist, midX, midY }
      return
    }
    const fx = (prev.midX - rect.left) / rect.width
    const fy = (prev.midY - rect.top) / rect.height
    setView((v) => {
      const ax = v.x + fx * v.w
      const ay = v.y + fy * v.h
      const factor = prev.dist / dist // fingers spread → dist up → factor < 1 → zoom in
      const w = Math.min(VBW, Math.max(MIN_W, v.w * factor))
      const h = w * ASPECT
      const panX = ((midX - prev.midX) / rect.width) * w
      const panY = ((midY - prev.midY) / rect.height) * h
      return clampView({ x: ax - fx * w - panX, y: ay - fy * h - panY, w, h })
    })
    pinch.current = { dist, midX, midY }
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    svgRef.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      pinch.current = null // re-seed on the next move
      if (drag.current) drag.current.multi = true
    } else {
      drag.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY, moved: false, multi: false }
    }
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      if (drag.current) drag.current.multi = true
      twoFingerMove()
      return
    }
    const d = drag.current
    if (!d || d.id !== e.pointerId || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = e.clientX - d.lastX
    const dy = e.clientY - d.lastY
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    d.lastX = e.clientX
    d.lastY = e.clientY
    // Pan on a single pointer only when panning is the active mode.
    if (spaceHeld || !onPick) {
      setView((prev) =>
        clampView({
          ...prev,
          x: prev.x - (dx / rect.width) * prev.w,
          y: prev.y - (dy / rect.height) * prev.h,
        }),
      )
    }
  }
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const wasMulti = pointers.current.size >= 2
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!svgRef.current) return
    // A clean single tap (no drag, no pan modifier, not part of a pinch) drops a pin.
    if (onPick && !d.moved && !d.multi && !wasMulti && !spaceHeld) {
      const rect = svgRef.current.getBoundingClientRect()
      const ux = view.x + ((e.clientX - rect.left) / rect.width) * view.w
      const uy = view.y + ((e.clientY - rect.top) / rect.height) * view.h
      const inv = projection.invert?.([ux, uy])
      if (inv) onPick({ lat: inv[1], lng: inv[0] })
    }
  }

  const zoomAroundCenter = (factor: number) =>
    setView((prev) => {
      const w = Math.min(VBW, Math.max(MIN_W, prev.w * factor))
      const h = w * ASPECT
      const cx = prev.x + prev.w / 2
      const cy = prev.y + prev.h / 2
      return clampView({ x: cx - w / 2, y: cy - h / 2, w, h })
    })

  const k = view.w / VBW // keep marks a constant on-screen size as we zoom
  const guessXY = value ? project(value) : undefined
  const answerXY = answer ? project(answer) : undefined

  return (
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => (hovering.current = true)}
        onPointerLeave={() => (hovering.current = false)}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          cursor: onPick && !spaceHeld ? 'crosshair' : 'grab',
          touchAction: 'none',
        }}
        role="img"
        aria-label="World map"
      >
        <path d={path({ type: 'Sphere' }) ?? ''} fill="#BFE3E8" />
        {features.map((f, i) => (
          <path key={i} d={path(f) ?? ''} fill="#E7D9BC" stroke="#211812" strokeWidth={0.5 * k} />
        ))}

        {guessXY && answerXY && (
          <line
            x1={guessXY[0]}
            y1={guessXY[1]}
            x2={answerXY[0]}
            y2={answerXY[1]}
            stroke="#211812"
            strokeWidth={1.5 * k}
            strokeDasharray={`${5 * k} ${4 * k}`}
          />
        )}

        {pins.map((pin, i) => {
          const xy = project(pin.point)
          if (!xy) return null
          return (
            <circle key={i} cx={xy[0]} cy={xy[1]} r={5 * k} fill={pin.color} stroke="#fff" strokeWidth={1.5 * k} />
          )
        })}

        {guessXY && (
          <circle cx={guessXY[0]} cy={guessXY[1]} r={7 * k} fill="#C96F4A" stroke="#fff" strokeWidth={2 * k} />
        )}

        {answerXY && (
          <g>
            <circle cx={answerXY[0]} cy={answerXY[1]} r={7 * k} fill="#2F5E4E" stroke="#fff" strokeWidth={2 * k} />
            <circle cx={answerXY[0]} cy={answerXY[1]} r={12 * k} fill="none" stroke="#2F5E4E" strokeWidth={2 * k} />
          </g>
        )}
      </svg>

      {/* zoom controls */}
      <div
        style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <ZoomButton label="Zoom in" onClick={() => zoomAroundCenter(1 / 1.6)}>
          +
        </ZoomButton>
        <ZoomButton label="Zoom out" onClick={() => zoomAroundCenter(1.6)}>
          −
        </ZoomButton>
        <ZoomButton label="Reset view" onClick={() => setView(isReveal ? fitToPins() : FULL)}>
          ⤢
        </ZoomButton>
      </div>

      {/* Discoverability: panning needs a modifier so taps can place pins. */}
      {onPick && (
        <div
          style={{ position: 'absolute', left: 8, bottom: 8 }}
          className="pointer-events-none select-none rounded-pill bg-pop-ink/70 px-2.5 py-1 text-[11px] font-bold text-white"
        >
          hold space or use two fingers to pan
        </div>
      )}
    </div>
  )
}

function ZoomButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-pop-ink bg-white text-xl font-black text-pop-ink shadow-pop-sm"
      style={{ lineHeight: 1 }}
    >
      {children}
    </button>
  )
}

/** Distance in km between a guess and the answer, or null if no guess yet. */
export function mapDistanceKm(guess?: LatLng | null, answer?: LatLng | null) {
  if (!guess || !answer) return null
  return Math.round(haversineKm(guess, answer))
}

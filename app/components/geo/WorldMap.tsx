'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Scan } from 'lucide-react'
import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'

import { loadCountryGeometry, type CountryFeature } from '@/lib/geo/geometry'
import { COUNTRIES } from '@/lib/geo/countries'
import type { LatLng } from '@/app/types'
import { haversineKm } from '@/lib/utils'

// A location marker keeps small countries discoverable until their outline is
// large enough to read at the current zoom. Missing geometry always gets a marker.
const LOCATED_COUNTRIES = COUNTRIES.filter(
  (c) => c.lat != null && c.lng != null,
) as ((typeof COUNTRIES)[number] & { lat: number; lng: number })[]

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
  showControls = true,
  fill = false,
  className,
}: {
  value?: LatLng | null
  onPick?: (p: LatLng) => void
  answer?: LatLng | null
  pins?: MapPin[]
  interactive?: boolean
  showControls?: boolean
  /** Use the container's actual aspect ratio for a fullscreen map without letterboxing. */
  fill?: boolean
  className?: string
}) {
  const [features, setFeatures] = useState<CountryFeature[]>([])
  const [view, setView] = useState<View>(FULL)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(ASPECT)
  const [viewportWidth, setViewportWidth] = useState(VBW)
  const maxW = Math.max(VBW, VBH / aspect)
  const full = useMemo<View>(() => {
    const w = Math.min(VBW, VBH / aspect)
    const h = w * aspect
    return { x: (VBW - w) / 2, y: (VBH - h) / 2, w, h }
  }, [aspect])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0) setViewportWidth(width)
      if (fill && width > 0 && height > 0) setAspect(height / width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [fill])

  const projection: GeoProjection = useMemo(
    () => geoNaturalEarth1().fitSize([VBW, VBH], { type: 'Sphere' }),
    [],
  )
  const path = useMemo(() => geoPath(projection), [projection])
  const countryPaths = useMemo(() => features.map((feature) => ({
    d: path(feature) ?? '',
    area: path.area(feature),
    code: String(parseInt(String(feature.id), 10)),
  })), [features, path])
  const countryAreas = useMemo(
    () => new Map(countryPaths.map(({ code, area }) => [code, area])),
    [countryPaths],
  )
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

  // The SVG viewBox matches its container, so all gestures share these coordinates.
  const contentBox = useCallback((rect: DOMRect) => rect, [])

  const clampView = useCallback((v: View): View => {
    const w = Math.min(maxW, Math.max(MIN_W, v.w))
    const h = w * aspect
    const x = w >= VBW ? (VBW - w) / 2 : Math.min(VBW - w, Math.max(0, v.x))
    const y = h >= VBH ? (VBH - h) / 2 : Math.min(VBH - h, Math.max(0, v.y))
    return { x, y, w, h }
  }, [aspect, maxW])

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
    if (points.length === 0) return full
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
    let w = Math.max(maxX - minX, (maxY - minY) / aspect) * 1.6
    w = Math.max(w, VBW / 5)
    return clampView({ x: cx - w / 2, y: cy - (w * aspect) / 2, w, h: w * aspect })
  }, [answer, value, pins, project, clampView, aspect, full])

  const isReveal = !!answer
  // Key off the actual coordinates (a stable string) rather than object identity -
  // callers pass fresh literals each render, which would otherwise loop forever.
  const fitKey = isReveal
    ? JSON.stringify([answer, value ?? null, pins.map((p) => p.point)])
    : 'full'
  useEffect(() => {
    setView(isReveal ? fitToPins() : full)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, full])

  // Wheel zoom toward the cursor (native listener so we can preventDefault).
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!interactive && !showControls) return
      e.preventDefault()
      if (!e.deltaY) return
      const box = contentBox(el.getBoundingClientRect())
      const fx = (e.clientX - box.left) / box.width
      const fy = (e.clientY - box.top) / box.height
      setView((prev) => {
        const ax = prev.x + fx * prev.w
        const ay = prev.y + fy * prev.h
        const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
        const w = Math.min(maxW, Math.max(MIN_W, prev.w * factor))
        const h = w * aspect
        return clampView({ x: ax - fx * w, y: ay - fy * h, w, h })
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clampView, contentBox, aspect, maxW, interactive, showControls])

  // Transient gesture data stays in refs; only cursor changes need React state.
  const [spaceHeld, setSpaceHeld] = useState(false)
  const spaceRef = useRef(false)
  const hovering = useRef(false)
  useEffect(() => {
    const isSpace = (e: KeyboardEvent) => e.code === 'Space' || e.key === ' '
    const down = (e: KeyboardEvent) => {
      if (!isSpace(e) || (e.target instanceof HTMLElement &&
        (e.target.closest('input, textarea, select, [contenteditable="true"]') ||
          (e.target.closest('button') && !hovering.current)))) return
      spaceRef.current = true
      setSpaceHeld(true)
      if (hovering.current) e.preventDefault() // don't scroll the page while panning
    }
    const up = (e: KeyboardEvent) => {
      if (isSpace(e)) resetSpace()
    }
    const resetSpace = () => {
      spaceRef.current = false
      setSpaceHeld(false)
    }
    window.addEventListener('blur', resetSpace)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('blur', resetSpace)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; midX: number; midY: number } | null>(null)
  const drag = useRef<{
    id: number
    startX: number
    startY: number
    threshold: number
    panOnly: boolean
    lastX: number
    lastY: number
    moved: boolean
    multi: boolean
  } | null>(null)

  // Two-finger gesture: zoom by the change in finger spread, pan by the midpoint drift.
  const twoFingerMove = () => {
    const pts = [...pointers.current.values()]
    if (pts.length < 2 || !svgRef.current) return
    const [p1, p2] = pts
    const box = contentBox(svgRef.current.getBoundingClientRect())
    const midX = (p1.x + p2.x) / 2
    const midY = (p1.y + p2.y) / 2
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1
    const prev = pinch.current
    if (!prev) {
      pinch.current = { dist, midX, midY }
      return
    }
    const fx = (prev.midX - box.left) / box.width
    const fy = (prev.midY - box.top) / box.height
    setView((v) => {
      const ax = v.x + fx * v.w
      const ay = v.y + fy * v.h
      const factor = prev.dist / dist // fingers spread → dist up → factor < 1 → zoom in
      const w = Math.min(maxW, Math.max(MIN_W, v.w * factor))
      const h = w * aspect
      const panX = ((midX - prev.midX) / box.width) * w
      const panY = ((midY - prev.midY) / box.height) * h
      return clampView({ x: ax - fx * w - panX, y: ay - fy * h - panY, w, h })
    })
    pinch.current = { dist, midX, midY }
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((!interactive && !showControls) || e.button !== 0) return
    svgRef.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      pinch.current = null
      twoFingerMove()
      if (drag.current) drag.current.multi = true
    } else {
      drag.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        threshold: e.pointerType === 'touch' ? 10 : 6,
        panOnly: spaceRef.current || !interactive || !onPick,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
        multi: false,
      }
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
    const box = contentBox(svgRef.current.getBoundingClientRect())
    const dx = e.clientX - d.lastX
    const dy = e.clientY - d.lastY
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > d.threshold) d.moved = true
    if (spaceRef.current) d.panOnly = true
    if (d.moved || d.panOnly || d.multi) {
      d.lastX = e.clientX
      d.lastY = e.clientY
      setView((prev) =>
        clampView({
          ...prev,
          x: prev.x - (dx / box.width) * prev.w,
          y: prev.y - (dy / box.height) * prev.h,
        }),
      )
    }
  }
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const wasMulti = pointers.current.size >= 2
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) {
      pinch.current = null
      const remaining = drag.current && pointers.current.get(drag.current.id)
      if (remaining && drag.current) {
        drag.current.lastX = remaining.x
        drag.current.lastY = remaining.y
      }
    }
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const nextPointer = pointers.current.entries().next().value
    drag.current = nextPointer ? {
      ...d, id: nextPointer[0], startX: nextPointer[1].x, startY: nextPointer[1].y,
      lastX: nextPointer[1].x, lastY: nextPointer[1].y, multi: true, moved: true,
    } : null
    if (!svgRef.current) return
    // A clean single tap (no drag, no pan modifier, not part of a pinch) drops a pin.
    const distance = Math.hypot(e.clientX - d.startX, e.clientY - d.startY)
    if (e.type === 'pointerup' && interactive && onPick && !d.moved &&
      distance <= d.threshold && !d.multi && !wasMulti && !d.panOnly && !spaceRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const ux = view.x + ((e.clientX - rect.left) / rect.width) * view.w
      const uy = view.y + ((e.clientY - rect.top) / rect.height) * view.h
      const inv = projection.invert?.([ux, uy])
      if (inv && inv.every(Number.isFinite) && Math.abs(inv[1]) <= 90 && Math.abs(inv[0]) <= 180) {
        const projected = projection(inv)
        if (projected && Math.hypot(projected[0] - ux, projected[1] - uy) < 0.01) {
          onPick({ lat: inv[1], lng: inv[0] })
        }
      }
    }
  }

  const zoomAroundCenter = (factor: number) =>
    setView((prev) => {
      const w = Math.min(maxW, Math.max(MIN_W, prev.w * factor))
      const h = w * aspect
      const cx = prev.x + prev.w / 2
      const cy = prev.y + prev.h / 2
      return clampView({ x: cx - w / 2, y: cy - h / 2, w, h })
    })

  const k = view.w / viewportWidth // keep pins and borders readable at every screen size
  const guessXY = value ? project(value) : undefined
  const answerXY = answer ? project(answer) : undefined

  return (
    <div ref={containerRef} className={className} style={{
      position: 'relative', width: '100%', height: fill ? '100%' : undefined,
      overflow: 'hidden', background: '#BFE3E8',
    }}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={onPointerUp}
        onPointerEnter={() => (hovering.current = true)}
        onPointerLeave={() => (hovering.current = false)}
        style={{
          width: '100%',
          height: fill ? '100%' : 'auto',
          display: 'block',
          cursor: onPick && !spaceHeld ? 'crosshair' : 'grab',
          touchAction: interactive || showControls ? 'none' : 'auto',
          userSelect: 'none',
        }}
        tabIndex={interactive || showControls ? 0 : undefined}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pop-ink"
        role="img"
        aria-label="World map"
      >
        <path d={path({ type: 'Sphere' }) ?? ''} fill="#BFE3E8" />
        {countryPaths.map(({ d }, i) => (
          <path key={i} d={d} fill="#E7D9BC" stroke="#211812" strokeWidth={0.5 * k} strokeLinejoin="round" />
        ))}

        {/* Mark small countries until zoom makes their real geography readable. */}
        {features.length > 0 && LOCATED_COUNTRIES.map((c) => {
          const area = countryAreas.get(String(parseInt(c.ccn3, 10)))
          if (area != null && area >= Math.PI * (2.5 * k) ** 2) return null
          const xy = project({ lat: c.lat, lng: c.lng })
          if (!xy) return null
          return (
            <circle
              key={c.ccn3}
              cx={xy[0]}
              cy={xy[1]}
              r={2.5 * k}
              fill="#E7D9BC"
              stroke="#211812"
              strokeWidth={0.5 * k}
            />
          )
        })}

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
            <circle
              key={i}
              cx={xy[0]}
              cy={xy[1]}
              r={10 * k}
              fill={pin.color}
              stroke="#fff"
              strokeWidth={2 * k}
            />
          )
        })}

        {guessXY && (
          <circle
            cx={guessXY[0]}
            cy={guessXY[1]}
            r={7 * k}
            fill="#C96F4A"
            stroke="#fff"
            strokeWidth={2 * k}
          />
        )}

        {answerXY && (
          <g>
            <circle
              cx={answerXY[0]}
              cy={answerXY[1]}
              r={7 * k}
              fill="#2F5E4E"
              stroke="#fff"
              strokeWidth={2 * k}
            />
            <circle
              cx={answerXY[0]}
              cy={answerXY[1]}
              r={12 * k}
              fill="none"
              stroke="#2F5E4E"
              strokeWidth={2 * k}
            />
          </g>
        )}
      </svg>

      {/* Interactive maps retain zoom; static launcher previews do not nest controls. */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <ZoomButton label="Zoom in" onClick={() => zoomAroundCenter(1 / 1.6)}>
            <Plus size={20} />
          </ZoomButton>
          <ZoomButton label="Zoom out" onClick={() => zoomAroundCenter(1.6)}>
            <Minus size={20} />
          </ZoomButton>
          <ZoomButton label="Reset view" onClick={() => setView(isReveal ? fitToPins() : full)}>
            <Scan size={20} />
          </ZoomButton>
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
      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-pop-ink bg-white text-xl font-black text-pop-ink shadow-pop-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pop-ink"
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

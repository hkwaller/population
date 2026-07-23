'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

import { loadCountryGeometry, type CountryFeature } from '@/lib/geo/geometry'
import { byCca3 } from '@/lib/geo/countries'
import type { LatLng } from '@/app/types'
import { POP } from '../pop/theme'

const VBW = 640
const VBH = 460
const ASPECT = VBH / VBW
const MIN_W = VBW / 16 // deepest zoom
// Padding (in viewBox units) around the fitted start/end bounds so the two
// countries aren't jammed against the edge.
const PAD = 34

type View = { x: number; y: number; w: number; h: number }
const FULL: View = { x: 0, y: 0, w: VBW, h: VBH }

const SEA = '#BFE3E8'
const LAND = '#E7D9BC'

const START_FILL = POP.mint // moss green
const END_FILL = POP.coral // terracotta
const HOP_FILL = POP.sunshine // ochre - matches the intermediate chips

/** Normalise a ccn3 code to the world-atlas key ("036" → "36"). */
const ccn3Key = (ccn3: string) => String(parseInt(ccn3, 10))

/** A player's completed route to overlay on the map, in their sticker colour. */
export type RouteOverlay = { path: string[]; color: string; label: string }

/**
 * A regional map for Border Hopper. The view is framed to the bounding box of the
 * **start and end countries**, so you always see the two anchors and the terrain
 * between them. Start/end are colour-coded and each intermediate country in `chain`
 * lights up in order, with a dashed line threading it together. `routes` overlays
 * other players' completed paths as solid coloured lines (for the reveal).
 *
 * `bounded` (default true) traps the view inside the fitted start/end frame; pass
 * `false` so players can freely zoom out to see where they are on the map.
 */
export function RouteMap({
  from,
  to,
  chain,
  routes,
  bounded = true,
  className,
}: {
  from: string
  to: string
  /** Ordered cca3 chain including `from` and `to`; intermediate entries are the player's hops. */
  chain: string[]
  /** Other players' completed routes, drawn as coloured overlays with a legend. */
  routes?: RouteOverlay[]
  bounded?: boolean
  className?: string
}) {
  const [byCcn3, setByCcn3] = useState<Map<string, CountryFeature> | null>(null)
  const [features, setFeatures] = useState<CountryFeature[]>([])
  const [view, setView] = useState<View>(FULL)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let alive = true
    loadCountryGeometry().then(({ collection, byCcn3 }) => {
      if (!alive) return
      setByCcn3(byCcn3)
      setFeatures(collection.features)
    })
    return () => {
      alive = false
    }
  }, [])

  // The svg letterboxes inside its element (width-driven here), so pointer math
  // maps against the rendered map area. Kept as a helper to mirror WorldMap.
  const contentBox = useCallback((rect: DOMRect) => {
    const width = Math.min(rect.width, rect.height / ASPECT)
    const height = width * ASPECT
    return {
      left: rect.left + (rect.width - width) / 2,
      top: rect.top + (rect.height - height) / 2,
      width,
      height,
    }
  }, [])

  // Widest zoom-out allowed. When unbounded we let the view grow well past the
  // fitted frame so neighbouring countries come into view.
  const maxW = bounded ? VBW : VBW * 6
  const clampView = useCallback(
    (v: View): View => {
      const w = Math.min(maxW, Math.max(MIN_W, v.w))
      const h = w * ASPECT
      if (!bounded) {
        // Free pan, held within a couple of frame-widths so you can't get lost.
        const mx = VBW * 2
        const my = VBH * 2
        const x = Math.min(VBW - w + mx, Math.max(-mx, v.x))
        const y = Math.min(VBH - h + my, Math.max(-my, v.y))
        return { x, y, w, h }
      }
      const x = Math.min(VBW - w, Math.max(0, v.x))
      const y = Math.min(VBH - h, Math.max(0, v.y))
      return { x, y, w, h }
    },
    [bounded, maxW],
  )

  // Wheel zoom toward the cursor (native listener so we can preventDefault).
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const box = contentBox(el.getBoundingClientRect())
      const fx = (e.clientX - box.left) / box.width
      const fy = (e.clientY - box.top) / box.height
      setView((prev) => {
        const ax = prev.x + fx * prev.w
        const ay = prev.y + fy * prev.h
        const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
        const w = Math.min(maxW, Math.max(MIN_W, prev.w * factor))
        const h = w * ASPECT
        return clampView({ x: ax - fx * w, y: ay - fy * h, w, h })
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [clampView, contentBox, maxW])

  // Pan (single drag - there's no pin to place here) and two-finger pinch/pan.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; midX: number; midY: number } | null>(null)
  const drag = useRef<{ id: number; lastX: number; lastY: number } | null>(null)

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
      const factor = prev.dist / dist
      const w = Math.min(maxW, Math.max(MIN_W, v.w * factor))
      const h = w * ASPECT
      const panX = ((midX - prev.midX) / box.width) * w
      const panY = ((midY - prev.midY) / box.height) * h
      return clampView({ x: ax - fx * w - panX, y: ay - fy * h - panY, w, h })
    })
    pinch.current = { dist, midX, midY }
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    svgRef.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      pinch.current = null // re-seed on the next move
    } else {
      drag.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY }
    }
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      twoFingerMove()
      return
    }
    const d = drag.current
    if (!d || d.id !== e.pointerId || !svgRef.current) return
    const box = contentBox(svgRef.current.getBoundingClientRect())
    const dx = e.clientX - d.lastX
    const dy = e.clientY - d.lastY
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
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  const zoomAroundCenter = (factor: number) =>
    setView((prev) => {
      const w = Math.min(maxW, Math.max(MIN_W, prev.w * factor))
      const h = w * ASPECT
      const cx = prev.x + prev.w / 2
      const cy = prev.y + prev.h / 2
      return clampView({ x: cx - w / 2, y: cy - h / 2, w, h })
    })

  const featureForCca3 = useMemo(() => {
    return (cca3: string): CountryFeature | undefined => {
      const c = byCca3.get(cca3)
      if (!c || !byCcn3) return undefined
      return byCcn3.get(ccn3Key(c.ccn3))
    }
  }, [byCcn3])

  // Project fitted to the start + end countries' combined bounds. Depends only on
  // the endpoints (not the evolving chain), so the frame stays fixed as hops are added.
  const projection = useMemo<GeoProjection | null>(() => {
    if (!byCcn3) return null
    const targets: Feature<Geometry>[] = []
    for (const code of [from, to]) {
      const f = featureForCca3(code)
      if (f) {
        targets.push(f as Feature<Geometry>)
        continue
      }
      // Tiny country the 110m atlas drops: fall back to a point at its centroid.
      const c = byCca3.get(code)
      if (c?.lat != null && c?.lng != null) {
        targets.push({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        })
      }
    }
    if (targets.length === 0) return null
    const fc: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: targets }
    return geoNaturalEarth1().fitExtent(
      [
        [PAD, PAD],
        [VBW - PAD, VBH - PAD],
      ],
      fc,
    )
  }, [byCcn3, from, to, featureForCca3])

  const path = useMemo(() => (projection ? geoPath(projection) : null), [projection])

  const project = (p: LatLng): [number, number] | undefined =>
    projection?.([p.lng, p.lat]) ?? undefined

  // Which fill a country gets: start / end / a locked-in hop / neutral land.
  const fillFor = (feature: CountryFeature): string => {
    const id = feature.id != null ? ccn3Key(String(feature.id)) : null
    if (!id) return LAND
    const startId = countryCcn3Key(from)
    const endId = countryCcn3Key(to)
    if (id === startId) return START_FILL
    if (id === endId) return END_FILL
    // Intermediate hops are every chain entry that isn't the start or end - the
    // chain may not have reached the end yet, so don't assume it's the last node.
    const hopIds = chain.filter((c) => c !== from && c !== to).map(countryCcn3Key)
    if (hopIds.includes(id)) return HOP_FILL
    return LAND
  }

  // Project an ordered cca3 list to screen points (dropping any we can't place).
  const pointsFor = (codes: string[]) =>
    codes
      .map((cca3) => {
        const c = byCca3.get(cca3)
        if (!c || c.lat == null || c.lng == null) return null
        const xy = project({ lat: c.lat, lng: c.lng })
        return xy ? { cca3, xy } : null
      })
      .filter(Boolean) as { cca3: string; xy: [number, number] }[]

  // Chain nodes as screen points, in order, for the connecting line + dots.
  const chainPoints = pointsFor(chain)
  // Each player's completed route as a coloured overlay.
  const routeOverlays = (routes ?? []).map((r) => ({ ...r, points: pointsFor(r.path) }))

  const ready = !!projection && !!path
  const k = view.w / VBW // keep marks a constant on-screen size as we zoom

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        border: `4px solid ${POP.ink}`,
        background: SEA,
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          cursor: 'grab',
          touchAction: 'none',
        }}
        role="img"
        aria-label={`Map from ${name(from)} to ${name(to)}`}
      >
        <rect x={0} y={0} width={VBW} height={VBH} fill={SEA} />
        {ready &&
          features.map((f, i) => (
            <path
              key={i}
              d={path!(f) ?? ''}
              fill={fillFor(f)}
              stroke={POP.ink}
              strokeWidth={0.6 * k}
              strokeLinejoin="round"
            />
          ))}

        {/* Dashed thread through the chain, in the order it was built. */}
        {ready && chainPoints.length >= 2 && (
          <polyline
            points={chainPoints.map((p) => p.xy.join(',')).join(' ')}
            fill="none"
            stroke={POP.ink}
            strokeWidth={2.5 * k}
            strokeDasharray={`${7 * k} ${5 * k}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* A dot on every chain node; endpoints get a ring. */}
        {ready &&
          chainPoints.map(({ cca3, xy }, i) => {
            const isStart = cca3 === from
            const isEnd = cca3 === to && i === chainPoints.length - 1
            const color = isStart ? START_FILL : isEnd ? END_FILL : HOP_FILL
            return (
              <g key={`${cca3}-${i}`}>
                {(isStart || isEnd) && (
                  <circle
                    cx={xy[0]}
                    cy={xy[1]}
                    r={9 * k}
                    fill="none"
                    stroke={color}
                    strokeWidth={2.5 * k}
                  />
                )}
                <circle
                  cx={xy[0]}
                  cy={xy[1]}
                  r={5 * k}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={2 * k}
                />
              </g>
            )
          })}

        {/* Players' completed routes, each a solid line in their sticker colour. */}
        {ready &&
          routeOverlays.map(
            (r, ri) =>
              r.points.length >= 2 && (
                <polyline
                  key={`route-line-${ri}`}
                  points={r.points.map((p) => p.xy.join(',')).join(' ')}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={3 * k}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
              ),
          )}
        {ready &&
          routeOverlays.flatMap((r, ri) =>
            r.points.map(({ xy }, i) => (
              <circle
                key={`route-dot-${ri}-${i}`}
                cx={xy[0]}
                cy={xy[1]}
                r={3.5 * k}
                fill={r.color}
                stroke="#fff"
                strokeWidth={1.5 * k}
              />
            )),
          )}
      </svg>

      {/* zoom controls */}
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
          +
        </ZoomButton>
        <ZoomButton label="Zoom out" onClick={() => zoomAroundCenter(1.6)}>
          −
        </ZoomButton>
        <ZoomButton label="Reset view" onClick={() => setView(FULL)}>
          ⤢
        </ZoomButton>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          right: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 10px',
          maxWidth: 'calc(100% - 60px)',
        }}
        className="pointer-events-none select-none rounded-[16px] bg-white/85 px-3 py-1.5 text-[11px] font-black text-pop-ink"
      >
        <LegendDot color={START_FILL} label={name(from)} />
        <LegendDot color={END_FILL} label={name(to)} />
        {routeOverlays.length > 0 && <LegendDot color={POP.ink} label="Answer" />}
        {routeOverlays.map((r, ri) => (
          <LegendDot key={`legend-${ri}`} color={r.color} label={r.label} />
        ))}
      </div>
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

const name = (cca3: string) => byCca3.get(cca3)?.name ?? cca3
const countryCcn3Key = (cca3: string) => {
  const c = byCca3.get(cca3)
  return c ? ccn3Key(c.ccn3) : null
}

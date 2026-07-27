'use client'

// Waiting-screen loader ("1b · Sticker card morph" from the Population Loader
// design). An ochre country silhouette sits on a breathing parchment sticker
// and morphs from one country to the next; a pill ticks along with the country
// name and a flavor line rotates underneath. Shapes come from a build-time set
// of equal-point-count silhouettes (scripts/build-country-shapes.mjs) so each
// can be linearly interpolated into the next.
import { useEffect, useRef, useState } from 'react'

import shapes from '@/lib/geo/country-shapes.json'
import { POP } from '@/app/components/pop/theme'

const LINES = [
  'Rounding up the borders…',
  'Waking the cartographers…',
  'Politely asking Norway to hold still…',
  'Counting everyone. Twice.',
  'Unfolding the atlas…',
  'Arguing about where Europe ends…',
]

type Shape = { name: string; pts: [number, number][] }
const SHAPES = shapes as Shape[]

// Eased crossfade between shape[i] and shape[i+1]. Holds on a shape for the
// first ~42% of each cycle, then morphs; `offset` lets two dials run out of
// phase off the same clock.
function pathAt(cycle: number, elapsed: number, offset: number) {
  const hold = cycle * 0.42
  const morph = cycle - hold
  const total = SHAPES.length
  const raw = elapsed / cycle
  const i = (Math.floor(raw) + offset) % total
  const local = (raw - Math.floor(raw)) * cycle
  let u = local <= hold ? 0 : (local - hold) / morph
  u = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
  const a = SHAPES[i].pts
  const b = SHAPES[(i + 1) % total].pts
  let d = ''
  for (let k = 0; k < a.length; k++) {
    const x = a[k][0] + (b[k][0] - a[k][0]) * u
    const y = a[k][1] + (b[k][1] - a[k][1]) * u
    d += (k ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)
  }
  return { d: d + 'Z', index: i, u }
}

export function PopWaitingLoader({
  title = 'Waiting for the game to start…',
  msPerShape = 1600,
  showCountryName = true,
}: {
  title?: string
  msPerShape?: number
  showCountryName?: boolean
}) {
  const [t, setT] = useState(0)
  const raf = useRef(0)
  const t0 = useRef(0)

  useEffect(() => {
    t0.current = performance.now()
    const loop = () => {
      raf.current = requestAnimationFrame(loop)
      setT(performance.now() - t0.current)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const cycle = msPerShape
  const B = pathAt(cycle, t, 0)

  // Copy line changes every 3 shape cycles, fading at the seam.
  const lineCycle = cycle * 3
  const lineRaw = t / lineCycle
  const lineFrac = lineRaw - Math.floor(lineRaw)
  const lineOpacity =
    lineFrac < 0.06 ? lineFrac / 0.06 : lineFrac > 0.94 ? (1 - lineFrac) / 0.06 : 1
  const line = LINES[Math.floor(lineRaw) % LINES.length]

  const name = SHAPES[B.u > 0.5 ? (B.index + 1) % SHAPES.length : B.index].name
  const nameOpacity = !showCountryName ? 0 : B.u > 0.35 && B.u < 0.65 ? 0.15 : 1

  return (
    <div className="mt-16 flex flex-col items-center gap-6 text-center">
      <style>{`@keyframes popBreathe{0%,100%{transform:translateY(0) rotate(-2deg) scale(1)}50%{transform:translateY(-6px) rotate(-2deg) scale(1.03)}}`}</style>

      <div
        className="grid place-items-center rounded-[36px] border-4 border-white"
        style={{
          width: 232,
          height: 232,
          background: POP.paper,
          boxShadow: '0 12px 0 rgba(0,0,0,0.15)',
          animation: 'popBreathe 5.2s ease-in-out infinite',
        }}
      >
        <svg viewBox="-6 -6 112 112" width={186} height={186} role="img" aria-label="Loading">
          <path
            d={B.d}
            fill={POP.sunshine}
            stroke={POP.ink}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-3.5">
        {/*       <span
          className="rounded-pill bg-white/15 px-[18px] py-[7px] text-base font-black text-white transition-opacity duration-300"
          style={{ letterSpacing: '0.02em', opacity: nameOpacity }}
        >
          {name}
        </span> */}
        <div
          className="flex min-h-[46px] max-w-[300px] items-center text-[19px] font-extrabold text-white/75 transition-opacity duration-300"
          style={{ textWrap: 'balance', opacity: lineOpacity }}
        >
          {line}
        </div>
      </div>
    </div>
  )
}

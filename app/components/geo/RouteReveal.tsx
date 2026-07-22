'use client'

import type { RouteQuestion } from '@/app/types'
import { shortestPath } from '@/lib/geo/adjacency'
import { byCca3 } from '@/lib/geo/countries'
import { RouteMap } from './RouteMap'

const name = (cca3: string) => byCca3.get(cca3)?.name ?? cca3

/** Reveal for a route question: the shortest land path from start to end, as chips. */
export function RouteReveal({ question }: { question: RouteQuestion }) {
  const path = shortestPath(question.from, question.to) ?? [question.from, question.to]
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-base font-black uppercase tracking-wide text-pop-ink/50">
        Shortest route · {question.optimalSteps} hops
      </p>
      <RouteMap from={question.from} to={question.to} chain={path} className="w-full" />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {path.map((cca3, i) => (
          <span key={`${cca3}-${i}`} className="flex items-center gap-2">
            <span className="rounded-pill border-2 border-pop-ink bg-white px-3 py-1.5 text-sm font-black text-pop-ink md:text-base">
              {name(cca3)}
            </span>
            {i < path.length - 1 && <span className="text-pop-ink/40">→</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

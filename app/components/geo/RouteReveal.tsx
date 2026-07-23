'use client'

import type { RouteQuestion, TPlayer } from '@/app/types'
import { shortestPath } from '@/lib/geo/adjacency'
import { asRouteAnswer } from '@/lib/utils'
import { stickerFill } from '../pop/theme'
import { RouteMap, type RouteOverlay } from './RouteMap'
import { RouteFlag } from './RouteFlags'
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

/**
 * Reveal for a route question: the suggested shortest land path, plus every
 * player's completed route overlaid on the map in their sticker colour with a
 * legend. Only completed routes are drawn (wrong hops are dropped here). The
 * suggested path is also listed below as flag + name chips.
 */
export function RouteReveal({
  question,
  players,
  bounded = false,
}: {
  question: RouteQuestion
  players?: TPlayer[]
  bounded?: boolean
}) {
  const path = shortestPath(question.from, question.to) ?? [question.from, question.to]

  // One overlay per player who logged a route, in their sticker colour.
  const routes: RouteOverlay[] = (players ?? [])
    .map((p) => {
      const answer = p.answers.find((a) => a.questionId === question.id)?.answer
      const routePath = asRouteAnswer(answer).path
      if (routePath.length < 2) return null
      return { path: routePath, color: stickerFill(p.color), label: p.name }
    })
    .filter(Boolean) as RouteOverlay[]

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-base font-black uppercase tracking-wide text-pop-ink/50">
        Shortest route · {question.optimalSteps} hops
      </p>
      <RouteMap
        from={question.from}
        to={question.to}
        chain={path}
        routes={routes}
        bounded={bounded}
        className="w-full"
      />
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
        {path.map((cca3, i) => (
          <Fragment key={`${cca3}-${i}`}>
            {i > 0 && (
              <ChevronRight size={18} strokeWidth={3} className="mt-4 flex-none text-pop-ink/40" />
            )}
            <RouteFlag cca3={cca3} size={44} />
          </Fragment>
        ))}
      </div>
    </div>
  )
}

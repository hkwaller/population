'use client'

import { icons as lucideIcons } from 'lucide-react'
import { categories } from '@/lib/utils'

// 8 chips scattered around the screen edges, drifting/bobbing slowly.
const SPOTS = [
  { top: '8%', left: '4%', rot: -8 },
  { top: '14%', right: '5%', rot: 7 },
  { top: '40%', left: '2%', rot: 5 },
  { top: '46%', right: '3%', rot: -6 },
  { bottom: '22%', left: '6%', rot: 8 },
  { bottom: '16%', right: '7%', rot: -7 },
  { bottom: '6%', left: '38%', rot: 4 },
  { top: '6%', left: '44%', rot: -5 },
]

export function PopChips({ opacity = 1 }: { opacity?: number }) {
  const picks = categories.slice(0, SPOTS.length)

  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden md:block" aria-hidden>
      {picks.map((cat, i) => {
        const Icon = lucideIcons[cat.icon as keyof typeof lucideIcons]
        const spot = SPOTS[i]
        return (
          <div
            key={cat.id}
            className="pop-bob absolute inline-flex items-center gap-2 rounded-pill border-4 border-white bg-white px-4 py-2.5 text-pop-ink shadow-pop"
            style={
              {
                ...spot,
                opacity,
                // @ts-ignore custom property drives the bob keyframe rotation
                '--rot': `${spot.rot}deg`,
                animationDelay: `${(i % 4) * 0.6}s`,
                transform: `rotate(${spot.rot}deg)`,
              } as React.CSSProperties
            }
          >
            {Icon && <Icon size={20} strokeWidth={2.5} />}
            <span className="text-[17px] font-black">{cat.name}</span>
          </div>
        )
      })}
    </div>
  )
}

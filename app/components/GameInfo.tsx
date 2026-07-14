'use client'

import { motion } from 'motion/react'
import CountUp from 'react-countup'

import stats from '../database/stats.json'
import { categories } from '@/lib/utils'
import { sampleSize } from 'lodash'
import { useHydrated } from '@/hooks/useHydrated'

export const GameInfo = () => {
  const mounted = useHydrated()
  const keys = Object.keys(stats)

  const selectedCategories = sampleSize(categories, 2)

  if (!mounted) {
    return null
  }

  return (
    <motion.div
      className="bg-ish-lime border-8 border-ish-ink p-6 transform -rotate-2 shadow-[6px_6px_0px_#211812]"
      whileHover={{
        rotate: 3,
      }}
    >
      <h2 className="text-xl md:text-3xl font-bold mb-4 uppercase">Features</h2>
      <ul className="list-disc list-inside text-md md:text-xl">
        <li>
          <span className="bg-ish-cobalt text-white px-2 py-1 inline w-[56px] mr-2">
            <CountUp
              start={0}
              end={stats.total || 0}
              className="text-white min-w-[56px]"
              duration={0.5}
              separator=""
            />
          </span>
          questions across {keys.length - 1} unique categories, including{' '}
          <CountUp
            start={0}
            end={selectedCategories[0]?.count || 0}
            className="bg-ish-cobalt text-white px-2 py-1 inline min-w-[50px] mr-2"
            duration={0.5}
            separator=""
          />
          {selectedCategories[0]?.name} and{' '}
          <CountUp
            start={0}
            end={selectedCategories[1]?.count || 0}
            className="bg-ish-coral text-white px-2 py-1 inline min-w-[50px] mr-2"
            duration={0.5}
            delay={0.1}
            separator=""
          />
          {selectedCategories[1]?.name} questions
        </li>
        <li>Pro users can create custom categories and questions</li>
        <li>Real-time scoring</li>
        <li>Customizable game settings</li>
      </ul>
    </motion.div>
  )
}

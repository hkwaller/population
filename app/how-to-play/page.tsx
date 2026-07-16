'use client'

import { motion } from 'motion/react'

import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { PopButton } from '../components/pop/PopButton'
import { HowToPlayContent } from '../components/HowToPlay'
import { POP, POP_SPRING } from '../components/pop/theme'

export default function HowToPlayPage() {
  return (
    <PopShell bg={POP.sky}>
      <PopHeader logoTextColor={POP.sky} right={<PopAuth tone="dark" />} />

      <div className="mx-auto max-w-2xl px-5 pb-32 pt-6 md:pt-10">
        <motion.h1
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: -1.5 }}
          transition={POP_SPRING}
          className="mb-10 text-center font-black tracking-[-0.02em] text-pop-ink"
          style={{ fontSize: 'clamp(48px, 9vw, 76px)' }}
        >
          How to play
        </motion.h1>

        <HowToPlayContent />

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <PopButton href="/new-game" variant="primary" size="lg" rotate={-1}>
            Start a party
          </PopButton>
          <PopButton href="/daily" variant="secondary" size="lg" rotate={1}>
            🗓️ Play the daily
          </PopButton>
        </div>
      </div>
    </PopShell>
  )
}

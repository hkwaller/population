'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { icons as lucideIcons, Minus, Plus, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

import { usePopStore } from '../state'
import { GameRoomProvider } from '../providers'
import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { PopButton } from '../components/pop/PopButton'
import { PopToggle } from '../components/pop/PopControls'
import { POP, POP_SPRING } from '../components/pop/theme'
import { categories, makeId } from '@/lib/utils'
import { useGame } from '@/hooks/useGame'
import { useStorage } from '@/liveblocks.config'

const CHIP_CYCLE: string[] = [POP.sunshine, POP.coral, POP.cobalt, POP.grape, POP.bubblegum, '#ffffff']
// Cobalt/coral/grape need light text; sunshine/bubblegum/white keep ink text.
const DARK_FILLS = new Set<string>([POP.coral, POP.cobalt, POP.grape])

function NewGamePageContent({ gameId }: { gameId: string }) {
  const router = useRouter()
  const refId = useRef(gameId)
  const storageLoaded = useStorage((root) => root.game) !== null
  const { isSignedIn } = useAuth()
  const { amountQuestions, selectedCategories, showQuestions, updateGame } = usePopStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    updateGame({
      me: undefined,
      players: [],
      customQuestions: [],
      customQuestionCategory: undefined,
      customQuestionsAnswered: [],
    })
    setVisible(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { send } = useGame(refId.current)

  const toggleCategory = (id: string) => {
    updateGame({
      selectedCategories: selectedCategories.includes(id)
        ? selectedCategories.filter((c) => c !== id)
        : [...selectedCategories, id],
    })
  }

  // Bulk toggle for a tier: select all if any are off, otherwise clear the tier.
  const toggleAll = (ids: string[]) => {
    const allOn = ids.every((id) => selectedCategories.includes(id))
    updateGame({
      selectedCategories: allOn
        ? selectedCategories.filter((id) => !ids.includes(id))
        : [...new Set([...selectedCategories, ...ids])],
    })
  }

  const setCount = (n: number) => updateGame({ amountQuestions: Math.min(20, Math.max(1, n)) })
  const canStart = storageLoaded && selectedCategories.length > 0

  return (
    <PopShell bg={POP.mint}>
      <PopHeader logoTextColor={POP.mint} right={<PopAuth tone="dark" />} />

      <div className="mx-auto max-w-4xl px-5 pb-40 pt-6 md:pt-10">
        <h1
          className="text-center font-black tracking-[-0.02em] text-pop-ink"
          style={{ fontSize: 'clamp(48px, 8vw, 72px)', rotate: '-1.5deg' }}
        >
          Build your quiz
        </h1>

        {/* Question count stepper */}
        <div className="mx-auto mt-10 flex max-w-xl items-center justify-between gap-4 rounded-pill bg-white px-7 py-4 shadow-pop-card">
          <span className="text-xl font-black text-pop-ink md:text-2xl">How many questions?</span>
          <div className="flex items-center gap-4">
            <StepBtn onClick={() => setCount(amountQuestions - 1)}>
              <Minus size={24} strokeWidth={3.5} />
            </StepBtn>
            <span className="w-14 text-center text-[52px] font-black leading-none" style={{ color: POP.coral }}>
              {amountQuestions}
            </span>
            <StepBtn onClick={() => setCount(amountQuestions + 1)}>
              <Plus size={24} strokeWidth={3.5} />
            </StepBtn>
          </div>
        </div>

        {/* Categories */}
        <h2 className="mt-14 text-center text-[44px] font-black leading-none text-pop-ink">
          Pick your categories
        </h2>
        <p className="mt-3 text-center text-lg font-bold text-pop-ink/70">
          Tap to toggle — greyed-out stickers sit this round out.
        </p>

        <CategorySection
          title="Main"
          cats={categories.filter((c) => c.tier === 'main')}
          selectedCategories={selectedCategories}
          onToggle={toggleCategory}
          onToggleAll={toggleAll}
          visible={visible}
        />
        <CategorySection
          title="Special"
          cats={categories.filter((c) => c.tier === 'special')}
          selectedCategories={selectedCategories}
          onToggle={toggleCategory}
          onToggleAll={toggleAll}
          visible={visible}
        />

        {/* Toggles + pro entry */}
        <div className="mx-auto mt-12 flex max-w-xl flex-col gap-4">
          <TogglePill
            label="Questions on host screen only"
            checked={!showQuestions}
            onChange={() => updateGame({ showQuestions: !showQuestions })}
          />
          {isSignedIn && (
            <PopButton
              variant="ghost"
              size="sm"
              rotate={-1}
              className="self-center"
              onClick={() => router.push(`/generate/${refId.current}`)}
            >
              <Sparkles size={18} /> Custom questions ✨
            </PopButton>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-5">
        <PopButton
          variant="primary"
          size="lg"
          rotate={-1}
          disabled={!canStart}
          onClick={async () => {
            if (!canStart) return
            await send('setup')
            router.push(`/setup/${refId.current}`)
          }}
        >
          Open the lobby <ArrowRight size={26} />
        </PopButton>
      </div>
    </PopShell>
  )
}

type Cat = (typeof categories)[number]

function CategorySection({
  title,
  cats,
  selectedCategories,
  onToggle,
  onToggleAll,
  visible,
}: {
  title: string
  cats: readonly Cat[]
  selectedCategories: string[]
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  visible: boolean
}) {
  const ids = cats.map((c) => c.id)
  const allOn = ids.every((id) => selectedCategories.includes(id))

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="flex items-center justify-center gap-3">
        <h3 className="text-2xl font-black text-pop-ink">{title}</h3>
        <button
          onClick={() => onToggleAll(ids)}
          className="rounded-pill border-2 border-pop-ink bg-white px-3 py-1 text-sm font-black text-pop-ink shadow-pop-sm"
        >
          {allOn ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-3.5">
        {cats.map((cat, i) => {
          const Icon = lucideIcons[cat.icon as keyof typeof lucideIcons]
          const selected = selectedCategories.includes(cat.id)
          const fill = CHIP_CYCLE[i % CHIP_CYCLE.length]
          const light = DARK_FILLS.has(fill)
          return (
            <motion.button
              key={cat.id}
              initial={{ scale: 0 }}
              animate={{ scale: visible ? 1 : 0, rotate: selected ? (i % 2 ? 3 : -3) : 0 }}
              transition={{ ...POP_SPRING, delay: i * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggle(cat.id)}
              className={`inline-flex items-center gap-2 rounded-pill px-5 py-3 text-[22px] font-black ${
                selected ? 'border-4 border-white shadow-pop' : ''
              }`}
              style={
                selected
                  ? { background: fill, color: light ? '#fff' : POP.ink }
                  : { background: 'rgba(255,255,255,0.45)', color: 'rgba(23,18,20,0.45)' }
              }
            >
              {Icon && <Icon size={22} strokeWidth={2.5} />}
              {cat.name}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function StepBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-pop-ink text-white shadow-pop-sm"
    >
      {children}
    </motion.button>
  )
}

function TogglePill({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-pill bg-white px-6 py-4 shadow-pop">
      <span className="text-lg font-black text-pop-ink md:text-xl">{label}</span>
      <PopToggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function NewGamePage() {
  const gameId = useRef(makeId()).current
  return (
    <GameRoomProvider gameId={gameId}>
      <NewGamePageContent gameId={gameId} />
    </GameRoomProvider>
  )
}

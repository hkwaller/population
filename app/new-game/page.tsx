'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { icons as lucideIcons, Minus, Plus, ArrowRight, Grid2x2, Keyboard } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { usePopStore } from '../state'
import { GameRoomProvider } from '../providers'
import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { PopButton } from '../components/pop/PopButton'
import { PopToggle } from '../components/pop/PopControls'
import { HowToPlayButton, HowToPlayModal } from '../components/HowToPlay'
import { POP, POP_SPRING } from '../components/pop/theme'
import { categories, makeId, INPUT_CAPABLE_CATEGORIES, type AnswerMode, type AnswerModes } from '@/lib/utils'
import { useGame } from '@/hooks/useGame'
import { useStorage } from '@/liveblocks.config'

const CHIP_CYCLE: string[] = [
  POP.sunshine,
  POP.coral,
  POP.cobalt,
  POP.grape,
  POP.bubblegum,
  '#ffffff',
]
// Cobalt/coral/grape need light text; sunshine/bubblegum/white keep ink text.
const DARK_FILLS = new Set<string>([POP.coral, POP.cobalt, POP.grape])

const DIFFICULTY_OPTIONS = [
  { id: 'all', label: 'Any', fill: POP.ink, light: true },
  { id: 'easy', label: 'Easy', fill: POP.mint, light: false },
  { id: 'medium', label: 'Medium', fill: POP.sunshine, light: false },
  { id: 'hard', label: 'Hard', fill: POP.coral, light: true },
] as const

function NewGamePageContent({ gameId }: { gameId: string }) {
  const router = useRouter()
  const refId = useRef(gameId)
  const storageLoaded = useStorage((root) => root.game) !== null
  const {
    amountQuestions,
    selectedCategories,
    selectedDifficulty,
    showQuestions,
    answerModes,
    updateGame,
  } = usePopStore()
  const [visible, setVisible] = useState(false)
  const [howToOpen, setHowToOpen] = useState(false)

  useEffect(() => {
    updateGame({
      me: undefined,
      players: [],
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

  const setMode = (id: string, mode: AnswerMode) => {
    updateGame({ answerModes: { ...answerModes, [id]: mode } })
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
      <PopHeader
        logoTextColor={POP.mint}
        right={
          <div className="flex items-center gap-3">
            <HowToPlayButton tone="dark" onClick={() => setHowToOpen(true)} />
            <PopAuth tone="dark" />
          </div>
        }
      />

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
            <span
              className="w-14 text-center text-[52px] font-black leading-none"
              style={{ color: POP.coral }}
            >
              {amountQuestions}
            </span>
            <StepBtn onClick={() => setCount(amountQuestions + 1)}>
              <Plus size={24} strokeWidth={3.5} />
            </StepBtn>
          </div>
        </div>

        {/* Difficulty */}
        <div className="mx-auto mt-6 flex max-w-xl flex-col gap-3 rounded-3xl bg-white px-7 py-5 shadow-pop-card">
          <span className="text-xl font-black text-pop-ink md:text-2xl">Difficulty</span>
          <div className="flex flex-wrap gap-2.5">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const active = selectedDifficulty === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => updateGame({ selectedDifficulty: opt.id })}
                  className={`flex-1 rounded-pill px-4 py-2.5 text-base font-black transition-colors ${
                    active ? 'border-4 border-white shadow-pop' : 'border-2 border-pop-ink/15'
                  }`}
                  style={
                    active
                      ? { background: opt.fill, color: opt.light ? '#fff' : POP.ink }
                      : { background: 'rgba(255,255,255,0.6)', color: 'rgba(23,18,20,0.5)' }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="text-sm font-bold text-pop-ink/60">
            Difficulty scales with how well-known each country is - Hard leans on the obscure ones.
          </p>
        </div>

        {/* Categories */}
        <h2 className="mt-14 text-center text-[44px] font-black leading-none text-pop-ink">
          Pick your categories
        </h2>
        <p className="mt-3 text-center text-lg font-bold text-pop-ink/70">
          Tap to toggle - greyed-out stickers sit this round out. Flags, Borders and Capitals let
          you pick options or typing.
        </p>

        <CategorySection
          title="Main"
          cats={categories.filter((c) => c.tier === 'main')}
          selectedCategories={selectedCategories}
          answerModes={answerModes}
          onToggle={toggleCategory}
          onToggleAll={toggleAll}
          onSetMode={setMode}
          visible={visible}
        />
        <CategorySection
          title="Special"
          cats={categories.filter((c) => c.tier === 'special')}
          selectedCategories={selectedCategories}
          answerModes={answerModes}
          onToggle={toggleCategory}
          onToggleAll={toggleAll}
          onSetMode={setMode}
          visible={visible}
        />

        {/* Toggles */}
        <div className="mx-auto mt-12 flex max-w-xl flex-col gap-4">
          <TogglePill
            label="Questions on host screen only"
            checked={!showQuestions}
            onChange={() => updateGame({ showQuestions: !showQuestions })}
          />
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

      <HowToPlayModal isOpen={howToOpen} onClose={() => setHowToOpen(false)} />
    </PopShell>
  )
}

type Cat = (typeof categories)[number]

function CategorySection({
  title,
  cats,
  selectedCategories,
  answerModes,
  onToggle,
  onToggleAll,
  onSetMode,
  visible,
}: {
  title: string
  cats: readonly Cat[]
  selectedCategories: string[]
  answerModes: AnswerModes
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
  onSetMode: (id: string, mode: AnswerMode) => void
  visible: boolean
}) {
  const ids = cats.map((c) => c.id)
  const allOn = ids.every((id) => selectedCategories.includes(id))

  // Which category's answer-mode popover is open (only one at a time).
  const [openMode, setOpenMode] = useState<string | null>(null)

  const handleChip = (cat: Cat) => {
    const willSelect = !selectedCategories.includes(cat.id)
    onToggle(cat.id)
    if (INPUT_CAPABLE_CATEGORIES.has(cat.id)) {
      // Every fresh selection starts on multiple choice (never remembers the last
      // mode). The badge pulses in to invite an explicit tap; deselecting closes
      // any open picker.
      if (willSelect) onSetMode(cat.id, 'choice')
      else if (openMode === cat.id) setOpenMode(null)
    }
  }

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

      {/* Click-catcher: taps outside an open popover dismiss it. */}
      {openMode && (
        <button
          aria-label="Close answer mode picker"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setOpenMode(null)}
        />
      )}

      <div className="mt-5 flex flex-wrap justify-center gap-3.5">
        {cats.map((cat, i) => {
          const Icon = lucideIcons[cat.icon as keyof typeof lucideIcons]
          const selected = selectedCategories.includes(cat.id)
          const fill = CHIP_CYCLE[i % CHIP_CYCLE.length]
          const light = DARK_FILLS.has(fill)
          const canInput = INPUT_CAPABLE_CATEGORIES.has(cat.id)
          const mode: AnswerMode = answerModes[cat.id] === 'input' ? 'input' : 'choice'
          const ModeIcon = mode === 'input' ? Keyboard : Grid2x2
          return (
            <div key={cat.id} className="relative">
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: visible ? 1 : 0, rotate: selected ? (i % 2 ? 3 : -3) : 0 }}
                transition={{ ...POP_SPRING, delay: i * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChip(cat)}
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
                {canInput && selected && (
                  <motion.span
                    role="button"
                    tabIndex={0}
                    aria-label={`Answer mode: ${mode === 'input' ? 'typing' : 'multiple choice'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMode((cur) => (cur === cat.id ? null : cat.id))
                    }}
                    // Badge mounts exactly when the category is selected, so this
                    // pop-in + double pulse is the "you can change this" nudge.
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1, 1.25, 1, 1.25, 1] }}
                    transition={{ duration: 0.9, times: [0, 0.15, 0.35, 0.55, 0.75, 1], ease: 'easeInOut' }}
                    className="ml-0.5 grid h-8 w-8 place-items-center rounded-full border-[3px] border-pop-ink/20 bg-white text-pop-ink"
                  >
                    <ModeIcon size={16} strokeWidth={2.75} />
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {openMode === cat.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.9 }}
                    transition={{ duration: 0.14 }}
                    className="absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 gap-1 rounded-2xl border-4 border-pop-ink bg-white p-1.5 shadow-pop-card"
                  >
                    <ModePill
                      active={mode === 'choice'}
                      Icon={Grid2x2}
                      label="Choose"
                      onClick={() => {
                        onSetMode(cat.id, 'choice')
                        setOpenMode(null)
                      }}
                    />
                    <ModePill
                      active={mode === 'input'}
                      Icon={Keyboard}
                      label="Type"
                      onClick={() => {
                        onSetMode(cat.id, 'input')
                        setOpenMode(null)
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ModePill({
  active,
  Icon,
  label,
  onClick,
}: {
  active: boolean
  Icon: typeof Grid2x2
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-2 text-base font-black transition-colors ${
        active ? 'bg-pop-ink text-white' : 'bg-transparent text-pop-ink/60 hover:text-pop-ink'
      }`}
    >
      <Icon size={17} strokeWidth={2.75} />
      {label}
    </button>
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
  sublabel,
  checked,
  onChange,
}: {
  label: string
  sublabel?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl bg-white px-6 py-4 shadow-pop">
      <div className="min-w-0">
        <span className="block text-lg font-black text-pop-ink md:text-xl">{label}</span>
        {sublabel && <span className="block text-sm font-bold text-pop-ink/55">{sublabel}</span>}
      </div>
      <PopToggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function NewGamePage() {
  // Stable per-mount id, computed once via a lazy initializer (reading a ref's
  // .current during render is disallowed by react-hooks rules).
  const [gameId] = useState(() => makeId())
  return (
    <GameRoomProvider gameId={gameId}>
      <NewGamePageContent gameId={gameId} />
    </GameRoomProvider>
  )
}

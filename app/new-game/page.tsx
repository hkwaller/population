'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { icons as lucideIcons, Minus, Plus, ArrowRight, Grid2x2, Keyboard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Drawer } from 'vaul'

import { usePopStore } from '../state'
import { GameRoomProvider } from '../providers'
import { PopShell } from '../components/pop/PopShell'
import { PopHeader, PopAuth } from '../components/pop/PopHeader'
import { PopButton } from '../components/pop/PopButton'
import { PopToggle } from '../components/pop/PopControls'
import { HowToPlayButton, HowToPlayModal } from '../components/HowToPlay'
import { POP, POP_SPRING } from '../components/pop/theme'
import {
  categories,
  makeId,
  INPUT_CAPABLE_CATEGORIES,
  type AnswerMode,
  type AnswerModes,
} from '@/lib/utils'
import { useGame } from '@/hooks/useGame'
import { useStorage } from '@/liveblocks.config'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { haptic } from '@/lib/native'

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

// How long the pointer must rest on a chip before its explainer appears.
const HOVER_DELAY_MS = 500
// Touch has no hover: hold a chip this long to see its explainer instead.
const LONG_PRESS_MS = 450
// A finger drifting further than this (px) is a scroll, not a long-press.
const LONG_PRESS_SLOP = 10
// Width of the explainer popover (px); used to clamp it within the viewport.
const TOOLTIP_WIDTH = 240

const DIFFICULTY_OPTIONS = [
  { id: 'all', label: 'Any', fill: POP.ink, light: true },
  { id: 'easy', label: 'Easy', fill: POP.mint, light: false },
  { id: 'medium', label: 'Medium', fill: POP.sunshine, light: false },
  { id: 'hard', label: 'Hard', fill: POP.coral, light: true },
] as const

const DIFF_LABEL: Record<string, string> = Object.fromEntries(
  DIFFICULTY_OPTIONS.map((o) => [o.id, o.label]),
)

function NewGamePageContent({ gameId }: { gameId: string }) {
  const router = useRouter()
  const refId = useRef(gameId)
  const storageLoaded = useStorage((root) => root.game) !== null
  const {
    amountQuestions,
    selectedCategories,
    selectedDifficulty,
    showQuestions,
    confidenceMode,
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

  const diffLabel = DIFF_LABEL[selectedDifficulty] ?? 'Any'

  return (
    <PopShell bg={POP.mint} chips chipsOpacity={0.35}>
      <PopHeader
        logoTextColor={POP.mint}
        right={
          <div className="flex items-center gap-3">
            <HowToPlayButton tone="dark" onClick={() => setHowToOpen(true)} />
            <PopAuth tone="dark" />
          </div>
        }
      />

      <div className="mx-auto max-w-4xl px-5 pb-52 pt-6 md:pt-10">
        <motion.h1
          initial={{ scale: 0.9, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: -1.5 }}
          transition={POP_SPRING}
          className="pop-textshadow text-center font-black tracking-[-0.02em] text-pop-ink"
          style={{ fontSize: 'clamp(48px, 8vw, 72px)' }}
        >
          Build your quiz
        </motion.h1>

        {/* Question count stepper */}
        <div className="mx-auto mt-10 flex max-w-xl items-center justify-between gap-4 rounded-pill bg-white px-7 py-4 shadow-pop-card">
          <span className="text-xl font-black text-pop-ink md:text-2xl">How many questions?</span>
          <div className="flex items-center gap-4">
            <StepBtn onClick={() => setCount(amountQuestions - 1)}>
              <Minus size={24} strokeWidth={3.5} />
            </StepBtn>
            <div className="grid w-14 place-items-center overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={amountQuestions}
                  initial={{ y: 18, scale: 0.6, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: -18, scale: 0.6, opacity: 0 }}
                  transition={POP_SPRING}
                  className="text-center text-[52px] font-black leading-none"
                  style={{ color: POP.coral }}
                >
                  {amountQuestions}
                </motion.span>
              </AnimatePresence>
            </div>
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
          Tap to toggle - greyed-out stickers sit this round out. Hold one to see what it is.
          Flags, Borders and Capitals let you pick options or typing.
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
          <TogglePill
            label="Confidence mode (bet a range on slider & map)"
            checked={confidenceMode}
            onChange={() => updateGame({ confidenceMode: !confidenceMode })}
          />
        </div>
      </div>

      {/* CTA - a live "boarding pass" reads back the quiz you built, then launches it. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex flex-col items-center gap-3 px-5">
        <QuizTicket
          count={amountQuestions}
          packs={selectedCategories.length}
          difficulty={diffLabel}
          ready={canStart}
        />
        <div className="pointer-events-auto">
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

  // Which category's answer-mode picker is open (only one at a time). On
  // desktop it's a popover under the chip; on phones a centered popover often
  // runs off-screen for edge chips, so it becomes a bottom drawer instead.
  const [openMode, setOpenMode] = useState<string | null>(null)
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const openCat = cats.find((c) => c.id === openMode)
  const openModeValue: AnswerMode = openMode && answerModes[openMode] === 'input' ? 'input' : 'choice'

  // The explainer popover. Positioned with fixed viewport coords (clamped to
  // stay on-screen) so edge chips never clip it. With a mouse it appears after
  // the pointer rests on a chip for HOVER_DELAY_MS, so brushing past chips stays
  // quiet; on touch it appears while a chip is held for LONG_PRESS_MS and goes
  // away when the finger lifts.
  const [info, setInfo] = useState<{ id: string; cx: number; bottom: number } | null>(null)
  const infoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  // Set when a long-press showed the explainer, so the release doesn't also
  // toggle the chip.
  const longPressed = useRef(false)

  const showInfoAfter = (id: string, el: HTMLElement, delay: number, onShow?: () => void) => {
    if (infoTimer.current) clearTimeout(infoTimer.current)
    infoTimer.current = setTimeout(() => {
      onShow?.()
      const r = el.getBoundingClientRect()
      // Keep the centered TOOLTIP_WIDTH box inside the viewport with an 8px gutter.
      const half = TOOLTIP_WIDTH / 2
      const cx = Math.min(Math.max(r.left + r.width / 2, 8 + half), window.innerWidth - 8 - half)
      // Anchor the popover's bottom 8px above the chip's top edge.
      setInfo({ id, cx, bottom: window.innerHeight - r.top + 8 })
    }, delay)
  }
  const hideInfo = () => {
    if (infoTimer.current) clearTimeout(infoTimer.current)
    infoTimer.current = null
    pressStart.current = null
    setInfo(null)
  }
  useEffect(() => () => void (infoTimer.current && clearTimeout(infoTimer.current)), [])

  const pressHandlers = (id: string) => ({
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') showInfoAfter(id, e.currentTarget, HOVER_DELAY_MS)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') hideInfo()
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') return
      longPressed.current = false
      pressStart.current = { x: e.clientX, y: e.clientY }
      showInfoAfter(id, e.currentTarget, LONG_PRESS_MS, () => {
        longPressed.current = true
        haptic('tap')
      })
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const start = pressStart.current
      if (e.pointerType === 'mouse' || !start || longPressed.current) return
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > LONG_PRESS_SLOP) hideInfo()
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') hideInfo()
    },
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') hideInfo()
    },
    // Swallow the click that follows a long-press (chip and mode badge alike).
    onClickCapture: (e: React.MouseEvent<HTMLElement>) => {
      if (!longPressed.current) return
      longPressed.current = false
      e.stopPropagation()
      e.preventDefault()
    },
    // Android fires contextmenu on long-press; keep it from opening anything.
    onContextMenu: (e: React.MouseEvent<HTMLElement>) => e.preventDefault(),
  })

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
      {openMode && isDesktop && (
        <button
          aria-label="Close answer mode picker"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setOpenMode(null)}
        />
      )}

      <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-3.5">
        {cats.map((cat, i) => {
          const Icon = lucideIcons[cat.icon as keyof typeof lucideIcons]
          const selected = selectedCategories.includes(cat.id)
          const fill = CHIP_CYCLE[i % CHIP_CYCLE.length]
          const light = DARK_FILLS.has(fill)
          const canInput = INPUT_CAPABLE_CATEGORIES.has(cat.id)
          const mode: AnswerMode = answerModes[cat.id] === 'input' ? 'input' : 'choice'
          const ModeIcon = mode === 'input' ? Keyboard : Grid2x2
          return (
            <div
              key={cat.id}
              className="relative select-none [-webkit-touch-callout:none]"
              {...pressHandlers(cat.id)}
            >
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: visible ? 1 : 0, rotate: selected ? (i % 2 ? 3 : -3) : 0 }}
                transition={{ ...POP_SPRING, delay: i * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChip(cat)}
                className={`inline-flex items-center gap-1.5 rounded-pill border-[3px] border-transparent px-3.5 py-2 text-base font-black sm:gap-2 sm:border-4 sm:px-5 sm:py-3 sm:text-[22px] ${
                  selected ? 'border-white shadow-pop' : ''
                }`}
                style={
                  selected
                    ? { background: fill, color: light ? '#fff' : POP.ink }
                    : { background: 'rgba(255,255,255,0.45)', color: 'rgba(23,18,20,0.45)' }
                }
              >
                {Icon && (
                  <Icon strokeWidth={2.5} className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
                )}
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
                    transition={{
                      duration: 0.9,
                      times: [0, 0.15, 0.35, 0.55, 0.75, 1],
                      ease: 'easeInOut',
                    }}
                    className="ml-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-pop-ink/20 bg-white text-pop-ink sm:h-8 sm:w-8 sm:border-[3px]"
                  >
                    <ModeIcon strokeWidth={2.75} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {isDesktop && openMode === cat.id && (
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

              {/* Explainer - floats just above the chip after a rested hover or long-press.
                  Fixed + viewport-clamped so it never clips at screen edges.
                  Suppressed while the answer-mode picker is open for this cat. */}
              <AnimatePresence>
                {info?.id === cat.id && openMode !== cat.id && (
                  <motion.div
                    role="tooltip"
                    initial={{ opacity: 0, y: 6, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.94 }}
                    transition={{ duration: 0.14 }}
                    style={{
                      width: TOOLTIP_WIDTH,
                      left: info.cx - TOOLTIP_WIDTH / 2,
                      bottom: info.bottom,
                    }}
                    className="pointer-events-none fixed z-40 rounded-2xl border-4 border-pop-ink bg-white p-3 text-center text-sm font-bold leading-snug text-pop-ink shadow-pop-card"
                  >
                    {cat.description}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {!isDesktop && (
        <Drawer.Root open={!!openCat} onOpenChange={(o) => !o && setOpenMode(null)}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-pop-ink/40" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px] border-x-4 border-t-4 border-pop-ink bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 outline-none">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-pop-ink/20" />
              <Drawer.Title className="text-center text-2xl font-black text-pop-ink">
                {openCat?.name}
              </Drawer.Title>
              <Drawer.Description className="mt-1 text-center text-base font-bold text-pop-ink/60">
                How do you want to answer?
              </Drawer.Description>
              <div className="mt-5 flex flex-col gap-3">
                {(
                  [
                    { id: 'choice', Icon: Grid2x2, label: 'Choose', hint: 'Pick from options' },
                    { id: 'input', Icon: Keyboard, label: 'Type', hint: 'Type the answer yourself' },
                  ] as const
                ).map(({ id, Icon, label, hint }) => {
                  const active = openModeValue === id
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        if (openMode) onSetMode(openMode, id)
                        setOpenMode(null)
                      }}
                      className={`flex items-center gap-4 rounded-3xl border-4 px-5 py-4 text-left transition-colors ${
                        active
                          ? 'border-pop-ink bg-pop-ink text-white'
                          : 'border-pop-ink/15 bg-white text-pop-ink'
                      }`}
                    >
                      <Icon size={26} strokeWidth={2.75} />
                      <span className="flex flex-col">
                        <span className="text-xl font-black">{label}</span>
                        <span
                          className={`text-sm font-bold ${active ? 'text-white/70' : 'text-pop-ink/55'}`}
                        >
                          {hint}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </div>
  )
}

// A small parchment "boarding pass" that floats above the start button and
// reads back the quiz you've assembled. When nothing is picked yet it turns
// into the reason the button is disabled, so the gate never feels dead.
function QuizTicket({
  count,
  packs,
  difficulty,
  ready,
}: {
  count: number
  packs: number
  difficulty: string
  ready: boolean
}) {
  // One persistent pill that swaps content/skin on `ready` rather than swapping
  // two AnimatePresence children - a mode="wait" swap here stalls the entering
  // child mid-spring and freezes it at partial opacity.
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: ready ? 1.5 : -1.5 }}
      transition={POP_SPRING}
      className={`rounded-pill border-4 px-4 py-2 text-base font-black md:text-lg ${
        ready
          ? 'border-white text-pop-ink shadow-pop-sm'
          : 'border-dashed border-pop-ink/25 text-pop-ink/55'
      }`}
      style={{ background: ready ? POP.paper : 'rgba(255,255,255,0.6)' }}
    >
      {ready ? (
        <span className="flex items-center gap-1.5">
          <TicketStat value={count} label={count === 1 ? 'question' : 'questions'} />
          <span className="opacity-30">·</span>
          <TicketStat value={packs} label={packs === 1 ? 'category' : 'categories'} />
          <span className="opacity-30">·</span>
          <span>{difficulty}</span>
        </span>
      ) : (
        'Pick a category to start'
      )}
    </motion.div>
  )
}

// One "12 questions" stat. The number remounts on change (keyed) so it gives a
// small spring pop without a nested AnimatePresence, which would deadlock inside
// the ticket's own mode="wait" presence and freeze it mid-fade.
function TicketStat({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <motion.span
        key={value}
        initial={{ y: 8, scale: 0.7, opacity: 0.3 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={POP_SPRING}
        className="inline-block tabular-nums"
        style={{ color: POP.coral }}
      >
        {value}
      </motion.span>
      {label}
    </span>
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

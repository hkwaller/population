'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { sample } from 'lodash'
import { motion, useReducedMotion } from 'motion/react'
import { UserPlus, ArrowRight, Copy, Check, Share, icons as lucideIcons } from 'lucide-react'
import { shareText } from '@/lib/native'
import { useIsNativeApp } from '@/hooks/useNative'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'

import { GameRoomProvider } from '@/app/providers'
import { makeId } from '@/lib/utils'
import { useGame } from '@/hooks/useGame'
import { useSupabase } from '@/hooks/useSupabase'
import { icons } from '@/app/icons'
import { Player } from '@/app/components/Player'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopHeader, PopAuth } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { NamePromptModal } from '@/app/components/pop/NamePromptModal'
import { HowToPlayButton, HowToPlayModal } from '@/app/components/HowToPlay'
import { POP, POP_SPRING, stickerColors, STICKER_FILLS } from '@/app/components/pop/theme'

// The room fills up like a party - the copy escalates with the head count so the
// host feels the momentum instead of reading a flat tally.
function hypeLine(n: number): string {
  if (n === 0) return 'Nobody yet - share that code!'
  if (n === 1) return 'One brave soul. Who’s next?'
  if (n === 2) return 'Two in - a rivalry brews.'
  if (n === 3) return 'Three deep. Now it’s a game.'
  if (n === 4) return 'Four strong - it’s getting loud in here.'
  return `${n} in - it’s a full house!`
}

// Pulsing three-dot ellipsis; falls back to a static char when motion is reduced.
function AnimatedDots() {
  const reduce = useReducedMotion()
  if (reduce) return <span>…</span>
  return (
    <span className="inline-flex" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        >
          .
        </motion.span>
      ))}
    </span>
  )
}

// An empty seat, held. Dashed sticker that gently breathes on the shared pop-bob.
function WaitingSticker({ rot = -2, delay = 0 }: { rot?: number; delay?: number }) {
  return (
    <div
      className="pop-bob inline-flex min-w-[128px] flex-col items-center justify-center gap-1 rounded-sticker px-5 py-4 text-center"
      style={
        {
          border: '4px dashed rgba(33,24,18,0.3)',
          '--rot': `${rot}deg`,
          animationDelay: `${delay}s`,
        } as React.CSSProperties
      }
    >
      <span className="text-lg font-black text-pop-ink/50">
        waiting
        <AnimatedDots />
      </span>
    </div>
  )
}

// A short burst of sticker-confetti, fired once each time a new player lands.
// Keyed by an incrementing trigger so it replays on remount and self-parks.
function JoinBurst({ trigger }: { trigger: number }) {
  const reduce = useReducedMotion()
  const bits = useMemo(() => {
    if (!trigger) return []
    return Array.from({ length: 14 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.5
      const dist = 55 + Math.random() * 95
      return {
        id: `${trigger}-${i}`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 24,
        rot: Math.random() * 300 - 150,
        size: 9 + Math.random() * 11,
        color: STICKER_FILLS[i % STICKER_FILLS.length],
        delay: Math.random() * 0.06,
      }
    })
  }, [trigger])

  if (reduce || !trigger) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-30 h-0 w-0" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: b.y, scale: 1, rotate: b.rot, opacity: 0 }}
          transition={{ duration: 0.9, delay: b.delay, ease: [0.22, 1, 0.36, 1] }}
          className="absolute block rounded-[5px] border-2 border-white"
          style={{ width: b.size, height: b.size, background: b.color }}
        />
      ))}
    </div>
  )
}

// Four corner brackets that frame the QR like a camera viewfinder - a wordless
// "aim here" that gently breathes.
const VIEWFINDER_CORNERS = [
  '-left-2 -top-2 border-l-[5px] border-t-[5px] rounded-tl-[12px]',
  '-right-2 -top-2 border-r-[5px] border-t-[5px] rounded-tr-[12px]',
  '-left-2 -bottom-2 border-l-[5px] border-b-[5px] rounded-bl-[12px]',
  '-right-2 -bottom-2 border-r-[5px] border-b-[5px] rounded-br-[12px]',
]

function SetupPageContent({ params }: { params: { id: string } }) {
  const { user } = useUser()
  const { game, send, closeModals, updateGame, setLocalJoinInfo } = useGame(params.id)
  const { fetchPlayerPreferences, updatePlayerPreferences } = useSupabase()
  const { players, preferences, boss, playingOnSameDevice } = game
  const [name, setName] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const isNative = useIsNativeApp()
  const [howToOpen, setHowToOpen] = useState(false)
  const [namePromptOpen, setNamePromptOpen] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const [mounted, setMounted] = useState(false)
  const prevCount = useRef(players.length)
  const reduce = useReducedMotion()
  const router = useRouter()

  // The QR encodes an absolute origin, so it can only be built on the client;
  // gate it behind mount so server and first client render agree (no hydration
  // mismatch) and the code is never wrong.
  useEffect(() => setMounted(true), [])

  // Fire a celebration burst only when the head count actually grows (never on
  // the first render, and never when someone leaves).
  useEffect(() => {
    if (players.length > prevCount.current) setBurstKey((k) => k + 1)
    prevCount.current = players.length
  }, [players.length])

  // Best-guess name from Clerk, used to seed the prompt when we have nothing saved.
  const clerkName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    ''

  // Pull saved preferences for a signed-in player if we don't already hold a
  // display_name locally - so someone who set their name on another device
  // isn't prompted again.
  useEffect(() => {
    if (!user?.id || preferences?.display_name) return
    let active = true
    fetchPlayerPreferences(user.id).then((prefs) => {
      if (active && prefs?.display_name) updateGame({ preferences: prefs as any })
    })
    return () => {
      active = false
    }
  }, [user?.id, preferences?.display_name, fetchPlayerPreferences, updateGame])

  const copyCode = async () => {
    // Native app: the share sheet with the join link (Messages, WhatsApp...).
    if (isNative) {
      await shareText(`Join my Population game: ${url}`)
      return
    }
    try {
      await navigator.clipboard.writeText(params.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) - silently ignore.
    }
  }

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${params.id}`
      : `/join/${params.id}`

  const handleContinue = async () => {
    if (!players.length || isStarting) return
    setIsStarting(true)
    if (!boss) send({ type: 'boss', payload: players.find((p) => p.localPlayer)?.id })
    closeModals()
    await send('start')
    router.push(`/game/${params.id}`)
  }

  const handleAddLocalPlayer = () => {
    const id = makeId()
    const player = {
      id,
      name,
      color: sample(stickerColors)!.id,
      localPlayer: true,
      icon: sample(Object.keys(lucideIcons))!,
    }
    send({ type: 'boss', payload: id })
    setLocalJoinInfo({ player: player as any, gameId: params.id! })
    send('join', { ...player, gameId: params.id! })
    setName('')
  }

  // Add the signed-in player to the room with a resolved display name + sticker.
  const joinAsUser = ({ name, color, icon }: { name: string; color: string; icon: string }) => {
    const id = user?.id
    const player = { id: id!, name, color, localPlayer: true, icon }
    send({ type: 'boss', payload: id })
    setLocalJoinInfo({ player: player as any, gameId: params.id! })
    send('join', { ...player, gameId: params.id! })
  }

  const handleAddMe = () => {
    // Nothing saved yet - ask for a name before joining so we never fall back to
    // the anonymous "Player" sticker.
    if (!preferences?.display_name) {
      setNamePromptOpen(true)
      return
    }
    joinAsUser({
      name: preferences.display_name,
      color: preferences.preferred_color ?? sample(stickerColors)!.id,
      icon: preferences.icon ?? sample(icons)!.name,
    })
  }

  // Persist the chosen name (with a default sticker if none set) and join.
  const handleSaveName = async (chosenName: string) => {
    if (!user?.id || savingName) return
    setSavingName(true)
    const color = preferences?.preferred_color ?? sample(stickerColors)!.id
    const icon = preferences?.icon ?? sample(icons)!.name
    try {
      await updatePlayerPreferences(user.id, color, icon, chosenName)
      updateGame({
        preferences: {
          ...preferences,
          preferred_color: color,
          icon,
          display_name: chosenName,
        } as any,
      })
      joinAsUser({ name: chosenName, color, icon })
      setNamePromptOpen(false)
    } finally {
      setSavingName(false)
    }
  }

  const ready = players.length > 0

  return (
    <PopShell bg={POP.bubblegum}>
      <PopHeader
        logoTextColor={POP.bubblegum}
        right={
          <div className="flex items-center gap-3">
            <HowToPlayButton tone="dark" onClick={() => setHowToOpen(true)} />
            <PopAuth tone="dark" />
          </div>
        }
      />

      <div className="mx-auto max-w-5xl px-5 pb-40 pt-6 md:pt-10">
        <h1
          className="text-center font-black leading-none tracking-[-0.02em] text-pop-ink"
          style={{ fontSize: 'clamp(52px, 10vw, 84px)', rotate: '-1.5deg' }}
        >
          Get in here!
        </h1>
        <p className="mt-4 text-center text-xl font-bold text-pop-ink/70">
          Scan the code, or head to the join page and enter it
        </p>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 md:mt-12 md:grid-cols-2">
          {/* QR card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            whileHover={reduce ? undefined : { y: -5, rotate: -0.5 }}
            className="relative mx-auto flex w-full max-w-sm flex-col items-center rounded-card bg-white p-5 shadow-pop-card md:p-6"
          >
            {/* "Aim your camera here" badge */}
            <motion.span
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -8 }}
              transition={{ ...POP_SPRING, delay: 0.25 }}
              className="absolute -left-3 -top-4 z-20 rounded-pill border-[3px] border-white px-3.5 py-1.5 text-sm font-black tracking-tight text-white shadow-pop"
              style={{ background: POP.cobalt }}
            >
              SCAN ME
            </motion.span>

            <div className="relative rounded-[20px] bg-white p-3">
              {VIEWFINDER_CORNERS.map((c, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className={`absolute block h-6 w-6 border-pop-ink ${c}`}
                  animate={reduce ? undefined : { opacity: [0.45, 1, 0.45] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
              {mounted ? (
                <QRCode value={url} size={204} />
              ) : (
                <div className="h-[204px] w-[204px]" aria-hidden />
              )}
            </div>

            <div className="mt-5 flex items-center gap-2 md:mt-6">
              <span
                className="rounded-pill border-[3px] border-pop-ink px-5 py-2.5 text-xl font-black text-pop-ink"
                style={{ background: POP.sunshine }}
              >
                {params.id}
              </span>
              <motion.button
                onClick={copyCode}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                aria-label={isNative ? 'Share invite link' : copied ? 'Code copied' : 'Copy game code'}
                className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-pop-ink bg-white text-pop-ink transition-colors active:bg-pop-ink active:text-white"
              >
                {copied ? (
                  <motion.span
                    initial={reduce ? false : { scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 14 }}
                  >
                    <Check size={20} strokeWidth={3} />
                  </motion.span>
                ) : isNative ? (
                  <Share size={20} strokeWidth={3} />
                ) : (
                  <Copy size={20} strokeWidth={3} />
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Players */}
          <div className="relative">
            <JoinBurst key={burstKey} trigger={burstKey} />

            <div className="mb-5 flex items-center gap-3">
              <motion.span
                key={players.length}
                initial={reduce ? false : { scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: -4 }}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 15 }}
                className="grid h-11 min-w-[44px] place-items-center rounded-sticker border-[3px] border-white px-2 text-2xl font-black text-pop-ink shadow-pop"
                style={{ background: POP.sunshine }}
              >
                {players.length}
              </motion.span>
              <motion.p
                key={hypeLine(players.length)}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl font-black leading-tight text-pop-ink"
              >
                {hypeLine(players.length)}
              </motion.p>
            </div>

            <div className="flex flex-wrap items-start gap-4">
              {players.map((player, index) => (
                <Player
                  key={player.id}
                  id={player.id}
                  index={index}
                  name={player.name}
                  icon={player.icon}
                  color={player.color || stickerColors[0].id}
                  send={send}
                  setBoss={() =>
                    send({ type: 'boss', payload: boss === player.id ? undefined : player.id })
                  }
                />
              ))}
              {/* Empty seats, held open */}
              <WaitingSticker rot={-2} delay={0} />
              {players.length === 0 && <WaitingSticker rot={3} delay={0.9} />}
            </div>

            {ready && (
              <p className="mt-6 text-lg font-bold text-pop-ink/70">
                Tap a sticker to crown the host.
              </p>
            )}

            {user && !players.find((p) => p.id === user.id) && (
              <motion.button
                onClick={handleAddMe}
                whileHover={reduce ? undefined : { y: -2, rotate: -1 }}
                whileTap={reduce ? undefined : { scale: 0.96, y: 2 }}
                className="mt-4 inline-flex items-center gap-3 rounded-pill bg-pop-ink px-5 py-3 text-lg font-black text-white shadow-pop-btn"
              >
                Add me
                {user.imageUrl && (
                  <Image
                    src={user.imageUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
              </motion.button>
            )}

            {!players.find((p) => p.localPlayer) && (
              <div className="mt-4">
                {!playingOnSameDevice ? (
                  <motion.button
                    onClick={() => updateGame({ playingOnSameDevice: true })}
                    whileHover={reduce ? undefined : { y: -2, rotate: 1 }}
                    whileTap={reduce ? undefined : { scale: 0.96, y: 2 }}
                    className="inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-lg font-black text-pop-ink shadow-pop"
                  >
                    <UserPlus size={20} /> Add player on this device
                  </motion.button>
                ) : (
                  <div className="flex max-w-sm items-center gap-2 rounded-pill bg-white p-2 pl-5 shadow-pop">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim()) handleAddLocalPlayer()
                      }}
                      maxLength={15}
                      placeholder="name"
                      className="min-w-0 flex-1 bg-transparent text-xl font-black text-pop-ink outline-none placeholder:text-[rgba(33,24,18,0.35)]"
                    />
                    <motion.button
                      onClick={handleAddLocalPlayer}
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                      className="shrink-0 rounded-pill px-5 py-2.5 text-lg font-black text-white"
                      style={{ background: POP.coral }}
                    >
                      Add
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-5">
        {!ready ? (
          <div
            className="pop-bob inline-flex items-center gap-2 rounded-pill border-[3px] border-dashed border-pop-ink/40 bg-white/85 px-8 py-4 text-xl font-black text-pop-ink/70"
            style={{ ['--rot' as any]: '1deg' }}
          >
            Waiting for players
            <AnimatedDots />
          </div>
        ) : (
          <motion.div
            animate={reduce ? undefined : { rotate: [1, -1.5, 1], y: [0, -3, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PopButton
              variant="primary"
              size="lg"
              rotate={0}
              disabled={isStarting}
              onClick={handleContinue}
            >
              {isStarting ? (
                'Starting…'
              ) : (
                <>
                  Everyone&apos;s in - let&apos;s go! <ArrowRight size={26} />
                </>
              )}
            </PopButton>
          </motion.div>
        )}
      </div>

      <HowToPlayModal isOpen={howToOpen} onClose={() => setHowToOpen(false)} />

      <NamePromptModal
        isOpen={namePromptOpen}
        initialName={clerkName}
        saving={savingName}
        onSave={handleSaveName}
        onClose={() => setNamePromptOpen(false)}
      />
    </PopShell>
  )
}

export default function SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  return (
    <GameRoomProvider gameId={resolvedParams.id}>
      <SetupPageContent params={resolvedParams} />
    </GameRoomProvider>
  )
}

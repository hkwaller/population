'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { sample } from 'lodash'
import { motion } from 'motion/react'
import { UserPlus, ArrowRight, Copy, Check, icons as lucideIcons } from 'lucide-react'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'

import { GameRoomProvider } from '@/app/providers'
import { makeId } from '@/lib/utils'
import { useGame } from '@/hooks/useGame'
import { icons } from '@/app/icons'
import { Player } from '@/app/components/Player'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopHeader, PopAuth } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { PopInput } from '@/app/components/pop/PopControls'
import { HowToPlayButton, HowToPlayModal } from '@/app/components/HowToPlay'
import { POP, stickerColors } from '@/app/components/pop/theme'

function SetupPageContent({ params }: { params: { id: string } }) {
  const { user } = useUser()
  const { game, send, closeModals, updateGame, setLocalJoinInfo } = useGame(params.id)
  const { players, preferences, boss, playingOnSameDevice } = game
  const [name, setName] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [howToOpen, setHowToOpen] = useState(false)
  const router = useRouter()

  const copyCode = async () => {
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

  const handleAddPlayer = ({ type }: { type: 'user' | 'local' }) => {
    const id = type === 'user' ? user?.id : makeId()
    const player = {
      id: id!,
      ...(type === 'user'
        ? {
            name:
              preferences.display_name ||
              user?.fullName ||
              user?.firstName ||
              user?.username ||
              user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
              'Player',
            color: preferences.preferred_color ?? sample(stickerColors)!.id,
            localPlayer: true,
            icon: preferences.icon ?? sample(icons)?.name,
          }
        : {
            name,
            color: sample(stickerColors)!.id,
            localPlayer: true,
            icon: sample(Object.keys(lucideIcons))!,
          }),
    }
    send({ type: 'boss', payload: id })
    setLocalJoinInfo({ player: player as any, gameId: params.id! })
    send('join', { ...player, gameId: params.id! })
    setName('')
  }

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

        <div className="mt-12 grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {/* QR card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto flex w-full max-w-sm flex-col items-center rounded-card bg-white p-6 shadow-pop-card"
          >
            <div className="rounded-[20px] bg-white p-2">
              <QRCode value={url} size={240} />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <span
                className="rounded-pill border-[3px] border-pop-ink px-5 py-2.5 text-xl font-black text-pop-ink"
                style={{ background: POP.sunshine }}
              >
                {params.id}
              </span>
              <button
                onClick={copyCode}
                aria-label={copied ? 'Code copied' : 'Copy game code'}
                className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-pop-ink bg-white text-pop-ink transition-colors active:bg-pop-ink active:text-white"
              >
                {copied ? <Check size={20} strokeWidth={3} /> : <Copy size={20} strokeWidth={3} />}
              </button>
            </div>
          </motion.div>

          {/* Players */}
          <div>
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
              {/* Ghost waiting sticker */}
              <div
                className="inline-flex min-w-[128px] flex-col items-center justify-center gap-1 rounded-sticker px-5 py-4 text-center"
                style={{ border: '4px dashed rgba(23,18,20,0.35)' }}
              >
                <span className="text-lg font-black text-pop-ink/40">waiting for more…</span>
              </div>
            </div>

            <p className="mt-6 text-lg font-bold text-pop-ink/70">
              {players.length === 0
                ? 'Nobody yet - share that code!'
                : `${players.length} ${players.length === 1 ? 'player' : 'players'} in. Tap a sticker to crown the host.`}
            </p>

            {user && !players.find((p) => p.id === user.id) && (
              <button
                onClick={() => handleAddPlayer({ type: 'user' })}
                className="mt-4 inline-flex items-center gap-3 rounded-pill bg-pop-ink px-5 py-3 text-lg font-black text-white"
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
              </button>
            )}

            {!players.find((p) => p.localPlayer) && (
              <div className="mt-4">
                {!playingOnSameDevice ? (
                  <button
                    onClick={() => updateGame({ playingOnSameDevice: true })}
                    className="inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-lg font-black text-pop-ink shadow-pop"
                  >
                    <UserPlus size={20} /> Add player on this device
                  </button>
                ) : (
                  <div className="flex max-w-sm items-center gap-2 rounded-pill bg-white p-2 pl-5 shadow-pop">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={15}
                      placeholder="name"
                      className="min-w-0 flex-1 bg-transparent text-xl font-black text-pop-ink outline-none placeholder:text-[rgba(23,18,20,0.35)]"
                    />
                    <button
                      onClick={() => handleAddPlayer({ type: 'local' })}
                      className="shrink-0 rounded-pill px-5 py-2.5 text-lg font-black text-white"
                      style={{ background: POP.coral }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-5">
        <PopButton
          variant="primary"
          size="lg"
          rotate={1}
          disabled={!players.length || isStarting}
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
      </div>

      <HowToPlayModal isOpen={howToOpen} onClose={() => setHowToOpen(false)} />
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

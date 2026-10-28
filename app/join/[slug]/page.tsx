'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'motion/react'
import { useUser } from '@clerk/nextjs'
import { ArrowRight } from 'lucide-react'

import { GameRoomProvider } from '@/app/providers'
import { Reconnect } from '@/app/components/Reconnect'
import { icons } from '@/app/icons'
import { makeId } from '@/lib/utils'
import { useRoom } from '@/hooks/partyRoom'
import { useGame } from '@/hooks/useGame'
import { PopShell } from '@/app/components/pop/PopShell'
import { PopHeader } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { PopInput } from '@/app/components/pop/PopControls'
import { POP, stickerColors } from '@/app/components/pop/theme'
import { PlayerStickerPicker } from '@/app/components/pop/PlayerStickerPicker'

function JoinPageContent({ params }: { params: { slug: string } }) {
  const [playerName, setPlayerName] = useState('')
  const [showReconnect, setShowReconnect] = useState(false)
  const [selectedColor, setSelectedColor] = useState(stickerColors[0].id)
  const [selectedIcon, setSelectedIcon] = useState(icons[0].name)

  const { user } = useUser()
  const { myPlayer } = useRoom()
  const joining = useRef(false)
  const { game, send, closeModals, resetGame, setLocalJoinInfo } = useGame(params.slug)
  const { preferences, gameStartedAt, command, endedAt, me } = game
  const generatedId = useRef(makeId())
  const router = useRouter()

  async function handleJoin({
    name,
    icon,
    color,
    id,
  }: {
    name: string
    icon: string
    color: string
    id: string
  }) {
    if (!name || !icon || !color || joining.current) return
    if (myPlayer) {
      setLocalJoinInfo({ player: myPlayer, gameId: params.slug })
      router.push(`/game/${params.slug}/${myPlayer.id}`)
      return
    }
    joining.current = true
    resetGame()
    const player = { name, id, color, icon: icon as any }
    setLocalJoinInfo({ player, gameId: params.slug })
    closeModals()
    try { await send('join', { gameId: params.slug, ...player }) }
    finally { joining.current = false }
    router.push(`/game/${params.slug}/${player.id}`)
  }

  useEffect(() => {
    if (!gameStartedAt) return
    const parsedStartDate = new Date(gameStartedAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (command !== 'end' && gameStartedAt && parsedStartDate > today && me && !endedAt) {
      setShowReconnect(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command, gameStartedAt])

  return (
    <PopShell bg={POP.ink} className="pop-scroll">
      <PopHeader logoTextColor={POP.ink} />

      <div className="mx-auto max-w-lg px-5 pb-40 pt-6">
        {showReconnect && <Reconnect />}

        <h1
          className="text-center font-black leading-none tracking-[-0.02em] text-white"
          style={{ fontSize: 'clamp(56px, 14vw, 84px)' }}
        >
          You&apos;re in!
        </h1>

        {!!user && !!preferences?.display_name && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() =>
              handleJoin({
                name: preferences.display_name,
                icon: preferences.icon as any,
                color: preferences.preferred_color,
                id: user.id,
              })
            }
            className="mt-8 flex w-full items-center justify-between rounded-card bg-white p-5 shadow-pop-card"
          >
            <span className="text-2xl font-black text-pop-ink">Jump in as {user.fullName}</span>
            {user.imageUrl && (
              <Image src={user.imageUrl} alt="" width={52} height={52} className="rounded-full" />
            )}
          </motion.button>
        )}

        {/* Name */}
        <label className="mt-10 block text-xl font-black text-white">Your name</label>
        <div className="mt-3">
          <PopInput
            value={playerName}
            onChange={setPlayerName}
            placeholder="who are you?"
            maxLength={12}
          />
        </div>

        <div className="mt-8">
          <PlayerStickerPicker
            colorId={selectedColor}
            iconName={selectedIcon}
            onColorChange={setSelectedColor}
            onIconChange={setSelectedIcon}
            tone="light"
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-6 z-20 flex justify-center px-5">
        <PopButton
          variant="action"
          size="lg"
          className="w-full max-w-md"
          onClick={() =>
            handleJoin({
              name: playerName,
              icon: selectedIcon,
              color: selectedColor,
              id: generatedId.current,
            })
          }
        >
          Take the stage <ArrowRight size={26} />
        </PopButton>
      </div>
    </PopShell>
  )
}

export default function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params)
  return (
    <GameRoomProvider gameId={resolvedParams.slug}>
      <JoinPageContent params={resolvedParams} />
    </GameRoomProvider>
  )
}

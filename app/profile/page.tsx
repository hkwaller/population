'use client'

import { createElement, useEffect, useState } from 'react'
import { icons as lucideIcons } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'

import { usePopStore } from '../state'
import { icons } from '@/app/icons'
import { TGame } from '../types'
import { useSupabase } from '@/hooks/useSupabase'
import { PopShell } from '../components/pop/PopShell'
import { PopHeader } from '../components/pop/PopHeader'
import { PopButton } from '../components/pop/PopButton'
import { POP, stickerColors, stickerFill } from '../components/pop/theme'

export default function Profile() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { updateGame, preferences } = usePopStore()
  const [games, setGames] = useState<TGame[]>([])

  const { loading, fetchGamesFromSupabase, updatePlayerPreferences, fetchPlayerPreferences } =
    useSupabase()

  // Signed-out visitors are bounced home. Derived from auth state (not stored)
  // so we don't setState inside an effect.
  const isRedirecting = isLoaded && !user

  useEffect(() => {
    if (isRedirecting) {
      window.location.href = '/'
    }
  }, [isRedirecting])

  useEffect(() => {
    async function getGames() {
      if (!user?.id) return
      const prefs = await fetchPlayerPreferences(user.id)
      const data = await fetchGamesFromSupabase(user.id)
      setGames(data as any)
      updateGame({ preferences: prefs as any })
    }
    getGames()
  }, [fetchGamesFromSupabase, fetchPlayerPreferences, updateGame, user?.id])

  if (isRedirecting) return <div className="p-8 text-xl font-bold">Redirecting…</div>

  const name = preferences?.display_name ?? ''
  const iconName = preferences?.icon ?? icons[0].name
  const colorId = preferences?.preferred_color ?? stickerColors[0].id
  const PreviewIcon = lucideIcons[iconName as keyof typeof lucideIcons]

  const wins = games.filter(
    (g) => g.winner?.display_name === name || (g.winner as any)?.id === user?.id,
  ).length

  const set = (patch: Record<string, any>) =>
    updateGame({ preferences: { ...preferences, ...patch } as any })

  return (
    <PopShell bg={POP.sunshine}>
      <PopHeader
        logoTone="ink"
        right={
          <PopButton
            variant="ghost"
            size="sm"
            rotate={2}
            onClick={() => signOut({ redirectUrl: '/' })}
          >
            Sign out
          </PopButton>
        }
      />

      <div className="mx-auto max-w-5xl px-5 pb-24 pt-6 md:pt-10">
        <h1
          className="font-black tracking-[-0.02em] text-pop-ink"
          style={{ fontSize: 'clamp(48px, 9vw, 72px)', rotate: '-1.5deg' }}
        >
          Your sticker
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Editor */}
          <div className="rounded-[40px] bg-white p-7 shadow-pop-card" style={{ rotate: '-1deg' }}>
            <label className="block text-lg font-black text-pop-ink">Name</label>
            <input
              value={name}
              onChange={(e) => set({ display_name: e.target.value })}
              className="mt-2 w-full rounded-pill px-5 py-3 text-xl font-extrabold text-pop-ink outline-none focus:ring-4 focus:ring-pop-ink"
              style={{ background: POP.paper }}
            />

            <label className="mt-6 block text-lg font-black text-pop-ink">Icon</label>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {icons.map((icon, i) => {
                const Icon = lucideIcons[icon.name as keyof typeof lucideIcons]
                const sel = iconName === icon.name
                return (
                  <button
                    key={icon.name}
                    onClick={() => set({ icon: icon.name })}
                    className="flex h-[62px] w-[62px] items-center justify-center rounded-[20px]"
                    style={{
                      background: sel ? stickerFill(colorId) : POP.paper,
                      border: sel ? '4px solid #211812' : 'none',
                      rotate: sel ? `${i % 2 ? 3 : -3}deg` : '0deg',
                    }}
                  >
                    {Icon && createElement(Icon, { size: 26, className: 'text-pop-ink' })}
                  </button>
                )
              })}
            </div>

            <label className="mt-6 block text-lg font-black text-pop-ink">Color</label>
            <div className="mt-2 flex gap-3">
              {stickerColors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => set({ preferred_color: c.id })}
                  className={`h-12 w-12 rounded-full ${colorId === c.id ? 'border-4 border-pop-ink' : ''}`}
                  style={{ background: c.hex }}
                  aria-label={c.id}
                />
              ))}
            </div>

            <div className="mt-8">
              <PopButton
                variant="primary"
                size="md"
                onClick={async () => {
                  const data = await updatePlayerPreferences(
                    user?.id!,
                    colorId,
                    iconName as any,
                    name,
                  )
                  if (data) updateGame({ preferences: data })
                }}
              >
                {loading ? 'Saving…' : 'Save my sticker'}
              </PopButton>
            </div>
          </div>

          {/* Preview + track record */}
          <div className="flex flex-col gap-6">
            <div className="rounded-[32px] bg-white/40 p-6">
              <span className="text-sm font-black uppercase tracking-wide text-pop-ink/60">
                Live preview
              </span>
              <div className="mt-4 flex justify-center">
                <div
                  className="inline-flex min-w-[140px] flex-col items-center gap-1 rounded-sticker border-4 border-white px-6 py-5 shadow-pop"
                  style={{ background: stickerFill(colorId), rotate: '-2deg' }}
                >
                  <div className="flex items-center gap-2">
                    {PreviewIcon &&
                      createElement(PreviewIcon, { size: 26, className: 'text-pop-ink' })}
                    <span className="text-2xl font-black text-pop-ink">{name || 'you'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-6 shadow-pop-card">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-pop-ink">Your track record</span>
              </div>
              <div className="mt-4 flex gap-6">
                <Stat value={games.length} label="games" />
                <Stat value={wins} label="wins" />
                <Stat
                  value={games.reduce((a, g) => a + (g.players?.length ?? 0), 0)}
                  label="rivals"
                />
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                {games
                  .slice()
                  .sort(
                    (a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime(),
                  )
                  .slice(0, 8)
                  .map((game) => {
                    const won =
                      game.winner?.display_name === name || (game.winner as any)?.id === user?.id
                    return (
                      <div
                        key={game.id}
                        className="flex items-center justify-between rounded-2xl px-4 py-3"
                        style={{ background: won ? POP.sunshine : POP.paper }}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-lg font-extrabold text-pop-ink">
                            {game.gameId ?? game.id}
                          </div>
                          <div className="text-xs font-bold text-pop-ink/50">
                            {new Date(game.finished_at).toLocaleDateString()} ·{' '}
                            {game.players?.length ?? 0} players
                          </div>
                        </div>
                        <span className="shrink-0 text-lg font-black text-pop-ink">
                          {won ? '🏆' : `${game.players?.length ?? 0}p`}
                        </span>
                      </div>
                    )
                  })}
                {games.length === 0 && (
                  <p className="text-lg font-bold text-pop-ink/50">No games yet - start a party!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PopShell>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-[34px] font-black leading-none text-pop-ink">{value}</div>
      <div className="text-sm font-bold text-pop-ink/60">{label}</div>
    </div>
  )
}

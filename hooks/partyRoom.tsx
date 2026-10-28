'use client'
import PartySocket from 'partysocket'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { applyAction, type Action, type GameState, type RoomMessage } from '@/lib/partyRoom'

type Status = 'initial' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
type Room = {
  myPlayer?: GameState['players'][number]
  state: GameState | null
  status: Status
  send: (action: Action) => Promise<void>
}
const Context = createContext<Room | null>(null)
export function useRoom() {
  const room = useContext(Context)
  if (!room) throw new Error('PartyRoomProvider is missing')
  return room
}
export const useStorage = <T,>(select: (root: { game: GameState }) => T): T | null => {
  const { state } = useRoom()
  return state ? select({ game: state }) : null
}
export const useRoomStatus = () => useRoom().status

export function PartyRoomProvider({ code, children }: { code: string; children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null)
  const [status, setStatus] = useState<Status>(
    process.env.NEXT_PUBLIC_PARTY_HOST ? 'connecting' : 'disconnected',
  )
  const socket = useRef<PartySocket | null>(null)
  const identity = useRef('')
  const [actorId, setActorId] = useState('')
  const online = useRef<string[]>([])
  const pending = useRef(
    new Map<
      string,
      { resolve: () => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }
    >(),
  )
  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_PARTY_HOST
    // Room changes remount the provider; connection state is driven by socket events.
    if (!host) return
    let guestId = localStorage.getItem('population-party-device')
    if (!guestId) {
      guestId = `anon_${crypto.randomUUID()}`
      localStorage.setItem('population-party-device', guestId)
    }
    let active = true
    let opened = false
    const s = new PartySocket({
      host,
      party: 'room',
      room: code,
      query: async () => {
        const res = await fetch('/api/party-auth', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ room: code, guestId }),
        })
        if (!res.ok) {
          if (active) setStatus('disconnected')
          throw new Error(`Room authorization failed (${res.status})`)
        }
        const ticket = await res.json()
        identity.current = ticket.id
        if (active) setActorId(ticket.id)
        return { ticket: ticket.ticket }
      },
    })
    s.addEventListener('open', () => {
      opened = true
      if (active) setStatus('connected')
    })
    s.addEventListener('close', () => {
      if (active) setStatus(opened ? 'reconnecting' : 'connecting')
    })
    s.addEventListener('message', (e: MessageEvent) => {
      if (!active) return
      try {
        const msg = JSON.parse(String(e.data)) as RoomMessage
        if (msg.type !== 'state') return
        online.current = msg.online
        setState(msg.state)
        if (msg.ack) {
          const p = pending.current.get(msg.ack)
          if (p) {
            clearTimeout(p.timer)
            p.resolve()
            pending.current.delete(msg.ack)
          }
        }
      } catch {}
    })
    socket.current = s
    const requests = pending.current
    return () => {
      active = false
      s.close()
      socket.current = null
      for (const p of requests.values()) {
        clearTimeout(p.timer)
        p.reject(new Error('Room closed'))
      }
      requests.clear()
    }
  }, [code])
  const send = useCallback(
    (action: Action) =>
      new Promise<void>((resolve, reject) => {
        if (!socket.current) {
          reject(new Error('Room is not connected'))
          return
        }
        const id = crypto.randomUUID()
        const timer = setTimeout(() => {
          pending.current.delete(id)
          reject(new Error('Room action timed out'))
        }, 15000)
        pending.current.set(id, { resolve, reject, timer })
        socket.current.send(JSON.stringify({ id, action }))
        if (action.type === 'answer' || action.type === 'join') {
          setState((s) =>
            s ? applyAction(s, identity.current, new Set(online.current), action) : s,
          )
        }
      }),
    [],
  )
  const value = useMemo(
    () => ({
      state,
      status,
      send,
      myPlayer: state?.players.find((p) => state.owners[p.id] === actorId),
    }),
    [state, status, send, actorId],
  )
  return (
    <Context.Provider value={value}>
      {status !== 'initial' && status !== 'connected' && (
        <div
          role="status"
          className="fixed left-1/2 top-3 z-[100] -translate-x-1/2 rounded-xl bg-pop-ink px-4 py-2 text-sm font-bold text-white"
        >
          {status === 'disconnected'
            ? 'Room connection unavailable. Try reloading.'
            : status === 'reconnecting'
            ? 'Reconnecting to your room…'
            : 'Connecting to your room…'}
        </div>
      )}
      {children}
    </Context.Provider>
  )
}

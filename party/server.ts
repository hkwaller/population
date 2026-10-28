/**
 * PartyServer backend for multiplayer rooms. One Durable Object per room code. The
 * server owns the state: clients send actions, it applies the rules in
 * lib/partyRoom.ts, saves, and broadcasts the whole room (a few KB) to everyone.
 *
 * Dev: npm run party:dev. Deploy: npm run party:deploy (see party/README.md).
 */
import {
  routePartykitRequest,
  Server,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from 'partyserver'
import {
  applyAction,
  initialRoom,
  parseAction,
  type GameState,
  type RoomMessage,
} from '../lib/partyRoom'
import { verifyRoomTicket } from '../lib/roomTicket'

type Env = { Room: DurableObjectNamespace<Room>; PARTY_SECRET: string }
import atlas from '../public/geo/countries-50m.json'
import { installCountryGeometry } from '../lib/geo/geometry'
installCountryGeometry(atlas)

type Who = { id: string; name: string }

/** Rooms nobody touched for this long are wiped, so a reused code starts clean. */
const IDLE_MS = 24 * 60 * 60 * 1000

export class Room extends Server<Env> {
  // Idle sockets cost nothing while hibernating; onStart reloads the state on wake.
  static options = { hibernate: true }

  game: GameState = initialRoom()

  async onStart() {
    this.game = (await this.ctx.storage.get<GameState>('game')) ?? initialRoom()
  }

  async onConnect(conn: Connection<Who>, ctx: ConnectionContext) {
    const ticket = new URL(ctx.request.url).searchParams.get('ticket') ?? ''
    const who = this.env.PARTY_SECRET
      ? await verifyRoomTicket(ticket, this.name, this.env.PARTY_SECRET)
      : null
    if (!who) return conn.close(4001, 'Unauthorized') // onBeforeConnect already refused it; belt and braces
    conn.setState(who)
    this.push()
  }

  onClose(conn: Connection<Who>) {
    this.push(conn.id)
  }

  async onMessage(conn: Connection<Who>, raw: WSMessage) {
    const who = conn.state
    if (!who || typeof raw !== 'string') return
    let action
    try {
      if (raw.length > 500_000) return
      action = parseAction(JSON.parse(raw).action)
    } catch {
      return
    }
    if (!action) return
    const next = applyAction(this.game, who.id, this.online(), action)
    if (next === this.game) {
      this.push(undefined, JSON.parse(raw).id)
      return
    }
    this.game = next
    await this.ctx.storage.put('game', next)
    await this.ctx.storage.setAlarm(Date.now() + IDLE_MS)
    this.push(undefined, JSON.parse(raw).id)
  }

  async onAlarm() {
    await this.ctx.storage.deleteAll()
    this.game = initialRoom()
    for (const c of this.getConnections()) c.close(4000, 'Room expired')
  }

  /** User ids with an open, authorized socket. `closing` is a socket that is going away. */
  online(closing?: string): Set<string> {
    const ids = new Set<string>()
    for (const c of this.getConnections<Who>()) if (c.id !== closing && c.state) ids.add(c.state.id)
    return ids
  }

  push(closing?: string, ack?: string) {
    const msg: RoomMessage = {
      type: 'state',
      state: this.game,
      online: [...this.online(closing)],
      ack,
    }
    const without = [...this.getConnections<Who>()]
      .filter((c) => c.id === closing || !c.state)
      .map((c) => c.id)
    this.broadcast(JSON.stringify(msg), without)
  }
}

export default {
  async fetch(req, env) {
    const res = await routePartykitRequest(req, env, {
      // Refuse a socket without a valid ticket before it reaches (and wakes) the room.
      onBeforeConnect: async (r, lobby) => {
        const ticket = new URL(r.url).searchParams.get('ticket') ?? ''
        if (!env.PARTY_SECRET || !(await verifyRoomTicket(ticket, lobby.name, env.PARTY_SECRET)))
          return new Response('Unauthorized', { status: 401 })
      },
    })
    return res ?? new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>

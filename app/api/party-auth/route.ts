import { auth, currentUser } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { signRoomTicket } from '@/lib/roomTicket'

export async function POST(req: NextRequest) {
  const secret = process.env.PARTY_SECRET
  if (!secret) return new Response('Room service is not configured', { status: 503 })
  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const { room, guestId } = body ?? {}
  if (
    typeof room !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,120}$/.test(room) ||
    typeof guestId !== 'string' ||
    !/^anon_[a-f0-9-]{36}$/.test(guestId)
  )
    return new Response('Bad room or identity', { status: 400 })
  const { userId } = await auth()
  const user = userId ? await currentUser() : null
  const id = userId ?? guestId
  const ticket = await signRoomTicket({ room, id, name: user?.fullName ?? 'Guest' }, secret)
  return Response.json({ ticket, id }, { headers: { 'Cache-Control': 'no-store' } })
}

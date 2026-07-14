import { Liveblocks } from '@liveblocks/node'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  const { room } = await req.json()

  const user = userId ? await currentUser() : null

  const identity = user
    ? {
        id: user.id,
        info: {
          name:
            user.fullName ??
            user.emailAddresses[0]?.emailAddress ??
            'Player',
          isAnonymous: false,
        },
      }
    : {
        id: `anon_${crypto.randomUUID()}`,
        info: { name: 'Guest', isAnonymous: true },
      }

  const session = liveblocks.prepareSession(identity.id, {
    userInfo: identity.info,
  })

  session.allow(room, session.FULL_ACCESS)

  const { status, body } = await session.authorize()
  return new Response(body, { status })
}

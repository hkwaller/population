import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Delete the signed-in account: remove stats and history from Supabase
 * (`population.delete_identity`), then delete the Clerk user. The id comes
 * from Clerk, never the request, so this can only ever delete yourself.
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  try {
    const clerk = await clerkClient()
    const { error } = await supabaseAdmin().rpc('delete_identity', { p_id: userId })
    if (error) throw error

    await clerk.users.deleteUser(userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete-account failed', err)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

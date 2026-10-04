import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Delete the signed-in account (App Store rule 5.1.1(v)): any running ad-free
 * subscription is cancelled so it stops billing, then the stats and history in
 * Supabase (`population.delete_identity`), then the Clerk user. The id comes
 * from Clerk, never the request, so this can only ever delete yourself.
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const customerId = (user.privateMetadata as { stripeCustomerId?: string })?.stripeCustomerId
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
      for (const sub of subs.data) {
        if (sub.status !== 'canceled' && sub.status !== 'incomplete_expired') {
          await stripe.subscriptions.cancel(sub.id)
        }
      }
    }

    const { error } = await supabaseAdmin().rpc('delete_identity', { p_id: userId })
    if (error) throw error

    await clerk.users.deleteUser(userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete-account failed', err)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

'use client'

import { useUser } from '@clerk/nextjs'

import { isAdFree, type AdFreePublicMetadata } from '@/lib/entitlement'

/**
 * Whether the current user should be shown ads.
 *
 * Ad-free requires a signed-in Clerk user with a live `adFreeUntil` in their
 * public metadata. Guests have no ad-free entitlement. Returns `{ loading }`
 * so callers can avoid a flash of ads before Clerk hydrates.
 */
export function useAdFree(): { adFree: boolean; loading: boolean } {
  const { user, isLoaded } = useUser()
  if (!isLoaded) return { adFree: false, loading: true }
  const meta = (user?.publicMetadata ?? {}) as AdFreePublicMetadata
  return { adFree: isAdFree(meta), loading: false }
}

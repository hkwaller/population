/**
 * Ad-free entitlement, stored on the Clerk user and read on both client & server.
 *
 * publicMetadata (client-readable via useUser):
 *   adFreeUntil:  ISO timestamp - ads hidden while this is in the future
 *
 * Kept independent of the purchase provider for future native in-app purchases.
 */
export type AdFreePublicMetadata = {
  adFreeUntil?: string
}

/** True when the given metadata grants ad-free right now. */
export function isAdFree(meta: AdFreePublicMetadata | undefined | null): boolean {
  if (!meta?.adFreeUntil) return false
  const until = Date.parse(meta.adFreeUntil)
  return Number.isFinite(until) && until > Date.now()
}

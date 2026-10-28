# Monetization

Web advertising is disabled and no ad provider is loaded. See `adsense-readiness.md` for the current web advertising policy.

Digital purchases will use native in-app billing on iOS and Android. Purchase integration is not implemented yet. There is no web checkout, billing portal, pricing page, or payment webhook.

## Ad-free entitlement

`lib/entitlement.ts` and `hooks/useAdFree.ts` read the provider-independent `adFreeUntil` ISO timestamp from Clerk public metadata. An unexpired timestamp grants ad-free status. Existing timestamps remain valid until they expire.

The host's ad-free status is stamped into a multiplayer room when starting a game, through `hooks/game/useStart.ts`. This remains available for the future native purchase integration.

Native purchases will need server-side verification and entitlement updates, renewal and expiry handling, and purchase restoration before they can be offered.

## Account deletion

`app/api/delete-account/route.ts` authenticates the current user, removes their Supabase identity and game data, then deletes their Clerk account. It has no payment-provider dependency.

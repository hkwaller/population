# Monetization: Adsterra ads + Stripe ad-free subscription

The repeatable recipe used to add ads + a "remove ads" subscription to Population. Written to be portable to our other games (the moving parts are the same).

## Model in one paragraph

Guests and signed-out users see **Adsterra** ads (a 468×60 banner in a few non-invasive spots + a popunder on the multiplayer end screen). Signing in with Clerk and buying an **ad-free** plan hides all ads. Three tiers, sold through **Stripe Checkout**: a one-time **24h day pass** (19 kr), and auto-renewing **monthly** (59 kr) and **yearly** (399 kr) subscriptions. Entitlement is a single `adFreeUntil` timestamp on the Clerk user - the day pass sets it to now+24h; subscriptions push it to the current period end on every renewal webhook. Ads are hidden whenever `adFreeUntil` is in the future, so both the one-time and recurring models share one gate.

## 1. Stripe: product + prices (once per Stripe account)

Create one product "Population Ad-Free" with three prices. In **live** mode we used the Stripe MCP; repeat in **test** mode (or the dashboard) for dev.

| Plan  | Type      | Amount         | Recurring | lookup_key     | metadata                     |
| ----- | --------- | -------------- | --------- | -------------- | ---------------------------- |
| day   | one_time  | 1900 (19 kr)   | –         | `adfree_day`   | `plan=day`, `grant_hours=24` |
| month | recurring | 5900 (59 kr)   | month     | `adfree_month` | `plan=month`                 |
| year  | recurring | 39900 (399 kr) | year      | `adfree_year`  | `plan=year`                  |

Amounts are in **øre** (NOK smallest unit). Currency `nok`.

## 2. Environment variables

Adsterra (client-exposed) and Stripe (server-only). See `.env.example`:

```
NEXT_PUBLIC_ADSTERRA_BANNER_KEY=...      # "Key" of a 468x60 banner unit
NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC=...    # full invoke.js src URL of a popunder unit
STRIPE_SECRET_KEY=sk_...                 # test key in dev, live in prod
STRIPE_WEBHOOK_SECRET=whsec_...          # from `stripe listen` (dev) or dashboard endpoint
STRIPE_PRICE_DAY / _MONTH / _YEAR=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000  # fallback for Checkout return URLs
```

## 3. Code (files added/changed)

- `lib/stripe.ts` - server Stripe client + plan→price / plan→mode mapping.
- `lib/entitlement.ts` - `AdFreePublicMetadata` type + `isAdFree()` (isomorphic).
- `hooks/useAdFree.ts` - client hook; reads Clerk `publicMetadata`. Guests → sees ads.
- `app/api/stripe/checkout/route.ts` - creates a Checkout Session (mode by plan); lazily creates + caches the Stripe customer in Clerk `privateMetadata`.
- `app/api/stripe/portal/route.ts` - Customer Portal for manage/cancel.
- `app/api/stripe/webhook/route.ts` - verifies signature, writes `adFreeUntil` to Clerk. Handles `checkout.session.completed` (day pass, mode=payment), `customer.subscription.created|updated` (period end), `.deleted` (mark canceled).
- `app/go-ad-free/page.tsx` - pricing page + success/cancel handling + portal.
- `app/components/AdsterraBanner.tsx` / `AdsterraPopunder.tsx` - **self-gating** (render nothing when ad-free or while Clerk hydrates), safe to drop anywhere.
- `proxy.ts` - allow-listed `/go-ad-free` and `/api/stripe/(.*)` as public (Stripe routes enforce their own auth; the webhook is authed by its signature).

### Where the ads live (chosen to stay non-invasive - never mid-question)

- Banner: home page (above footer), highscores, and the between-questions reveal modal (`QuestionResultModal`).
- Banner + popunder: multiplayer **end** screen; popunder only on **player devices** (`me` is set), not the shared host screen.

### Host perk: a Pro host makes the whole room ad-free

If the host (the device that starts the game) is ad-free, **all players in that room** play without in-game ads. Ad-free status lives in per-user Clerk metadata, so a player device can't read the host's status directly — instead the host publishes a shared flag into the room:

- `GameState.hostAdFree: boolean` in `liveblocks.config.ts` (init `false` in `providers.tsx`).
- `useStart` reads the starting device's own `useAdFree()` and stamps `hostAdFree` into room storage; `useSetup` resets it to `false` (so a rematch by a non-Pro host clears it).
- `hooks/useInGameAdsSuppressed.ts` → `suppressed = localAdFree || hostAdFree`. Used by the game-play page (passed to `QuestionResultModal` as the `adsSuppressed` prop) and the end screen.

Notes / gotchas:

- Only **in-game** spots inherit the host perk. Home/highscores banners are outside any room and stay per-device (self-gating `<AdsterraBanner>`); `useStorage` can't run outside a `RoomProvider`, which is also why the modal takes an `adsSuppressed` **prop** rather than calling the hook itself (the preview page renders that modal without a room).
- `hostAdFree` is captured **at game start** — a host buying Pro mid-game only applies from the next game.

## 4. Wiring the Stripe webhook

Dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook` → paste the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

Prod: add an endpoint in the Stripe dashboard for `https://<domain>/api/stripe/webhook` subscribed to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`; copy its signing secret.

## 5. Test checklist

1. Sign in, buy the **day pass** (Stripe test card `4242 4242 4242 4242`). → banner/popunder disappear; `/go-ad-free` shows "You're ad-free … day pass".
2. Buy **monthly** → same, and "Manage subscription" opens the Customer Portal.
3. Cancel in the portal → stays ad-free until period end, then ads return.
4. Signed-out / guest → always sees ads.

## Gotchas

- Webhook route must use the **Node runtime** and read the **raw** body (`await req.text()`); a parsed body breaks signature verification.
- Stripe SDK v22: subscription period end moved onto the subscription **item**; `subscriptionPeriodEndMs()` reads the item first, falls back to the sub.
- `useSearchParams()` on a client page must be inside a `<Suspense>` boundary (Next 16 build requirement).
- The Stripe account we provisioned is **live** - provision test keys for dev and never commit live keys.

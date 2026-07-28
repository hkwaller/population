# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary players are **friends in a social / party setting** - a group playing a live multiplayer room together, whether in the same room or over a call. One person hosts, shares a link or code, and everyone plays in real time. The experience is built around that shared, competitive moment rather than solitary study.

Secondary audiences the product also serves (confirmed present, not the design center):

- Solo / returning players who come back for the shared **Daily** puzzle.
- Anonymous guests, who can play without creating an account.

## Product Purpose

Population is a real-time, multiplayer **geography guessing game**. Players answer questions about the world - flags, capitals, borders, populations - across several guessing formats. Scoring rewards **being close**, not just being exactly right: every guess earns up to `MAX_SCORE` (1000) points on a "closeness" curve, and the **highest total wins**. Success is a group of friends having a fast, replayable, low-friction good time together.

> Note: `README.md` currently says "lowest score wins" - this is stale. The scoring code (`lib/utils.ts`) is authoritative: higher is better, highest total wins.

## Positioning

The meaningfully different thing is the **variety of question types under one game**. A single Population session can move between:

- **slider** - numeric answers scored by closeness (with `lower_bound`/`upper_bound`)
- **choice** - timed multiple choice
- **map** - pin-the-map answers scored by haversine distance
- **rank** - order items by population, scored by Kendall-tau

…plus rich stimuli (flags, country outlines, borders). No single question mechanic defines the game; the breadth of ways-to-guess is the identity. The closeness-based scoring is the connective tissue that lets all these formats share one leaderboard and keeps casual players in contention.

## Operating Context

- **Live multiplayer** - a host creates a room and shares a link/code; players join and play in sync. This is the core scene.
- **Daily** - a deterministic, worldwide-shared puzzle: a UTC date key seeds the same question set for everyone that day.
- **Solo / same-device** - pass-and-play on one device.
- **Custom (AI-generated)** - generate a question set on any topic via the Anthropic API.

Routes span `/`, `/new-game`, `/setup/[id]`, `/join/[slug]`, `/game/[slug]/[id]`, `/game/[slug]/end`, `/daily`, `/highscores`, `/profile`, `/how-to-play`, `/about`, and `/admin/*`.

## Capabilities and Constraints

- **Stack:** Next.js 16 (App Router, RSC) + React 18 + TypeScript (strict); Liveblocks for authoritative realtime room state; Zustand (`usePopStore`) for device-local state; Supabase (Postgres) for the question bank and player/game stats; Clerk for auth (anonymous guests supported); Tailwind + Radix + Framer Motion (`motion`); Vitest.
- **Two-layer state model:** room-shared/authoritative state lives in Liveblocks; per-device/per-player config lives in Zustand. The two layers own separate fields and must not be blanket-synced (see `docs/state-store.md`). `hooks/useGame.ts` is the single canonical boundary hook.
- **Scoring** lives in `lib/utils.ts` (`scoreAnswer`, `haversineKm`, `isBullseye`, `MAX_SCORE`); it is closeness-based and shared across all question types.
- **Question model** is a discriminated union `TQuestion` on `type` (`app/types.ts`).
- Supabase objects are prefixed `population_`.
- Anonymous guest play (no signup required) is a functional capability the current product supports.

## Brand Commitments

- **Name:** "Population" - settled. The name and its `population_`-prefixed identity stay.
- **Maker attribution:** "Made by Amalies Utviklingsfabrikk" is a binding credit to keep.
- **Voice (observed, from existing copy):** playful, punchy, second-person, confident - e.g. "Get close, score big", "Guess the world - closest wins", "The closer your guess, the more points you bag", "Highest score takes the crown". Recorded as observed, not as a locked constraint.

> History: the product started as a number-guessing quiz called "Ish" and became geography-first. User-facing copy, package, and store are now all "Population"; only old git history still says "Ish".

## Evidence on Hand

- A working, deployed game with a seeded Supabase question bank (`scripts/schema.sql`, `scripts/migrate-questions.ts`) and generated country data (`lib/geo/countries.json`).
- Existing marketing/support surfaces: landing (`app/page.tsx`), `how-to-play`, `about`, `highscores`, `profile`, `privacy`, `contact`.
- **Monetization present in code** (Adsterra ads + a Stripe ad-free upgrade, `/go-ad-free`): this exists in the codebase but the user did **not** mark it as a fixed constraint during init - treat it as current implementation, not a binding commitment.
- No confirmed testimonials, user counts, press, or benchmark figures - future work must not fabricate these.

## Product Principles

1. **The party moment wins.** Optimize first for a group of friends playing a live room together - fast, low-friction, everyone in contention.
2. **Reward closeness, not just correctness.** Every guess should feel like it counted; the scoring curve keeps casual and expert players in the same game.
3. **Breadth is the brand.** The variety of question types is the differentiator; new formats extend the identity rather than dilute it.
4. **No barrier to joining.** Guests can play instantly; sharing a room must stay a link/code away.
5. **Keep the two state layers honest.** Room-shared vs. device-local ownership is a product-integrity rule, not just an implementation detail.

## Accessibility & Inclusion

No product-specific accessibility standard was established during init. (Open decision - not a claim that none is needed.)

# CLAUDE.md

Guidance for working in this repo. Read this before making changes.

## What this is

A real-time, multiplayer **geography/trivia guessing game**. Players answer numeric, multiple-choice, and map-pin questions; scoring rewards being _close_ - each question is worth up to `MAX_SCORE` (1000) points and the **highest total wins**. Modes: live multiplayer rooms, a shared **daily** puzzle, and solo/same-device.

> History: the product started as a number-guessing quiz called "Ish" and evolved into a geography-first game. The package, store, and user-facing copy are now all **Population**; Supabase objects are prefixed `population_`. You may still see "Ish" in old git history.

## Stack

- **Next.js 16** (App Router, RSC) + React 18 + TypeScript (strict)
- **Liveblocks** - realtime room state (the multiplayer source of truth)
- **Zustand** - device-local state (`usePopStore`)
- **Supabase** - question bank + player/game stats (Postgres)
- **Clerk** - auth; anonymous guests play without signing in
- **Tailwind** + Radix + `motion` (Framer Motion) for UI/animation
- **Vitest** - unit tests

## Commands

```sh
npm run dev        # dev server on :3000 (or use the "geo-dev" launch config)
npm run build      # production build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit - run this after non-trivial changes
npm test           # vitest (watch)
npm run test:run   # vitest once (CI / quick check)
```

Seed the question bank (after applying `scripts/schema.sql` in Supabase):

```sh
npx tsx --env-file=.env.local scripts/migrate-questions.ts
```

Regenerate country data (build-time, needs `RESTCOUNTRIES_API_KEY`):

```sh
node scripts/build-countries.mjs   # writes lib/geo/countries.json
```

## Architecture - the important part

### State lives in two places. Do not mix them up.

`hooks/useGame.ts` is the **single canonical boundary hook** - always use it. It merges:

- **Liveblocks (room-shared, authoritative for a live game):** `command`, `currentQuestion`, `players`, `boss`, `answeredQuestions`, `skippedQuestions`, `endedAt`
- **Zustand / `usePopStore` (device-local, per player):** `selectedCategories`, `amountQuestions`, `capAnswers`, `hideQuestions`, `showQuestions`, `me`, `preferences`
- **Derived (no store):** `showQuestionResultModal`

`useGame` deliberately does **not** sync the Zustand-owned config fields back from Liveblocks - each layer owns its fields. If a field needs to be shared across players, add it to `GameState` in `liveblocks.config.ts` and mutate it via a hook in `hooks/game/`; if it's per-device, keep it in Zustand. Don't reach into Liveblocks storage directly from components. (A prior `useLiveGame` hook blanket-synced everything and wiped category picks on room join - it's been removed. See `docs/state-store.md`.)

Per-command mutations live in `hooks/game/` (`useAnswer`, `useNext`, `useReveal`, `useStart`, `useEnd`, `useJoin`, `useBoss`, `useRematch`, etc.). A game advances by issuing a `command` (see `CommandType` in `app/types.ts`) through these hooks.

### Question model

`TQuestion` is a discriminated union on `type` (`app/types.ts`):

- `slider` - numeric answer with `lower_bound`/`upper_bound`, optional `unit`
- `choice` - `options[]` + string `answer` (time-limited: `CHOICE_TIME_LIMIT_MS`)
- `map` - `LatLng` answer, scored by haversine distance with `falloffKm` (default `MAP_FALLOFF_KM`)

Optional `prompt: PromptSpec` gives a rich stimulus (`text` | `flag` | `outline` | `borders`); falls back to `question` text when omitted. Scoring lives in `lib/utils.ts` (`scoreAnswer`, `haversineKm`, `isBullseye`, `MAX_SCORE`). **When touching scoring, update `lib/scoring.test.ts`.**

### Daily mode

`lib/daily.ts` - deterministic. A UTC date key (`dateKeyUTC`) seeds a `mulberry32` PRNG so everyone worldwide gets the same `DAILY_SIZE` questions for a given day. Keep it pure/deterministic; `lib/daily.test.ts` guards this.

### Routing & auth

App Router routes: `/`, `/new-game`, `/setup/[id]`, `/join/[slug]`, `/game/[slug]/[id]`, `/game/[slug]/end`, `/daily`, `/highscores`, `/profile`, `/admin/*`.

Auth middleware is **`proxy.ts`** (Next 16's renamed middleware entry), not `middleware.ts`. Public routes are allow-listed there - **add any new public route to `isPublicRoute`** or Clerk will gate it.

### API routes

- `app/api/liveblocks-auth/route.ts` - issues Liveblocks room tokens (Clerk-aware; guests allowed)

## Conventions

- Import alias: `@/*` → repo root (mirrored in `vitest.config.ts`).
- Liveblocks storage must be JSON-serializable - that's why `players` is `any[]` in `liveblocks.config.ts` (icons carry symbol indices). Don't "fix" that type without a plan.
- UI components: shared in `app/components/`, feature-scoped under `app/components/{geo,daily,pop}/`. `pop/` is the current design-system shell (`PopShell`, `PopSlider`, `theme.ts`).
- Prettier + `.eslintrc.json` (next core-web-vitals) are the formatters - match surrounding style.
- Env vars: copy `.env.example` → `.env.local`. **Provision your own Liveblocks/Supabase/Clerk projects - do not reuse the originals.** `SUPABASE_SERVICE_ROLE_KEY` is server/script only.

## Gotchas

- `command` typing is loose (`Command | CommandType`) in the store - the string `command` field drives the state machine; grep `hooks/game/` for how each is handled.
- `npm test` defaults to **watch mode**; use `npm run test:run` for a one-shot.

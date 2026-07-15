# Population

A real-time, multiplayer **geography guessing game**. Answer numeric, multiple-choice, and map-pin questions about the world - flags, capitals, borders, and a few billion people. Scoring rewards being _close_, and the **lowest score wins**.

> Population began life as a number-guessing quiz called "Ish" and grew into a geography-first game. You may still see "Ish" in old git history; the codebase is now Population throughout.

## Modes

- **Live multiplayer** - one player creates a room and shares the link; everyone plays in real time.
- **Daily** - a shared, deterministic puzzle; everyone worldwide gets the same set for a given day.
- **Solo / same-device** - pass-and-play on one device.
- **Custom (AI-generated)** - generate a question set on any topic via the Anthropic API.

## Stack

- **Next.js 16** (App Router, RSC) + React 18 + TypeScript (strict)
- **Liveblocks** - realtime room state (multiplayer source of truth)
- **Zustand** - device-local state (`usePopStore`)
- **Supabase** - question bank + player/game stats
- **Clerk** - auth (anonymous guests can play without signing in)
- **Tailwind** + Radix + Framer Motion (`motion`)
- **Anthropic SDK** - AI custom-question generation
- **Vitest** - unit tests

## Getting started

```sh
npm install
cp .env.example .env.local   # then fill in - provision your OWN Liveblocks/Supabase/Clerk projects
npm run dev                  # http://localhost:3000
```

Seed the question bank (after applying `scripts/schema.sql` in your Supabase project):

```sh
npx tsx --env-file=.env.local scripts/migrate-questions.ts
```

## Commands

```sh
npm run dev        # dev server on :3000
npm run build      # production build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
npm run test:run   # vitest once   (npm test runs in watch mode)
```

## Where things live

- Architecture, conventions, and gotchas: **[CLAUDE.md](CLAUDE.md)**
- The two-layer state model (Liveblocks vs. Zustand): **[docs/state-store.md](docs/state-store.md)**

## License

Private project. All rights reserved.

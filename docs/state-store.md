# State store overview

This document explains the two-layer state model. `app/state.ts` links here.

## Two sources of truth

State is split deliberately. **Consume everything through `hooks/useGame.ts`** - it's the single boundary hook that merges both layers. Don't read Liveblocks storage or the Zustand store directly in components.

### 1. Liveblocks - room-shared, authoritative during a live game

Defined in `liveblocks.config.ts` (`GameState`). This is what every player in a room sees and what the host mutates to drive the game forward:

`command`, `boss`, `currentQuestion`, `answeredQuestions`, `skippedQuestions`, `players`, `endedAt` (plus the game config fields the host sets at setup).

Liveblocks storage must be JSON-serializable - that's why `players` is typed `any[]` (player icons carry symbol indices). Don't tighten that type without a serialization plan.

### 2. Zustand (`usePopStore`) - device-local, per player

Defined in `app/state.ts`. Persisted to `localStorage` under the key **`population-store`** (`persist` + `createJSONStorage`). Holds things that are _this device's_ concern:

`selectedCategories`, `amountQuestions`, `capAnswers`, `hideQuestions`, `showQuestions`, `me`, `preferences`, plus local UI flags (`showScoreModal`, `showQuestionResultModal`, `playingOnSameDevice`).

## The bug this split fixes

An earlier `useLiveGame` hook (now removed) synced **all** Liveblocks fields into Zustand on every render, including `selectedCategories: []` (the initial room storage value). Result: joining a room wiped the user's category selections.

`useGame` fixes this by **not** syncing the Zustand-owned config fields back from Liveblocks. Each layer owns its fields:

- Room state flows Liveblocks → `useGame` → components.
- Local config flows `usePopStore` → `useGame` → components, and is written straight to Zustand.

**Do not reintroduce a blanket sync.** If a field needs to be shared across players, move it into `GameState` in `liveblocks.config.ts` and mutate it via a hook in `hooks/game/`. If it's per-device, keep it in Zustand.

## Advancing the game

The game is a small state machine keyed on `command` (`CommandType` in `app/types.ts`). Each transition has a dedicated mutation hook in `hooks/game/`:

| Concern           | Hook                    |
| ----------------- | ----------------------- |
| Start / setup     | `useStart`, `useSetup`  |
| Answer a question | `useAnswer`             |
| Advance / replace | `useNext`, `useReplace` |
| Reveal results    | `useReveal`, `useShow`  |
| End / rematch     | `useEnd`, `useRematch`  |
| Join / players    | `useJoin`, `useRemove`  |
| Host ("boss")     | `useBoss`               |

Scoring on answer submission runs through `scoreAnswer` in `lib/utils.ts`.

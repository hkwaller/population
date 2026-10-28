# State store overview

This document explains the two-layer state model. `app/state.ts` links here.

## Two sources of truth

State is split deliberately. **Consume everything through `hooks/useGame.ts`** - it's the single boundary hook that merges both layers. Don't read PartyServer storage or the Zustand store directly in components.

### 1. PartyServer - room-shared, authoritative during a live game

Defined in `lib/partyRoom.ts` (`GameState`). This is what every player in a room sees and what the host mutates to drive the game forward:

`command`, `boss`, `currentQuestion`, `answeredQuestions`, `skippedQuestions`, `players`, `endedAt` (plus the game config fields the host sets at setup: `amountQuestions`, `showQuestions`, `answerModes`, `confidenceMode`, `hostAdFree`).

### 2. Zustand (`usePopStore`) - device-local, per player

Defined in `app/state.ts`. Persisted to `localStorage` under the key **`population-store`** (`persist` + `createJSONStorage`). Holds things that are _this device's_ concern:

`selectedCategories`, `amountQuestions`, `capAnswers`, `hideQuestions`, `showQuestions`, `confidenceMode`, `me`, `preferences`, plus local UI flags (`showScoreModal`, `showQuestionResultModal`, `playingOnSameDevice`).

`confidenceMode` is the interesting case: it's a device preference (it's what daily and solo read, and what the host toggles on `/new-game`), but because it changes **scoring** it can't stay device-local once a room is live - the host would be scored under different rules than the guests. `useStart` stamps it onto room storage, and `resolveConfidenceMode` (`lib/confidenceMode.ts`) picks the winner: room value in a live game, device value in the lobby and outside rooms. It's resolved rather than written back into Zustand, so joining someone else's confidence-mode room doesn't silently flip your own daily setting.

## The bug this split fixes

An earlier boundary hook synced **all** room fields into Zustand on every render, including `selectedCategories: []` (the initial room storage value). Result: joining a room wiped the user's category selections.

`useGame` fixes this by **not** syncing the Zustand-owned config fields back from PartyServer. Each layer owns its fields:

- Room state flows PartyServer → `useGame` → components.
- Local config flows `usePopStore` → `useGame` → components, and is written straight to Zustand.

**Do not reintroduce a blanket sync.** If a field needs to be shared across players, move it into `GameState` in `lib/partyRoom.ts` and mutate it via a hook in `hooks/game/`. If it's per-device, keep it in Zustand.

The Worker in `party/server.ts` validates each action through `parseAction` and applies it with `applyAction` before persisting and broadcasting the full room. `owners` binds each seat to its authenticated connection identity, with one seat per device. The room creator and the player crowned as boss can issue round controls; players can only submit their own answers. Scoring runs on the server, including map-border and route validation.

The client provider in `hooks/partyRoom.tsx` refreshes signed tickets on reconnect. Joining and answering are optimistic; navigation waits for a server acknowledgement. No component can submit an arbitrary room-state patch.

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

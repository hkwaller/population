import type { CommandType } from '@/app/types'

/**
 * Which confidence-mode setting applies right now.
 *
 * Confidence mode changes how slider/map answers are scored, so in a live room
 * it must be room-wide - if it were per-device the host would be scored under
 * different rules than the guests. The host stamps its choice onto Liveblocks
 * storage at `start` (see GameState.confidenceMode); from then on that value
 * wins for everyone in the room.
 *
 * While the room is still idle (lobby) - or with no room at all, i.e. daily and
 * solo play - there is nothing stamped yet, so the device's own preference
 * applies. That also means joining a host's confidence-mode room never rewrites
 * the guest's own preference for their daily puzzle.
 */
export function resolveConfidenceMode({
  room,
  device,
}: {
  /** Liveblocks game storage, or undefined when there's no room / it hasn't loaded. */
  room?: { command: CommandType; confidenceMode?: boolean }
  /** This device's own (Zustand-persisted) preference. */
  device: boolean
}): boolean {
  if (!room || room.command === 'idle') return device
  return room.confidenceMode ?? false
}

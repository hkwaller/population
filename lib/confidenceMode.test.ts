import { describe, expect, it } from 'vitest'

import { resolveConfidenceMode } from './confidenceMode'

describe('resolveConfidenceMode', () => {
  it('uses the device preference when there is no room (daily / solo)', () => {
    expect(resolveConfidenceMode({ device: true })).toBe(true)
    expect(resolveConfidenceMode({ device: false })).toBe(false)
  })

  it('uses the device preference while the room is idle, so the host sees their own toggle', () => {
    expect(resolveConfidenceMode({ room: { command: 'idle', confidenceMode: false }, device: true })).toBe(
      true,
    )
  })

  it('lets the host-stamped value win once the game has started', () => {
    // Guest has it off locally, host turned it on - the guest must see the band.
    expect(
      resolveConfidenceMode({ room: { command: 'start', confidenceMode: true }, device: false }),
    ).toBe(true)
    // ...and the reverse: a guest's own preference cannot switch it on mid-room.
    expect(
      resolveConfidenceMode({ room: { command: 'next', confidenceMode: false }, device: true }),
    ).toBe(false)
  })

  it('treats a room from before this field existed as off', () => {
    expect(resolveConfidenceMode({ room: { command: 'start' }, device: true })).toBe(false)
  })
})

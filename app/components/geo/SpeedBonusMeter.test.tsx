// @vitest-environment jsdom
import React from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpeedBonusMeter } from './SpeedBonusMeter'

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'],
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// JSX in this repo uses Next's transform; createElement keeps the test runtime independent.
const meter = (startedAt: number, onExpire: () => void, active = true) =>
  React.createElement(SpeedBonusMeter, { startedAt, onExpire, active })

describe('timed points meter', () => {
  it('holds full points, drains to half, then expires exactly once at 30 seconds', () => {
    const onExpire = vi.fn()
    render(meter(performance.now(), onExpire))
    const bar = screen.getByRole('progressbar')
    act(() => vi.advanceTimersByTime(5000))
    expect(bar.getAttribute('aria-valuenow')).toBe('1000')
    act(() => vi.advanceTimersByTime(5000))
    expect(bar.getAttribute('aria-valuenow')).toBe('750')
    act(() => vi.advanceTimersByTime(5000))
    expect(bar.getAttribute('aria-valuenow')).toBe('500')
    expect(screen.getByRole('timer').textContent).toBe('15s left')
    act(() => vi.advanceTimersByTime(14999))
    expect(onExpire).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('timer').textContent).toBe('Time’s up')
    act(() => vi.advanceTimersByTime(10000))
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('cancels expiry when an answer is locked', () => {
    const onExpire = vi.fn()
    const start = performance.now()
    const { rerender } = render(meter(start, onExpire))
    act(() => vi.advanceTimersByTime(5000))
    rerender(meter(start, onExpire, false))
    act(() => vi.advanceTimersByTime(30000))
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('resets for a new question and calls the latest callback without extending the deadline', () => {
    const oldExpire = vi.fn()
    const nextExpire = vi.fn()
    const { rerender } = render(meter(performance.now(), oldExpire))
    act(() => vi.advanceTimersByTime(20000))
    const nextStart = performance.now()
    rerender(meter(nextStart, oldExpire))
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1000')
    act(() => vi.advanceTimersByTime(10000))
    rerender(meter(nextStart, nextExpire))
    expect(oldExpire).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(20000))
    expect(nextExpire).toHaveBeenCalledTimes(1)
    expect(oldExpire).not.toHaveBeenCalled()
  })
})

// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MapPicker } from './MapPicker'

vi.mock('./WorldMap', () => ({ WorldMap: () => null }))
vi.mock('../pop/PopButton', () => ({
  PopButton: ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
}))

beforeEach(() => vi.stubGlobal('React', React))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const props = {
  question: 'Where in the world is Kenya?',
  value: null,
  onPick: vi.fn(),
  onConfirm: vi.fn(),
}

describe('automatic map questions', () => {
  it('opens with the question visible and restores body scrolling after closing', () => {
    const previousOverflow = document.body.style.overflow
    render(React.createElement(MapPicker, props))
    expect(screen.getByRole('dialog', { name: props.question })).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button', { name: 'Close fullscreen map' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe(previousOverflow)
    fireEvent.click(screen.getByRole('button', { name: 'Open the map to place your guess' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('stays closed on ordinary updates, then opens for the next question', () => {
    const { rerender } = render(React.createElement(MapPicker, { ...props, key: 'kenya' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    rerender(React.createElement(MapPicker, { ...props, key: 'kenya', value: { lat: 1, lng: 38 } }))
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(React.createElement(MapPicker, { ...props, key: 'norway', question: 'Where is Norway?' }))
    expect(screen.getByRole('dialog', { name: 'Where is Norway?' })).toBeTruthy()
  })

  it('does not auto-open answered questions and opens when answering becomes available', () => {
    const { rerender } = render(React.createElement(MapPicker, { ...props, disabled: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(React.createElement(MapPicker, { ...props, disabled: false }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    rerender(React.createElement(MapPicker, { ...props, disabled: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('confirms once and keeps the map closed after locking a guess', () => {
    const onConfirm = vi.fn()
    const { rerender } = render(React.createElement(MapPicker, { ...props, onConfirm, value: { lat: 1, lng: 38 } }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Lock it in' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(React.createElement(MapPicker, { ...props, onConfirm, disabled: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

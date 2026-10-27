// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorldMap } from './WorldMap'

vi.mock('@/lib/geo/geometry', () => ({
  loadCountryGeometry: () => Promise.resolve({ collection: { features: [] } }),
}))

beforeEach(() => {
  vi.stubGlobal('React', React)
  vi.stubGlobal('ResizeObserver', class {
    constructor(private callback: ResizeObserverCallback) {}
    observe() {
      this.callback([{ contentRect: { width: 390, height: 650 } }] as ResizeObserverEntry[], this as unknown as ResizeObserver)
    }
    disconnect() {}
  })
  vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 800, height: 411, right: 800, bottom: 411,
    toJSON: () => ({}),
  })
  SVGElement.prototype.setPointerCapture = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function pointer(target: Element, type: string, x: number, y: number, id = 1, pointerType = 'mouse') {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperties(event, { pointerId: { value: id }, pointerType: { value: pointerType } })
  fireEvent(target, event)
}
function setup(props = {}) {
  const onPick = vi.fn()
  render(React.createElement(WorldMap, { onPick, ...props }))
  const map = screen.getByRole('img', { name: 'World map' })
  return { onPick, map, view: () => map.getAttribute('viewBox') }
}

describe('map gestures', () => {
  it('places a pin on a tap with small touch jitter', () => {
    const { map, onPick } = setup()
    pointer(map, 'pointerdown', 400, 205, 1, 'touch')
    pointer(map, 'pointermove', 404, 208, 1, 'touch')
    pointer(map, 'pointerup', 404, 208, 1, 'touch')
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick.mock.calls[0][0].lng).toBeCloseTo(1.7, 0)
  })

  it.each(['mouse', 'touch'])('pans on a slow %s drag without placing a pin, even after returning to the start', (type) => {
    const { map, onPick, view } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    const before = view()
    pointer(map, 'pointerdown', 400, 205, 1, type)
    for (let x = 402; x <= 440; x += 2) pointer(map, 'pointermove', x, 205, 1, type)
    expect(view()).not.toBe(before)
    pointer(map, 'pointermove', 400, 205, 1, type)
    pointer(map, 'pointerup', 400, 205, 1, type)
    expect(onPick).not.toHaveBeenCalled()
  })

  it('never places a pin after cancellation or lost capture', () => {
    const { map, onPick } = setup()
    pointer(map, 'pointerdown', 400, 205)
    pointer(map, 'pointercancel', 400, 205)
    pointer(map, 'pointerup', 400, 205)
    pointer(map, 'pointerdown', 400, 205)
    pointer(map, 'lostpointercapture', 400, 205)
    pointer(map, 'pointerup', 400, 205)
    expect(onPick).not.toHaveBeenCalled()
  })

  it('pinches then continues panning with the remaining finger, without a pin', () => {
    const { map, onPick, view } = setup()
    pointer(map, 'pointerdown', 300, 205, 1, 'touch')
    pointer(map, 'pointerdown', 500, 205, 2, 'touch')
    const before = view()
    pointer(map, 'pointermove', 550, 205, 2, 'touch')
    expect(view()).not.toBe(before)
    pointer(map, 'pointerup', 300, 205, 1, 'touch')
    const afterPinch = view()
    pointer(map, 'pointermove', 580, 205, 2, 'touch')
    expect(view()).not.toBe(afterPinch)
    pointer(map, 'pointerup', 580, 205, 2, 'touch')
    expect(onPick).not.toHaveBeenCalled()
  })

  it('suppresses pin placement for Space and resets the modifier on window blur', () => {
    const { map, onPick } = setup()
    fireEvent.keyDown(window, { code: 'Space' })
    pointer(map, 'pointerdown', 400, 205)
    fireEvent.keyUp(window, { code: 'Space' })
    pointer(map, 'pointerup', 400, 205)
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { code: 'Space' })
    fireEvent.blur(window)
    pointer(map, 'pointerdown', 400, 205)
    pointer(map, 'pointerup', 400, 205)
    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it('does not place pins in disabled mode or outside the projected globe', () => {
    const { map, onPick } = setup({ interactive: false })
    pointer(map, 'pointerdown', 400, 205)
    pointer(map, 'pointerup', 400, 205)
    expect(onPick).not.toHaveBeenCalled()
    cleanup()
    const active = setup()
    pointer(active.map, 'pointerdown', 0, 0)
    pointer(active.map, 'pointerup', 0, 0)
    expect(active.onPick).not.toHaveBeenCalled()
  })

  it('fits a portrait container without stretching the projection', () => {
    const { view } = setup({ fill: true })
    const [, , w, h] = view()!.split(' ').map(Number)
    expect(h / w).toBeCloseTo(650 / 390)
    expect(h).toBe(411)
  })
})

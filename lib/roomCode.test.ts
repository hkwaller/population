import { describe, expect, it } from 'vitest'

import { roomCodeFromScan } from './roomCode'
import { makeId } from './utils'

describe('roomCodeFromScan', () => {
  it('accepts a bare code', () => {
    expect(roomCodeFromScan('sleepy-fox-42')).toBe('sleepy-fox-42')
    expect(roomCodeFromScan('  zany-alpacas-7 \n')).toBe('zany-alpacas-7')
    expect(roomCodeFromScan('far-out-otters-0')).toBe('far-out-otters-0')
  })

  it('accepts every code makeId produces', () => {
    for (let i = 0; i < 200; i++) {
      const code = makeId()
      expect(roomCodeFromScan(code)).toBe(code)
    }
  })

  it('accepts the lobby QR link', () => {
    expect(roomCodeFromScan('https://population.playam.app/join/sleepy-fox-42')).toBe('sleepy-fox-42')
    expect(roomCodeFromScan('https://population.playam.app/join/sleepy-fox-42/')).toBe('sleepy-fox-42')
    expect(roomCodeFromScan('http://localhost:3000/join/sleepy-fox-42?x=1')).toBe('sleepy-fox-42')
  })

  it('rejects anything else', () => {
    expect(roomCodeFromScan('')).toBeNull()
    expect(roomCodeFromScan('hello')).toBeNull()
    expect(roomCodeFromScan('sleepy-fox')).toBeNull()
    expect(roomCodeFromScan('sleepy-fox-420')).toBeNull()
    expect(roomCodeFromScan('Sleepy-Fox-42')).toBeNull()
    expect(roomCodeFromScan('https://population.playam.app/')).toBeNull()
    expect(roomCodeFromScan('https://population.playam.app/game/sleepy-fox-42')).toBeNull()
    expect(roomCodeFromScan('https://population.playam.app/join/sleepy-fox-42/extra')).toBeNull()
    expect(roomCodeFromScan('https://population.playam.app/join/not%20a%20code')).toBeNull()
    expect(roomCodeFromScan('javascript:alert(1)//join/sleepy-fox-42')).toBeNull()
    expect(roomCodeFromScan('WIFI:S:home;T:WPA;P:secret;;')).toBeNull()
  })
})

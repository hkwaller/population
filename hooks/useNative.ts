'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { haptic, isNativeApp, nativePlatform, onTvChange, tvConnected, type HapticKind } from '@/lib/native'

/** Buzzes once when a verdict shows (and again only when `key` changes). */
export function useHaptic(kind: HapticKind | null, key: string | number, delayMs = 0) {
  useEffect(() => {
    if (!kind) return
    const id = setTimeout(() => haptic(kind), delayMs)
    return () => clearTimeout(id)
  }, [kind, key, delayMs])
}

/** True inside the native app. False on the server and the first render, so hydration matches. */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(noSubscribe, isNativeApp, () => false)
}

/** 'ios', 'android' or 'web' (also on the server and the first render). */
export function useNativePlatform(): 'ios' | 'android' | 'web' {
  return useSyncExternalStore(noSubscribe, nativePlatform, () => 'web')
}

const noSubscribe = () => () => {}

/** Where "home" is: the app's launcher (`/app`, the shell's server.url) in the app, `/` on the web. */
export function useHomeHref(): string {
  return useIsNativeApp() ? '/app' : '/'
}

/** iOS app only: true while a TV is attached over AirPlay or a cable. */
export function useTvConnected(): boolean {
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    let alive = true
    void tvConnected().then((c) => alive && setConnected(c))
    const off = onTvChange(setConnected)
    return () => {
      alive = false
      off()
    }
  }, [])
  return connected
}

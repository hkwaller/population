'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'

import { usePopStore } from '@/app/state'
import { isNativeApp, restoreDeviceStorage } from '@/lib/native'

/** localStorage keys mirrored to native Preferences (the device store, the daily streak). */
const MIRRORED_KEYS = ['population-store', 'population-daily']

/**
 * Native app only (does nothing in a browser):
 *  1. `native-app` on <html> so CSS can drop what the app can't use (Google
 *     sign-in), and the device store put back if iOS cleared localStorage
 *     (PopShell sets the status bar style per route),
 *  2. universal links (a scanned QR code, a shared invite) open in the app,
 *  3. tapping the daily reminder opens the daily puzzle.
 */
export function NativeBoot() {
  const router = useRouter()

  useEffect(() => {
    if (!isNativeApp()) return
    document.documentElement.classList.add('native-app')
    void restoreDeviceStorage(MIRRORED_KEYS).then((restored) => {
      if (restored.includes('population-store')) void usePopStore.persist.rehydrate()
    })

    const open = (path: string) => router.push(path)
    const links = App.addListener('appUrlOpen', ({ url }) => {
      const { pathname, search } = new URL(url)
      open(pathname + search)
    })
    const taps = LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      const path = notification.extra?.path
      if (typeof path === 'string') open(path)
    })
    return () => {
      void links.then((h) => h.remove())
      void taps.then((h) => h.remove())
    }
  }, [router])

  return null
}

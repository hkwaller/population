/**
 * The thin layer between the web app and the native shell (Capacitor, see
 * NATIVE.md). Every helper works in a plain browser too, so components call
 * these and never ask which platform they are on.
 */
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { Share } from '@capacitor/share'
import { StatusBar, Style } from '@capacitor/status-bar'
import type { StateStorage } from 'zustand/middleware'

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

export function nativePlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const p = Capacitor.getPlatform()
  return p === 'ios' || p === 'android' ? p : 'web'
}

export type HapticKind = 'tap' | 'select' | 'right' | 'wrong' | 'turn'

/** A short buzz in the native app. Nothing in a browser, so the website is unchanged. */
export function haptic(kind: HapticKind): void {
  if (!isNativeApp()) return
  const done = (p: Promise<void>) => void p.catch(() => {})
  if (kind === 'tap') done(Haptics.impact({ style: ImpactStyle.Light }))
  else if (kind === 'select') done(Haptics.selectionChanged())
  else if (kind === 'right') done(Haptics.notification({ type: NotificationType.Success }))
  else if (kind === 'wrong') done(Haptics.notification({ type: NotificationType.Error }))
  else done(Haptics.notification({ type: NotificationType.Warning }))
}

/**
 * Shares text through the system share sheet, falling back to the clipboard.
 * `cancelled` means the player closed the sheet: no copy, no message.
 */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (isNativeApp()) {
    try {
      await Share.share({ text })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return 'shared'
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/**
 * Zustand storage that also mirrors every write to native Preferences in the
 * app. iOS may clear a web view's localStorage, and the guest id, settings and
 * daily streak must survive that. Reads stay synchronous (localStorage only),
 * so the store hydrates on first render exactly as on the web; the native copy
 * is put back by `restoreDeviceStorage` when localStorage was wiped.
 */
export const deviceStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Private mode: the native copy still keeps it.
    }
    if (isNativeApp()) void Preferences.set({ key: name, value })
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Nothing stored.
    }
    if (isNativeApp()) void Preferences.remove({ key: name })
  },
}

/**
 * Native app only: copies each key's native copy back into localStorage when
 * localStorage lost it (or mirrors it the first time). Returns the keys that
 * were restored, so the caller can rehydrate whatever reads them.
 */
export async function restoreDeviceStorage(keys: string[]): Promise<string[]> {
  if (!isNativeApp()) return []
  const restored: string[] = []
  for (const key of keys) {
    let local: string | null = null
    try {
      local = localStorage.getItem(key)
    } catch {
      continue
    }
    if (local !== null) {
      // Already there: make sure the native copy exists too (first launch after update).
      void Preferences.set({ key, value: local })
      continue
    }
    const { value } = await Preferences.get({ key })
    if (value === null) continue
    try {
      localStorage.setItem(key, value)
      restored.push(key)
    } catch {
      // Still in Preferences for next time.
    }
  }
  return restored
}

/**
 * Native app only: status bar text that reads on the screen's own colour
 * (every route paints its own full-bleed background, see PopShell).
 */
export function statusBarFor(bg: string): void {
  if (!isNativeApp()) return
  const hex = bg.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // Style.Dark = light text (for dark backgrounds), Style.Light = dark text.
  void StatusBar.setStyle({ style: luminance > 0.6 ? Style.Light : Style.Dark }).catch(() => {})
}

/** The daily reminder fires once a day at this local time. */
const REMINDER = { id: 1, hour: 9, minute: 0 }

/**
 * Turns the daily reminder on or off (games with a daily puzzle). Returns
 * whether it ended up on (false when the player declined notification
 * permission). Tapping it opens `path` (NativeBoot routes it).
 */
export async function setDailyReminder(on: boolean, copy: { title: string; body: string }, path = '/daily'): Promise<boolean> {
  if (!isNativeApp()) return false
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER.id }] }).catch(() => {})
  if (!on) return false
  const { display } = await LocalNotifications.requestPermissions()
  if (display !== 'granted') return false
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER.id,
        title: copy.title,
        body: copy.body,
        // Not allowWhileIdle: that needs the exact-alarm permission on Android, removed in the manifest.
        schedule: { on: { hour: REMINDER.hour, minute: REMINDER.minute } },
        extra: { path },
      },
    ],
  })
  return true
}

/**
 * Native app only: opens the camera and returns whatever QR code it reads, or
 * null if the player closes the scanner. The caller decides if it's a room.
 * (In a browser the phone's own camera app already scans the TV's code.)
 */
export async function scanQr(instructions: string): Promise<string | null> {
  if (!isNativeApp()) return null
  try {
    // Loaded on demand: its web fallback bundles a QR decoder the website never needs.
    const { CapacitorBarcodeScanner, CapacitorBarcodeScannerCameraDirection, CapacitorBarcodeScannerTypeHint } =
      await import('@capacitor/barcode-scanner')
    const { ScanResult } = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      scanInstructions: instructions,
      cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
    })
    return ScanResult || null
  } catch {
    return null
  }
}

/** The app's own plugin (ios/App/App/ExternalDisplay.swift): the TV over AirPlay. */
type ExternalDisplayPlugin = {
  getState(): Promise<{ connected: boolean; showing: boolean }>
  show(options: { url: string }): Promise<{ connected: boolean }>
  hide(): Promise<void>
  addListener(event: 'change', cb: (state: { connected: boolean }) => void): Promise<PluginListenerHandle>
}
const ExternalDisplay = registerPlugin<ExternalDisplayPlugin>('ExternalDisplay')

/** iOS app only: is a TV attached (Screen Mirroring to an Apple TV, or a cable)? */
export async function tvConnected(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'ios') return false
  return ExternalDisplay.getState()
    .then((s) => s.connected)
    .catch(() => false)
}

/** Calls back whenever a TV comes or goes. Returns the unsubscribe. */
export function onTvChange(cb: (connected: boolean) => void): () => void {
  if (Capacitor.getPlatform() !== 'ios') return () => {}
  const handle = ExternalDisplay.addListener('change', ({ connected }) => cb(connected))
  return () => void handle.then((h) => h.remove())
}

/** Shows a page on the TV (kept for when a TV connects later), or clears it. */
export function showOnTv(url: string | null): void {
  if (Capacitor.getPlatform() !== 'ios') return
  void (url ? ExternalDisplay.show({ url }) : ExternalDisplay.hide()).catch(() => {})
}

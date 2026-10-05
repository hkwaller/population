import { Preferences } from '@capacitor/preferences'
import type { StateStorage } from 'zustand/middleware'

import { isNativeApp } from '../../../lib/native'

// Everything else (haptics, status bar, share) works offline as it is.
export * from '../../../lib/native'

/**
 * Stand-in for lib/native's `deviceStorage` in the offline island. The island
 * runs on the app's local origin with its own localStorage. It reads the
 * site's store from native Preferences (confidence mode, name, colour) but
 * never writes there: the site stays the owner of that copy, so nothing done
 * offline can overwrite newer settings or progress made online.
 */
export const deviceStorage: StateStorage = {
  getItem: async (name) => {
    // The site's copy wins, so the island always starts from the latest online settings.
    if (isNativeApp()) {
      const { value } = await Preferences.get({ key: name }).catch(() => ({ value: null }))
      if (value !== null) return value
    }
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
      // Nothing to keep: the island is a fallback.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Nothing stored.
    }
  },
}

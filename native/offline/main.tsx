import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

import { usePopStore } from '@/app/state'
import { isNativeApp } from '@/lib/native'

import { OfflineApp, goOnline } from './OfflineApp'
import './offline.css'

// The store's storage is the island's deviceStorage (shims/native.ts): it
// reads the site's copy from native Preferences and writes only to this
// origin's localStorage. That read is async, so hydrate explicitly.
void usePopStore.persist.rehydrate()

if (isNativeApp()) {
  document.documentElement.classList.add('native-app')
  void StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  // A universal link or a reminder tap while offline: try the real page.
  void App.addListener('appUrlOpen', ({ url }) => {
    const { pathname, search } = new URL(url)
    goOnline(pathname + search)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfflineApp />
  </StrictMode>,
)

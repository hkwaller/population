# Population - native app (iOS + Android)

The App Store and Google Play builds are a Capacitor 8 shell around the live site, `https://population.playam.app`. Same recipe as Anno (`~/privat/anno`, branch `capacitor`, its NATIVE.md).

## How it works

- **Remote URL, not a bundled export.** The app opens population.playam.app in a WKWebView (iOS) or WebView (Android). The game needs its server (Liveblocks auth, Clerk `proxy.ts`, Stripe and delete-account routes), and a remote URL means every Vercel deploy reaches the app without a store review. The shell only ships the icon, splash, offline page and native plugins.
- **One codebase.** `lib/native.ts` is the only file that touches Capacitor. Every helper falls back or does nothing in a browser, and components branch only through `useIsNativeApp()` / `useNativePlatform()` (`hooks/useNative.ts`, hydration-safe). The website is unchanged.
- iOS uses Swift Package Manager (no CocoaPods). Android uses Gradle and needs Java and the Android SDK.

## Files

| Path | What |
|---|---|
| `native.config.json` | App id `app.playam.population`, name, colours, Clerk hosts. Input for the skill's scripts. |
| `capacitor.config.ts` | Server URL (or `CAP_SERVER_URL` for dev), hosts allowed inside the web view (Clerk, Sign in with Apple), offline page. |
| `native/www/` | `index.html` (required, never shown) and `offline.html` (no connection, retry). |
| `native/assets/` | Icon and splash sources. `npm run native:icons` redraws them (`scripts/native/icons.mjs`, the white "P" tile on terracotta) and generates every size. |
| `ios/App/Population.xcworkspace` | Open this one (`npm run native:ios`). It wraps `ios/App/App.xcodeproj`, whose file and folder names the Capacitor CLI hardcodes; the target, product and scheme inside are named Population (`ios.scheme` in `capacitor.config.ts`). Don't rename `App.xcodeproj`: `cap sync` then can't update the plugin package. |
| `ios/`, `android/` | Generated native projects, committed. Hand edits: `ios/App/App/App.entitlements` (universal links), `SceneDelegate.swift` + `ExternalDisplay.swift` (AirPlay, see below), `Info.plist` (camera text), `AndroidManifest.xml` (App Links, camera, exact alarm removed). |
| `lib/native.ts` | `isNativeApp`, `haptic`, `shareText`, `deviceStorage` + `restoreDeviceStorage`, `statusBarFor`, `setDailyReminder`, `scanQr`, and the TV helpers. |
| `components/NativeBoot.tsx` | `native-app` class on `<html>`, restores the device store if iOS cleared it, routes universal links and reminder taps. Mounted in `app/layout.tsx`. |
| `lib/roomCode.ts` | `roomCodeFromScan`: a bare room code or a `/join/<code>` link, nothing else (tested). |
| `app/.well-known/*` | `apple-app-site-association` and `assetlinks.json`, 404 until `APPLE_TEAM_ID` / `ANDROID_CERT_SHA256` are set. |
| `app/api/delete-account/route.ts`, `lib/supabaseAdmin.ts`, `supabase/migrations/0002_population_delete_identity.sql` | Account deletion. |

## Native extras

- **Haptics.** A buzz on your own reveal (daily: the 550-point line the score pill uses; rooms: correct on right/wrong rounds, 550+ on scored ones), a tick on choice and higher/lower taps, a nudge on the player phone when a new question lands. Nothing on the web.
- **Share sheet** for the daily result. In the lobby, the copy-code button becomes "share invite link" in the app.
- **Daily reminder.** "Remind me tomorrow" on the daily result, app only, a local notification at 09:00. Tapping it opens `/daily`. State in the store (`dailyReminder`).
- **QR scan to join.** "Scan the QR code" on `/join`, app only.
- **Storage that survives.** `population-store` (Zustand) and `population-daily` (streak) are mirrored to native Preferences. Reads stay synchronous so hydration is exactly as on the web; NativeBoot copies the native copy back if localStorage was wiped, then rehydrates the store.
- **Safe area.** `PopShell` pads by `--safe-top` (`env(safe-area-inset-top)`, 0 in a browser) and sets the status bar text colour from each route's background. Plain pages get `body` padding and a parchment strip.
- **Sign-in.** Google blocks OAuth in app web views, so `globals.css` hides Clerk's Google button and divider under `html.native-app`. Email codes must stay on.
- **No purchases in the app.** Apple and Google require their own billing for digital goods, so the app hides the "Remove ads" link, the Stripe tiers and the portal on `/go-ad-free` ("Ad-free passes aren't sold in the app"). A pass bought on the web still applies (it's on the Clerk user). Popunders never fire in the app; banners stay.
- **Account deletion.** "Delete my account" on `/profile` (two steps, web and app). `/api/delete-account` cancels any Stripe subscription, runs `population.delete_identity` (deletes the profile row and solo games, strips the player from shared games), then deletes the Clerk user.

## Dev loop

```bash
npm run dev -- -p 3010
```

```bash
CAP_SERVER_URL=http://localhost:3010 npm run native:dev
```

```bash
xcodebuild -workspace ios/App/Population.xcworkspace -scheme Population -configuration Debug -sdk iphonesimulator -destination 'name=iPhone 17 Pro' -derivedDataPath ios/App/build CODE_SIGNING_ALLOWED=NO build
```

Or `npm run native:ios` and run from Xcode. The `geo-native` launch config runs the dev server on 3010. Web edits hot-reload into the app; config, plugin and Swift changes need a sync and rebuild. A real phone needs the Mac's LAN IP in `CAP_SERVER_URL`.

**Before any release build, sync without `CAP_SERVER_URL`** (`npm run native:sync`). The generated `ios/App/App/capacitor.config.json` is gitignored, so it still points at localhost after a dev sync.

## Before the first store submission

Owner tasks:

1. **Clerk production instance.** population.playam.app runs on a development instance (`charming-mustang-76.clerk.accounts.dev`, dev limits). Move to production, then make sure `clerkHosts` in `native.config.json` / `allowNavigation` in `capacitor.config.ts` match the production Frontend API host (set up on population.playam.app: `clerk.population.playam.app`, `accounts.population.playam.app`; add an explicit `population` DNS record before the Clerk ones, see Anno's NATIVE.md), and re-sync.
2. **Set `SUPABASE_SERVICE_ROLE_KEY` on Vercel** (the delete-account route needs it). The deletion migration is applied.
3. **Apple Developer**: Team in Xcode, Associated Domains capability (entitlement file is in place), `APPLE_TEAM_ID` on Vercel.
4. **Google Play**: closed test with 12 testers for 14 days (new personal accounts), `ANDROID_CERT_SHA256` from Play Console > App integrity on Vercel.
5. **Listings**: copy, screenshots (6.9" iPhone, Android phone), privacy labels (Clerk email, Supabase stats, PostHog if turned back on, Adsterra ads), age rating, privacy policy (`/privacy`).
6. **Ads in the app.** Adsterra banners are web ads inside a web view. Review and Adsterra's own terms may not like that; the fallback is to hide `AdsterraBanner` in the app too.

## Not done yet

- **AirPlay TV.** The native side is in (`ExternalDisplay.swift`, the scene role, the SceneDelegate check), but the web side isn't: Population needs a display-only TV view of the lobby and `/game/[slug]` that claims nothing, and the host phone switching to a player view while a TV is connected (see Anno's `useCasting`).
- **Bottom safe area.** Fixed docks (`pb-6`) sit close to the iPhone home indicator.
- **Android.** Not built here (no Java / Android SDK on this Mac). Check edge-to-edge insets on Android.
- **Real-device pass**: scanner, haptics, emoji in the share text, the reminder firing.

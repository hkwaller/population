import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native shell (iOS + Android) around the live site. The app loads the deployed
 * Next.js app instead of a bundled export: the game needs its server (Liveblocks
 * auth, Clerk proxy, API routes), and web deploys reach the app without a
 * store review. See NATIVE.md.
 *
 * CAP_SERVER_URL points the shell at a dev server for local testing, e.g.
 *   CAP_SERVER_URL=http://localhost:3000 npx cap run ios
 */
const url = process.env.CAP_SERVER_URL ?? 'https://population.buzz'

const config: CapacitorConfig = {
  appId: 'app.playam.population',
  appName: 'Population',
  // Only holds the offline page; the game itself comes from `server.url`.
  webDir: 'native/www',
  backgroundColor: '#CC6B49',
  // Lets the web app and analytics tell the app apart from a browser.
  appendUserAgent: 'PopulationApp',
  server: {
    url,
    cleartext: url.startsWith('http://'),
    // Hosts that stay inside the app instead of opening Safari: Clerk's
    // session handshake (dev instance, and the prod Frontend API once live),
    // and Sign in with Apple's web flow.
    allowNavigation: ['*.clerk.accounts.dev', 'clerk.population.buzz', 'accounts.population.buzz', 'appleid.apple.com'],
    errorPath: 'offline.html',
  },
  ios: {
    contentInset: 'never',
    // Long-press link previews make the game feel like a web page.
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#CC6B49',
      showSpinner: false,
    },
    LocalNotifications: {
      iconColor: '#CC6B49',
    },
  },
}

export default config

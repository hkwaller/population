/** Bundle id / package name of the native app (capacitor.config.ts). */
const NATIVE_APP_ID = 'app.playam.population'

/**
 * iOS universal links: links to this site (QR codes, invites, the daily) open
 * the native app when it is installed. Needs APPLE_TEAM_ID; 404 without it.
 */
export function GET() {
  const team = process.env.APPLE_TEAM_ID
  if (!team) return new Response('Not found', { status: 404 })
  return Response.json({
    applinks: {
      details: [{ appIDs: [`${team}.${NATIVE_APP_ID}`], components: [{ '/': '/*', comment: 'Every page opens in the app' }] }],
    },
  })
}

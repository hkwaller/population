import type { NextFetchEvent, NextRequest as PublicNextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/app', // the native app's start screen (capacitor.config.ts server.url)
  '/new-game',
  '/setup/(.*)',
  '/join',
  '/join/(.*)',
  '/game/(.*)',
  '/daily',
  '/how-to-play',
  '/preview',
  '/geo/(.*)', // public static geometry (.json is otherwise caught by the matcher)
  '/highscores',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/go-ad-free',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // SEO / crawler endpoints (metadata file conventions with no static-asset
  // extension are otherwise caught by the matcher and gated by Clerk).
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
  '/api/party-auth',
  // Stripe routes enforce their own auth (checkout/portal require a userId;
  // the webhook is authenticated by its Stripe signature).
  '/api/stripe/(.*)',
  // Universal links / App Links for the native app (NATIVE.md).
  '/.well-known/(.*)',
  // Checks auth itself and only ever deletes the signed-in user.
  '/api/delete-account',
])

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})


// Public HTML must not depend on a Clerk handshake. Account/game routes keep their existing auth policy.
export default function publicProxy(request: PublicNextRequest, event: NextFetchEvent) {
  if (['/', '/privacy', '/terms', '/about', '/contact', '/support', '/how-to-play', '/robots.txt', '/sitemap.xml'].includes(request.nextUrl.pathname.replace(/\/$/, '') || '/')) {

    return NextResponse.next()
  }
  return clerkProxy(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|ingest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
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
  '/go-ad-free',
  '/sign-in',
  '/sign-up',
  // SEO / crawler endpoints (metadata file conventions with no static-asset
  // extension are otherwise caught by the matcher and gated by Clerk).
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
  '/api/liveblocks-auth',
  // Stripe routes enforce their own auth (checkout/portal require a userId;
  // the webhook is authenticated by its Stripe signature).
  '/api/stripe/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

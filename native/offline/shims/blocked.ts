/**
 * Network-only modules (PostHog, Supabase, stats saves) resolve here in the
 * offline island. It exports nothing on purpose: if a component the island
 * bundles starts importing one of them, the build fails instead of shipping
 * code that waits on a network the island doesn't have.
 */
export {}

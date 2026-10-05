// Canonical site metadata used across metadata, sitemap, robots, and JSON-LD.
// Override via NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_APP_URL) per environment;
// falls back to the production domain.
const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://population.playam.app'

// Normalize: absolute URL, no trailing slash.
export const SITE_URL = rawSiteUrl.replace(/\/+$/, '')

export const SITE_NAME = 'Population'

export const SITE_DESCRIPTION =
  'Flags, capitals, borders and a few billion people. Guess the world - closest wins. Play live with friends, a daily puzzle, or solo.'

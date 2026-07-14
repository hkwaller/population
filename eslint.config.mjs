// Flat ESLint config (ESLint 9+/Next 16). Replaces the legacy `.eslintrc.json`
// + `next lint`, both removed in this stack. Run with `npm run lint`.
//
// Ruleset intentionally matches the old `.eslintrc.json` (`next/core-web-vitals`
// only). We do NOT add `eslint-config-next/typescript` — it errors on the
// `any` types this project uses on purpose (e.g. Liveblocks `players: any[]`).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'node_modules/**',
      'next-env.d.ts',
      'lib/geo/countries.json',
      'data/**',
    ],
  },
  ...nextCoreWebVitals,
]

export default config

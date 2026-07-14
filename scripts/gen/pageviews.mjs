/**
 * Fetches English-Wikipedia pageviews per country — a proxy for how well-known a
 * country is ("fame"), used to derive per-question difficulty in build-questions.mjs.
 *
 * Source: Wikimedia REST pageviews API (public, no key). We sum monthly views over
 * a fixed calendar window so the signal is deterministic and reproducible.
 *
 * The pageviews API does NOT follow redirects, so a wrong/ambiguous article title
 * returns 404 or an undercount. WIKI_TITLE_OVERRIDES maps our country names to the
 * canonical en.wikipedia article title wherever they differ.
 */

// Fixed 12-month window (calendar year 2025) → deterministic re-runs.
const WINDOW_START = '2025010100'
const WINDOW_END = '2025123100'

// country name → canonical en.wikipedia article title (only where they differ)
export const WIKI_TITLE_OVERRIDES = {
  Congo: 'Republic of the Congo',
  DRC: 'Democratic Republic of the Congo',
  'Cabo Verde': 'Cape Verde',
  Czechia: 'Czech Republic',
  'Timor-Leste': 'East Timor',
  Palestine: 'State of Palestine',
  Micronesia: 'Federated States of Micronesia',
  Gambia: 'The Gambia',
  Bahamas: 'The Bahamas',
  Georgia: 'Georgia (country)', // plain "Georgia" is a disambiguation page
  Ireland: 'Republic of Ireland', // plain "Ireland" is the island
}

const UA = 'population-quiz/1.0 (geography trivia; contact hannes@unfold.no)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchOne(title, attempt = 0) {
  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
    `en.wikipedia/all-access/all-agents/${encodeURIComponent(title.replace(/ /g, '_'))}/monthly/` +
    `${WINDOW_START}/${WINDOW_END}`
  const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } })
  if (res.status === 404) return 0 // no data for this title/window
  if (res.status === 429 && attempt < 5) {
    await sleep(1000 * 2 ** attempt) // exponential backoff on rate-limit
    return fetchOne(title, attempt + 1)
  }
  if (!res.ok) throw new Error(`pageviews ${res.status} for "${title}"`)
  const json = await res.json()
  return (json.items ?? []).reduce((sum, it) => sum + (it.views ?? 0), 0)
}

/**
 * Fetch total pageviews for each country. Returns Map<cca3, number>.
 * Runs in small concurrent batches to stay polite to the API.
 * @param {{cca3:string,name:string}[]} countries
 * @param {(msg:string)=>void} [log]
 */
export async function fetchCountryPageviews(countries, log = () => {}) {
  const out = new Map()
  const suspicious = []
  // Sequential with a small delay — the pageviews API throttles bursts (HTTP 429).
  for (let i = 0; i < countries.length; i++) {
    const c = countries[i]
    const title = WIKI_TITLE_OVERRIDES[c.name] ?? c.name
    try {
      const views = await fetchOne(title)
      out.set(c.cca3, views)
      if (views < 10000) suspicious.push(`${c.name} (${title}): ${views}`)
    } catch (err) {
      log(`  ! ${c.name}: ${err.message}`)
      out.set(c.cca3, 0)
      suspicious.push(`${c.name} (${title}): ERROR`)
    }
    await sleep(120)
    if ((i + 1) % 25 === 0 || i + 1 === countries.length) {
      log(`  pageviews ${i + 1}/${countries.length}`)
    }
  }
  if (suspicious.length) {
    log(`  low/zero pageviews (check for title mismatches):\n    ${suspicious.join('\n    ')}`)
  }
  return out
}

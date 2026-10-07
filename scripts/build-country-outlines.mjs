// Build one high-detail silhouette per country for the "which country has this
// shape?" questions (app/components/geo/CountryOutline.tsx).
//
// The world map and point-in-country scoring keep using the light 110m atlas;
// a single country blown up to fill the screen needs far more detail, so this
// reads the 10m atlas once at build time and writes a tiny pre-projected SVG
// path per country:
//
//   public/geo/outlines/<ccn3 without leading zeros>.json  →  { w, h, d }
//
// Per country:
// 1. Keep the "home" landmass: the largest polygon plus anything near it.
//    Far-flung territories (French Guiana, Svalbard, Hawaii, the Canaries,
//    Easter Island...) are dropped - they otherwise shrink the mainland into
//    a corner of the frame.
// 2. Project with an azimuthal equal-area projection centred on that landmass,
//    so it looks like it does on a globe (no Mercator stretch up north, and
//    countries crossing the antimeridian like Russia stay in one piece).
// 3. Fit into a 1000-unit box, simplify (Douglas-Peucker, sub-pixel at quiz
//    size) and drop specks too small to see.
//
//   node scripts/build-country-outlines.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { feature } from 'topojson-client'
import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance } from 'd3-geo'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public/geo/outlines')

const BOX = 1000 // output coordinate space; the component scales it via viewBox
const TOLERANCE = 1.2 // simplification tolerance in box units (~0.3px at 280px)
const MIN_RING_AREA = 12 // drop rings smaller than this (box units²)
// A polygon joins the home landmass if its gap to the main polygon is within
// `reach` = max(NEAR_DEG, NEAR_FRACTION x main polygon radius), or if it's within
// CHAIN_DEG of a polygon that already joined (so archipelagos like Indonesia or
// Japan stay whole while Svalbard, Alaska and the Canaries fall away). A polygon
// at least MAJOR_FRACTION of the main one's area always stays, wherever it is
// (Peninsular Malaysia vs. Malaysian Borneo).
const NEAR_DEG = 2.5
const NEAR_FRACTION = 0.25
const CHAIN_DEG = 2
const MAJOR_FRACTION = 0.25

const DEG = Math.PI / 180

const topo = JSON.parse(
  readFileSync(join(root, 'node_modules/world-atlas/countries-10m.json'), 'utf8'),
)
const collection = feature(topo, topo.objects.countries)

const polygonsOf = (geom) =>
  geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : []

// At most `n` evenly spaced vertices, to keep the gap search cheap.
function sample(ring, n) {
  if (ring.length <= n) return ring
  const step = ring.length / n
  return Array.from({ length: n }, (_, i) => ring[Math.floor(i * step)])
}

// Smallest angular distance (degrees) between two polygons' outer rings.
function gapDeg(a, b) {
  let min = Infinity
  for (const p of b.sampled) for (const q of a.sampled) min = Math.min(min, geoDistance(p, q))
  return min / DEG
}

function describe(coords) {
  const centre = geoCentroid({ type: 'Polygon', coordinates: coords })
  let radius = 0
  for (const p of sample(coords[0], 2000)) radius = Math.max(radius, geoDistance(centre, p))
  return {
    coords,
    area: geoArea({ type: 'Polygon', coordinates: coords }),
    centre,
    radius: radius / DEG,
    sampled: sample(coords[0], 600),
  }
}

function homeLandmass(polys) {
  const all = polys.map(describe).sort((a, b) => b.area - a.area)
  const main = all[0]
  const reach = Math.max(NEAR_DEG, main.radius * NEAR_FRACTION)
  // Cheap lower bound on the gap, to skip the vertex search for far pairs.
  const roughGap = (a, b) => geoDistance(a.centre, b.centre) / DEG - a.radius - b.radius

  const major = all.slice(1).filter((p) => p.area >= main.area * MAJOR_FRACTION)
  const kept = [main, ...major]
  const queue = [...kept]
  let rest = all.slice(1 + major.length)
  while (queue.length) {
    const from = queue.shift()
    const limit = from === main ? reach : CHAIN_DEG
    const next = []
    for (const p of rest) {
      if (roughGap(from, p) <= limit && gapDeg(from, p) <= limit) {
        kept.push(p)
        queue.push(p)
      } else next.push(p)
    }
    rest = next
  }
  return { kept: kept.map((p) => p.coords), centre: main.centre }
}

// Iterative Douglas-Peucker on a closed ring of [x, y] points.
function simplify(ring, tol) {
  if (ring.length < 5) return ring
  const keep = new Uint8Array(ring.length)
  keep[0] = keep[ring.length - 1] = 1
  const stack = [[0, ring.length - 1]]
  const tol2 = tol * tol
  while (stack.length) {
    const [s, e] = stack.pop()
    const [x1, y1] = ring[s]
    const [x2, y2] = ring[e]
    const dx = x2 - x1
    const dy = y2 - y1
    const len2 = dx * dx + dy * dy
    let maxD = -1
    let idx = -1
    for (let i = s + 1; i < e; i++) {
      const [px, py] = ring[i]
      let d2
      if (len2 === 0) d2 = (px - x1) ** 2 + (py - y1) ** 2
      else {
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
        d2 = (px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2
      }
      if (d2 > maxD) {
        maxD = d2
        idx = i
      }
    }
    if (maxD > tol2) {
      keep[idx] = 1
      stack.push([s, idx], [idx, e])
    }
  }
  return ring.filter((_, i) => keep[i])
}

function ringArea(pts) {
  let a = 0
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % n]
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a) / 2
}

const r1 = (n) => Math.round(n * 10) / 10

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

let written = 0
let bytes = 0
const dropped = []
for (const f of collection.features) {
  if (f.id == null) continue
  const polys = polygonsOf(f.geometry)
  if (polys.length === 0) continue

  const { kept, centre } = homeLandmass(polys)
  if (kept.length < polys.length) dropped.push(`${f.properties.name} (${polys.length - kept.length})`)
  const home = { type: 'MultiPolygon', coordinates: kept }

  const projection = geoAzimuthalEqualArea()
    .rotate([-centre[0], -centre[1]])
    .fitSize([BOX, BOX], home)

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const rings = []
  for (const poly of kept) {
    for (const ring of poly) {
      const pts = simplify(ring.map((p) => projection(p)), TOLERANCE)
      if (pts.length < 4 || ringArea(pts) < MIN_RING_AREA) continue
      rings.push(pts)
      for (const [x, y] of pts) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }
  if (rings.length === 0) continue

  // Origin at the top-left of what's actually drawn.
  const d = rings
    .map((ring) => {
      const pts = ring.slice(0, -1) // last point repeats the first; Z closes it
      return `M${pts.map(([x, y]) => `${r1(x - minX)},${r1(y - minY)}`).join('L')}Z`
    })
    .join('')
  const json = JSON.stringify({ w: r1(maxX - minX), h: r1(maxY - minY), d })
  writeFileSync(join(outDir, `${parseInt(String(f.id), 10)}.json`), json)
  written++
  bytes += json.length
}

console.log(
  `wrote ${written} outlines to public/geo/outlines (${Math.round(bytes / 1024)} KB total, ` +
    `avg ${Math.round(bytes / written / 1024)} KB)`,
)
console.log(`dropped far-off polygons from: ${dropped.join(', ')}`)

// Build a tiny set of morph-ready country silhouettes for the waiting-screen
// loader (see app/components/pop/PopWaitingLoader.tsx). Each shape is the
// country's largest polygon ring, projected, resampled to a FIXED point count
// (so shape[i] can be linearly interpolated into shape[i+1] point-by-point),
// aspect-preserved and centered into a ~0..100 box, with index 0 anchored to
// the topmost point to keep the morph from twisting.
//
//   node scripts/build-country-shapes.mjs
//
// Writes lib/geo/country-shapes.json (imported directly by the component).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { feature } from 'topojson-client'
import { geoMercator, geoPath } from 'd3-geo'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const POINTS = 64 // points per shape - every shape resampled to exactly this

// Curated for recognizability: dominant single-mainland silhouettes that read
// well small. Names must match the TopoJSON `properties.name`.
const WANTED = [
  'France',
  'Italy',
  'Spain',
  'Sweden',
  'Norway',
  'India',
  'Brazil',
  'Australia',
  'Egypt',
  'Chile',
  'Madagascar',
  'Iceland',
  'South Africa',
  'Turkey',
  'Japan',
  'New Zealand',
]

const topo = JSON.parse(readFileSync(join(root, 'public/geo/countries-110m.json'), 'utf8'))
const collection = feature(topo, topo.objects.countries)
const byName = new Map(collection.features.map((f) => [f.properties?.name, f]))

// Signed area of a projected ring (shoelace) - used to pick the biggest polygon.
function ringArea(pts) {
  let a = 0
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % n]
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a) / 2
}

// Largest outer ring of a feature, projected to screen space by `proj`.
function largestRing(feat, proj) {
  const geom = feat.geometry
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates]
  let best = null
  let bestArea = -1
  for (const poly of polys) {
    const outer = poly[0].map(([lng, lat]) => proj([lng, lat])).filter((p) => p && isFinite(p[0]))
    if (outer.length < 4) continue
    const area = ringArea(outer)
    if (area > bestArea) {
      bestArea = area
      best = outer
    }
  }
  return best
}

// Resample a closed ring to exactly `n` points, evenly spaced by arc length.
function resample(ring, n) {
  // drop duplicate closing point if present
  const pts = ring.slice()
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) pts.pop()

  const seg = []
  let total = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    seg.push(len)
    total += len
  }
  const step = total / n
  const out = []
  let idx = 0
  let acc = 0
  for (let k = 0; k < n; k++) {
    const target = k * step
    while (acc + seg[idx] < target && idx < seg.length - 1) {
      acc += seg[idx]
      idx++
    }
    const a = pts[idx]
    const b = pts[(idx + 1) % pts.length]
    const t = seg[idx] > 0 ? (target - acc) / seg[idx] : 0
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}

// Aspect-preserving fit into a `box`-sized square, centered.
function normalize(pts, box = 100, pad = 8) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of pts) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const scale = (box - pad * 2) / Math.max(w, h)
  const offX = (box - w * scale) / 2
  const offY = (box - h * scale) / 2
  return pts.map(([x, y]) => [(x - minX) * scale + offX, (y - minY) * scale + offY])
}

// Rotate the ring so index 0 is the topmost point - a stable anchor across all
// shapes so the crossfade morph doesn't spin.
function anchorTop(pts) {
  let min = 0
  for (let i = 1; i < pts.length; i++) if (pts[i][1] < pts[min][1]) min = i
  return pts.slice(min).concat(pts.slice(0, min))
}

// Ensure consistent winding (clockwise) so interpolation direction matches.
function ensureClockwise(pts) {
  let a = 0
  for (let i = 0, n = pts.length; i < n; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % n]
    a += x1 * y2 - x2 * y1
  }
  return a > 0 ? pts.slice().reverse() : pts
}

const shapes = []
for (const name of WANTED) {
  const feat = byName.get(name)
  if (!feat) {
    console.warn(`skip: "${name}" not in topojson`)
    continue
  }
  // Per-shape mercator fit so each silhouette is drawn at a comparable scale
  // before we normalize (keeps small countries from vanishing).
  const proj = geoMercator().fitExtent(
    [
      [0, 0],
      [100, 100],
    ],
    feat,
  )
  const ring = largestRing(feat, proj)
  if (!ring) {
    console.warn(`skip: "${name}" has no usable ring`)
    continue
  }
  let pts = resample(ring, POINTS)
  pts = ensureClockwise(pts)
  pts = anchorTop(pts)
  pts = normalize(pts)
  shapes.push({ name, pts: pts.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]) })
}

const outPath = join(root, 'lib/geo/country-shapes.json')
writeFileSync(outPath, JSON.stringify(shapes))
console.log(`wrote ${shapes.length} shapes (${POINTS} pts each) → ${outPath}`)

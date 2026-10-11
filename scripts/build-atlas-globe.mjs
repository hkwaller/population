// Decorative home globe, generated from the same Natural Earth/world-atlas
// geography already used by the game. Run: node scripts/build-atlas-globe.mjs
import fs from 'node:fs'
import { geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const world = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'))
const projection = geoOrthographic().rotate([-15, -15]).translate([240, 240]).scale(215)
const land = geoPath(projection)(feature(world, world.objects.land))
fs.writeFileSync(
  'public/geo/atlas-globe.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480"><path fill="#F4E8D2" d="${land}"/></svg>`,
)

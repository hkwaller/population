// Keep the map and country-hit scoring on the same complete, medium-detail atlas.
// Unlike individual quiz silhouettes, retain every island and overseas territory.
// 50m keeps small countries while avoiding the 10m atlas's costly redraws.
import { readFileSync, writeFileSync } from 'node:fs'
import { feature } from 'topojson-client'
import { geoArea } from 'd3-geo'

const atlas = JSON.parse(readFileSync(
  new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url), 'utf8',
))

// Some source island polygons (Maldives) have reversed winding: d3 interprets
// them as the entire globe minus the island. Reverse their shared-arc references,
// retaining the original coordinates and the opposite winding of any holes.
for (const geometry of atlas.objects.countries.geometries) {
  const polygons = geometry.type === 'Polygon' ? [geometry.arcs]
    : geometry.type === 'MultiPolygon' ? geometry.arcs : []
  for (const rings of polygons) {
    if (geoArea(feature(atlas, { type: 'Polygon', arcs: rings })) > 2 * Math.PI) {
      for (let i = 0; i < rings.length; i++) {
        rings[i] = rings[i].slice().reverse().map((arc) => ~arc)
      }
    }
  }
}

writeFileSync(new URL('../public/geo/countries-50m.json', import.meta.url), JSON.stringify(atlas))

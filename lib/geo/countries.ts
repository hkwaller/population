import raw from './countries.json'

export type Country = {
  cca2: string
  cca3: string
  ccn3: string
  name: string
  official: string | null
  capital: string | null
  capitalLat: number | null
  capitalLng: number | null
  lat: number | null
  lng: number | null
  area: number | null
  borders: string[]
  region: string | null
  subregion: string | null
  currency: string | null
  currencyCode: string | null
  languages: string[]
  flag: string | null
  population: number | null
  hasOutline: boolean
  /** English-Wikipedia annual pageviews — a "fame" proxy for difficulty scoring. */
  pageviews: number
}

export const COUNTRIES = raw as Country[]

export const byCca2 = new Map(COUNTRIES.map((c) => [c.cca2, c]))
export const byName = new Map(COUNTRIES.map((c) => [c.name, c]))
export const byCca3 = new Map(COUNTRIES.map((c) => [c.cca3, c]))
/** Numeric ISO code (world-atlas geometry id) → country. */
export const byCcn3 = new Map(COUNTRIES.map((c) => [String(parseInt(c.ccn3, 10)), c]))

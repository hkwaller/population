import { COUNTRIES } from './countries'

/**
 * Land-adjacency graph built once from `country.borders` (cca3 edges). Edges are
 * forced symmetric (if A lists B, B↔A both hold) to guard against one-sided data.
 * Border-less countries (islands like Fiji, Iceland, NZ) simply have no edges, so
 * they can never appear on a valid route.
 */
const adj = new Map<string, Set<string>>()
for (const c of COUNTRIES) {
  if (!adj.has(c.cca3)) adj.set(c.cca3, new Set())
  for (const b of c.borders) {
    adj.get(c.cca3)!.add(b)
    if (!adj.has(b)) adj.set(b, new Set())
    adj.get(b)!.add(c.cca3)
  }
}

/** Neighbouring country cca3 codes, or [] for a border-less country. */
export function neighbors(cca3: string): string[] {
  return Array.from(adj.get(cca3) ?? [])
}

/** True if two countries share a land border. */
export function areAdjacent(a: string, b: string): boolean {
  return adj.get(a)?.has(b) ?? false
}

/** Countries with at least one land border - the only valid route endpoints/waypoints. */
export function hasBorders(cca3: string): boolean {
  return (adj.get(cca3)?.size ?? 0) > 0
}

/**
 * BFS shortest path (inclusive of both endpoints) as cca3 codes, or null if the
 * two countries aren't connected by land within the graph.
 */
export function shortestPath(from: string, to: string): string[] | null {
  if (from === to) return [from]
  if (!adj.has(from) || !adj.has(to)) return null
  const prev = new Map<string, string>()
  const seen = new Set<string>([from])
  const queue: string[] = [from]
  while (queue.length) {
    const node = queue.shift()!
    for (const next of adj.get(node) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      prev.set(next, node)
      if (next === to) {
        const path = [to]
        let cur = to
        while (prev.has(cur)) {
          cur = prev.get(cur)!
          path.unshift(cur)
        }
        return path
      }
      queue.push(next)
    }
  }
  return null
}

/** Hop count of the shortest land path (edges, not nodes), or null if unconnected. */
export function shortestPathLength(from: string, to: string): number | null {
  const path = shortestPath(from, to)
  return path ? path.length - 1 : null
}

/**
 * Validate a proposed route (array of cca3 codes): it must start at `from`, end at
 * `to`, every consecutive pair must be land-adjacent, no repeated country, and use
 * no more than `maxSteps` hops.
 */
export function isValidRoute(
  from: string,
  to: string,
  route: string[],
  maxSteps: number,
): boolean {
  if (!Array.isArray(route) || route.length < 2) return false
  if (route[0] !== from || route[route.length - 1] !== to) return false
  if (route.length - 1 > maxSteps) return false
  if (new Set(route).size !== route.length) return false // no revisits
  for (let i = 1; i < route.length; i++) {
    if (!areAdjacent(route[i - 1], route[i])) return false
  }
  return true
}

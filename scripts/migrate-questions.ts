/**
 * Seeds the geography question bank into Supabase from app/database/geo-questions.json
 * (produced by `node scripts/gen/build-questions.mjs`).
 *
 * Prereqs:
 *   1. Create the schema first: run scripts/schema.sql in the Supabase SQL editor.
 *   2. Set env vars in .env.local:
 *        NEXT_PUBLIC_SUPABASE_URL
 *        SUPABASE_SERVICE_ROLE_KEY   <-- service role (bypasses RLS), never client-side
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/migrate-questions.ts
 *
 * Full sync: deletes all existing `source='geo'` rows first, then inserts the
 * current bank. This keeps Supabase in lockstep with the JSON — questions removed
 * from the generator (e.g. dropped distance pairs) are pruned, not left orphaned.
 * Idempotent: re-running always reproduces exactly the JSON's contents.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local or export them before running.',
  )
  process.exit(1)
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

type GeoQuestion = {
  id: string
  type: 'slider' | 'choice' | 'map'
  category: string
  question: string
  prompt?: unknown
  answer: unknown
  options?: string[]
  lower_bound?: number
  upper_bound?: number
  unit?: string
  falloffKm?: number
  ccn3?: string
  difficulty?: number
  tier?: string
}

const CHUNK_SIZE = 500

async function main() {
  const filePath = join(process.cwd(), 'app', 'database', 'geo-questions.json')
  const questions: GeoQuestion[] = JSON.parse(readFileSync(filePath, 'utf-8'))

  const rows = questions.map((q) => ({
    id: q.id,
    type: q.type,
    category: q.category,
    question: q.question,
    prompt: q.prompt ?? null,
    answer: q.answer,
    options: q.options ?? null,
    lower_bound: q.lower_bound ?? null,
    upper_bound: q.upper_bound ?? null,
    unit: q.unit ?? null,
    falloff_km: q.falloffKm ?? null,
    ccn3: q.ccn3 ?? null,
    difficulty: q.difficulty ?? null,
    tier: q.tier ?? null,
    source: 'geo',
  }))

  console.log(`Loaded ${rows.length} questions.`)

  // Prune first: remove every existing geo row so questions dropped from the
  // generator don't linger as orphans. The source filter satisfies Supabase's
  // "delete requires a filter" rule; other sources are left untouched.
  const { error: deleteError } = await supabase
    .from('population_questions')
    .delete()
    .eq('source', 'geo')
  if (deleteError) {
    console.error('Error pruning existing geo questions:', deleteError.message)
    process.exit(1)
  }
  console.log('Pruned existing geo questions.')

  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    const { error } = await supabase.from('population_questions').insert(chunk)
    if (error) {
      console.error(`Error inserting chunk ${i / CHUNK_SIZE + 1}:`, error.message)
      process.exit(1)
    }
    inserted += chunk.length
    console.log(`Inserted ${inserted}/${rows.length}`)
  }

  const byCategory: Record<string, number> = {}
  for (const q of questions) byCategory[q.category] = (byCategory[q.category] ?? 0) + 1
  console.log('\nDone. Questions per category:')
  for (const [cat, count] of Object.entries(byCategory).sort()) {
    console.log(`  ${cat}: ${count}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

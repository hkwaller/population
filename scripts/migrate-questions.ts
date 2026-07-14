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
 * Idempotent: upserts on `id`, so re-running is safe.
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
    source: 'geo',
  }))

  console.log(`Loaded ${rows.length} questions.`)

  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    const { error } = await supabase.from('population_questions').upsert(chunk, { onConflict: 'id' })
    if (error) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE + 1}:`, error.message)
      process.exit(1)
    }
    inserted += chunk.length
    console.log(`Upserted ${inserted}/${rows.length}`)
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses the service role key to bypass RLS — admin only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { questions } = await req.json()

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 })
    }

    // Check for existing IDs first
    const ids = questions.map((q: { id: string }) => q.id)
    const { data: existing } = await supabase.from('population_questions').select('id').in('id', ids)
    const existingIds = new Set((existing ?? []).map((e: { id: string }) => e.id))
    const newQuestions = questions.filter((q: { id: string }) => !existingIds.has(q.id))
    const skipped = questions.length - newQuestions.length

    if (newQuestions.length === 0) {
      return NextResponse.json({ data: [], skipped })
    }

    const { data, error } = await supabase.from('population_questions').insert(newQuestions).select()
    if (error) throw error

    return NextResponse.json({ data, skipped })
  } catch (error) {
    console.error('Error inserting questions:', error)
    return NextResponse.json({ error: 'Failed to insert questions' }, { status: 500 })
  }
}

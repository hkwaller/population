import geoQuestions from '@/app/database/geo-questions.json'
import { pickDaily, dateKeyUTC } from '@/lib/daily'
import { normalizeQuestionRow } from '@/lib/utils'
import { DailyGame } from '@/app/components/daily/DailyGame'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily Puzzle',
  description:
    'One shared geography puzzle for the whole world each day. Same questions for everyone - come back daily and climb the streak.',
  alternates: { canonical: '/daily' },
}

// Date-dependent - never statically cached.
export const dynamic = 'force-dynamic'

export default function DailyPage() {
  const dateKey = dateKeyUTC(new Date())
  // The JSON bank uses the Supabase row shape (rank items live under `options`),
  // so normalize it like the Supabase path does.
  const questions = pickDaily(geoQuestions.map(normalizeQuestionRow), dateKey)
  return <DailyGame questions={questions} dateKey={dateKey} />
}

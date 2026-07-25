import geoQuestions from '@/app/database/geo-questions.json'
import type { TQuestion } from '@/app/types'
import { pickDaily, dateKeyUTC } from '@/lib/daily'
import { toLargestFirstRank } from '@/lib/utils'
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
  // The JSON bank bypasses normalizeQuestionRow (the Supabase path), so flip any
  // legacy "smallest first" rank questions to largest-first here too.
  const questions = pickDaily(geoQuestions as unknown as TQuestion[], dateKey).map((q) =>
    q.type === 'rank' ? toLargestFirstRank(q) : q,
  )
  return <DailyGame questions={questions} dateKey={dateKey} />
}

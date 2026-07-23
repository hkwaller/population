import geoQuestions from '@/app/database/geo-questions.json'
import type { TQuestion } from '@/app/types'
import { pickDaily, dateKeyUTC } from '@/lib/daily'
import { toLargestFirstRank } from '@/lib/utils'
import { DailyGame } from '@/app/components/daily/DailyGame'

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

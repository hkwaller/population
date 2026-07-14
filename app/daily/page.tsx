import geoQuestions from '@/app/database/geo-questions.json'
import type { TQuestion } from '@/app/types'
import { pickDaily, dateKeyUTC } from '@/lib/daily'
import { DailyGame } from '@/app/components/daily/DailyGame'

// Date-dependent — never statically cached.
export const dynamic = 'force-dynamic'

export default function DailyPage() {
  const dateKey = dateKeyUTC(new Date())
  const questions = pickDaily(geoQuestions as unknown as TQuestion[], dateKey)
  return <DailyGame questions={questions} dateKey={dateKey} />
}

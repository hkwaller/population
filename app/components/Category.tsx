import { useMemo } from 'react'
import { TQuestion } from '../types'
import { categories } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { POP } from './pop/theme'

export const Category = ({
  question,
  bg = POP.bubblegum,
  className,
}: {
  question: TQuestion
  bg?: string
  className?: string
}) => {
  const categoryName = useMemo(() => {
    if (!question) return
    return categories.find((c) => c.id === question.category)?.name
  }, [question])

  if (!categoryName) return null

  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-pill border-2 border-pop-ink px-3 py-1 text-sm font-black text-pop-ink',
        className,
      )}
      style={{ background: bg }}
    >
      {categoryName}
    </span>
  )
}

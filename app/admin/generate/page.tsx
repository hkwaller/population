'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { generateQuestions, asSlider, formatAnswerValue } from '@/lib/utils'
import { categories } from '@/lib/utils'
import { TQuestion } from '@/app/types'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ReviewQuestion = TQuestion & { isDuplicate: boolean; selected: boolean }

export default function AdminGeneratePage() {
  const [topic, setTopic] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [amount, setAmount] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([])
  console.log('🚀 ~ AdminGeneratePage ~ reviewQuestions:', reviewQuestions)
  const [saveResult, setSaveResult] = useState<{ added: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const { fetchQuestionsByCategory } = useSupabase()

  const handleGenerate = async () => {
    if (!topic.trim() || !selectedCategory) return
    setGenerating(true)
    setError('')
    setSaveResult(null)
    setReviewQuestions([])

    try {
      const existing = await fetchQuestionsByCategory(selectedCategory)
      const existingIds = new Set(existing.map((q) => q.id))

      const result = await generateQuestions(
        topic,
        amount,
        existing as TQuestion[],
        selectedCategory,
      )

      if (result.error) {
        setError(result.error)
        return
      }

      const withMeta: ReviewQuestion[] = result.questions.map((q) => ({
        ...q,
        isDuplicate: existingIds.has(q.id),
        selected: !existingIds.has(q.id),
      }))
      console.log('🚀 ~ handleGenerate ~ withMeta:', withMeta)

      setReviewQuestions(withMeta)
    } catch (e) {
      setError('Failed to generate questions. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    const toSave = reviewQuestions
      .filter((q) => q.selected && !q.isDuplicate)
      .map(({ isDuplicate, selected, ...q }) => q)
    if (toSave.length === 0) return

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: toSave }),
      })
      const result = await res.json()

      if (!res.ok || result.error) {
        setError(result.error ?? 'Failed to save questions.')
        return
      }

      const added = (result.data ?? []).length
      setSaveResult({ added, skipped: result.skipped ?? 0 })
      if (added > 0) {
        setReviewQuestions([])
      }
    } catch (e) {
      setError('Failed to save questions.')
    } finally {
      setSaving(false)
    }
  }

  const toggleQuestion = (id: string) => {
    setReviewQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q)),
    )
  }

  const toggleAll = () => {
    const selectableCount = reviewQuestions.filter((q) => !q.isDuplicate).length
    const selectedCount = reviewQuestions.filter((q) => q.selected && !q.isDuplicate).length
    const allSelected = selectedCount === selectableCount
    setReviewQuestions((prev) =>
      prev.map((q) => (q.isDuplicate ? q : { ...q, selected: !allSelected })),
    )
  }

  const selectedCount = reviewQuestions.filter((q) => q.selected && !q.isDuplicate).length
  const duplicateCount = reviewQuestions.filter((q) => q.isDuplicate).length

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-yellow-500" />
            Generate Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Norwegian history 1900–1950"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Amount ({amount})</label>
            <input
              type="range"
              min={5}
              max={20}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>5</span>
              <span>20</span>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !topic.trim() || !selectedCategory}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {saveResult && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium">
                {saveResult.added} question{saveResult.added !== 1 ? 's' : ''} added to the database
                {saveResult.skipped > 0 &&
                  `, ${saveResult.skipped} duplicate${saveResult.skipped !== 1 ? 's' : ''} skipped`}
              </p>
            </div>
          )}

          {reviewQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  Review questions
                  {duplicateCount > 0 && (
                    <span className="ml-2 text-amber-600 font-normal">
                      ({duplicateCount} already in database)
                    </span>
                  )}
                </h3>
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {selectedCount === reviewQuestions.filter((q) => !q.isDuplicate).length
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-24 text-right">Answer</TableHead>
                    <TableHead className="w-28 text-right">Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewQuestions.map((q) => (
                    <TableRow key={q.id} className={q.isDuplicate ? 'opacity-50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={q.selected}
                          disabled={q.isDuplicate}
                          onChange={() => toggleQuestion(q.id)}
                          className="h-4 w-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {q.question}
                        {q.isDuplicate && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5">
                            duplicate
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAnswerValue(q.answer)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-gray-500">
                        {asSlider(q)?.lower_bound}–{asSlider(q)?.upper_bound}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
                className="w-full"
                variant="default"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  `Add ${selectedCount} question${selectedCount !== 1 ? 's' : ''} to database`
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

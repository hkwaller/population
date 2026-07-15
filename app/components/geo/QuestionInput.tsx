'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { AnswerValue, LatLng, TQuestion } from '@/app/types'
import { PopSlider } from '../pop/PopSlider'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'
import { ChoiceOptions } from './ChoiceOptions'
import { MapPicker } from './MapPicker'
import { RankInput } from './RankInput'

/**
 * Per-type answer input, shared by the multiplayer game and the solo/daily mode.
 * Slider and map collect a value then commit on "Lock it in"; choice commits on
 * tap. Reports the value plus elapsedMs (for the choice speed bonus).
 */
export function QuestionInput({
  question,
  onAnswer,
  disabled = false,
}: {
  question: TQuestion
  onAnswer: (value: AnswerValue, elapsedMs: number) => void
  disabled?: boolean
}) {
  const startedAt = useRef<number>(0)
  // reset the timer whenever the question changes
  useEffect(() => {
    startedAt.current = performance.now()
  }, [question.id])
  const elapsed = () => Math.round(performance.now() - startedAt.current)

  const midpoint = useMemo(
    () =>
      question.type === 'slider'
        ? Math.round((question.lower_bound + question.upper_bound) / 2)
        : 0,
    [question],
  )
  const [sliderValue, setSliderValue] = useState(midpoint)
  const [pin, setPin] = useState<LatLng | null>(null)

  // Reset the input when the question changes (during render, not in an effect).
  const [prevQuestionId, setPrevQuestionId] = useState(question.id)
  if (question.id !== prevQuestionId) {
    setPrevQuestionId(question.id)
    setSliderValue(midpoint)
    setPin(null)
  }

  if (question.type === 'choice') {
    return (
      <ChoiceOptions
        options={question.options}
        disabled={disabled}
        onSelect={(opt) => onAnswer(opt, elapsed())}
      />
    )
  }

  if (question.type === 'rank') {
    return (
      <RankInput question={question} onAnswer={(v, ms) => onAnswer(v, ms)} disabled={disabled} />
    )
  }

  if (question.type === 'map') {
    return (
      <MapPicker
        value={pin}
        onPick={setPin}
        onConfirm={() => pin && onAnswer(pin, elapsed())}
        disabled={disabled}
      />
    )
  }

  // slider
  return (
    <div className="flex flex-col gap-4">
      <PopSlider
        min={question.lower_bound}
        max={question.upper_bound}
        value={sliderValue}
        onChange={setSliderValue}
        valueColor={POP.cobalt}
        locked={disabled}
      />
      <PopButton
        variant="primary"
        size="lg"
        disabled={disabled}
        onClick={() => onAnswer(sliderValue, elapsed())}
      >
        Lock it in
      </PopButton>
    </div>
  )
}

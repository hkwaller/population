'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { AnswerValue, LatLng, TQuestion } from '@/app/types'
import { usePopStore } from '@/app/state'
import { PopSlider } from '../pop/PopSlider'
import { PopButton } from '../pop/PopButton'
import { POP } from '../pop/theme'
import { ChoiceOptions } from './ChoiceOptions'
import { HigherLower } from './HigherLower'
import { MapPicker } from './MapPicker'
import { RankInput } from './RankInput'
import { BuildUp } from './BuildUp'
import { RouteInput } from './RouteInput'
import { ConfidenceBand } from './ConfidenceBand'

/** Extra scoring modifiers an input can attach to its answer (confidence mode, build-up). */
export type AnswerExtra = { confidence?: number; cluesUsed?: number }

/**
 * Per-type answer input, shared by the multiplayer game and the solo/daily mode.
 * Slider and map collect a value then commit on "Lock it in"; choice commits on
 * tap. Reports the value plus elapsedMs (for the choice speed bonus) and optional
 * per-answer extras (confidence band/radius).
 */
export function QuestionInput({
  question,
  onAnswer,
  disabled = false,
  confidenceMode: confidenceModeProp,
}: {
  question: TQuestion
  onAnswer: (value: AnswerValue, elapsedMs: number, extra?: AnswerExtra) => void
  disabled?: boolean
  /** Override the store setting (used by the preview harness). */
  confidenceMode?: boolean
}) {
  const storeConfidence = usePopStore((s) => s.confidenceMode)
  const confidenceMode = confidenceModeProp ?? storeConfidence

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
  // Default confidence band: a quarter of the slider range (half-width).
  const defaultBand = useMemo(
    () =>
      question.type === 'slider'
        ? Math.round((question.upper_bound - question.lower_bound) / 4)
        : 0,
    [question],
  )
  const [sliderValue, setSliderValue] = useState(midpoint)
  const [band, setBand] = useState(defaultBand)
  const [pin, setPin] = useState<LatLng | null>(null)
  const [radius, setRadius] = useState(0)

  // Reset the input when the question changes (during render, not in an effect).
  const [prevQuestionId, setPrevQuestionId] = useState(question.id)
  if (question.id !== prevQuestionId) {
    setPrevQuestionId(question.id)
    setSliderValue(midpoint)
    setBand(defaultBand)
    setPin(null)
    setRadius(0)
  }

  if (question.type === 'choice' || question.type === 'odd-one-out') {
    return (
      <ChoiceOptions
        options={question.options}
        disabled={disabled}
        onSelect={(opt) => onAnswer(opt, elapsed())}
      />
    )
  }

  if (question.type === 'higher-lower') {
    return (
      <HigherLower
        question={question}
        disabled={disabled}
        onSelect={(side) => onAnswer(side, elapsed())}
      />
    )
  }

  if (question.type === 'rank') {
    return (
      <RankInput question={question} onAnswer={(v, ms) => onAnswer(v, ms)} disabled={disabled} />
    )
  }

  if (question.type === 'build-up') {
    return (
      <BuildUp
        question={question}
        onAnswer={(v, ms, extra) => onAnswer(v, ms, extra)}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'route') {
    return (
      <RouteInput question={question} onAnswer={(v, ms) => onAnswer(v, ms)} disabled={disabled} />
    )
  }

  if (question.type === 'map') {
    return (
      <div className="flex flex-col gap-4">
        <MapPicker
          value={pin}
          onPick={setPin}
          onConfirm={() =>
            pin && onAnswer(pin, elapsed(), confidenceMode ? { confidence: radius } : undefined)
          }
          disabled={disabled}
        />
        {confidenceMode && (
          <ConfidenceBand
            label="How wide is your circle? (km)"
            min={50}
            max={question.falloffKm ?? 2500}
            value={radius || Math.round((question.falloffKm ?? 2500) / 4)}
            onChange={setRadius}
            disabled={disabled}
          />
        )}
      </div>
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
      {confidenceMode && (
        <ConfidenceBand
          label={`How sure? (± ${question.unit ?? ''})`}
          min={0}
          max={Math.round((question.upper_bound - question.lower_bound) / 2)}
          value={band}
          onChange={setBand}
          disabled={disabled}
        />
      )}
      <PopButton
        variant="primary"
        size="lg"
        disabled={disabled}
        onClick={() =>
          onAnswer(sliderValue, elapsed(), confidenceMode ? { confidence: band } : undefined)
        }
      >
        Lock it in
      </PopButton>
    </div>
  )
}

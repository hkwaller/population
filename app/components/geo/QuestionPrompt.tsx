'use client'

import { byCca3 } from '@/lib/geo/countries'
import type { PromptSpec } from '@/app/types'
import { CountryOutline } from './CountryOutline'

/** A flag image served from /public/flags/{cca2}.svg. */
export function FlagPrompt({ code, className }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt="Flag to identify"
      className={className}
      style={{
        width: 'min(340px, 78vw)',
        borderRadius: 12,
        border: '4px solid #211812',
        boxShadow: '0 8px 0 rgba(0,0,0,0.18)',
      }}
    />
  )
}

/** The set of neighbouring countries (their flags) for a "which borders these?" question. */
export function BordersPrompt({ codes }: { codes: string[] }) {
  const neighbours = codes.map((c) => byCca3.get(c)).filter(Boolean).slice(0, 6)
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {neighbours.map((n) => (
        <div key={n!.cca3} className="flex flex-col items-center gap-1">
          <img
            // eslint-disable-next-line @next/next/no-img-element
            src={`/flags/${n!.cca2.toLowerCase()}.svg`}
            alt={n!.name}
            style={{ width: 64, borderRadius: 6, border: '2px solid #211812' }}
          />
          <span className="text-xs font-bold text-pop-ink/70">{n!.name}</span>
        </div>
      ))}
    </div>
  )
}

/** Renders a question's stimulus based on its PromptSpec (falls back to text). */
export function QuestionPrompt({
  prompt,
  fallbackText,
}: {
  prompt?: PromptSpec
  fallbackText: string
}) {
  if (!prompt || prompt.kind === 'text') {
    return (
      <p
        className="text-center font-black leading-tight tracking-[-0.01em] text-pop-ink"
        style={{ fontSize: 'clamp(24px, 4.5vw, 44px)' }}
      >
        {prompt?.kind === 'text' ? prompt.text : fallbackText}
      </p>
    )
  }
  if (prompt.kind === 'flag') return <FlagPrompt code={prompt.code} />
  if (prompt.kind === 'outline') return <CountryOutline code={prompt.code} size={280} />
  if (prompt.kind === 'borders') return <BordersPrompt codes={prompt.codes} />
  return null
}

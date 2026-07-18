'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

import { useAdFree } from '@/hooks/useAdFree'

const BANNER_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY

/**
 * Adsterra 468x60 banner. Self-gating: renders nothing for ad-free users (and
 * while Clerk hydrates, to avoid a flash). Includes a subtle "Remove ads" link
 * so the banner doubles as the upsell entry point.
 */
export function AdsterraBanner() {
  const { adFree, loading } = useAdFree()
  const containerRef = useRef<HTMLDivElement>(null)
  const hidden = adFree || loading

  useEffect(() => {
    if (hidden || !containerRef.current || !BANNER_KEY) return
    const container = containerRef.current
    container.innerHTML = ''

    const optionsScript = document.createElement('script')
    optionsScript.type = 'text/javascript'
    optionsScript.text = `
      atOptions = {
        'key': '${BANNER_KEY}',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };
    `

    const invokeScript = document.createElement('script')
    invokeScript.type = 'text/javascript'
    invokeScript.src = `//www.topcreativeformat.com/${BANNER_KEY}/invoke.js`

    container.appendChild(optionsScript)
    container.appendChild(invokeScript)

    return () => {
      container.innerHTML = ''
    }
  }, [hidden])

  if (hidden) return null

  return (
    <div className="flex flex-col items-center gap-1">
      <div ref={containerRef} className="flex justify-center" style={{ minHeight: 60 }} />
      <Link
        href="/go-ad-free"
        className="text-xs font-bold text-pop-ink/40 underline decoration-dotted hover:text-pop-ink/70"
      >
        Remove ads
      </Link>
    </div>
  )
}

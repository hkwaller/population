'use client'

import { useEffect, useRef } from 'react'

const BANNER_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY

export function AdsterraBanner() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !BANNER_KEY) return
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
  }, [])

  return <div ref={containerRef} className="flex justify-center" style={{ minHeight: 60 }} />
}

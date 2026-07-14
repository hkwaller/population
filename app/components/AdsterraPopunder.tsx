'use client'

import { useEffect, useRef } from 'react'

const POPUNDER_SRC = process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC

export function AdsterraPopunder() {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !POPUNDER_SRC) return
    fired.current = true

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = POPUNDER_SRC
    document.body.appendChild(script)
  }, [])

  return null
}

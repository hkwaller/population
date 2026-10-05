import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { navigate } from './nav'

/** Stand-in for next/link in the offline island (see vite.config.ts). */
export default function Link({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}

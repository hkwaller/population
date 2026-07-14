'use client'

import { LoginAndProfile } from './LoginAndProfile'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePathname, useRouter } from 'next/navigation'

export const Logo = () => {
  const router = useRouter()
  const isDesktop = useMediaQuery('(min-width: 600px)')
  const isGamePath = usePathname().includes('/game')

  return (
    <div
      className={`${
        isDesktop && isGamePath ? 'absolute left-0 right-0 top-0 z-2' : undefined
      } w-full items-center justify-between mb-0 md:mb-12 px-4 md:px-8 pt-4 md:pt-8 flex gap-4`}
    >
      <div
        className="bg-white border-4 border-ish-ink p-2 transform -rotate-1 inline-block cursor-pointer shadow-[4px_4px_0px_#211812]
      md:border-8 md:p-4"
        onClick={() => router.push('/')}
      >
        <span className="text-xl font-extrabold md:text-2xl tracking-tighter">Ish.</span>
      </div>
      <LoginAndProfile />
    </div>
  )
}

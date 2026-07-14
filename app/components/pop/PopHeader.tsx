'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { SignInButton, useUser } from '@clerk/nextjs'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { SignOutButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

// The tilted `Population` tag, top-left of most screens. Clicking it goes home.
export function PopLogo({
  tone = 'paper',
  textColor,
}: {
  tone?: 'paper' | 'ink'
  textColor?: string
}) {
  const isPaper = tone === 'paper'
  return (
    <Link href="/">
      <motion.span
        whileHover={{ rotate: 0, y: -2 }}
        className={cn(
          'inline-block cursor-pointer rounded-[18px] px-4 py-2 text-xl font-black shadow-pop-sm md:text-2xl',
          isPaper ? 'bg-white' : 'bg-pop-ink text-white',
        )}
        style={{ rotate: '-3deg', color: textColor, boxShadow: '0 5px 0 rgba(0,0,0,0.15)' }}
      >
        Population
      </motion.span>
    </Link>
  )
}

// Sign-in ghost pill (signed out) or avatar w/ sign-out menu (signed in).
export function PopAuth({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { user, isSignedIn, isLoaded } = useUser()
  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <motion.button
          whileHover={{ rotate: 0, y: -2 }}
          style={{ rotate: '2deg' }}
          className={cn(
            'rounded-pill border-[3px] px-5 py-2.5 text-lg font-black',
            tone === 'light'
              ? 'border-white text-white'
              : 'border-pop-ink text-pop-ink',
          )}
        >
          Sign in
        </motion.button>
      </SignInButton>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Link href="/profile">
          {user?.imageUrl ? (
            <Image
              width={52}
              height={52}
              src={user.imageUrl}
              alt="Profile"
              className="rounded-full border-4 border-white shadow-pop-sm"
            />
          ) : null}
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="mt-2 rounded-2xl border-2 border-pop-ink">
        <ContextMenuItem className="cursor-pointer font-bold">
          <SignOutButton>Sign out</SignOutButton>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

// Standard top bar: logo left, arbitrary node right.
export function PopHeader({
  logoTone = 'paper',
  logoTextColor,
  right,
}: {
  logoTone?: 'paper' | 'ink'
  logoTextColor?: string
  right?: React.ReactNode
}) {
  return (
    <header className="flex w-full items-center justify-between px-5 pt-5 md:px-12 md:pt-8">
      <PopLogo tone={logoTone} textColor={logoTextColor} />
      {right}
    </header>
  )
}

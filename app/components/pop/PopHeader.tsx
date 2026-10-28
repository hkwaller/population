'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Globe2 } from 'lucide-react'
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
import { POP } from './theme'
import { useHomeHref } from '@/hooks/useNative'

// The tilted `Population` tag, top-left of most screens. Clicking it goes home.
export function PopLogo({
  tone = 'paper',
  textColor,
}: {
  tone?: 'paper' | 'ink'
  textColor?: string
}) {
  const isPaper = tone === 'paper'
  const home = useHomeHref()
  return (
    <Link href={home}>
      <motion.span
        whileHover={{ y: -2 }}
        className={cn(
          'inline-flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 text-xl font-bold md:text-2xl',
          isPaper ? 'bg-white' : 'bg-pop-ink text-white',
        )}
        style={{
          color:
            isPaper &&
            (textColor === POP.sky ||
              textColor === POP.sunshine ||
              textColor === POP.bubblegum ||
              textColor === POP.mint)
              ? POP.ink
              : textColor,
        }}
      >
        <Globe2 size={26} strokeWidth={1.75} aria-hidden />
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
      <SignInButton withSignUp mode="modal">
        <motion.button
          whileHover={{ y: -2 }}
          className={cn(
            'rounded-lg border-2 px-5 py-2.5 text-xl font-bold',
            tone === 'light' ? 'border-white text-white' : 'border-pop-ink text-pop-ink',
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

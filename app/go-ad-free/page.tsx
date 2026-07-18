'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignInButton, useUser } from '@clerk/nextjs'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'

import { PopShell } from '@/app/components/pop/PopShell'
import { PopHeader, PopAuth } from '@/app/components/pop/PopHeader'
import { PopButton } from '@/app/components/pop/PopButton'
import { POP } from '@/app/components/pop/theme'
import { isAdFree, type AdFreePublicMetadata } from '@/lib/entitlement'
import type { PlanKey } from '@/lib/stripe'

type Tier = {
  plan: PlanKey
  name: string
  price: string
  cadence: string
  blurb: string
  color: string
  rotate: number
}

const TIERS: Tier[] = [
  {
    plan: 'day',
    name: 'Day pass',
    price: '19 kr',
    cadence: 'one-time · 24 hours',
    blurb: 'Ad-free for 24 hours. No auto-renew.',
    color: POP.sunshine,
    rotate: -2,
  },
  {
    plan: 'month',
    name: 'Monthly',
    price: '59 kr',
    cadence: 'per month',
    blurb: 'Ad-free everywhere. Cancel anytime.',
    color: POP.mint,
    rotate: 1,
  },
  {
    plan: 'year',
    name: 'Yearly',
    price: '399 kr',
    cadence: 'per year',
    blurb: 'Best value - under 34 kr/month.',
    color: POP.coral,
    rotate: -1,
  },
]

function GoAdFreeContent() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const params = useSearchParams()
  const [busy, setBusy] = useState<PlanKey | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const status = params.get('status')
  const meta = (user?.publicMetadata ?? {}) as AdFreePublicMetadata
  const adFree = isAdFree(meta)

  // After a successful checkout the webhook needs a beat to write entitlement;
  // poll Clerk a few times so the page reflects the new status.
  useEffect(() => {
    if (status !== 'success' || !user) return
    let tries = 0
    const timer = setInterval(async () => {
      tries += 1
      await user.reload()
      if (isAdFree((user.publicMetadata ?? {}) as AdFreePublicMetadata) || tries >= 5) {
        clearInterval(timer)
      }
    }, 1500)
    return () => clearInterval(timer)
  }, [status, user])

  async function checkout(plan: PlanKey) {
    setError(null)
    setBusy(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start checkout.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(null)
    }
  }

  async function openPortal() {
    setError(null)
    setBusy('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not open portal.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(null)
    }
  }

  return (
    <PopShell bg={POP.grape}>
      <PopHeader logoTextColor={POP.grape} right={<PopAuth tone="light" />} />

      <div className="mx-auto max-w-4xl px-5 pb-24 pt-6 text-center md:pt-10">
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="pop-textshadow font-black leading-[0.9] tracking-[-0.02em] text-white"
          style={{ fontSize: 'clamp(48px, 10vw, 92px)' }}
        >
          Remove all ads
        </motion.h1>
        <p className="mx-auto mt-6 max-w-xl text-lg font-bold text-white/80">
          Support Population and play without banners or popunders - across every mode.
        </p>

        {status === 'success' && (
          <div className="mx-auto mt-8 max-w-md rounded-3xl border-4 border-white bg-white/10 p-5 text-lg font-black text-white">
            Payment complete! Your ad-free status is activating…
          </div>
        )}
        {status === 'cancelled' && (
          <div className="mx-auto mt-8 max-w-md rounded-3xl border-4 border-white/60 p-4 text-base font-bold text-white/80">
            Checkout cancelled - no charge was made.
          </div>
        )}
        {error && (
          <div className="mx-auto mt-8 max-w-md rounded-3xl border-4 border-white bg-pop-ink/20 p-4 text-base font-bold text-white">
            {error}
          </div>
        )}

        {/* Already ad-free */}
        {isLoaded && adFree && (
          <div className="mx-auto mt-10 max-w-md rounded-[32px] bg-white p-8 shadow-pop-card">
            <div className="flex items-center justify-center gap-2 text-2xl font-black text-pop-ink">
              <Check size={28} /> You&apos;re ad-free
            </div>
            <p className="mt-3 text-base font-bold text-pop-ink/60">
              {meta.subStatus === 'day-pass' ? 'Day pass active' : 'Subscription active'} until{' '}
              {new Date(meta.adFreeUntil!).toLocaleString()}
            </p>
            {meta.subStatus !== 'day-pass' && (
              <div className="mt-6">
                <PopButton
                  variant="secondary"
                  size="lg"
                  rotate={-1}
                  disabled={busy === 'portal'}
                  onClick={openPortal}
                >
                  {busy === 'portal' ? 'Opening…' : 'Manage subscription'}
                </PopButton>
              </div>
            )}
          </div>
        )}

        {/* Tiers */}
        {isLoaded && !adFree && (
          <div className="mt-12 flex flex-wrap items-stretch justify-center gap-5">
            {TIERS.map((tier) => (
              <div
                key={tier.plan}
                className="flex w-[260px] flex-col items-center rounded-[32px] bg-white p-6 shadow-pop-card"
                style={{ rotate: `${tier.rotate}deg` }}
              >
                <span
                  className="rounded-pill border-4 border-pop-ink px-5 py-2 text-lg font-black text-pop-ink"
                  style={{ background: tier.color }}
                >
                  {tier.name}
                </span>
                <span className="mt-5 text-5xl font-black text-pop-ink">{tier.price}</span>
                <span className="mt-1 text-sm font-bold uppercase tracking-wide text-pop-ink/50">
                  {tier.cadence}
                </span>
                <p className="mt-4 min-h-[48px] text-base font-bold text-pop-ink/70">
                  {tier.blurb}
                </p>
                <div className="mt-5">
                  {isSignedIn ? (
                    <PopButton
                      variant="primary"
                      size="lg"
                      rotate={0}
                      disabled={busy === tier.plan}
                      onClick={() => checkout(tier.plan)}
                    >
                      {busy === tier.plan ? 'Loading…' : 'Choose'}
                    </PopButton>
                  ) : (
                    <SignInButton mode="modal">
                      <PopButton variant="primary" size="lg" rotate={0}>
                        Sign in to buy
                      </PopButton>
                    </SignInButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoaded && !isSignedIn && (
          <p className="mt-8 text-base font-bold text-white/70">
            You&apos;ll need an account so your ad-free status follows you across devices.
          </p>
        )}
      </div>
    </PopShell>
  )
}

export default function GoAdFreePage() {
  return (
    <Suspense fallback={<PopShell bg={POP.grape}>{null}</PopShell>}>
      <GoAdFreeContent />
    </Suspense>
  )
}

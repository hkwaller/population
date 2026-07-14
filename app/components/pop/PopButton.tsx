'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MotionLink = motion.create(Link)

type Variant = 'primary' | 'secondary' | 'action' | 'ghost' | 'ghostLight'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-pop-ink text-white shadow-pop-btn',
  secondary: 'bg-white text-pop-ink shadow-pop-btn',
  action: 'bg-pop-coral text-white shadow-pop-btn',
  ghost: 'bg-transparent text-pop-ink border-[4px] border-pop-ink',
  ghostLight: 'bg-transparent text-white border-[3px] border-white',
}

const SIZES: Record<Size, string> = {
  sm: 'text-lg px-5 py-2.5',
  md: 'text-xl md:text-2xl px-7 py-3.5',
  lg: 'text-[26px] md:text-[28px] px-9 py-4',
}

const DISABLED = 'bg-[rgba(23,18,20,0.15)] text-[rgba(23,18,20,0.4)] shadow-none border-none'

export type PopButtonProps = {
  children: React.ReactNode
  variant?: Variant
  size?: Size
  rotate?: number
  href?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

export function PopButton({
  children,
  variant = 'primary',
  size = 'md',
  rotate = 0,
  href,
  onClick,
  disabled = false,
  type = 'button',
  className,
}: PopButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-pill font-black tracking-tight select-none whitespace-nowrap',
    SIZES[size],
    disabled ? DISABLED : VARIANTS[variant],
    disabled && 'cursor-not-allowed',
    className,
  )

  const motionProps = disabled
    ? {}
    : {
        whileHover: { rotate: 0, y: -2 },
        whileTap: { y: 4, boxShadow: '0 2px 0 rgba(0,0,0,0.25)' },
      }

  const style = { rotate: `${rotate}deg` }

  if (href && !disabled) {
    return (
      <MotionLink href={href} className={classes} style={style} {...motionProps} onClick={onClick}>
        {children}
      </MotionLink>
    )
  }

  return (
    <motion.button
      type={type}
      onClick={() => {
        if (disabled) return
        onClick?.()
      }}
      className={classes}
      style={style}
      {...motionProps}
    >
      {children}
    </motion.button>
  )
}

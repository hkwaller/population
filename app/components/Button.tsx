import React from 'react'

interface ButtonProps {
  onClick: () => void
  className?: string
  children?: React.ReactNode
  small?: boolean
  bg?: string
  center?: boolean
  disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  className,
  children,
  small,
  bg,
  center,
  disabled,
}) => {
  return (
    <button
      onClick={() => {
        if (disabled) return
        onClick()
      }}
      className={`rounded-none px-8 inline-flex items-center justify-center font-semibold transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'} ${
        small ? 'h-[40px]' : 'h-[60px]'
      } ${bg ?? bg}
      } ${center ? 'mx-auto' : ''} flex items-center justify-center md:max-w-[300px] ${className}`}
    >
      <span>{children}</span>
    </button>
  )
}

export default Button

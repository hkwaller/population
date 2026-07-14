import { CSSProperties } from 'react'

export const SmallContainer = ({
  className,
  children,
  style,
}: {
  className?: string
  style?: CSSProperties
  children: React.ReactNode
}) => {
  return (
    <div
      className={`p-8 pt-4 md:pt-8 mt-4 flex flex-col transition-all shadow-md rounded-lg ${
        className ?? 'bg-white'
      }`}
      style={style}
    >
      {children}
    </div>
  )
}

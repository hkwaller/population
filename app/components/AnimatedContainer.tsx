import { ScrollArea } from '@/components/ui/scroll-area'
import { categories } from '@/lib/utils'
import { icons } from 'lucide-react'

const FloatingIcon = ({ Icon, className }: { Icon: React.ElementType; className: string }) => (
  <div className={`absolute ${className} z-1`}>
    <Icon size={60} className="text-ish-ink opacity-[0.07]" />
  </div>
)

const floatingIconClasses = [
  'top-1/4 left-1/4 animate-float-slow',
  'top-3/4 left-1/3 animate-float-medium',
  'top-1/2 right-1/4 animate-float-fast',
  'bottom-1/4 right-1/3 animate-float-slow',
  'top-1/3 right-1/2 animate-float-medium',
  'bottom-1/3 left-1/2 animate-float-fast',
  'top-1/6 left-1/5 animate-float-medium',
  'bottom-1/4 right-1/4 animate-float-slow',
  'top-2/5 left-3/4 animate-float-fast',
  'bottom-1/3 left-1/6 animate-float-medium',
  'top-3/5 right-1/3 animate-float-slow',
  'bottom-2/5 left-2/3 animate-float-fast',
  'top-1/2 right-1/5 animate-float-medium',
  'top-3/4 right-2/3 animate-float-fast',
  'bottom-3/5 left-1/4 animate-float-medium',
]

export const AnimatedContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative h-[100dvh] w-[100vw] overflow-hidden ish-bg">
      {categories.map((category, index) => {
        const Icon = icons[category.icon as keyof typeof icons]
        if (!Icon) return null
        return <FloatingIcon key={index} Icon={Icon} className={floatingIconClasses[index]} />
      })}

      <ScrollArea className="h-full w-screen">{children}</ScrollArea>

    </div>
  )
}

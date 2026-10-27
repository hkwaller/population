'use client'

import { createElement } from 'react'
import { Check, icons as lucideIcons } from 'lucide-react'
import { icons } from '@/app/icons'
import { stickerColors, stickerFill } from './theme'

export function PlayerStickerPicker({
  colorId,
  iconName,
  onColorChange,
  onIconChange,
  tone = 'ink',
}: {
  colorId: string
  iconName: string
  onColorChange: (colorId: string) => void
  onIconChange: (iconName: string) => void
  tone?: 'ink' | 'light'
}) {
  const textClass = tone === 'light' ? 'text-white' : 'text-pop-ink'
  const focusClass = tone === 'light' ? 'focus-visible:outline-white' : 'focus-visible:outline-pop-ink'
  const selectionClass = tone === 'light' ? 'border-white' : 'border-pop-ink'

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className={`text-lg font-black ${textClass}`}>Your color</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {stickerColors.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={color.id}
              aria-pressed={colorId === color.id}
              onClick={() => onColorChange(color.id)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusClass} ${
                colorId === color.id ? selectionClass : 'border-transparent'
              }`}
              style={{ background: color.hex }}
            >
              {colorId === color.id && <Check size={20} strokeWidth={3} className="text-pop-ink" />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={`text-lg font-black ${textClass}`}>Pick a sticker</legend>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {icons.map((icon) => {
            const Icon = lucideIcons[icon.name as keyof typeof lucideIcons]
            return (
              <button
                key={icon.name}
                type="button"
                aria-label={icon.name}
                aria-pressed={iconName === icon.name}
                onClick={() => onIconChange(icon.name)}
                className={`flex aspect-square items-center justify-center rounded-sticker border-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusClass} ${
                  iconName === icon.name ? selectionClass : 'border-transparent'
                }`}
                style={{ background: stickerFill(colorId) }}
              >
                {Icon && createElement(Icon, { size: 30, strokeWidth: 2.5, className: 'text-pop-ink' })}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

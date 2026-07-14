import { usePopStore } from '../state'
import Slider from './Slider'

export type TFancyButton = {
  Icon: React.ReactNode
  onClick: () => void
  flex?: boolean
  label?: string
  small?: boolean
  className?: string
  indicator?: string | number
  bg?: string
  disabled?: boolean
}

type Props = {
  buttons: TFancyButton[]
  rounded?: boolean
  topComponent?: React.ReactNode
}

export function FancyButton({
  Icon,
  onClick,
  flex = true,
  label,
  small = false,
  indicator = '',
  className,
  bg,
  disabled,
}: TFancyButton) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer relative flex items-center justify-center border ${
        flex ? 'flex-1' : ''
      } transition-all active:scale-95 hover:bg-sky-600 relative z-20 ${small ? 'p-4' : 'p-5'} ${
        disabled ? 'bg-slate-400' : bg ? bg : ''
      } ${className ? className : ''}`}
    >
      <div className="flex text-white flex-row gap-2 md:gap-4 items-center justify-center">
        {Icon}
        {label ? <div className="font-bold mr-auto ml-2">{label}</div> : null}
      </div>
      {indicator ? <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold">{indicator}</span> : null}
    </button>
  )
}

function FancyButtonRow({ buttons, rounded = false, topComponent }: Props) {
  const state = usePopStore()

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[21] bg-white flex flex-col p-2 sm:p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.3)]">
      {state.showQuestionResultModal ? null : topComponent ?? null}
      <div className={`flex gap-2 ${rounded ? 'sm:rounded-lg' : ''} `}>
        {buttons.map((button: TFancyButton, index: number) => {
          return <FancyButton key={index} {...button} />
        })}
      </div>
    </div>
  )
}

export default FancyButtonRow

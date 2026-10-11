import { AnimatePresence, motion } from 'motion/react'

type SpringModalProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  children: React.ReactNode
  onClose?: () => void
}

export const SpringModal = ({ isOpen, setIsOpen, children, onClose }: SpringModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-slate-900 backdrop-blur p-8 fixed inset-0 z-[1000] grid place-items-center overflow-y-scroll cursor-pointer"
          onClick={() => {
            setIsOpen(false)
            onClose?.()
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-blue p-6 bg-white rounded-lg w-full max-w-lg shadow-xl cursor-default relative overflow-hidden"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

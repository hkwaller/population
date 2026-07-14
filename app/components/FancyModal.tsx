import * as React from 'react'
import { XIcon } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export function FancyModal({
  open,
  setOpen,
  header,
  title,
  children,
  footer,
  onClickOutside,
  onClose,
}: {
  open: boolean
  setOpen?: (open: boolean) => void
  header?: React.ReactNode
  title?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  onClickOutside?: () => void
  onClose?: () => void
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={() => {
          setOpen?.(!open)
          onClose?.()
        }}
        aria-describedby="modal-description"
        aria-labelledby="modal-title"
      >
        <DialogContent
          className="sm:max-w-[425px] md:min-w-[600px] bg-ish-cream pb-8 text-ish-ink pt-8 md:pt-20"
          role="dialog"
        >
          <DialogClose asChild>
            <Button
              className="absolute top-4 right-4 bg-white border-4 border-ish-ink p-2"
              aria-label="Close modal"
            >
              <XIcon className="text-black fill-black" />
            </Button>
          </DialogClose>
          {title ? (
            <DialogHeader>
              <h2
                className="text-4xl font-extrabold uppercase text-ish-cobalt transform -rotate-2 mb-4 mt-6"
                id="modal-description"
              >
                {title}
              </h2>
            </DialogHeader>
          ) : null}
          <ScrollArea className="max-h-[calc(100vh-200px)]">{children}</ScrollArea>
          {footer ?? null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      onClose={onClose}
      aria-describedby="drawer-description"
      aria-labelledby="drawer-title"
    >
      <DrawerContent
        className="bg-ish-cream max-h-[95dvh] text-ish-ink"
        onPointerDownOutside={onClickOutside}
        role="dialog"
      >
        <DrawerHeader className="text-left">
          {title && (
            <DrawerTitle>
              <h2
                className="text-3xl font-extrabold uppercase text-ish-cobalt transform -rotate-2 mb-4"
                id="drawer-title"
              >
                {title || 'Modal'}
              </h2>
            </DrawerTitle>
          )}
        </DrawerHeader>
        <ScrollArea className="flex-grow overflow-auto px-6 pb-[150px] mt-[-50px]">
          {children}
        </ScrollArea>
        {footer && (
          <DrawerFooter className="absolute bottom-2 left-4 right-4">
            <DrawerClose>{footer}</DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

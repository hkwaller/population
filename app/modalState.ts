import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type ModalState = {
  questionResultModalOpen: boolean
  scoreModalOpen: boolean
  setQuestionResultModalOpen: (open: boolean) => void
  setScoreModalOpen: (open: boolean) => void
  updateModalState: (state: { questionResultModalOpen: boolean; scoreModalOpen: boolean }) => void
  reset: () => void
}
export const useModalStore = create<ModalState>()(
  persist(
    (set) => ({
      questionResultModalOpen: false,
      scoreModalOpen: false,
      setQuestionResultModalOpen: (open) => set({ questionResultModalOpen: open }),
      setScoreModalOpen: (open) => set({ scoreModalOpen: open }),
      updateModalState: ({
        questionResultModalOpen,
        scoreModalOpen,
      }: {
        questionResultModalOpen: boolean
        scoreModalOpen: boolean
      }) => set({ questionResultModalOpen, scoreModalOpen }),
      reset: () => set({ questionResultModalOpen: false, scoreModalOpen: false }),
    }),
    {
      name: 'ish-modal-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

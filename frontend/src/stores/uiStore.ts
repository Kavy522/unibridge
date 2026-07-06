import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiStore {
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  activeSemesterId: string | null
  activeYearId: string | null
  toggleSidebar: () => void
  setMobileSidebar: (open: boolean) => void
  setActiveSemester: (id: string | null) => void
  setActiveYear: (id: string | null) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileSidebarOpen: false,
      activeSemesterId: null,
      activeYearId: null,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setMobileSidebar: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setActiveSemester: (activeSemesterId) => set({ activeSemesterId }),
      setActiveYear: (activeYearId) => set({ activeYearId }),
    }),
    { name: 'uniportal-ui', version: 1 },
  ),
)

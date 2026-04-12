import { create } from "zustand"

interface AppState {
  isMobileSidebarOpen: boolean
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),

  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
}))

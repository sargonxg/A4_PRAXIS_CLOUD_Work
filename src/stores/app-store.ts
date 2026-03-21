import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  orgName: string;
  isDemo?: boolean;
}

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  demoMode: boolean;
  demoBannerExpanded: boolean;
  toggleDemoBanner: () => void;
  setDemoMode: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  user: null,
  setUser: (user) => set({ user }),
  demoMode: false,
  demoBannerExpanded: true,
  toggleDemoBanner: () => set((state) => ({ demoBannerExpanded: !state.demoBannerExpanded })),
  setDemoMode: (v) => set({ demoMode: v }),
}));

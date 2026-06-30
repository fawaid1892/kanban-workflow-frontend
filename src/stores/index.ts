import { create } from 'zustand';

interface AppState {
  // Placeholder — will be expanded in future sprints
  isReady: boolean;
}

export const useAppStore = create<AppState>(() => ({
  isReady: true,
}));

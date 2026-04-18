import { create } from "zustand";

interface LayoutState {
  isMobileView: boolean;
  toggleMobileView: () => void;
  setMobileView: (val: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isMobileView: false,
  toggleMobileView: () => set((state) => ({ isMobileView: !state.isMobileView })),
  setMobileView: (val) => set({ isMobileView: val }),
}));

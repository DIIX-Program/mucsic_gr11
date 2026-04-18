import { create } from "zustand";

interface AuthState {
  userId: string | null;
  isAdmin: boolean;
  setAuth: (userId: string | null, isAdmin: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isAdmin: false,
  setAuth: (userId, isAdmin) => set({ userId, isAdmin }),
}));

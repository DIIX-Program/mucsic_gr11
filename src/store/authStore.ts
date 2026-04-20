import { create } from "zustand";

interface AuthState {
  userId: string | null;
  isAdmin: boolean;
  isArtist: boolean;
  setAuth: (userId: string | null, isAdmin: boolean, isArtist: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isAdmin: false,
  isArtist: false,
  setAuth: (userId, isAdmin, isArtist) => set({ userId, isAdmin, isArtist }),
}));

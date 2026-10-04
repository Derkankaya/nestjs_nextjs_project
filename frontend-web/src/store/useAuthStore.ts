import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthRole = 'ADMIN' | 'USER';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  username?: string;
  bio?: string;
  avatar?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  
  setUser: (user: AuthUser) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      // Sadece user objesini eziyoruz
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // localStorage'da bu isimle tutulacak
    }
  )
);
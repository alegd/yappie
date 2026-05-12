import { create } from "zustand";
import {
  clearTokens,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/secure-store";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  login: (tokens: TokenPair, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  login: async (tokens, user) => {
    await setAccessToken(tokens.accessToken);
    await setRefreshToken(tokens.refreshToken);
    set({ accessToken: tokens.accessToken, user });
  },
  logout: async () => {
    await clearTokens();
    set({ accessToken: null, user: null });
  },
  hydrate: async () => {
    const token = await getAccessToken();
    set({ accessToken: token, hydrated: true });
  },
}));

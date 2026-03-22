"use client";

import { create } from "zustand";
import { api } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const data = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/auth/login", { email, password });

    api.setToken(data.accessToken);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
  },

  register: async (name, email, password) => {
    const data = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/auth/register", { name, email, password });

    api.setToken(data.accessToken);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
  },

  logout: () => {
    api.setToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: () => {
    const accessToken = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");

    if (accessToken && userStr) {
      const user = JSON.parse(userStr);
      api.setToken(accessToken);
      set({ user, accessToken, isAuthenticated: true });
    }
  },
}));

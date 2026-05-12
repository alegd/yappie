import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { getRefreshToken } from "@/lib/secure-store";
import { useAuthStore, type AuthUser } from "./auth-store";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface VerifyOtpInput {
  email: string;
  code: string;
}

interface CompleteRegisterInput {
  email: string;
  code: string;
  name: string;
}

export function useAuth() {
  const login = useAuthStore((s) => s.login);
  const clearAuth = useAuthStore((s) => s.logout);

  const requestOtp = useMutation({
    mutationFn: (email: string) =>
      apiFetch("/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
  });

  const verifyOtp = useMutation({
    mutationFn: async (input: VerifyOtpInput) => {
      const data = await apiFetch<AuthResponse>("/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await login(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );
      return data;
    },
  });

  const completeRegister = useMutation({
    mutationFn: async (input: CompleteRegisterInput) => {
      const data = await apiFetch<AuthResponse>("/auth/complete-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await login(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );
      return data;
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiFetch("/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => undefined);
      }
      await clearAuth();
    },
  });

  return { requestOtp, verifyOtp, completeRegister, logout };
}

"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isTokenReady, setIsTokenReady] = useState(false);

  // Sync token to API client BEFORE rendering children
  useEffect(() => {
    if (session?.accessToken) {
      api.setToken(session.accessToken);
      setIsTokenReady(true);
    }
  }, [session?.accessToken]);

  // Handle session errors (refresh token expired)
  useEffect(() => {
    if (session?.error === "RefreshTokenExpired" || session?.error === "RefreshTokenError") {
      signOut({ redirectTo: "/login" });
    }
  }, [session?.error]);

  // Listen for 401 from API client
  useEffect(() => {
    const handleAuthExpired = () => {
      signOut({ redirectTo: "/login" });
    };

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  if (status === "loading" || !isTokenReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user
    ? { name: session.user.name || "", email: session.user.email || "" }
    : null;

  const handleLogout = () => {
    signOut({ redirectTo: "/login" });
  };

  return (
    <div className="flex h-screen">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

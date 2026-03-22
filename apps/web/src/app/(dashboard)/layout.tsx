"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.accessToken) {
      api.setToken(session.accessToken);
    }
  }, [session?.accessToken]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!session) return null; // middleware handles redirect

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

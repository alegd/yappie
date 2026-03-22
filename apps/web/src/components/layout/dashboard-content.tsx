"use client";

import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { api } from "@/lib/api";

interface DashboardContentProps {
  accessToken: string;
  user: { name: string; email: string };
  children: React.ReactNode;
}

export function DashboardContent({ accessToken, user, children }: DashboardContentProps) {
  // Sync token on every render — picks up refreshed tokens from server
  api.setToken(accessToken);

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

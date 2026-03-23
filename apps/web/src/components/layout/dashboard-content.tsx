"use client";

import { ToastProvider } from "@/components/ui/toast/toast-provider";
import { useSocket } from "@/hooks/use-socket";
import { api } from "@/lib/api";
import { LOGIN_PAGE } from "@/lib/constants/pages";
import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";

interface DashboardContentProps {
  accessToken: string;
  user: { name: string; email: string };
  children: React.ReactNode;
}

export function DashboardContent({ accessToken, user, children }: DashboardContentProps) {
  // Sync token on every render — picks up refreshed tokens from server
  api.setToken(accessToken);

  // Connect WebSocket for real-time pipeline progress
  useSocket({ token: accessToken });

  const handleLogout = () => {
    signOut({ redirectTo: LOGIN_PAGE });
  };

  return (
    <ToastProvider>
      <div className="flex bg-surface/40 h-screen">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}

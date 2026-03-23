"use client";

import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "@/components/ui/toast/toast-provider";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/use-socket";
import { LOGIN_PAGE } from "@/lib/constants/pages";

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
      <div className="flex h-screen">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </ToastProvider>
  );
}

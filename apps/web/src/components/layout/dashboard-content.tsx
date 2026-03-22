"use client";

import { useRef } from "react";
import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { api } from "@/lib/api";

interface DashboardContentProps {
  accessToken: string;
  user: { name: string; email: string };
  children: React.ReactNode;
}

export function DashboardContent({ accessToken, user, children }: DashboardContentProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    api.setToken(accessToken);
    initialized.current = true;
  }

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

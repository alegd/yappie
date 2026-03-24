"use client";

import { ToastProvider } from "@/components/ui/toast/toast-provider";
import { Sidebar } from "./sidebar";

interface DashboardContentProps {
  user: { name: string; email: string };
  children: React.ReactNode;
}

export function DashboardContent({ user, children }: DashboardContentProps) {
  return (
    <ToastProvider>
      <div className="flex bg-surface/40 h-screen">
        <Sidebar user={user} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </ToastProvider>
  );
}

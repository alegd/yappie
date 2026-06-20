"use client";

import { useSession } from "next-auth/react";
import { RecordingModal } from "@/features/recording/recording-modal";
import { useSocket } from "@/hooks/use-socket";
import { QuotaBanner } from "./quota-banner";
import { Sidebar } from "./sidebar";

interface DashboardContentProps {
  user: { name: string; email: string };
  children: React.ReactNode;
}

export function DashboardContent({ user, children }: DashboardContentProps) {
  const { data: session } = useSession();
  useSocket({ token: session?.accessToken ?? null });

  return (
    <div className="flex bg-surface/40 h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mx-auto max-w-6xl">
          <QuotaBanner />
          {children}
        </div>
      </main>
      <RecordingModal />
    </div>
  );
}

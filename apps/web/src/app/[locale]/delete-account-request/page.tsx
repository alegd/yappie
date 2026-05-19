import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { AccountDeletionFlow } from "@/features/account-deletion/account-deletion-flow";

export const metadata: Metadata = {
  title: "Delete account — Yappie",
  description: "Permanently delete your Yappie account and all of its data.",
};

export default function DeleteAccountRequestPage() {
  return (
    <main className="min-h-screen">
      <PublicNavbar />
      <div className="mx-auto max-w-2xl px-6 py-24 pt-32">
        <AccountDeletionFlow mode="public" />
      </div>
    </main>
  );
}

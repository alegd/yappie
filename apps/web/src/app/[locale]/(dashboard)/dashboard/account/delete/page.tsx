"use client";

import { signOut, useSession } from "next-auth/react";
import { AccountDeletionFlow } from "@/features/account-deletion/account-deletion-flow";
import { AUTH_PAGE } from "@/lib/constants/pages";

export default function DeleteAccountPage() {
  const { data: session } = useSession();

  if (!session?.user?.email) return null;

  return (
    <div className="mx-auto max-w-2xl py-12">
      <AccountDeletionFlow
        mode="authenticated"
        initialEmail={session.user.email}
        onDeleted={() => signOut({ callbackUrl: AUTH_PAGE, redirect: true })}
      />
    </div>
  );
}

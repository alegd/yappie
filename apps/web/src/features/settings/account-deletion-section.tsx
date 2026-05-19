"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card/Card";
import { DELETE_ACCOUNT_PAGE } from "@/lib/constants/pages";

export function AccountDeletionSection() {
  return (
    <section className="py-8">
      <h2 className="mb-4 font-semibold text-lg text-red-400">Danger zone</h2>

      <Card className="p-4 border-red-500/30">
        <div className="flex justify-between items-center gap-4">
          <div>
            <p className="font-medium">Delete account</p>
            <p className="mt-0.5 text-foreground/75 text-sm">
              Permanently delete your account, recordings, projects, tickets and integrations.
              This cannot be undone.
            </p>
          </div>
          <Link
            href={DELETE_ACCOUNT_PAGE}
            className="shrink-0 inline-flex items-center rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            Delete account
          </Link>
        </div>
      </Card>
    </section>
  );
}

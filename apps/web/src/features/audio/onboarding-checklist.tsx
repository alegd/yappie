"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { toast } from "@/components/ui/toast/Toast";
import { apiFetcher } from "@/lib/api-fetcher";
import { JIRA_AUTH } from "@/lib/constants/endpoints";
import { NEW_PROJECT_PAGE } from "@/lib/constants/pages";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface OnboardingChecklistProps {
  jiraConnected: boolean;
  jiraSiteName?: string;
  hasProjects: boolean;
}

export function OnboardingChecklist({
  jiraConnected,
  jiraSiteName,
  hasProjects,
}: OnboardingChecklistProps) {
  const [connecting, setConnecting] = useState(false);

  const handleConnectJira = async () => {
    setConnecting(true);
    try {
      const data = await apiFetcher(`${JIRA_AUTH}?returnPath=/dashboard/audios`);
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="mb-6 font-semibold text-3xl">Get started with Yappie</h2>

      <div className="space-y-4">
        {/* Step 1: Connect Jira */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {jiraConnected ? (
                <CheckCircle2
                  size={20}
                  className="text-success shrink-0 bg-success/20 rounded-full"
                />
              ) : (
                <Circle size={20} className="text-muted-foreground shrink-0" />
              )}
              <div>
                <p className={jiraConnected ? "font-medium text-muted-foreground" : "font-medium"}>
                  Connect Jira
                </p>
                <p className="text-muted-foreground text-sm">
                  {jiraConnected
                    ? `Connected to ${jiraSiteName || "Atlassian"}`
                    : "Link your Jira account to export tickets"}
                </p>
              </div>
            </div>
            {!jiraConnected && (
              <Button onClick={handleConnectJira} disabled={connecting} aria-label="Connect Jira">
                {connecting ? <Loader2 size={16} className="animate-spin" /> : null}
                {connecting ? "Connecting..." : "Connect Jira"}
              </Button>
            )}
          </div>
        </Card>

        {/* Step 2: Create a project */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {hasProjects ? (
                <CheckCircle2
                  size={20}
                  className="text-success shrink-0 bg-success/20 rounded-full"
                />
              ) : (
                <Circle size={20} className="text-muted-foreground shrink-0" />
              )}
              <div>
                <p className={hasProjects ? "font-medium text-muted-foreground" : "font-medium"}>
                  Create a project
                </p>
                <p className="text-muted-foreground text-sm">
                  Projects give AI context for better tickets
                </p>
              </div>
            </div>
            {!hasProjects && (
              <Link
                href={NEW_PROJECT_PAGE}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg font-medium text-white transition"
                aria-label="Create project"
              >
                Create project
              </Link>
            )}
          </div>
        </Card>
        {/* Step 3: Upload first audio */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Circle
                size={20}
                className={
                  hasProjects
                    ? "text-muted-foreground shrink-0"
                    : "text-muted-foreground/40 shrink-0"
                }
              />
              <div>
                <p className={hasProjects ? "font-medium" : "font-medium text-muted-foreground/40"}>
                  Upload your first audio
                </p>
                <p
                  className={
                    hasProjects
                      ? "text-muted-foreground text-sm"
                      : "text-muted-foreground/40 text-sm"
                  }
                >
                  Record or upload audio to generate tickets
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

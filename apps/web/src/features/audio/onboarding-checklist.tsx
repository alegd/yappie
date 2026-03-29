"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { apiFetcher } from "@/lib/api-fetcher";
import { JIRA_AUTH } from "@/lib/constants/endpoints";
import { NEW_PROJECT_PAGE } from "@/lib/constants/pages";
import { toast } from "@/components/ui/toast/Toast";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

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
  const handleConnectJira = async () => {
    try {
      const data = await apiFetcher(JIRA_AUTH);
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-4 font-semibold text-lg">Get started with Yappie</h2>

      <div className="space-y-4">
        {/* Step 1: Connect Jira */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {jiraConnected ? (
              <CheckCircle2 size={20} className="text-success shrink-0" />
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
            <Button size="sm" onClick={handleConnectJira} aria-label="Connect Jira">
              Connect Jira
            </Button>
          )}
        </div>

        {/* Step 2: Create a project */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {hasProjects ? (
              <CheckCircle2 size={20} className="text-success shrink-0" />
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
            <Link href={NEW_PROJECT_PAGE}>
              <Button size="sm" aria-label="Create project">
                Create project
              </Button>
            </Link>
          )}
        </div>

        {/* Step 3: Upload first audio */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Circle
              size={20}
              className={
                hasProjects ? "text-muted-foreground shrink-0" : "text-muted-foreground/40 shrink-0"
              }
            />
            <div>
              <p className={hasProjects ? "font-medium" : "font-medium text-muted-foreground/40"}>
                Upload your first audio
              </p>
              <p
                className={
                  hasProjects ? "text-muted-foreground text-sm" : "text-muted-foreground/40 text-sm"
                }
              >
                Record or upload audio to generate tickets
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

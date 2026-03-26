"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import { JIRA_AUTH, JIRA_DISCONNECT, JIRA_STATUS } from "@/lib/constants/endpoints";
import { DELETE } from "@/lib/constants/http";
import { CheckCircle2, Unlink } from "lucide-react";
import { useState } from "react";

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
  connectedAt: string | null;
}

export function IntegrationsSection() {
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleConnectJira = async () => {
    try {
      const data = await apiFetcher(JIRA_AUTH);
      window.location.href = data.url;
    } catch {
      // handle error
    }
  };

  const handleDisconnectJira = async () => {
    if (!confirm("Are you sure you want to disconnect Jira?")) return;

    setDisconnecting(true);
    try {
      await apiFetcher(JIRA_DISCONNECT, { method: DELETE });
      invalidateQuery(JIRA_STATUS);
    } catch {
      // handle error
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <section className="py-8">
      <h2 className="mb-4 font-semibold text-lg">Integrations</h2>

      <Card className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">Jira</p>
              {jiraStatus?.connected ? (
                <p className="flex items-center gap-1 mt-0.5 text-success text-sm">
                  <CheckCircle2 size={12} />
                  Connected to {jiraStatus.siteName || "Atlassian"}
                </p>
              ) : (
                <p className="mt-0.5 text-muted-foreground text-sm">
                  Export tickets to Atlassian Jira
                </p>
              )}
            </div>
          </div>
          {jiraStatus?.connected ? (
            <Button
              variant="outlined"
              onClick={handleDisconnectJira}
              disabled={disconnecting}
              className="hover:text-destructive"
              aria-label="Disconnect Jira"
            >
              <Unlink size={18} />
            </Button>
          ) : (
            <Button onClick={handleConnectJira} className="bg-info hover:bg-info/80">
              Connect Jira
            </Button>
          )}
        </div>
      </Card>
    </section>
  );
}

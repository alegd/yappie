"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import {
  JIRA_AUTH,
  JIRA_DISCONNECT,
  JIRA_STATUS,
  TEMPLATES_LIST,
  templateDetail,
} from "@/lib/constants/endpoints";
import { DELETE } from "@/lib/constants/http";
import {
  CheckCircle2,
  FileText,
  Link2,
  Palette,
  Pencil,
  Plus,
  Star,
  Trash2,
  Unlink,
} from "lucide-react";
import { useState } from "react";
import { TemplateForm } from "./template-form";

interface Template {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
  connectedAt: string | null;
}

export function SettingsPage() {
  const { data: templates = [] } = useQuery<Template[]>(TEMPLATES_LIST);
  const { data: jiraStatus } = useQuery<JiraStatus>(JIRA_STATUS);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>();

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

  const handleNewTemplate = () => {
    setEditingTemplate(undefined);
    setShowForm(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await apiFetcher(templateDetail(id), { method: DELETE });
      invalidateQuery(TEMPLATES_LIST);
    } catch {
      // handle error
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(undefined);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 font-bold text-2xl">Settings</h1>

      {/* Appearance */}
      <section className="mb-6">
        <Card className="p-4">
          <h2 className="flex items-center gap-2 mb-4 font-semibold text-lg">
            <Palette size={18} />
            Appearance
          </h2>
          <div className="bg-surface/25 p-4 border border-border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Theme</p>
                <p className="mt-0.5 text-muted-foreground text-sm">
                  Choose light, dark, or system preference
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </Card>
      </section>

      {/* Integrations */}
      <section className="mb-6">
        <Card className="p-4">
          <h2 className="flex items-center gap-2 mb-4 font-semibold text-lg">
            <Link2 size={18} />
            Integrations
          </h2>

          <div className="bg-surface/25 p-4 border border-border rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">Jira</p>
                  {jiraStatus?.connected ? (
                    <p className="flex items-center gap-1 mt-0.5 text-emerald-500 text-sm">
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
                <Button variant="danger" onClick={handleDisconnectJira} disabled={disconnecting}>
                  <Unlink size={14} />
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button onClick={handleConnectJira} className="bg-blue-600 hover:bg-blue-500">
                  Connect Jira
                </Button>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Templates */}
      <section>
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="flex items-center gap-2 font-semibold text-lg">
              <FileText size={18} />
              Templates
            </h2>
            {!showForm && (
              <Button variant="outlined" onClick={handleNewTemplate}>
                <Plus size={14} />
                New template
              </Button>
            )}
          </div>

          {showForm && (
            <div className="mb-4">
              <TemplateForm template={editingTemplate} onClose={handleCloseForm} />
            </div>
          )}

          {templates.length === 0 && !showForm ? (
            <div className="bg-surface/25 py-10 border border-border rounded-lg text-muted-foreground text-center">
              <FileText size={32} className="opacity-50 mx-auto mb-2" />
              <p className="text-sm">No templates yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 bg-surface/50 p-4 border border-border hover:border-border-hover rounded-lg transition"
                >
                  <FileText size={16} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 font-medium text-sm">{template.name}</span>
                  {template.isDefault && (
                    <span className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Star size={12} />
                      Default
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    aria-label={`Edit ${template.name}`}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="hover:text-red-400"
                    aria-label={`Delete ${template.name}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

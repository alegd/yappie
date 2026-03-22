"use client";

import { useEffect, useState } from "react";
import { Link2, FileText, Star, Plus } from "lucide-react";
import { api } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export function SettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await api.get<Template[]>("/templates");
        setTemplates(data);
      } catch {
        // silently fail
      }
    };
    fetchTemplates();
  }, []);

  const handleConnectJira = async () => {
    try {
      const data = await api.get<{ url: string }>("/integrations/jira/auth");
      window.open(data.url, "_blank");
    } catch {
      // handle error
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {/* Integrations */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link2 size={18} />
          Integrations
        </h2>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Jira</p>
              <p className="text-sm text-zinc-500 mt-0.5">Export tickets to Atlassian Jira</p>
            </div>
            <button
              onClick={handleConnectJira}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Connect Jira
            </button>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText size={18} />
            Templates
          </h2>
          <button className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium transition">
            <Plus size={14} />
            New
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No templates yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition"
              >
                <FileText size={16} className="text-zinc-500 shrink-0" />
                <span className="flex-1 text-sm font-medium">{template.name}</span>
                {template.isDefault && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star size={12} />
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { invalidateQuery } from "@/hooks/use-query";
import { TEMPLATES_CREATE, TEMPLATES_LIST, templateDetail } from "@/lib/constants/endpoints";

interface TemplateFormProps {
  template?: { id: string; name: string; content: string; isDefault: boolean };
  onClose: () => void;
}

export function TemplateForm({ template, onClose }: TemplateFormProps) {
  const isEditing = !!template;
  const [name, setName] = useState(template?.name ?? "");
  const [content, setContent] = useState(template?.content ?? "");
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setSaving(true);
    setError("");

    try {
      const body = { name: name.trim(), content: content.trim(), isDefault };

      if (isEditing) {
        await api.patch(templateDetail(template.id), body);
      } else {
        await api.post(TEMPLATES_CREATE, body);
      }

      invalidateQuery(TEMPLATES_LIST);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface/50 border border-border rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">{isEditing ? "Edit template" : "New template"}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition"
          aria-label="Close form"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="template-name" className="block text-sm font-medium text-muted mb-1">
          Name
        </label>
        <input
          id="template-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bug Report"
          className="w-full bg-surface border border-border-hover rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition"
        />
      </div>

      <div>
        <label htmlFor="template-content" className="block text-sm font-medium text-muted mb-1">
          Content
        </label>
        <textarea
          id="template-content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="## Description&#10;&#10;## Steps to reproduce&#10;&#10;## Expected behavior"
          rows={6}
          className="w-full bg-surface border border-border-hover rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition resize-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="rounded border-zinc-600"
        />
        <span className="text-muted-foreground">Set as default template</span>
      </label>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || !name.trim() || !content.trim()}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saving ? "Saving..." : isEditing ? "Save changes" : "Create template"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

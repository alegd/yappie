"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invalidateQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import { TEMPLATES_CREATE, TEMPLATES_LIST, templateDetail } from "@/lib/constants/endpoints";
import { PATCH, POST } from "@/lib/constants/http";
import { Loader2, X } from "lucide-react";
import { useState } from "react";

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
        await apiFetcher(templateDetail(template.id), { data: body, method: PATCH });
      } else {
        await apiFetcher(TEMPLATES_CREATE, { data: body, method: POST });
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
      className="space-y-4 bg-surface/50 p-4 border border-border rounded-lg"
    >
      <div className="flex justify-between items-center">
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
        <div className="bg-red-500/10 p-3 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <Input
        id="template-name"
        label="Name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Bug Report"
      />

      <div>
        <label htmlFor="template-content" className="block mb-1 font-medium text-muted text-sm">
          Content
        </label>
        <textarea
          id="template-content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="## Description&#10;&#10;## Steps to reproduce&#10;&#10;## Expected behavior"
          rows={6}
          className="bg-surface px-3 py-2 border border-border-hover focus:border-primary rounded-lg focus:outline-none w-full text-sm transition resize-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="border-zinc-600 rounded"
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

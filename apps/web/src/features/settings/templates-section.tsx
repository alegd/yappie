"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card/Card";
import { invalidateQuery, useQuery } from "@/hooks/use-query";
import { apiFetcher } from "@/lib/api-fetcher";
import { TEMPLATES_LIST, templateDetail } from "@/lib/constants/endpoints";
import { DELETE } from "@/lib/constants/http";
import { FileText, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { TemplateForm } from "./template-form";

interface Template {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export function TemplatesSection() {
  const { data: templates = [] } = useQuery<Template[]>(TEMPLATES_LIST);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>();

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
    <section className="py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Templates</h2>
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

      <Card className="p-4">
        {templates.length === 0 && !showForm ? (
          <div className="py-10 text-foreground/50 text-center">
            <FileText size={32} className="opacity-50 mx-auto mb-2" />
            <p className="text-sm">No templates yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3 hover:border-border-hover rounded-lg transition"
              >
                <FileText size={18} className="text-muted-foreground shrink-0" />
                <span className="flex-1 font-medium text-sm">{template.name}</span>
                {template.isDefault && (
                  <span className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Star size={18} />
                    Default
                  </span>
                )}
                <Button
                  variant="outlined"
                  onClick={() => handleEditTemplate(template)}
                  aria-label={`Edit ${template.name}`}
                >
                  <Pencil size={18} />
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="hover:text-red-400"
                  aria-label={`Delete ${template.name}`}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

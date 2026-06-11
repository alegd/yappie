"use client";

import { projectDetailPage } from "@/lib/constants/pages";
import { CheckCircle2, FileText, Mic } from "lucide-react";
import Link from "next/link";
import type { ActivityItem } from "./types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return `${d} d ago`;
}

function renderInner(item: ActivityItem) {
  const sub =
    item.projectName !== null
      ? `${item.projectName} · ${relativeTime(item.at)}`
      : relativeTime(item.at);

  if (item.type === "audio.uploaded") {
    return {
      icon: <Mic size={16} className="text-muted-foreground shrink-0" />,
      title: item.fileName,
      sub,
    };
  }
  if (item.type === "audio.completed") {
    const ticketLabel = `${item.ticketCount} ticket${item.ticketCount !== 1 ? "s" : ""}`;
    return {
      icon: <CheckCircle2 size={16} className="text-success shrink-0" />,
      title: (
        <>
          <span>{item.fileName}</span>
          <span className="text-foreground/60"> · </span>
          <span>{ticketLabel}</span>
        </>
      ),
      sub,
    };
  }
  // ticket.exported
  return {
    icon: <FileText size={16} className="text-info shrink-0" />,
    title: (
      <>
        <span>{item.ticketTitle}</span>
        <span className="text-foreground/60"> · </span>
        <span className="text-info">{item.jiraIssueKey}</span>
      </>
    ),
    sub,
  };
}

interface ActivityItemRowProps {
  item: ActivityItem;
}

export function ActivityItemRow({ item }: ActivityItemRowProps) {
  const { icon, title, sub } = renderInner(item);

  const inner = (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover/40 rounded-lg transition">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-foreground/75 text-xs">{sub}</p>
      </div>
    </div>
  );

  if (item.projectId === null) return inner;
  return <Link href={projectDetailPage(item.projectId)}>{inner}</Link>;
}

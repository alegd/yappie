"use client";

import { CheckCircle2, Loader2, MoreVertical, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Ticket } from "../types";

interface ActionsMenuProps {
  ticket: Ticket;
  isActing: boolean;
  onApprove: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
  canExport: boolean;
}

export function ActionsMenu({
  ticket,
  isActing,
  onApprove,
  onExport,
  onDelete,
  canExport,
}: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-md hover:bg-surface-hover transition"
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-40 bg-background border border-border rounded-md shadow-lg py-1">
          {ticket.status === "DRAFT" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(ticket.id);
                setOpen(false);
              }}
              disabled={isActing}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-surface-hover transition disabled:opacity-50"
            >
              {isActing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Approve
            </button>
          )}
          {ticket.status === "APPROVED" && canExport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport(ticket.id);
                setOpen(false);
              }}
              disabled={isActing}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-surface-hover transition disabled:opacity-50"
            >
              {isActing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Export to Jira
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ticket.id);
              setOpen(false);
            }}
            disabled={isActing}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-destructive hover:bg-surface-hover transition disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { SquareArrowOutUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { priorityVariants, ticketStatusVariants } from "@/features/tickets/badge-variants";
import type { Ticket } from "@/features/tickets/types";

interface TicketRowProps {
  ticket: Ticket;
  isSelected: boolean;
  onToggle: (ticketId: string) => void;
}

export function TicketRow({ ticket, isSelected, onToggle }: TicketRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-border border-b last:border-b-0">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(ticket.id)}
        aria-label={`Select ${ticket.title}`}
        className="border-zinc-600 rounded"
      />
      <p className="flex-1 min-w-0 font-medium text-sm truncate">{ticket.title}</p>
      <Badge variant={priorityVariants[ticket.priority]}>{ticket.priority}</Badge>
      <Badge variant={ticketStatusVariants[ticket.status]}>{ticket.status}</Badge>
      {ticket.jiraIssueKey && (
        <a
          href={ticket.jiraIssueUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:text-blue-500 transition"
        >
          <SquareArrowOutUpRightIcon size={12} />
          {ticket.jiraIssueKey}
        </a>
      )}
    </div>
  );
}

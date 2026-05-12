import { apiFetch } from "./client";
import type { Ticket, UpdateTicketInput } from "./types";

export function updateTicket(id: string, data: UpdateTicketInput): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deleteTicket(id: string): Promise<void> {
  return apiFetch<void>(`/tickets/${id}`, { method: "DELETE" });
}

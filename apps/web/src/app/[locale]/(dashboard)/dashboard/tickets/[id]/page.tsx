import { redirect } from "next/navigation";
import { auth } from "@/config/auth.config";
import { apiFetcher } from "@/lib/api-fetcher";
import { ticketDetail } from "@/lib/constants/endpoints";
import { AUTH_PAGE, DASHBOARD_PAGE, projectDetailPage } from "@/lib/constants/pages";
import type { Ticket } from "@/features/tickets/types";

export default async function LegacyTicketRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect(AUTH_PAGE);

  const { id } = await params;

  let ticket: Ticket | null = null;
  try {
    ticket = await apiFetcher(ticketDetail(id));
  } catch {
    redirect(DASHBOARD_PAGE);
  }

  if (!ticket?.audioRecording?.projectId) {
    redirect(DASHBOARD_PAGE);
  }

  redirect(`${projectDetailPage(ticket.audioRecording.projectId)}?ticket=${id}`);
}

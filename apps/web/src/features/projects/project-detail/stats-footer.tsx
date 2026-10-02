"use client";

interface StatsFooterProps {
  audioCount: number;
  ticketCount: number;
  exportedTicketCount: number;
}

export function StatsFooter({ audioCount, ticketCount, exportedTicketCount }: StatsFooterProps) {
  return (
    <div className="flex gap-6 mt-6 pt-4 border-border border-t text-muted-foreground text-sm">
      <span>{audioCount} audios</span>
      <span>{ticketCount} tickets</span>
      <span>{exportedTicketCount} exported</span>
    </div>
  );
}

import { cn } from "@/lib/utils";

const BAR_DELAYS_MS = [0, 80, 160, 240, 320] as const;
const BAR_HEIGHTS = ["h-3", "h-5", "h-7", "h-5", "h-3"] as const;

export function WaveformDecorative() {
  return (
    <div
      className="flex items-center justify-center gap-1"
      role="img"
      aria-label="Recording waveform"
    >
      {BAR_DELAYS_MS.map((delay, i) => (
        <span
          key={delay}
          data-testid="waveform-bar"
          className={cn("w-1 rounded bg-accent animate-pulse", BAR_HEIGHTS[i])}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

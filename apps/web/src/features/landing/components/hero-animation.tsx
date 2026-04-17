"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const WAVE_BARS = Array.from({ length: 24 }, (_, i) => i);

const TRANSCRIPT_TEXT =
  "there's a bug in checkout, Ana should look at it. Also Luis needs to add the filter endpoint for products by category.";

const TICKETS = [
  {
    type: "Bug",
    priority: "critical",
    title: "Checkout total doesn't update with 3+ items",
    assignee: "Ana (frontend)",
    color: "#ff4757",
  },
  {
    type: "Feature",
    priority: "medium",
    title: "Add product filter endpoint by category",
    assignee: "Luis (backend)",
    color: "#15803d",
  },
  {
    type: "Improvement",
    priority: "low",
    title: "Redesign empty cart page",
    assignee: "María (design)",
    color: "#ffb347",
  },
];

const PHASE_MS = {
  WAVE: 2000,
  TRANSCRIPT: 2000,
  TICKETS: 4000,
} as const;

const TOTAL_CYCLE = PHASE_MS.WAVE + PHASE_MS.TRANSCRIPT + PHASE_MS.TICKETS;

type Phase = 0 | 1 | 2;

function WaveformContent() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex items-center gap-1.5">
        {WAVE_BARS.map((i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full bg-primary"
            animate={{ scaleY: [0.2, 1, 0.2] }}
            transition={{
              duration: 1,
              delay: i * 0.04,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ height: "60px", transformOrigin: "center" }}
          />
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Recording…</p>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    setVisibleChars(0);
    const interval = setInterval(() => {
      setVisibleChars((c) => {
        if (c >= text.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [text]);

  return <>{text.slice(0, visibleChars)}</>;
}

function TranscriptContent() {
  const [label, setLabel] = useState("Transcribing…");

  useEffect(() => {
    const timer = setTimeout(() => setLabel("Extracting tasks…"), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full flex-col justify-center">
      <p className="text-foreground/90 text-base leading-relaxed italic">
        <TypewriterText text={TRANSCRIPT_TEXT} />
      </p>
      <p className="mt-6 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function TicketsContent() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {TICKETS.map((ticket, i) => (
        <motion.div
          key={ticket.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.3, ease: "easeOut" }}
          className="rounded-lg border border-border bg-background/40 p-3"
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ticket.color }} />
            <span className="uppercase tracking-wider text-muted-foreground">
              {ticket.type} · {ticket.priority}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">{ticket.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">→ {ticket.assignee}</p>
        </motion.div>
      ))}
    </div>
  );
}

export function HeroAnimation() {
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const cycle = () => {
      setPhase(0);
      timers.push(setTimeout(() => setPhase(1), PHASE_MS.WAVE));
      timers.push(setTimeout(() => setPhase(2), PHASE_MS.WAVE + PHASE_MS.TRANSCRIPT));
      timers.push(setTimeout(cycle, TOTAL_CYCLE));
    };

    cycle();

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      data-testid="hero-animation"
      aria-hidden="true"
      className="relative mx-auto mt-12 h-[300px] max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface/50 p-8"
    >
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            key="wave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <WaveformContent />
          </motion.div>
        )}
        {phase === 1 && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <TranscriptContent />
          </motion.div>
        )}
        {phase === 2 && (
          <motion.div
            key="tickets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <TicketsContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

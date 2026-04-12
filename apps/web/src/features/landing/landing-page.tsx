"use client";

import { cn } from "@/lib/utils";
import { AUTH_PAGE } from "@/lib/constants/pages";
import { ArrowRight, Check, FileCheck, Mic, Sparkles } from "lucide-react";
import Link from "next/link";
import { HTMLAttributes, PropsWithChildren } from "react";
import { useScrollAnimation } from "./hooks/use-scroll-animation";

function AnimatedSection({
  children,
  className,
  ...rest
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref}
      {...rest}
      className={cn(
        "transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </section>
  );
}

const HERO_WAVE_HEIGHTS = [
  20, 35, 50, 65, 45, 30, 55, 70, 40, 25, 60, 45, 35, 50, 65, 30, 55, 40, 70, 50,
];

const steps = [
  {
    icon: Mic,
    title: "Record or upload",
    description:
      "Capture a voice note in the browser or upload a file. MP3, WAV, OGG — any format works.",
  },
  {
    icon: Sparkles,
    title: "AI extracts and structures",
    description:
      "Yappie transcribes your audio, breaks it into individual tasks, and generates complete tickets with titles, descriptions, acceptance criteria, and priority — using your project's context.",
  },
  {
    icon: FileCheck,
    title: "Review and export",
    description:
      "Edit if needed, then export to Jira with one click. Individual or bulk. Your tickets show up in the right project, with the right labels.",
  },
];

const features = [
  {
    title: "Passwordless auth",
    description: "Sign in with a one-time code. No passwords to manage, leak, or forget.",
    accent: "#5b86e5",
  },
  {
    title: "Real-time progress",
    description: "See your audio being transcribed and tickets generated live via WebSocket.",
    accent: "#ffb347",
  },
  {
    title: "Jira OAuth 2.0",
    description: "Connect your Jira with one click. Tokens encrypted with AES-256.",
    accent: "#15803d",
  },
  {
    title: "Quotas & plans",
    description: "Free tier with 20 min/month. Upgrade to Pro when you need more.",
    accent: "#e8612f",
  },
  {
    title: "Dark & light mode",
    description: "Follows your system preference. Because developers have opinions.",
    accent: "#a78bfa",
  },
  {
    title: "Open source",
    description: "AGPL-3.0. Read the code, fork it, self-host it. Trust through transparency.",
    accent: "#2dd4bf",
  },
];

interface LandingPageProps {
  upgradeHref?: string;
}

export function LandingPage({ upgradeHref = AUTH_PAGE }: LandingPageProps = {}) {
  return (
    <>
      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-6 pt-40 pb-16 text-center">
        <div
          data-testid="hero-waves"
          aria-hidden="true"
          className="pointer-events-none absolute top-32 left-1/2 flex h-[120px] -translate-x-1/2 items-center gap-1.5 opacity-[0.06]"
        >
          {HERO_WAVE_HEIGHTS.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-[2px] bg-primary"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
        <div className="relative mb-6 inline-block rounded-full border border-border bg-accent-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Open Source &middot; Powered by AI
        </div>
        <h1 className="relative font-extrabold tracking-[-0.02em] text-[36px] leading-[1.1] md:text-[56px]">
          Talk. Yappie writes
          <br />
          <span className="text-primary">the ticket.</span>
        </h1>
        <p className="relative mx-auto mt-6 max-w-[520px] text-lg leading-relaxed text-foreground">
          Record a voice note after a meeting, standup, or brainstorm. Yappie uses AI to extract
          tasks, generate structured tickets, and export them to Jira — in seconds.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href={AUTH_PAGE}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-primary-hover"
          >
            Start for free <ArrowRight size={18} />
          </Link>
          <a
            href="#how-it-works"
            className="rounded-lg border border-border-hover px-6 py-3 font-medium text-foreground transition hover:border-border-hover"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No credit card &middot; 20 min/month free &middot; Open source (AGPL-3.0)
        </p>
      </section>

      {/* Demo */}
      <section className="mx-auto max-w-[900px] px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border border-border shadow-2xl">
          <video autoPlay muted loop playsInline className="w-full">
            <source src="/demo.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <AnimatedSection id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">From audio to action in 3 steps</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-xl border border-border bg-surface/50 p-6 transition hover:border-border-hover"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-surface">
                <step.icon size={28} className="text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="leading-relaxed text-foreground/75">{step.description}</p>
              <span
                data-testid="step-number"
                aria-hidden="true"
                className="pointer-events-none absolute top-5 right-5 text-4xl font-extrabold text-primary opacity-[0.08]"
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Project context differentiator */}
      <AnimatedSection className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold">
              Your AI knows
              <br />
              <span className="text-primary">your project</span>
            </h2>
            <p className="mb-6 text-foreground/75 leading-relaxed">
              Describe your project once — team members, tech stack, conventions, priorities — and
              Yappie uses that context to generate tickets that feel like they were written by
              someone on the team.
            </p>
            <p className="text-sm italic text-muted-foreground/80">
              One text field. Set it once. Every ticket gets better.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-surface/50 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Without context
              </p>
              <div className="font-mono text-sm leading-relaxed text-muted-foreground">
                <p className="text-foreground">[Bug] Login problem in Safari</p>
                <p>Priority: medium</p>
                <p>Assignee: —</p>
              </div>
            </div>
            <div className="relative rounded-xl border border-primary/30 bg-surface/50 p-5">
              <span className="absolute -top-2 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-white">
                AI-enhanced
              </span>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                With project context
              </p>
              <div className="font-mono text-sm leading-relaxed">
                <p className="text-foreground">[Bug] Login: form broken in Safari</p>
                <p className="text-primary">Priority: critical &middot; Labels: bug, auth</p>
                <p className="text-primary">Assignee: Ana (frontend)</p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Features grid */}
      <AnimatedSection className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Built for real teams</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-surface/50 p-5 transition hover:border-border-hover"
              style={{ borderTop: `2px solid ${feature.accent}` }}
            >
              <h3 className="mb-1.5 text-sm font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/75">{feature.description}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Pricing */}
      <AnimatedSection id="pricing" className="mx-auto max-w-[700px] px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Simple <span className="text-primary">pricing</span>
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-border bg-surface/50 p-8">
            <h3 className="text-base font-semibold">Free</h3>
            <p className="mt-1 text-4xl font-extrabold">
              $0<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted-foreground">
              {[
                "20 minutes of audio per month",
                "1 project",
                "Full AI pipeline",
                "Export to Jira",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span
                    data-testid="pricing-check"
                    className="flex h-4 w-4 items-center justify-center rounded bg-[#15803d]/20"
                  >
                    <Check size={10} className="stroke-[3] text-[#15803d]" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={AUTH_PAGE}
              className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition hover:border-border-hover"
            >
              Start for free <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative flex flex-col rounded-2xl border-2 border-primary/40 bg-surface/50 p-8">
            <span className="absolute -top-2.5 right-5 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-white">
              RECOMMENDED
            </span>
            <h3 className="text-base font-semibold text-primary">Pro</h3>
            <p className="mt-1 text-4xl font-extrabold">
              €4.99<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted-foreground">
              {[
                "100 minutes of audio per month",
                "Unlimited projects",
                "Priority processing",
                "Everything in Free",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span
                    data-testid="pricing-check"
                    className="flex h-4 w-4 items-center justify-center rounded bg-primary/20"
                  >
                    <Check size={10} className="stroke-[3] text-primary" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={upgradeHref}
              className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Upgrade to Pro <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground/70">
          No credit card required for Free. Cancel Pro anytime. Early adopters lock in this price
          forever.
        </p>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection className="mx-auto max-w-3xl px-6 pb-20">
        <div className="rounded-[20px] border border-primary/20 bg-gradient-to-br from-primary/[0.15] to-primary/[0.05] p-12 text-center">
          <h2 className="mb-3 text-3xl font-bold">Ready to stop typing tickets?</h2>
          <p className="mb-6 text-foreground/75">
            Record your first audio. See the tickets. Decide if it&apos;s worth it.
          </p>
          <Link
            href={AUTH_PAGE}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Start for free <ArrowRight size={16} />
          </Link>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-xs text-muted-foreground md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">Yappie</span>
            <span className="text-muted-foreground/70">Built with TDD and a lot of love.</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/alegd/yappie"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-foreground"
            >
              GitHub
            </a>
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
            <span>AGPL-3.0</span>
          </div>
        </div>
      </footer>
    </>
  );
}

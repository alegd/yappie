import { PublicNavbar } from "@/components/layout/public-navbar";
import { AUTH_PAGE } from "@/lib/constants/pages";
import {
  ArrowRight,
  FileCheck,
  Github,
  KeyRound,
  Mic,
  Moon,
  Radio,
  Shield,
  Sparkles,
  TicketCheck,
} from "lucide-react";
import Link from "next/link";

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
    icon: KeyRound,
    title: "Passwordless auth",
    description: "Sign in with a one-time code. No passwords to manage, leak, or forget.",
  },
  {
    icon: Radio,
    title: "Real-time progress",
    description: "See your audio being transcribed and tickets generated live via WebSocket.",
  },
  {
    icon: Shield,
    title: "Jira OAuth 2.0",
    description: "Connect your Jira with one click. Tokens encrypted with AES-256.",
  },
  {
    icon: TicketCheck,
    title: "Quotas & plans",
    description: "Free tier with 20 min/month. Upgrade to Pro when you need more.",
  },
  {
    icon: Moon,
    title: "Dark & light mode",
    description: "Follows your system preference. Because developers have opinions.",
  },
  {
    icon: Github,
    title: "Open source",
    description: "AGPL-3.0. Read the code, fork it, self-host it. Trust through transparency.",
  },
];

interface LandingPageProps {
  upgradeHref?: string;
}

export function LandingPage({ upgradeHref = AUTH_PAGE }: LandingPageProps = {}) {
  return (
    <main className="min-h-screen">
      <PublicNavbar />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-40 pb-16 text-center">
        <div className="mb-6 inline-block rounded-full border border-border bg-accent-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
          Open Source &middot; Powered by AI
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
          Talk. Yappie writes
          <br />
          <span className="text-accent">the ticket.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground">
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
      <section className="mx-auto max-w-4xl px-6">
        <div className="overflow-hidden rounded-xl border border-border shadow-2xl">
          <video autoPlay muted loop playsInline className="w-full">
            <source src="/demo.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">From audio to action in 3 steps</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-border bg-surface/50 p-6 transition hover:border-border-hover"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-surface">
                <step.icon size={28} className="text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="leading-relaxed text-foreground/75">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project context differentiator */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-4 text-center text-3xl font-bold">Your AI knows your project</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-foreground/75">
          Describe your project once — team members, tech stack, conventions, priorities — and
          Yappie uses that context to generate tickets that feel like they were written by someone
          on the team.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/30 p-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Without context
            </p>
            <div className="rounded-lg border border-border/50 bg-background p-4 font-mono text-sm leading-relaxed">
              <p className="font-semibold text-foreground">[Bug] Login problem in Safari</p>
              <p className="text-muted-foreground">Priority: medium</p>
              <p className="text-muted-foreground">Assignee: —</p>
            </div>
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
              With project context
            </p>
            <div className="rounded-lg border border-accent/20 bg-background p-4 font-mono text-sm leading-relaxed">
              <p className="font-semibold text-foreground">[Bug] Login: form broken in Safari</p>
              <p className="text-accent">Priority: critical &middot; Labels: bug, auth</p>
              <p className="text-accent">Assignee: Ana (frontend)</p>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          One text field. Set it once. Every ticket gets better.
        </p>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Built for real teams</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-surface/50 p-6 transition hover:border-border-hover"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-surface">
                <feature.icon size={20} className="text-accent" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/75">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Simple pricing</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-xl border border-border bg-surface/50 p-8">
            <h3 className="text-xl font-bold">Free</h3>
            <p className="mt-1 text-3xl font-extrabold">
              $0<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-foreground/75">
              <li>20 minutes of audio per month</li>
              <li>1 project</li>
              <li>Full AI pipeline</li>
              <li>Export to Jira</li>
            </ul>
            <Link
              href={AUTH_PAGE}
              className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold transition hover:border-border-hover"
            >
              Start for free <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex flex-col rounded-xl border-2 border-accent bg-surface/50 p-8">
            <h3 className="text-xl font-bold">Pro</h3>
            <p className="mt-1 text-3xl font-extrabold">
              $4.99<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-foreground/75">
              <li>100 minutes of audio per month</li>
              <li>Unlimited projects</li>
              <li>Priority processing</li>
              <li>Everything in Free</li>
            </ul>
            <Link
              href={upgradeHref}
              className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent/90"
            >
              Upgrade to Pro <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No credit card required for Free. Cancel Pro anytime. Early adopters lock in this price
          forever.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-12">
          <h2 className="mb-4 text-3xl font-bold">Ready to stop typing tickets?</h2>
          <p className="mb-8 text-foreground/75">
            Record your first audio. See the tickets. Decide if it&apos;s worth it.
          </p>
          <Link
            href={AUTH_PAGE}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            Start for free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-muted-foreground md:flex-row md:justify-between">
          <span className="font-semibold text-foreground">Yappie</span>
          <div className="flex items-center gap-4">
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
    </main>
  );
}

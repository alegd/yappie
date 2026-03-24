import { PublicNavbar } from "@/components/layout/public-navbar";
import { REGISTER_PAGE } from "@/lib/constants/pages";
import { ArrowRight, FileText, Mic, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Mic,
    title: "Record or Upload",
    description:
      "Capture voice notes on the go or upload existing audio files. Supports MP3, WAV, OGG, and more.",
  },
  {
    icon: Zap,
    title: "AI Decomposes Tasks",
    description:
      "GPT analyzes your audio, extracts actionable items, and structures them into well-defined tickets.",
  },
  {
    icon: FileText,
    title: "Export to Jira",
    description:
      "Review, edit, approve, and export tickets to Jira with one click. Bulk export supported.",
  },
];

const steps = [
  {
    title: "Record or upload",
    description: "Capture a voice note after a meeting or upload an existing audio file.",
  },
  {
    title: "AI extracts tasks",
    description:
      "Yappie transcribes the audio and breaks it down into structured, actionable tickets.",
  },
  {
    title: "Review and edit",
    description:
      "Check the generated tickets, adjust titles or descriptions, and approve the ones you want.",
  },
  {
    title: "Export to Jira",
    description:
      "Send approved tickets to your Jira project with one click — individually or in bulk.",
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen">
      <PublicNavbar />

      {/* Hero */}
      <section className="mx-auto px-6 py-24 max-w-4xl text-center">
        <div className="inline-block mb-6 px-3 py-1 border border-border rounded-full font-semibold text-accent text-xs uppercase tracking-wider bg-accent-surface">
          Powered by AI
        </div>
        <h1 className="font-extrabold text-5xl md:text-6xl tracking-tight">
          Turn voice notes into
          <br />
          <span className="text-accent">Jira tickets</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-foreground text-lg leading-relaxed">
          Record your thoughts after a meeting, standup, or brainstorm. Yappie uses AI to extract
          tasks, generate structured tickets, and export them to Jira — in seconds.
        </p>
        <div className="flex justify-center items-center gap-4 mt-8">
          <Link
            href={REGISTER_PAGE}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-lg font-semibold text-white text-base transition"
          >
            Start for free <ArrowRight size={18} />
          </Link>
          <Link
            href="#how-it-works"
            className="px-6 py-3 border border-border-hover hover:border-border-hover rounded-lg font-medium text-foreground  transition"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto px-6 py-20 max-w-6xl">
        <h2 className="mb-12 font-bold text-3xl text-center">From audio to action in 3 steps</h2>
        <div className="gap-8 grid md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-surface/50 p-6 border border-border hover:border-border-hover rounded-xl transition"
            >
              <div className="flex justify-center items-center mb-4 rounded-lg w-10 h-10 bg-accent-surface">
                <feature.icon size={20} className="text-accent" />
              </div>
              <h3 className="mb-2 font-semibold text-lg">{feature.title}</h3>
              <p className="text-foreground/75 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto px-6 py-20 max-w-4xl">
        <h2 className="mb-12 font-bold text-3xl text-center">How it works</h2>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-surface/30 p-5 border border-border/50 rounded-lg"
            >
              <div className="flex justify-center items-center mt-0.5 rounded-full w-8 h-8 bg-accent-surface shrink-0">
                <span className="font-bold text-accent">{i + 1}</span>
              </div>
              <div>
                <p className="font-heading font-semibold">{step.title}</p>
                <p className="text-muted-foreground text-sm mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto px-6 py-20 max-w-6xl text-center">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-12 border border-border rounded-2xl">
          <h2 className="mb-4 font-bold text-3xl">Ready to stop typing tickets?</h2>
          <p className="mb-8 text-foreground/75">
            Join teams who save hours every week by turning meetings into actionable Jira tickets.
          </p>
          <Link
            href={REGISTER_PAGE}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-8 py-3 rounded-lg font-semibold text-white transition"
          >
            Get started for free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-border border-t">
        <div className="flex justify-between items-center mx-auto max-w-6xl text-muted-foreground text-sm">
          <span>Yappie</span>
          <span>AGPL-3.0</span>
        </div>
      </footer>
    </main>
  );
}

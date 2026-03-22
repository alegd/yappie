import { Mic, Zap, FileText, ArrowRight, CheckCircle } from "lucide-react";
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
  "Record a voice note or upload an audio file",
  "AI transcribes and extracts actionable tasks",
  "Review and edit generated tickets",
  "Export to Jira with one click",
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">Yappie</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition">
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-6">
          Powered by OpenAI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Turn voice notes into
          <br />
          <span className="text-indigo-500">Jira tickets</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Record your thoughts after a meeting, standup, or brainstorm. Yappie uses AI to extract
          tasks, generate structured tickets, and export them to Jira — in seconds.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg font-semibold text-base transition flex items-center gap-2"
          >
            Start for free <ArrowRight size={18} />
          </Link>
          <Link
            href="#how-it-works"
            className="border border-zinc-700 hover:border-zinc-500 px-6 py-3 rounded-lg font-medium text-sm text-zinc-300 transition"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">From audio to action in 3 steps</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition"
            >
              <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon size={20} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4"
            >
              <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-indigo-400">{i + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <span className="text-zinc-300">{step}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to stop typing tickets?</h2>
          <p className="text-zinc-400 mb-8">
            Join teams who save hours every week by turning meetings into actionable Jira tickets.
          </p>
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg font-semibold transition inline-flex items-center gap-2"
          >
            Get started for free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <span>Yappie — TFM Project</span>
          <span>AGPL-3.0</span>
        </div>
      </footer>
    </main>
  );
}

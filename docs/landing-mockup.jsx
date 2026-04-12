import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#1c1c28",
  surface: "#2a2a38",
  surfaceHover: "#38384a",
  text: "#f5f5f5",
  muted: "#a0a0b8",
  orange: "#e8612f",
  orangeHover: "#f07040",
  amber: "#ffb347",
  green: "#15803d",
  blue: "#5b86e5",
  border: "rgba(255,255,255,0.08)",
  accentSurface: "rgba(232,97,47,0.10)",
};

function WaveBar({ delay, height }) {
  return (
    <div
      style={{
        width: 3,
        borderRadius: 2,
        background: C.orange,
        animation: `wave 1.2s ease-in-out ${delay}s infinite alternate`,
        height,
      }}
    />
  );
}

export default function Landing() {
  const [visible, setVisible] = useState({});
  const observers = useRef([]);

  useEffect(() => {
    document.querySelectorAll("[data-anim]").forEach((el, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible((v) => ({ ...v, [i]: true }));
            obs.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      obs.observe(el);
      observers.current.push(obs);
    });
    return () => observers.current.forEach((o) => o.disconnect());
  }, []);

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap');
        @keyframes wave { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes typewriter { from { width:0; } to { width:100%; } }
        .anim { opacity:0; transform:translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .anim.show { opacity:1; transform:translateY(0); }
        .anim.show:nth-child(2) { transition-delay:0.1s; }
        .anim.show:nth-child(3) { transition-delay:0.2s; }
        .anim.show:nth-child(4) { transition-delay:0.3s; }
        * { margin:0; padding:0; box-sizing:border-box; }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="28" height="28" viewBox="0 0 64 64">
            <rect x="4" y="4" width="56" height="56" rx="14" fill={C.orange} />
            <line
              x1="32"
              y1="48"
              x2="32"
              y2="34"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="32"
              y1="34"
              x2="18"
              y2="20"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="32"
              y1="34"
              x2="46"
              y2="20"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="32" cy="48" r="4" fill="white" />
            <circle cx="18" cy="20" r="4" fill="white" />
            <circle cx="46" cy="20" r="4" fill="white" />
          </svg>
          <span
            style={{ fontFamily: "'Sora'", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}
          >
            Yappie
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>How it works</span>
          <span style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>Pricing</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.muted}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          <div
            style={{
              background: C.orange,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Start for free
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "80px 24px 40px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Decorative wave bars behind hero */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 60,
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
            alignItems: "center",
            height: 120,
            opacity: 0.06,
          }}
        >
          {[20, 35, 50, 65, 45, 30, 55, 70, 40, 25, 60, 45, 35, 50, 65, 30, 55, 40, 70, 50].map(
            (h, i) => (
              <div key={i} style={{ width: 4, height: h, background: C.orange, borderRadius: 2 }} />
            ),
          )}
        </div>

        <div
          style={{
            display: "inline-block",
            background: C.accentSurface,
            border: `1px solid ${C.orange}30`,
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 11,
            fontWeight: 600,
            color: C.orange,
            letterSpacing: 0.5,
            marginBottom: 24,
          }}
        >
          OPEN SOURCE · POWERED BY AI
        </div>

        <h1
          style={{
            fontFamily: "'Sora'",
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Talk. Yappie writes
          <br />
          <span style={{ color: C.orange }}>the ticket.</span>
        </h1>

        <p
          style={{
            fontSize: 17,
            color: C.muted,
            maxWidth: 520,
            margin: "0 auto 32px",
            lineHeight: 1.7,
          }}
        >
          Record a voice note after a meeting, standup, or brainstorm. Yappie uses AI to extract
          tasks, generate structured tickets, and export them to Jira — in seconds.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
          <div
            style={{
              background: C.orange,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              padding: "12px 28px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Start for free <span style={{ fontSize: 18 }}>→</span>
          </div>
          <div
            style={{
              background: "transparent",
              color: C.text,
              fontSize: 15,
              fontWeight: 500,
              padding: "12px 28px",
              borderRadius: 10,
              cursor: "pointer",
              border: `1px solid ${C.border}`,
            }}
          >
            See how it works
          </div>
        </div>

        <p style={{ fontSize: 12, color: C.muted, opacity: 0.7 }}>
          No credit card · 20 min/month free · Open source (AGPL-3.0)
        </p>
      </section>

      {/* DEMO VIDEO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px 80px" }}>
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${C.border}`,
            background: C.surface,
            position: "relative",
          }}
        >
          {/* Fake video placeholder - in real version this is the <video> tag */}
          <div
            style={{
              aspectRatio: "16/9",
              background: `linear-gradient(135deg, ${C.bg}, ${C.surface})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: C.accentSurface,
                border: `2px solid ${C.orange}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "10px solid transparent",
                  borderBottom: "10px solid transparent",
                  borderLeft: `16px solid ${C.orange}`,
                  marginLeft: 4,
                }}
              />
            </div>
            <span style={{ fontSize: 13, color: C.muted }}>
              Demo: audio → tickets → Jira in 15 seconds
            </span>
          </div>
        </div>
      </section>

      {/* 3 STEPS */}
      <section data-anim style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px" }}>
        <h2
          style={{
            fontFamily: "'Sora'",
            fontSize: 28,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          From audio to action in <span style={{ color: C.orange }}>3 steps</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            {
              num: "1",
              title: "Record or upload",
              desc: "Capture a voice note in the browser or upload a file. MP3, WAV, OGG — any format works.",
              icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3",
            },
            {
              num: "2",
              title: "AI extracts and structures",
              desc: "Yappie transcribes, breaks it into tasks, and generates tickets with context from your project.",
              icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
            },
            {
              num: "3",
              title: "Review and export",
              desc: "Edit if needed, then export to Jira with one click. Individual or bulk. Right project, right labels.",
              icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4",
            },
          ].map(({ num, title, desc, icon }) => (
            <div
              key={num}
              style={{
                padding: "28px 24px",
                background: C.surface,
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: C.accentSurface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={C.orange}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={icon} />
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Sora'", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {title}
              </h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  fontFamily: "'Sora'",
                  fontSize: 36,
                  fontWeight: 800,
                  color: C.orange,
                  opacity: 0.08,
                }}
              >
                {num}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTEXT — THE DIFFERENTIATOR */}
      <section data-anim style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}
        >
          <div>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
              Your AI knows
              <br />
              <span style={{ color: C.orange }}>your project</span>
            </h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
              Describe your project once — team members, tech stack, conventions, priorities — and
              Yappie uses that context to generate tickets that feel like they were written by
              someone on the team.
            </p>
            <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic", opacity: 0.7 }}>
              One text field. Set it once. Every ticket gets better.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: "18px 20px",
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.muted,
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Without context
              </div>
              <div
                style={{ fontFamily: "monospace", fontSize: 13, color: "#9090a0", lineHeight: 1.8 }}
              >
                <div>[Bug] Login problem in Safari</div>
                <div>Priority: medium</div>
                <div>Assignee: —</div>
              </div>
            </div>
            <div
              style={{
                padding: "18px 20px",
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.orange}30`,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.orange,
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                With project context
              </div>
              <div
                style={{ fontFamily: "monospace", fontSize: 13, color: C.text, lineHeight: 1.8 }}
              >
                <div>[Bug] Login: form broken in Safari</div>
                <div style={{ color: C.orange }}>Priority: critical · Labels: bug, auth</div>
                <div style={{ color: C.orange }}>Assignee: Ana (frontend)</div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  right: 16,
                  background: C.orange,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: 10,
                }}
              >
                AI-enhanced
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section data-anim style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px" }}>
        <h2
          style={{
            fontFamily: "'Sora'",
            fontSize: 28,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Built for <span style={{ color: C.orange }}>real teams</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            {
              title: "Passwordless auth",
              desc: "Sign in with a one-time code. No passwords to manage, leak, or forget.",
              color: C.blue,
            },
            {
              title: "Real-time progress",
              desc: "See your audio being transcribed and tickets generated live via WebSocket.",
              color: C.amber,
            },
            {
              title: "Jira OAuth 2.0",
              desc: "Connect your Jira with one click. Tokens encrypted with AES-256.",
              color: C.green,
            },
            {
              title: "Quotas & plans",
              desc: "Free tier with 20 min/month. Upgrade to Pro when you need more.",
              color: C.orange,
            },
            {
              title: "Dark & light mode",
              desc: "Follows your system preference. Because developers have opinions.",
              color: "#a78bfa",
            },
            {
              title: "Open source",
              desc: "AGPL-3.0. Read the code, fork it, self-host it. Trust through transparency.",
              color: "#2dd4bf",
            },
          ].map(({ title, desc, color }) => (
            <div
              key={title}
              style={{
                padding: "20px",
                background: C.surface,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                borderTop: `2px solid ${color}`,
              }}
            >
              <h3 style={{ fontFamily: "'Sora'", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {title}
              </h3>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section
        data-anim
        style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}
      >
        <h2 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 700, marginBottom: 48 }}>
          Simple <span style={{ color: C.orange }}>pricing</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div
            style={{
              padding: "32px 28px",
              background: C.surface,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              textAlign: "left",
            }}
          >
            <p style={{ fontFamily: "'Sora'", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Free
            </p>
            <p style={{ fontFamily: "'Sora'", fontSize: 36, fontWeight: 800, marginBottom: 20 }}>
              $0<span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/month</span>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                "20 minutes of audio per month",
                "1 project",
                "Full AI pipeline",
                "Export to Jira",
              ].map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: C.muted,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: `${C.green}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={C.green}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "10px 0",
                textAlign: "center",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                color: C.text,
              }}
            >
              Start for free →
            </div>
          </div>
          <div
            style={{
              padding: "32px 28px",
              background: C.surface,
              borderRadius: 14,
              border: `2px solid ${C.orange}40`,
              textAlign: "left",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                right: 20,
                background: C.orange,
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                padding: "3px 12px",
                borderRadius: 10,
              }}
            >
              RECOMMENDED
            </div>
            <p
              style={{
                fontFamily: "'Sora'",
                fontSize: 16,
                fontWeight: 600,
                color: C.orange,
                marginBottom: 4,
              }}
            >
              Pro
            </p>
            <p style={{ fontFamily: "'Sora'", fontSize: 36, fontWeight: 800, marginBottom: 20 }}>
              $4.99<span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/month</span>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                "100 minutes of audio per month",
                "Unlimited projects",
                "Priority processing",
                "Everything in Free",
              ].map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: C.muted,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: `${C.orange}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={C.orange}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "10px 0",
                textAlign: "center",
                background: C.orange,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                color: "#fff",
              }}
            >
              Upgrade to Pro →
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 16, opacity: 0.7 }}>
          No credit card required for Free. Cancel Pro anytime. Early adopters lock in this price
          forever.
        </p>
      </section>

      {/* CTA FINAL */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        <div
          style={{
            padding: "48px 40px",
            borderRadius: 20,
            background: `linear-gradient(135deg, ${C.orange}15, ${C.orange}05)`,
            border: `1px solid ${C.orange}20`,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            Ready to stop typing tickets?
          </h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 24 }}>
            Record your first audio. See the tickets. Decide if it's worth it.
          </p>
          <div
            style={{
              display: "inline-block",
              background: C.orange,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              padding: "12px 32px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            Start for free →
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 64 64">
            <rect x="4" y="4" width="56" height="56" rx="14" fill={C.orange} />
            <line
              x1="32"
              y1="48"
              x2="32"
              y2="34"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="32"
              y1="34"
              x2="18"
              y2="20"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="32"
              y1="34"
              x2="46"
              y2="20"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="32" cy="48" r="4" fill="white" />
            <circle cx="18" cy="20" r="4" fill="white" />
            <circle cx="46" cy="20" r="4" fill="white" />
          </svg>
          <span style={{ fontSize: 12, color: C.muted }}>
            Built with TDD. 481 tests. 95% API coverage.
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: C.muted }}>
          <span>GitHub</span>
          <span>Privacy</span>
          <span>AGPL-3.0</span>
        </div>
      </footer>
    </div>
  );
}

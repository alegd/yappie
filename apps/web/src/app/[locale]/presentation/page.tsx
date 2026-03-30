"use client";

import { useCallback, useEffect, useState } from "react";

const COLORS = {
  orange: "#e8612f",
  orangeHover: "#f07040",
  amber: "#ffb347",
  navy: "#1c1c28",
  surface: "#2a2a38",
  surfaceHover: "#38384a",
  light: "#FFFAF5",
  text: "#f5f5f5",
  muted: "#a0a0b8",
  green: "#15803d",
  blue: "#5b86e5",
  red: "#ff4757",
  warning: "#d4940a",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",
  accentSurface: "rgba(232, 97, 47, 0.12)",
};

const slides = [
  // 0 — TITLE
  () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        textAlign: "center",
        padding: "0 60px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <svg width="80" height="80" viewBox="0 0 64 64" style={{ marginBottom: 24 }}>
        <rect x="4" y="4" width="56" height="56" rx="14" fill={COLORS.orange} />
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
      <h1
        style={{
          fontFamily: "'Sora',sans-serif",
          fontSize: 48,
          fontWeight: 800,
          color: COLORS.text,
          letterSpacing: -2,
          margin: 0,
        }}
      >
        Yappie
      </h1>
      <p
        style={{
          fontSize: 22,
          color: COLORS.muted,
          margin: "12px 0 0",
          fontWeight: 400,
          lineHeight: 1.4,
        }}
      >
        De nota de voz caótica a tickets estructurados con IA
      </p>
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <p style={{ fontSize: 14, color: COLORS.muted }}>
          Proyecto Final de Máster · Desarrollo con IA
        </p>
        <p style={{ fontSize: 14, color: COLORS.muted }}>Alejandro Guerra · BIG School · 2026</p>
      </div>
      <p
        style={{ position: "absolute", bottom: 20, fontSize: 11, color: "rgba(255,255,255,0.25)" }}
      >
        ← → para navegar
      </p>
    </div>
  ),

  // 1 — PROBLEMA
  () => (
    <Slide title="El problema">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 18, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>
          Las reuniones y conversaciones generan tareas que se pierden. Los managers dictan ideas
          mezcladas y los devs las interpretan mal. Crear tickets bien escritos es tedioso y nadie
          lo hace bien.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <StatCard number="70%" label="del tiempo de un PM se va en documentar tareas" />
          <StatCard number="3-5 min" label="promedio para escribir un ticket bien estructurado" />
          <StatCard number="40%" label="de las tareas de una reunión se pierden sin documentar" />
        </div>
        <div
          style={{
            padding: "16px 20px",
            background: COLORS.surface,
            borderRadius: 10,
            borderLeft: `3px solid ${COLORS.orange}`,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: COLORS.muted,
              margin: 0,
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            "Hay un bug en el login de Safari, dile a diseño que cambie el botón, y esto es urgente
            para mañana" — un audio real de 30 segundos con 3 tareas mezcladas.
          </p>
        </div>
      </div>
    </Slide>
  ),

  // 2 — SOLUCIÓN
  () => (
    <Slide title="La solución: Yappie">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 17, color: COLORS.text, lineHeight: 1.7, margin: 0 }}>
          Una herramienta open source que convierte notas de voz caóticas en tickets de trabajo
          estructurados con IA. Grabas hablando, la IA entiende tu proyecto, y genera tickets listos
          para exportar a Jira.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <FeatureCard
            icon="🎙️"
            title="Graba o sube"
            desc="Audio desde el navegador o archivo. MP3, WAV, OGG."
          />
          <FeatureCard
            icon="🧠"
            title="La IA descompone"
            desc="GPT analiza, separa tareas y genera tickets completos."
          />
          <FeatureCard
            icon="📤"
            title="Exporta a Jira"
            desc="Un click. Bulk export. OAuth 2.0 integrado."
          />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            "Passwordless auth (OTP)",
            "Contexto de proyecto",
            "Real-time (WebSocket)",
            "Quotas por plan",
            "Dark/Light theme",
            "i18n ready",
          ].map((f) => (
            <span
              key={f}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                background: COLORS.accentSurface,
                color: COLORS.orange,
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </Slide>
  ),

  // 3 — PIPELINE
  () => (
    <Slide title="Pipeline de procesamiento de audio">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          {
            step: "1",
            title: "Upload",
            desc: "El usuario selecciona proyecto y graba/sube audio",
            color: COLORS.muted,
          },
          {
            step: "2",
            title: "Whisper",
            desc: "Transcripción de audio a texto con timestamps",
            color: "#a78bfa",
          },
          {
            step: "3",
            title: "Contexto",
            desc: "Carga el contexto del proyecto (equipo, stack, reglas)",
            color: "#2dd4bf",
          },
          {
            step: "4",
            title: "GPT-4o-mini",
            desc: "Descompone en tareas individuales + genera tickets completos",
            color: COLORS.orange,
          },
          {
            step: "5",
            title: "Draft",
            desc: "Tickets guardados para revisión del usuario",
            color: COLORS.blue,
          },
          {
            step: "6",
            title: "Jira",
            desc: "Export individual o bulk con un click",
            color: COLORS.green,
          },
        ].map(({ step, title, desc, color }) => (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `${color}20`,
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {step}
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>{title}</span>
              <span style={{ fontSize: 15, color: COLORS.muted, marginLeft: 8 }}>{desc}</span>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 14, color: COLORS.muted, marginTop: 8, fontStyle: "italic" }}>
          Todo el pipeline corre async con BullMQ. El usuario recibe notificación por WebSocket
          cuando los tickets están listos.
        </p>
      </div>
    </Slide>
  ),

  // 4 — CONTEXTO IA
  () => (
    <Slide title="Contexto de proyecto: la clave de la calidad">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 17, color: COLORS.text, lineHeight: 1.6, margin: 0 }}>
          El usuario describe su proyecto una vez (equipo, stack, reglas) y la IA lo usa para
          generar tickets precisos.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: 16, background: COLORS.surface, borderRadius: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", margin: "0 0 8px" }}>
              Sin contexto
            </p>
            <p style={{ fontSize: 15, color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>
              [Bug] Problema en login de Safari
              <br />
              Prioridad: medium
              <br />
              Assignee: —
            </p>
          </div>
          <div
            style={{
              padding: 16,
              background: COLORS.surface,
              borderRadius: 10,
              border: `1px solid ${COLORS.green}30`,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.green, margin: "0 0 8px" }}>
              Con contexto
            </p>
            <p style={{ fontSize: 15, color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>
              [Bug] Login: formulario roto en Safari
              <br />
              Prioridad: critical · Labels: bug, auth
              <br />
              Assignee: Ana (frontend)
            </p>
          </div>
        </div>
        <div
          style={{
            padding: 14,
            background: COLORS.accentSurface,
            borderRadius: 8,
            border: `1px solid ${COLORS.orange}20`,
          }}
        >
          <p style={{ fontSize: 14, color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: COLORS.orange }}>Ejemplo de contexto:</strong> "App e-commerce
            TiendaVerde. Equipo: Ana (front), Luis (back), María (diseño). Bugs en checkout siempre
            son priority critical."
          </p>
        </div>
      </div>
    </Slide>
  ),

  // 5 — STACK
  () => (
    <Slide title="Stack tecnológico">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          {
            layer: "Frontend",
            tech: "Next.js 16, React 19, Tailwind CSS 4, NextAuth v5, SWR",
            color: COLORS.green,
          },
          {
            layer: "Backend",
            tech: "NestJS 11, Prisma 7, PostgreSQL 16, Redis 7, BullMQ",
            color: COLORS.blue,
          },
          {
            layer: "IA",
            tech: "OpenAI Whisper (transcripción), GPT-4o-mini (descomposición + generación)",
            color: COLORS.orange,
          },
          {
            layer: "Auth",
            tech: "Passwordless OTP por email (Resend), NextAuth v5, sin contraseñas",
            color: "#a78bfa",
          },
          {
            layer: "Infra",
            tech: "Docker, Vercel (web), Coolify (API), GitHub Actions CI",
            color: "#2dd4bf",
          },
          { layer: "Testing", tech: "Vitest, Testing Library, Playwright E2E", color: "#f472b6" },
          {
            layer: "Seguridad",
            tech: "OWASP Top 10, Helmet, CORS, rate limiting, AES-256-GCM",
            color: "#ef4444",
          },
          { layer: "Observabilidad", tech: "Sentry (error tracking)", color: COLORS.amber },
        ].map(({ layer, tech, color }) => (
          <div
            key={layer}
            style={{
              padding: "14px 16px",
              background: COLORS.surface,
              borderRadius: 8,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color, margin: "0 0 4px" }}>{layer}</p>
            <p style={{ fontSize: 14, color: COLORS.muted, margin: 0, lineHeight: 1.4 }}>{tech}</p>
          </div>
        ))}
      </div>
    </Slide>
  ),

  // 6 — ARQUITECTURA
  () => (
    <Slide title="Arquitectura del sistema">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <svg width="100%" viewBox="0 0 600 280" style={{ maxWidth: 560 }}>
          <rect
            x="200"
            y="10"
            width="200"
            height="40"
            rx="8"
            fill={COLORS.surface}
            stroke={COLORS.border}
          />
          <text
            x="300"
            y="35"
            fill={COLORS.text}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            Usuarios
          </text>

          <line
            x1="250"
            y1="50"
            x2="180"
            y2="80"
            stroke={COLORS.muted}
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="350"
            y1="50"
            x2="420"
            y2="80"
            stroke={COLORS.muted}
            strokeWidth="1"
            opacity="0.4"
          />

          <rect
            x="100"
            y="80"
            width="160"
            height="40"
            rx="8"
            fill={"rgba(21,128,61,0.12)"}
            stroke={"rgba(21,128,61,0.3)"}
          />
          <text
            x="180"
            y="105"
            fill={COLORS.green}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            Web App (Next.js 16)
          </text>

          <rect
            x="340"
            y="80"
            width="160"
            height="40"
            rx="8"
            fill={"rgba(232,97,47,0.12)"}
            stroke={`${COLORS.orange}40`}
          />
          <text
            x="420"
            y="105"
            fill={COLORS.orange}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            Landing Page
          </text>

          <line
            x1="180"
            y1="120"
            x2="300"
            y2="150"
            stroke={COLORS.muted}
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="420"
            y1="120"
            x2="300"
            y2="150"
            stroke={COLORS.muted}
            strokeWidth="1"
            opacity="0.4"
          />

          <rect
            x="200"
            y="150"
            width="200"
            height="40"
            rx="8"
            fill={"rgba(91,134,229,0.12)"}
            stroke={"rgba(91,134,229,0.3)"}
          />
          <text
            x="300"
            y="175"
            fill={COLORS.blue}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            API Gateway (NestJS)
          </text>

          <line
            x1="220"
            y1="190"
            x2="120"
            y2="230"
            stroke={COLORS.muted}
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="300"
            y1="190"
            x2="300"
            y2="230"
            stroke={COLORS.muted}
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1="380"
            y1="190"
            x2="480"
            y2="230"
            stroke={COLORS.muted}
            strokeWidth="1"
            opacity="0.4"
          />

          <rect
            x="50"
            y="230"
            width="140"
            height="40"
            rx="8"
            fill={COLORS.surface}
            stroke={COLORS.border}
          />
          <text
            x="120"
            y="248"
            fill={COLORS.text}
            textAnchor="middle"
            fontSize="13"
            fontFamily="sans-serif"
          >
            PostgreSQL
          </text>
          <text
            x="120"
            y="262"
            fill={COLORS.muted}
            textAnchor="middle"
            fontSize="12"
            fontFamily="sans-serif"
          >
            + pgvector
          </text>

          <rect
            x="230"
            y="230"
            width="140"
            height="40"
            rx="8"
            fill={COLORS.surface}
            stroke={COLORS.border}
          />
          <text
            x="300"
            y="248"
            fill={COLORS.text}
            textAnchor="middle"
            fontSize="13"
            fontFamily="sans-serif"
          >
            BullMQ
          </text>
          <text
            x="300"
            y="262"
            fill={COLORS.muted}
            textAnchor="middle"
            fontSize="12"
            fontFamily="sans-serif"
          >
            (Redis)
          </text>

          <rect
            x="410"
            y="230"
            width="140"
            height="40"
            rx="8"
            fill={COLORS.surface}
            stroke={COLORS.border}
          />
          <text
            x="480"
            y="248"
            fill={COLORS.text}
            textAnchor="middle"
            fontSize="13"
            fontFamily="sans-serif"
          >
            OpenAI
          </text>
          <text
            x="480"
            y="262"
            fill={COLORS.muted}
            textAnchor="middle"
            fontSize="12"
            fontFamily="sans-serif"
          >
            Whisper + GPT-4o-mini
          </text>
        </svg>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {["Monorepo Turborepo", "TDD estricto", "AGPL-3.0", "CI/CD GitHub Actions", "Docker"].map(
            (t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  background: COLORS.surface,
                  color: COLORS.muted,
                  borderRadius: 6,
                }}
              >
                {t}
              </span>
            ),
          )}
        </div>
      </div>
    </Slide>
  ),

  // 7 — LANDING
  () => (
    <Slide title="El producto — Landing page">
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            flex: 1,
            borderRadius: 10,
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <img
            src="presentation/landing.png"
            alt="Landing"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>
          yappie.gueden.com — Hero, propuesta de valor, flujo en 3 pasos, dark mode
        </p>
      </div>
    </Slide>
  ),

  // 8 — DASHBOARD
  () => (
    <Slide title="El producto — Dashboard">
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            flex: 1,
            borderRadius: 10,
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <img
            src="presentation/dashboard-onboarding.png"
            alt="Dashboard"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>
          Onboarding guiado: Connect Jira → Create project → Upload audio
        </p>
      </div>
    </Slide>
  ),

  // 8 — METODOLOGÍA
  () => (
    <Slide title="Metodología: TDD + desarrollo con IA">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: 16, background: COLORS.surface, borderRadius: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", margin: "0 0 8px" }}>
              RED
            </p>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>
              Escribir el test que describe el comportamiento esperado. Ejecutar. Falla.
            </p>
          </div>
          <div style={{ padding: 16, background: COLORS.surface, borderRadius: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.green, margin: "0 0 8px" }}>
              GREEN
            </p>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>
              Escribir el código mínimo para que pase. Nada más.
            </p>
          </div>
        </div>
        <div style={{ padding: 16, background: COLORS.surface, borderRadius: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.blue, margin: "0 0 8px" }}>
            REFACTOR
          </p>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.5 }}>
            Limpiar el código sin romper tests. Extraer abstracciones si emergen.
          </p>
        </div>
        <div
          style={{
            padding: "14px 16px",
            background: COLORS.accentSurface,
            borderRadius: 8,
            border: `1px solid ${COLORS.orange}20`,
          }}
        >
          <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: COLORS.orange }}>Claude Code como copiloto:</strong> utilizado
            durante todo el desarrollo para scaffolding, generación de tests, debugging y
            documentación. El desarrollador mantiene el control de las decisiones arquitectónicas.
          </p>
        </div>
      </div>
    </Slide>
  ),

  // 9 — MÉTRICAS
  () => (
    <Slide title="Métricas del proyecto">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <StatCard number="284" label="Commits" />
          <StatCard number="481" label="Tests totales" />
          <StatCard number="41" label="Endpoints API" />
          <StatCard number="~7,500" label="Líneas de código" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 16, background: COLORS.surface, borderRadius: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 10px" }}>
              Coverage API
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <CoverageStat label="Statements" value="95.7%" />
              <CoverageStat label="Branches" value="87.0%" />
              <CoverageStat label="Functions" value="93.9%" />
              <CoverageStat label="Lines" value="96.4%" />
            </div>
          </div>
          <div style={{ padding: 16, background: COLORS.surface, borderRadius: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 10px" }}>
              Coverage Web
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <CoverageStat label="Statements" value="89.4%" />
              <CoverageStat label="Branches" value="81.7%" />
              <CoverageStat label="Functions" value="87.0%" />
              <CoverageStat label="Lines" value="89.8%" />
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <MiniStat label="Tests API" value="169" />
          <MiniStat label="Tests Web" value="309" />
          <MiniStat label="E2E Specs" value="3 suites" />
        </div>
      </div>
    </Slide>
  ),

  // 10 — TIMELINE
  () => (
    <Slide title="Desarrollo: 4 semanas">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            padding: "12px 14px",
            background: COLORS.surface,
            borderRadius: 8,
            borderLeft: `3px solid #6366f1`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", minWidth: 80 }}>
              Semana 1
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                background: "#6366f120",
                color: "#6366f1",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Planificación
            </span>
          </div>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
            Arquitectura, ADRs, diagramas C4, setup monorepo, CI/CD, Docker, definición de pipeline
            de IA, diseño de modelo de datos, API contracts
          </p>
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: COLORS.surface,
            borderRadius: 8,
            borderLeft: `3px solid ${COLORS.orange}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.orange, minWidth: 80 }}>
              Semana 2
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                background: "rgba(232,97,47,0.15)",
                color: COLORS.orange,
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Implementación
            </span>
          </div>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
            Auth passwordless (OTP), base de datos + Prisma, pipeline de audio completo (Whisper +
            GPT), integración Jira OAuth 2.0, templates, quotas
          </p>
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: COLORS.surface,
            borderRadius: 8,
            borderLeft: `3px solid ${COLORS.green}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.green, minWidth: 80 }}>
              Semana 3
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                background: "rgba(21,128,61,0.15)",
                color: COLORS.green,
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Implementación
            </span>
          </div>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
            Frontend web completo (dashboard, landing, onboarding), tests unitarios + integración
            (478 tests), E2E con Playwright, WebSocket real-time
          </p>
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: COLORS.surface,
            borderRadius: 8,
            borderLeft: `3px solid #ef4444`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", minWidth: 80 }}>
              Semana 4
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                background: "#ef444420",
                color: "#ef4444",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Producción
            </span>
          </div>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
            Seguridad (OWASP Top 10, Sentry), deploy en Vercel + Coolify, documentación, dark/light
            theme, i18n, polish final
          </p>
        </div>
        <div
          style={{
            padding: "12px 16px",
            background: COLORS.accentSurface,
            borderRadius: 8,
            border: `1px solid ${COLORS.orange}20`,
            marginTop: 4,
          }}
        >
          <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: COLORS.orange }}>284 commits en 4 semanas</strong> — la
            planificación detallada de la semana 1 permitió ejecutar a velocidad máxima con Claude
            Code como copiloto durante las 3 semanas de implementación.
          </p>
        </div>
        <p style={{ fontSize: 12, color: COLORS.muted, margin: "2px 0 0", fontStyle: "italic" }}>
          5 marzo — 29 marzo 2026
        </p>
      </div>
    </Slide>
  ),

  // 11 — SEGURIDAD
  () => (
    <Slide title="Seguridad y calidad">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          {
            title: "OWASP Top 10",
            desc: "Checklist completo auditado. Inyección, XSS, CSRF, acceso, datos sensibles.",
            icon: "🛡️",
          },
          {
            title: "Tokens encriptados",
            desc: "Tokens de Jira almacenados con AES-256-GCM. Nunca en texto plano.",
            icon: "🔐",
          },
          {
            title: "Passwordless",
            desc: "Auth por OTP via email. Sin contraseñas que gestionar o filtrar.",
            icon: "✉️",
          },
          {
            title: "Rate limiting",
            desc: "Throttling por usuario y endpoint. Protección contra abuso.",
            icon: "⚡",
          },
          {
            title: "ENV validation",
            desc: "Zod valida todas las variables al inicio. Falla si falta algo.",
            icon: "✅",
          },
          {
            title: "Sentry",
            desc: "Error tracking en producción. Stack traces, contexto, alertas.",
            icon: "📊",
          },
          {
            title: "Refresh tokens",
            desc: "Stateful en DB con SHA-256. Revocación y gestión de sesiones.",
            icon: "🔄",
          },
          {
            title: "Quotas",
            desc: "Límites por minutos de audio/mes. Protección de costes de IA.",
            icon: "📏",
          },
        ].map(({ title, desc, icon }) => (
          <div
            key={title}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 14px",
              background: COLORS.surface,
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 2px" }}>
                {title}
              </p>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.4 }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  ),

  // 12 — OPEN SOURCE + NEGOCIO
  () => (
    <Slide title="Open source y modelo de negocio">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: 16, background: COLORS.surface, borderRadius: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>
            Licencia AGPL-3.0 (open-core)
          </p>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.6 }}>
            El código es libre. Si alguien quiere usarlo como SaaS sin liberar sus cambios, necesita
            licencia comercial. Mismo modelo que n8n, GitLab y Cal.com.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div
            style={{
              padding: 14,
              background: COLORS.surface,
              borderRadius: 10,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: "0 0 4px" }}>
              Free
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.muted, margin: "0 0 6px" }}>
              $0
            </p>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.4 }}>
              20 min audio/mes
            </p>
          </div>
          <div
            style={{
              padding: 14,
              background: COLORS.surface,
              borderRadius: 10,
              textAlign: "center",
              border: `1px solid ${COLORS.orange}30`,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.orange, margin: "0 0 4px" }}>
              Pro
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 6px" }}>
              $4.99<span style={{ fontSize: 12, color: COLORS.muted }}>/mes</span>
            </p>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.4 }}>
              100 min/mes, templates
            </p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>
          Repositorio: <span style={{ color: COLORS.orange }}>github.com/alegd/yappie</span> ·
          Producción: <span style={{ color: COLORS.orange }}>yappie.gueden.com</span>
        </p>
      </div>
    </Slide>
  ),

  // 13 — CONCLUSIONES
  () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        textAlign: "center",
        padding: "0 80px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <svg width="60" height="60" viewBox="0 0 64 64" style={{ marginBottom: 20 }}>
        <rect x="4" y="4" width="56" height="56" rx="14" fill={COLORS.orange} />
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
      <h2
        style={{
          fontFamily: "'Sora',sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: COLORS.text,
          margin: "0 0 16px",
        }}
      >
        Yappie
      </h2>
      <p style={{ fontSize: 16, color: COLORS.muted, lineHeight: 1.7, maxWidth: 480 }}>
        Un producto real construido en 4 semanas con TDD, IA como herramienta de desarrollo, y la
        intención de llevarlo al mercado como SaaS open source.
      </p>
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ fontSize: 13, color: COLORS.muted }}>
          yappie.gueden.com · github.com/alegd/yappie
        </p>
        <p style={{ fontSize: 13, color: COLORS.muted }}>Alejandro Guerra · ale.gueden@gmail.com</p>
      </div>
    </div>
  ),
];

function Slide({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ height: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          display: "flex",
          flexDirection: "column",
          padding: "36px 48px 24px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Sora',sans-serif",
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.text,
            margin: "0 0 20px",
            flexShrink: 0,
          }}
        >
          {title}
        </h2>
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: COLORS.surface,
        borderRadius: 10,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: COLORS.orange,
          margin: "0 0 4px",
          fontFamily: "'Sora',sans-serif",
        }}
      >
        {number}
      </p>
      <p style={{ fontSize: 13, color: COLORS.muted, margin: 0, lineHeight: 1.3 }}>{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ padding: "14px 16px", background: COLORS.surface, borderRadius: 10 }}>
      <p style={{ fontSize: 22, margin: "0 0 6px" }}>{icon}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: "0 0 4px" }}>
        {title}
      </p>
      <p style={{ fontSize: 14, color: COLORS.muted, margin: 0, lineHeight: 1.4 }}>{desc}</p>
    </div>
  );
}

function CoverageStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.green, margin: "0 0 2px" }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        background: COLORS.surface,
        borderRadius: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 14, color: COLORS.muted }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{value}</span>
    </div>
  );
}

export default function Presentation() {
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const total = slides.length;

  const goTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < total && idx !== current) {
        setCurrent(idx);
        setAnimKey((k) => k + 1);
      }
    },
    [total, current],
  );

  const go = useCallback(
    (dir: number) => {
      goTo(current + dir);
    },
    [current, goTo],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: COLORS.navy,
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        fontFamily: "'DM Sans',sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .slide-enter { animation: fadeUp 0.45s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
        .slide-enter > div > div > div, .slide-enter > div > div > p { animation: fadeIn 0.5s ease both; }
        .slide-enter > div > div > div:nth-child(1) { animation-delay: 0.08s; }
        .slide-enter > div > div > div:nth-child(2) { animation-delay: 0.16s; }
        .slide-enter > div > div > div:nth-child(3) { animation-delay: 0.24s; }
        .slide-enter > div > div > div:nth-child(4) { animation-delay: 0.32s; }
        .slide-enter > div > div > div:nth-child(5) { animation-delay: 0.38s; }
        .slide-enter > div > div > div:nth-child(6) { animation-delay: 0.44s; }
        .nav-btn { background: none; border: none; cursor: pointer; font-size: 20px; padding: 6px 12px; border-radius: 6px; transition: background 0.15s, color 0.15s; }
        .nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
        .nav-btn:disabled { cursor: default; }
        .dot { transition: all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1); cursor: pointer; }
        .dot:hover { background: rgba(255,255,255,0.4) !important; }
      `}</style>

      {/* Slide content */}
      <div key={animKey} className="slide-enter" style={{ flex: 1, overflow: "hidden" }}>
        {slides[current]()}
      </div>

      {/* Navigation footer */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          background: "rgba(0,0,0,0.35)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          className="nav-btn"
          onClick={() => go(-1)}
          disabled={current === 0}
          style={{ color: current === 0 ? "rgba(255,255,255,0.12)" : COLORS.muted }}
        >
          ←
        </button>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {slides.map((_, i) => (
            <div
              key={i}
              className="dot"
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: i === current ? COLORS.orange : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>
        <button
          className="nav-btn"
          onClick={() => go(1)}
          disabled={current === total - 1}
          style={{ color: current === total - 1 ? "rgba(255,255,255,0.12)" : COLORS.muted }}
        >
          →
        </button>
      </div>
    </div>
  );
}

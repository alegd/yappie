// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { parseSentryRate } from "@/lib/sentry-utils";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  try {
    Sentry.init({
      dsn,

      integrations: [Sentry.replayIntegration()],

      tracesSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"),

      enableLogs: true,

      replaysSessionSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"),

      replaysOnErrorSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE"),

      sendDefaultPii: true,
    });
  } catch (error) {
    console.error("[Sentry] Failed to initialize client:", error);
  }
}

export const onRouterTransitionStart = dsn ? Sentry.captureRouterTransitionStart : () => {};

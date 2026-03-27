// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { parseSentryRate } from "@/lib/sentry-utils";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"),

  enableLogs: true,

  replaysSessionSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE"),

  replaysOnErrorSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE"),

  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

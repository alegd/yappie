// This file configures the initialization of Sentry for edge features.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { parseSentryRate } from "./src/lib/sentry-utils";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  try {
    Sentry.init({
      dsn,

      tracesSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"),

      enableLogs: true,

      sendDefaultPii: true,
    });
  } catch (error) {
    console.error("[Sentry] Failed to initialize edge:", error);
  }
}

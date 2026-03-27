// This file configures the initialization of Sentry for edge features.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { parseSentryRate } from "./src/lib/sentry-utils";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: parseSentryRate("NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"),

  enableLogs: true,

  sendDefaultPii: true,
});

import * as Sentry from "@sentry/react-native";

export function initSentry(dsn: string | undefined): void {
  if (!dsn) return;
  try {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enableAutoSessionTracking: true,
    });
  } catch (err) {
    console.warn("Sentry init failed, continuing without it", err);
  }
}

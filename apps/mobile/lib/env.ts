import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url(),
  EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
});

export interface AppEnv {
  apiUrl: string;
  sentryDsn?: string;
}

export function loadEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return {
    apiUrl: parsed.data.EXPO_PUBLIC_API_URL,
    sentryDsn: parsed.data.EXPO_PUBLIC_SENTRY_DSN,
  };
}

export const env = loadEnv();

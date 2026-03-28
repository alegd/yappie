import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number(),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRATION: z.string().min(1),
  JWT_REFRESH_EXPIRATION: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  AI_TRANSCRIPTION_MODEL: z.string().min(1),
  AI_DECOMPOSITION_MODEL: z.string().min(1),
  AI_GENERATION_MODEL: z.string().min(1),

  // Storage
  UPLOAD_PATH: z.string().min(1),

  // Frontend
  NEXT_PUBLIC_API_URL: z.string().min(1),
  FRONTEND_URL: z.string().min(1),

  // Jira OAuth
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  JIRA_CALLBACK_URL: z.string().optional(),

  // Sentry (optional — disabled in dev if not set)
  SENTRY_DSN: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // Email
  RESEND_API_KEY: z.string().min(1),

  // Quotas
  QUOTA_FREE_MINUTES: z.coerce.number(),
  QUOTA_PRO_MINUTES: z.coerce.number(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(`\nEnvironment validation failed:\n${formatted}\n`);
    console.error("Check your .env file against .env.example\n");
    process.exit(1);
  }

  return result.data;
}

export function buildDatabaseUrl(env: Env): string {
  return `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
}

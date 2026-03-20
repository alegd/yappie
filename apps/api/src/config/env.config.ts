import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),

  // Database
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default("yappie"),
  DB_PASSWORD: z.string().default("yappie_dev"),
  DB_NAME: z.string().default("yappie"),

  // Redis
  REDIS_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRATION: z.string().default("15m"),
  JWT_REFRESH_EXPIRATION: z.string().default("7d"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),

  // Jira OAuth
  JIRA_CLIENT_ID: z.string().optional(),
  JIRA_CLIENT_SECRET: z.string().optional(),
  JIRA_CALLBACK_URL: z.string().optional(),
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

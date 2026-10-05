const DEFAULT_ENV_FILE = ".env";

export function resolveEnvFile(env: { ENV_FILE?: string }): string {
  return env.ENV_FILE || DEFAULT_ENV_FILE;
}

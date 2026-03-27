export function parseSentryRate(envVar: string): number {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`Invalid sample rate for ${envVar}: "${value}" (must be 0-1)`);
  }
  return parsed;
}

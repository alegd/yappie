import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { envObjectSchema } from "./env.config.js";

const COMPOSE_PATH = join(import.meta.dirname, "../../../../docker-compose.prod.yaml");
const DECLARED_KEY = /^\s+([A-Z][A-Z0-9_]*):/gm;

function keysRequiredToBoot(): string[] {
  const result = envObjectSchema.safeParse({});
  if (result.success) return [];

  return [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
}

function keysDeclaredIn(compose: string): Set<string> {
  const matches = compose.match(DECLARED_KEY) ?? [];

  return new Set(matches.map((line) => line.trim().slice(0, -1)));
}

describe("docker-compose.prod.yaml", () => {
  it("declares every environment variable the API needs to boot", () => {
    const declared = keysDeclaredIn(readFileSync(COMPOSE_PATH, "utf8"));

    const missing = keysRequiredToBoot().filter((key) => !declared.has(key));

    expect(missing).toEqual([]);
  });

  it("derives the required keys from the schema rather than a parallel list", () => {
    expect(keysRequiredToBoot()).toContain("ENCRYPTION_KEY");
    expect(keysRequiredToBoot()).not.toContain("SENTRY_DSN");
    expect(keysRequiredToBoot()).not.toContain("E2E_MOCK_AI");
  });
});

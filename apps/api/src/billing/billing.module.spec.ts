import type { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { createStripeClient } from "./billing.module.js";

function createMockConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe("createStripeClient", () => {
  it("should return a Stripe instance when STRIPE_SECRET_KEY is set", () => {
    const config = createMockConfig({ STRIPE_SECRET_KEY: "sk_test_123" });

    const client = createStripeClient(config);

    expect(client).toBeInstanceOf(Stripe);
  });

  it("should throw when STRIPE_SECRET_KEY is missing", () => {
    const config = createMockConfig({ STRIPE_SECRET_KEY: undefined });

    expect(() => createStripeClient(config)).toThrow(/STRIPE_SECRET_KEY/);
  });

  it("should throw when STRIPE_SECRET_KEY is empty string", () => {
    const config = createMockConfig({ STRIPE_SECRET_KEY: "" });

    expect(() => createStripeClient(config)).toThrow(/STRIPE_SECRET_KEY/);
  });
});

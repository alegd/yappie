import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingService } from "./billing.service.js";

function createMockStripe() {
  return {
    customers: {
      create: vi.fn(),
    },
    checkout: {
      sessions: { create: vi.fn() },
    },
    billingPortal: {
      sessions: { create: vi.fn() },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  };
}

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
  };
}

let mockStripe: ReturnType<typeof createMockStripe>;
let mockPrisma: ReturnType<typeof createMockPrisma>;
let mockConfig: { get: ReturnType<typeof vi.fn> };
let service: BillingService;

beforeEach(() => {
  mockStripe = createMockStripe();
  mockPrisma = createMockPrisma();
  mockConfig = {
    get: vi.fn((key: string) => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: "sk_test_abc",
        STRIPE_PRO_PRICE_ID: "price_test_abc",
        STRIPE_SUCCESS_URL: "http://localhost:3000/dashboard?upgraded=true",
        STRIPE_CANCEL_URL: "http://localhost:3000/dashboard",
        STRIPE_WEBHOOK_SECRET: "whsec_test_abc",
      };
      return config[key];
    }),
  };
  service = new BillingService(mockStripe as never, mockPrisma as never, mockConfig as never);
});

describe("BillingService", () => {
  describe("getOrCreateCustomer", () => {
    it("should return existing stripeCustomerId when user already has one", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        stripeCustomerId: "cus_existing",
      });

      const result = await service.getOrCreateCustomer("user-1", "test@test.com");

      expect(result).toBe("cus_existing");
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it("should create Stripe customer and save ID when user has none", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        stripeCustomerId: null,
      });
      mockStripe.customers.create.mockResolvedValue({ id: "cus_new" });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.getOrCreateCustomer("user-1", "test@test.com");

      expect(result).toBe("cus_new");
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: "test@test.com",
        metadata: { userId: "user-1" },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { stripeCustomerId: "cus_new" },
      });
    });
  });
});

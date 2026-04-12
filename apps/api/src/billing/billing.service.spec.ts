import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
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
    processedWebhookEvent: {
      create: vi.fn(),
      delete: vi.fn(),
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
  mockPrisma.processedWebhookEvent.create.mockResolvedValue({ stripeEventId: "evt_default" });
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

  describe("createCheckoutSession", () => {
    it("should create a Stripe Checkout session and return URL", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        stripeCustomerId: "cus_existing",
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: "https://checkout.stripe.com/session123",
      });

      const result = await service.createCheckoutSession("user-1", "test@test.com");

      expect(result).toBe("https://checkout.stripe.com/session123");
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: "cus_existing",
        mode: "subscription",
        line_items: [{ price: "price_test_abc", quantity: 1 }],
        success_url: "http://localhost:3000/dashboard?upgraded=true",
        cancel_url: "http://localhost:3000/dashboard",
        metadata: { userId: "user-1" },
      });
    });

    it("should throw when Stripe does not return a session URL", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        stripeCustomerId: "cus_existing",
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: null });

      await expect(service.createCheckoutSession("user-1", "test@test.com")).rejects.toThrow(
        /checkout session url/i,
      );
    });
  });

  describe("createPortalSession", () => {
    it("should create a Customer Portal session and return URL", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        stripeCustomerId: "cus_existing",
      });
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: "https://billing.stripe.com/portal123",
      });

      const result = await service.createPortalSession("user-1");

      expect(result).toBe("https://billing.stripe.com/portal123");
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: "cus_existing",
        return_url: "http://localhost:3000/dashboard",
      });
    });

    it("should throw when user has no Stripe customer", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        stripeCustomerId: null,
      });

      await expect(service.createPortalSession("user-1")).rejects.toThrow(BadRequestException);
    });
  });

  describe("handleWebhookEvent", () => {
    it("should upgrade subscription on checkout.session.completed", async () => {
      const event = {
        id: "evt_checkout_1",
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { userId: "user-1" },
            subscription: "sub_stripe_123",
          },
        },
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: "sub_stripe_123",
        start_date: 1700000000,
      });

      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        userId: "user-1",
        plan: "FREE",
        endDate: null,
      });

      mockPrisma.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
        fn(mockPrisma),
      );

      await service.handleWebhookEvent(event as never);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: {
          plan: "PRO",
          stripeSubscriptionId: "sub_stripe_123",
          stripePriceId: "price_test_abc",
          startDate: new Date(1700000000000),
        },
      });
    });

    it("should create a PRO subscription when no active subscription exists on checkout.completed", async () => {
      const event = {
        id: "evt_checkout_new",
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { userId: "user-new" },
            subscription: "sub_stripe_new",
          },
        },
      };

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: "sub_stripe_new",
        start_date: 1700000000,
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await service.handleWebhookEvent(event as never);

      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: "user-new",
          plan: "PRO",
          stripeSubscriptionId: "sub_stripe_new",
          stripePriceId: "price_test_abc",
          startDate: new Date(1700000000000),
        },
      });
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });

    it("should sync cancelAtPeriodEnd on subscription.updated", async () => {
      const event = {
        id: "evt_upd_1",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_stripe_123",
            cancel_at_period_end: true,
            current_period_end: 1702592000,
            status: "active",
          },
        },
      };

      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        userId: "user-1",
        stripeSubscriptionId: "sub_stripe_123",
      });

      await service.handleWebhookEvent(event as never);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { cancelAtPeriodEnd: true },
      });
    });

    it("should downgrade to FREE on subscription.deleted", async () => {
      const event = {
        id: "evt_del_1",
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_stripe_123" },
        },
      };

      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        userId: "user-1",
        stripeSubscriptionId: "sub_stripe_123",
      });

      mockPrisma.$transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
        fn(mockPrisma),
      );

      await service.handleWebhookEvent(event as never);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: expect.objectContaining({ plan: "FREE" }),
      });
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: { userId: "user-1", plan: "FREE" },
      });
    });

    it("should ignore unknown event types", async () => {
      const event = { id: "evt_unknown", type: "unknown.event", data: { object: {} } };

      await service.handleWebhookEvent(event as never);

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });

    describe("idempotency", () => {
      it("should record the event ID before processing", async () => {
        const event = {
          id: "evt_123",
          type: "customer.subscription.updated",
          data: { object: { id: "sub_stripe_123", cancel_at_period_end: false } },
        };

        mockPrisma.subscription.findFirst.mockResolvedValue({
          id: "sub-1",
          stripeSubscriptionId: "sub_stripe_123",
        });

        await service.handleWebhookEvent(event as never);

        expect(mockPrisma.processedWebhookEvent.create).toHaveBeenCalledWith({
          data: { stripeEventId: "evt_123" },
        });
      });

      it("should skip processing when event was already processed", async () => {
        const event = {
          id: "evt_duplicate",
          type: "customer.subscription.updated",
          data: { object: { id: "sub_stripe_123", cancel_at_period_end: true } },
        };

        const uniqueConstraintError = Object.assign(new Error("Unique constraint"), {
          code: "P2002",
        });
        mockPrisma.processedWebhookEvent.create.mockRejectedValue(uniqueConstraintError);

        await service.handleWebhookEvent(event as never);

        expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
        expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
      });

      it("should delete the event marker and rethrow when processing fails", async () => {
        const event = {
          id: "evt_fails",
          type: "customer.subscription.updated",
          data: { object: { id: "sub_stripe_fail", cancel_at_period_end: true } },
        };

        mockPrisma.subscription.findFirst.mockResolvedValue({
          id: "sub-1",
          stripeSubscriptionId: "sub_stripe_fail",
        });
        mockPrisma.subscription.update.mockRejectedValue(new Error("DB error"));

        await expect(service.handleWebhookEvent(event as never)).rejects.toThrow("DB error");

        expect(mockPrisma.processedWebhookEvent.delete).toHaveBeenCalledWith({
          where: { stripeEventId: "evt_fails" },
        });
      });

      it("should rethrow non-P2002 errors from the marker create", async () => {
        const event = {
          id: "evt_unknown_err",
          type: "customer.subscription.updated",
          data: { object: {} },
        };

        mockPrisma.processedWebhookEvent.create.mockRejectedValue(new Error("Connection lost"));

        await expect(service.handleWebhookEvent(event as never)).rejects.toThrow("Connection lost");
      });
    });
  });

  describe("getBillingStatus", () => {
    it("should return billing status for user with active subscription", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: "sub-1",
        plan: "PRO",
        stripeSubscriptionId: "sub_stripe_123",
        cancelAtPeriodEnd: false,
        endDate: null,
      });

      const result = await service.getBillingStatus("user-1");

      expect(result).toEqual({
        plan: "PRO",
        stripeSubscriptionId: "sub_stripe_123",
        cancelAtPeriodEnd: false,
      });
    });

    it("should return FREE status when no subscription exists", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await service.getBillingStatus("user-1");

      expect(result).toEqual({
        plan: "FREE",
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
      });
    });
  });
});

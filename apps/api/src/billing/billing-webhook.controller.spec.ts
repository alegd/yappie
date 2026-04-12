import { BadRequestException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingWebhookController } from "./billing-webhook.controller.js";
import type { BillingService } from "./billing.service.js";

function createMockStripe() {
  return {
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
}

function createMockBillingService() {
  return {
    handleWebhookEvent: vi.fn(),
  };
}

function createMockConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function createRequest(rawBody: Buffer | undefined): RawBodyRequest<Request> {
  return { rawBody } as unknown as RawBodyRequest<Request>;
}

let mockStripe: ReturnType<typeof createMockStripe>;
let mockService: ReturnType<typeof createMockBillingService>;
let mockConfig: ConfigService;
let controller: BillingWebhookController;

beforeEach(() => {
  mockStripe = createMockStripe();
  mockService = createMockBillingService();
  mockConfig = createMockConfig({ STRIPE_WEBHOOK_SECRET: "whsec_test_abc" });
  controller = new BillingWebhookController(
    mockStripe as unknown as Stripe,
    mockService as unknown as BillingService,
    mockConfig,
  );
});

describe("BillingWebhookController", () => {
  describe("handleWebhook", () => {
    it("should reject requests without a raw body", async () => {
      const req = createRequest(undefined);

      await expect(controller.handleWebhook(req, "sig_123")).rejects.toThrow(BadRequestException);
      expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
    });

    it("should reject when STRIPE_WEBHOOK_SECRET is not configured", async () => {
      mockConfig = createMockConfig({ STRIPE_WEBHOOK_SECRET: undefined });
      controller = new BillingWebhookController(
        mockStripe as unknown as Stripe,
        mockService as unknown as BillingService,
        mockConfig,
      );
      const req = createRequest(Buffer.from("payload"));

      await expect(controller.handleWebhook(req, "sig_123")).rejects.toThrow(BadRequestException);
      expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
    });

    it("should reject when signature verification fails", async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("No signatures found matching the expected signature for payload");
      });
      const req = createRequest(Buffer.from("payload"));

      await expect(controller.handleWebhook(req, "sig_invalid")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should not expose the webhook secret in the thrown error message", async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("Signature mismatch: expected sig using whsec_test_abc");
      });
      const req = createRequest(Buffer.from("payload"));

      await expect(controller.handleWebhook(req, "sig_invalid")).rejects.toThrow(
        /^Invalid signature$/,
      );
    });

    it("should dispatch valid events to the billing service", async () => {
      const event = { id: "evt_1", type: "customer.subscription.updated" } as Stripe.Event;
      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      const req = createRequest(Buffer.from("payload"));

      const result = await controller.handleWebhook(req, "sig_valid");

      expect(mockService.handleWebhookEvent).toHaveBeenCalledWith(event);
      expect(result).toEqual({ received: true });
    });
  });
});

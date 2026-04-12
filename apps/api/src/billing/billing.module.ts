import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { STRIPE_CLIENT } from "./billing.constants.js";
import { BillingController } from "./billing.controller.js";
import { BillingService } from "./billing.service.js";
import { BillingWebhookController } from "./billing-webhook.controller.js";

export function createStripeClient(config: ConfigService): Stripe {
  const key = config.get<string>("STRIPE_SECRET_KEY");
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is required to initialize the billing module. " +
        "Either set it in your environment or remove BillingModule from app imports.",
    );
  }
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

@Module({
  controllers: [BillingController, BillingWebhookController],
  providers: [
    {
      provide: STRIPE_CLIENT,
      useFactory: createStripeClient,
      inject: [ConfigService],
    },
    BillingService,
  ],
  exports: [BillingService],
})
export class BillingModule {}

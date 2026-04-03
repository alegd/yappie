import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { STRIPE_CLIENT } from "./billing.constants.js";
import { BillingController } from "./billing.controller.js";
import { BillingService } from "./billing.service.js";
import { BillingWebhookController } from "./billing-webhook.controller.js";

@Module({
  controllers: [BillingController, BillingWebhookController],
  providers: [
    {
      provide: STRIPE_CLIENT,
      useFactory: (config: ConfigService) => {
        const key = config.get<string>("STRIPE_SECRET_KEY");
        if (!key) return null;
        return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
      },
      inject: [ConfigService],
    },
    BillingService,
  ],
  exports: [BillingService],
})
export class BillingModule {}

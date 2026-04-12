import {
  BadRequestException,
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import type Stripe from "stripe";
import { Public } from "../auth/decorators/public.decorator.js";
import { STRIPE_CLIENT } from "./billing.constants.js";
import { BillingService } from "./billing.service.js";

@Controller("billing")
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  @Throttle({ long: { ttl: 60000, limit: 100 } })
  @Post("webhook")
  @Public()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    if (!req.rawBody) {
      this.logger.warn("Webhook request missing raw body");
      throw new BadRequestException("Missing request body");
    }

    const secret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      this.logger.error("STRIPE_WEBHOOK_SECRET is not configured");
      throw new BadRequestException("Webhook not configured");
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody, signature, secret);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException("Invalid signature");
    }

    await this.billingService.handleWebhookEvent(event);

    return { received: true };
  }
}

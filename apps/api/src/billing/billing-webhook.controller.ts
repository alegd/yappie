import {
  BadRequestException,
  Controller,
  Headers,
  Inject,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type Stripe from "stripe";
import { Public } from "../auth/decorators/public.decorator.js";
import { STRIPE_CLIENT } from "./billing.constants.js";
import { BillingService } from "./billing.service.js";

@Controller("billing")
export class BillingWebhookController {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  @Post("webhook")
  @Public()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        signature,
        this.configService.get<string>("STRIPE_WEBHOOK_SECRET")!,
      );
    } catch {
      throw new BadRequestException("Webhook signature verification failed");
    }

    await this.billingService.handleWebhookEvent(event);

    return { received: true };
  }
}

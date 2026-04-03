import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service.js";
import { STRIPE_CLIENT } from "./billing.constants.js";

@Injectable()
export class BillingService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(userId: string, email: string): Promise<string> {
    const customerId = await this.getOrCreateCustomer(userId, email);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: this.configService.get<string>("STRIPE_PRO_PRICE_ID"),
          quantity: 1,
        },
      ],
      success_url: this.configService.get<string>("STRIPE_SUCCESS_URL"),
      cancel_url: this.configService.get<string>("STRIPE_CANCEL_URL"),
      metadata: { userId },
    });

    return session.url!;
  }

  async createPortalSession(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.stripeCustomerId) {
      throw new BadRequestException("No active subscription");
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: this.configService.get<string>("STRIPE_CANCEL_URL"),
    });

    return session.url;
  }
}

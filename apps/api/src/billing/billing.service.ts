import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service.js";
import { STRIPE_CLIENT } from "./billing.constants.js";
import type { BillingStatus } from "./dto/billing-status.dto.js";

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

  async getBillingStatus(userId: string): Promise<BillingStatus> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, endDate: null },
    });

    if (!subscription) {
      return { plan: "FREE", stripeSubscriptionId: null, cancelAtPeriodEnd: false };
    }

    return {
      plan: subscription.plan,
      stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata!.userId;
    const stripeSubscriptionId = session.subscription as string;

    const stripeSub = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findFirst({
        where: { userId, endDate: null },
      });

      if (!subscription) return;

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: "PRO",
          stripeSubscriptionId,
          stripePriceId: this.configService.get<string>("STRIPE_PRO_PRICE_ID"),
          startDate: new Date(stripeSub.start_date * 1000),
        },
      });
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!sub) return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: subscription.cancel_at_period_end },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!sub) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          plan: "FREE",
          endDate: new Date(),
          stripeSubscriptionId: null,
          stripePriceId: null,
          cancelAtPeriodEnd: false,
        },
      });

      await tx.subscription.create({
        data: { userId: sub.userId, plan: "FREE" },
      });
    });
  }
}

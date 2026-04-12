import { Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { BillingService } from "./billing.service.js";

@Controller("billing")
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post("checkout-session")
  async createCheckoutSession(@Req() req: { user: { sub: string; email: string } }) {
    const url = await this.billingService.createCheckoutSession(req.user.sub, req.user.email);
    return { url };
  }

  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @Post("portal-session")
  async createPortalSession(@Req() req: { user: { sub: string } }) {
    const url = await this.billingService.createPortalSession(req.user.sub);
    return { url };
  }

  @Get("status")
  async getBillingStatus(@Req() req: { user: { sub: string } }) {
    return this.billingService.getBillingStatus(req.user.sub);
  }
}

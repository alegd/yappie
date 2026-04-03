import { Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { BillingService } from "./billing.service.js";

@Controller("billing")
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("checkout-session")
  async createCheckoutSession(@Req() req: { user: { sub: string; email: string } }) {
    const url = await this.billingService.createCheckoutSession(req.user.sub, req.user.email);
    return { url };
  }

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

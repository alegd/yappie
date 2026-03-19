import { Controller, Get } from "@nestjs/common";
import { type AppService } from "./app.service.js";
import { Public } from "./auth/decorators/public.decorator.js";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get("health")
  getHealth() {
    return this.appService.getHealth();
  }
}

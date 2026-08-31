import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service.js";
import { FakeEmailService } from "./fake-email.service.js";

@Global()
@Module({
  providers: [
    {
      provide: EmailService,
      useFactory: () =>
        process.env.E2E_TEST_ENDPOINTS === "true"
          ? new FakeEmailService()
          : new EmailService(process.env.RESEND_API_KEY!, process.env.EMAIL_FROM!),
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}

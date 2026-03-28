import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service.js";

@Global()
@Module({
  providers: [
    {
      provide: EmailService,
      useFactory: () => new EmailService(process.env.RESEND_API_KEY!, process.env.EMAIL_FROM!),
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}

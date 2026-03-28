import { Injectable } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendOtp(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: "Yappie <onboarding@resend.dev>",
      to: email,
      subject: `Your Yappie code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          <h2 style="color: #1c1c28; margin-bottom: 8px;">Your verification code</h2>
          <p style="color: #6b6b80; margin-bottom: 32px;">Enter this code to sign in to Yappie</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1c1c28; background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 32px;">
            ${code}
          </div>
          <p style="color: #a0a0b8; font-size: 13px;">This code expires in 10 minutes.</p>
          <p style="color: #a0a0b8; font-size: 13px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
  }
}

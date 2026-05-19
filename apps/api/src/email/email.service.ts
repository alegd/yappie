import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.resend = new Resend(apiKey);
    this.from = from;
  }

  async sendOtp(email: string, code: string): Promise<void> {
    await this.send({
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
      errorLabel: "OTP email",
    });
  }

  async sendAccountDeletionOtp(email: string, code: string): Promise<void> {
    await this.send({
      to: email,
      subject: `Delete your Yappie account: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; text-align: center;">
          <h2 style="color: #1c1c28; margin-bottom: 8px;">Confirm account deletion</h2>
          <p style="color: #6b6b80; margin-bottom: 32px;">Enter this code in the app to permanently delete your Yappie account and all of its data. This action cannot be undone.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1c1c28; background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 32px;">
            ${code}
          </div>
          <p style="color: #a0a0b8; font-size: 13px;">This code expires in 10 minutes.</p>
          <p style="color: #a0a0b8; font-size: 13px;">If you didn't request to delete your account, you can safely ignore this email — no changes will be made.</p>
        </div>
      `,
      errorLabel: "account deletion OTP email",
    });
  }

  async sendAccountDeletionConfirmation(
    email: string,
    opts?: { hadJira?: boolean },
  ): Promise<void> {
    const atlassianBlock = opts?.hadJira
      ? `
          <p style="color: #6b6b80; margin: 24px 0 8px;">Want to revoke Yappie's access to your Atlassian account as well?</p>
          <p style="color: #6b6b80; margin: 0 0 32px;">
            Open
            <a href="https://id.atlassian.com/manage-profile/apps" style="color: #4f46e5;">https://id.atlassian.com/manage-profile/apps</a>
            and remove the Yappie grant.
          </p>
        `
      : "";

    await this.send({
      to: email,
      subject: "Your Yappie account has been deleted",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1c1c28; margin-bottom: 16px; text-align: center;">Your account has been deleted</h2>
          <p style="color: #6b6b80; margin-bottom: 16px;">Your Yappie account, recordings, projects, tickets and integrations have all been removed from our systems.</p>
          <p style="color: #6b6b80; margin-bottom: 16px;">Any tickets you previously created in your Jira workspace remain there — those live in your Jira workspace, outside of our control.</p>
          ${atlassianBlock}
          <p style="color: #a0a0b8; font-size: 13px; text-align: center; margin-top: 32px;">If this wasn't you, please contact support immediately.</p>
        </div>
      `,
      errorLabel: "account deletion confirmation email",
    });
  }

  private async send(input: {
    to: string;
    subject: string;
    html: string;
    errorLabel: string;
  }): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      this.logger.error(`Failed to send ${input.errorLabel}: ${error.message}`);
      throw new Error(error.message);
    }
  }
}

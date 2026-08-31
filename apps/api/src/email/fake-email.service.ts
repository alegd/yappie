import { Injectable } from "@nestjs/common";

@Injectable()
export class FakeEmailService {
  async sendOtp(_email: string, _code: string): Promise<void> {}

  async sendAccountDeletionOtp(_email: string, _code: string): Promise<void> {}

  async sendAccountDeletionConfirmation(
    _email: string,
    _opts?: { hadJira?: boolean },
  ): Promise<void> {}
}

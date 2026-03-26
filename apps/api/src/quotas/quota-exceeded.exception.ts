import { ForbiddenException } from "@nestjs/common";

export class QuotaExceededException extends ForbiddenException {
  constructor() {
    super({
      message: "Quota exceeded. Upgrade to PRO for more minutes.",
      code: "QUOTA_EXCEEDED",
    });
  }
}

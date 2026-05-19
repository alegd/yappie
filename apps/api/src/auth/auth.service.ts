import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "crypto";
import { EmailService } from "../email/email.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { STORAGE_ADAPTER, type StorageAdapter } from "../storage/storage.interface.js";
import { OtpService } from "./otp.service.js";

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  async requestOtp(email: string) {
    const code = await this.otpService.generateAndStore(email);
    await this.emailService.sendOtp(email, code);
    return { sent: true };
  }

  async verifyOtp(email: string, code: string, context?: SessionContext) {
    const isValid = await this.otpService.verify(email, code);

    if (!isValid) {
      throw new UnauthorizedException("Invalid or expired code");
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await this.otpService.delete(email);
      const tokens = await this.generateTokens(user, context);
      return { ...tokens, isNewUser: false };
    }

    await this.otpService.markVerified(email);
    return { verified: true, isNewUser: true };
  }

  async completeRegister(email: string, code: string, name: string, context?: SessionContext) {
    const isVerified = await this.otpService.isVerified(email, code);

    if (!isVerified) {
      throw new UnauthorizedException("Invalid or expired verification");
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const user = await this.prisma.user.create({
      data: { email, name },
    });

    await this.otpService.delete(email);

    return this.generateTokens(user, context);
  }

  // Grace period for recently-revoked tokens. Next.js dispatches concurrent
  // requests (proxy + /api/auth/session + server actions) that all carry the
  // same cookie. The first one rotates the token; subsequent ones arrive with
  // the already-revoked token. Within the grace window we return the latest
  // active token instead of failing. This is the standard approach used by
  // Auth0, Firebase, and Supabase for token rotation with concurrent clients.
  private readonly REFRESH_GRACE_MS = 30_000;

  async refresh(token: string, context?: SessionContext) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    if (refreshToken.revokedAt) {
      const msSinceRevoked = Date.now() - refreshToken.revokedAt.getTime();
      if (msSinceRevoked > this.REFRESH_GRACE_MS) {
        throw new UnauthorizedException("Refresh token has been revoked");
      }

      // Another request already rotated this token — find the new one
      const latestToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId: refreshToken.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!latestToken) {
        throw new UnauthorizedException("Refresh token has been revoked");
      }

      // Return a fresh access token with the already-rotated refresh token
      const accessToken = await this.jwtService.signAsync({
        sub: refreshToken.user.id,
        email: refreshToken.user.email,
      });

      return {
        accessToken,
        refreshToken: latestToken.token,
        user: {
          id: refreshToken.user.id,
          email: refreshToken.user.email,
          name: refreshToken.user.name,
        },
      };
    }

    // First request: revoke old token and generate new pair
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(refreshToken.user, context);
  }

  async logout(token: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (refreshToken) {
      await this.prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSession(sessionId: string, userId: string) {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      throw new NotFoundException("Session not found");
    }
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async requestAccountDeletion(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Silent no-op: do not leak whether the email is registered.
      return { requested: true };
    }

    const code = await this.otpService.generateAndStore(email, "account-deletion");
    await this.emailService.sendAccountDeletionOtp(email, code);

    return { requested: true };
  }

  async confirmAccountDeletion(email: string, code: string) {
    const isValid = await this.otpService.verify(email, code, "account-deletion");

    if (!isValid) {
      throw new UnauthorizedException("Invalid or expired code");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("Invalid or expired code");
    }

    const jiraIntegration = await this.prisma.integration.findUnique({
      where: { userId_type: { userId: user.id, type: "JIRA" } },
    });

    const audios = await this.prisma.audioRecording.findMany({
      where: { userId: user.id },
      select: { filePath: true },
    });

    for (const audio of audios) {
      try {
        await this.storage.delete(audio.filePath);
      } catch (err) {
        // Best-effort: log and continue so the account delete still completes.
        // Orphaned files can be cleaned up by a separate sweep job.
        this.logger.warn(
          `Failed to delete storage file ${audio.filePath} for user ${user.id}: ${
            (err as Error).message
          }`,
        );
      }
    }

    await this.prisma.user.delete({ where: { id: user.id } });

    await this.otpService.delete(email, "account-deletion");
    await this.emailService.sendAccountDeletionConfirmation(email, {
      hadJira: !!jiraIntegration,
    });

    return { deleted: true };
  }

  private async generateTokens(
    user: { id: string; email: string; name: string },
    context?: SessionContext,
  ) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshTokenValue = randomBytes(40).toString("hex");

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}

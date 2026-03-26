import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { randomBytes } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.generateTokens(user);
  }

  // Grace period for recently-revoked tokens. Next.js dispatches concurrent
  // requests (proxy + /api/auth/session + server actions) that all carry the
  // same cookie. The first one rotates the token; subsequent ones arrive with
  // the already-revoked token. Within the grace window we return the latest
  // active token instead of failing. This is the standard approach used by
  // Auth0, Firebase, and Supabase for token rotation with concurrent clients.
  private readonly REFRESH_GRACE_MS = 30_000;

  async refresh(token: string) {
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

    return this.generateTokens(refreshToken.user);
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

  async revokeSession(sessionId: string, _userId: string) {
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
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

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async generateTokens(user: { id: string; email: string; name: string }) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshTokenValue = randomBytes(40).toString("hex");

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
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

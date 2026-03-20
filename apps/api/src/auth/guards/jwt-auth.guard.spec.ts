import { describe, it, expect, vi } from "vitest";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";

function createMockExecutionContext(headers: Record<string, string> = {}): ExecutionContext {
  const request = { headers } as Record<string, unknown>;
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  const mockReflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;

  const mockJwtService = {
    verifyAsync: vi.fn(),
  } as unknown as JwtService;

  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new JwtAuthGuard(mockJwtService, mockReflector);
  });

  it("should allow access with a valid token", async () => {
    const payload = { sub: "user-1", email: "john@example.com" };
    (mockJwtService.verifyAsync as ReturnType<typeof vi.fn>).mockResolvedValue(payload);
    (mockReflector.getAllAndOverride as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const context = createMockExecutionContext({
      authorization: "Bearer valid-jwt-token",
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual(payload);
  });

  it("should throw UnauthorizedException when no token is provided", async () => {
    (mockReflector.getAllAndOverride as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const context = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should throw UnauthorizedException for an invalid token", async () => {
    (mockJwtService.verifyAsync as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("invalid"),
    );
    (mockReflector.getAllAndOverride as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const context = createMockExecutionContext({
      authorization: "Bearer invalid-token",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should throw UnauthorizedException for an expired token", async () => {
    (mockJwtService.verifyAsync as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("jwt expired"),
    );
    (mockReflector.getAllAndOverride as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const context = createMockExecutionContext({
      authorization: "Bearer expired-token",
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should allow access to @Public() routes without token", async () => {
    (mockReflector.getAllAndOverride as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const context = createMockExecutionContext({});
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it("should check IS_PUBLIC_KEY metadata", async () => {
    (mockReflector.getAllAndOverride as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const context = createMockExecutionContext({});
    await guard.canActivate(context);

    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { AuthService, SessionContext } from "./auth.service.js";
import { Public } from "./decorators/public.decorator.js";
import { CompleteRegisterDto } from "./dto/complete-register.dto.js";
import { DeleteAccountConfirmDto } from "./dto/delete-account-confirm.dto.js";
import { DeleteAccountRequestDto } from "./dto/delete-account-request.dto.js";
import { RefreshDto } from "./dto/refresh.dto.js";
import { RequestOtpDto } from "./dto/request-otp.dto.js";
import { VerifyOtpDto } from "./dto/verify-otp.dto.js";

function sessionContextOf(req: Request): SessionContext {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };
}

@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post("request-otp")
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.authService.verifyOtp(dto.email, dto.code, sessionContextOf(req));
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post("complete-register")
  completeRegister(@Body() dto: CompleteRegisterDto, @Req() req: Request) {
    return this.authService.completeRegister(dto.email, dto.code, dto.name, sessionContextOf(req));
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, sessionContextOf(req));
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get("sessions")
  getSessions(@Req() req: { user: { sub: string } }) {
    return this.authService.getSessions(req.user.sub);
  }

  @Delete("sessions/:sessionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(@Param("sessionId") sessionId: string, @Req() req: { user: { sub: string } }) {
    return this.authService.revokeSession(sessionId, req.user.sub);
  }

  @Delete("sessions")
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeAllSessions(@Req() req: { user: { sub: string } }) {
    return this.authService.revokeAllSessions(req.user.sub);
  }

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 3 } })
  @Post("account/delete/request")
  @HttpCode(HttpStatus.OK)
  requestAccountDeletion(@Body() dto: DeleteAccountRequestDto) {
    return this.authService.requestAccountDeletion(dto.email);
  }

  @Public()
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @Post("account/delete/confirm")
  @HttpCode(HttpStatus.OK)
  confirmAccountDeletion(@Body() dto: DeleteAccountConfirmDto) {
    return this.authService.confirmAccountDeletion(dto.email, dto.code);
  }
}

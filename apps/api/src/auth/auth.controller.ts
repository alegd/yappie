import { ApiBearerAuth } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service.js";
import { RequestOtpDto } from "./dto/request-otp.dto.js";
import { VerifyOtpDto } from "./dto/verify-otp.dto.js";
import { CompleteRegisterDto } from "./dto/complete-register.dto.js";
import { RefreshDto } from "./dto/refresh.dto.js";
import { Public } from "./decorators/public.decorator.js";

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
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post("complete-register")
  completeRegister(@Body() dto: CompleteRegisterDto) {
    return this.authService.completeRegister(dto.email, dto.code, dto.name);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
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
}
